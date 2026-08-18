<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\HealthWorkerConsent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Sisi pemberi izin — PRD §9 F-15, BUSINESS_FLOWS §9.
 */
class HealthWorkerConsentTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, string>
     */
    private function authHeader(User $user): array
    {
        $this->app['auth']->forgetGuards();
        $this->app['tymon.jwt']->unsetToken();

        return ['Authorization' => 'Bearer '.JWTAuth::fromUser($user)];
    }

    private function healthWorker(): User
    {
        return User::factory()->create(['role' => 'health_worker']);
    }

    public function test_granting_consent_returns_the_access_code_exactly_once(): void
    {
        $user = User::factory()->create();
        $nakes = $this->healthWorker();

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/consents', ['health_worker_id' => $nakes->id])
            ->assertCreated();

        $code = $response->json('data.access_code');
        $this->assertNotEmpty($code);
        $this->assertStringContainsString("/nakes/akses/{$code}", $response->json('data.access_link'));

        // Yang tersimpan hanya hash-nya, dan tidak ada endpoint yang
        // mengembalikan kode itu lagi.
        $consent = HealthWorkerConsent::firstOrFail();
        $this->assertSame(hash('sha256', $code), $consent->access_code_hash);

        $list = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/consents')->assertOk();
        $this->assertArrayNotHasKey('access_code', $list->json('data.0'));
        $this->assertArrayNotHasKey('access_code_hash', $list->json('data.0'));
    }

    public function test_granting_consent_is_recorded_in_audit_logs(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/consents', ['health_worker_id' => $this->healthWorker()->id])
            ->assertCreated();

        $log = AuditLog::where('model_type', 'HealthWorkerConsent')->firstOrFail();
        $this->assertSame('created', $log->action);
        $this->assertSame($user->id, $log->user_id);

        // Kode tautan adalah kredensial; audit log dibaca super admin.
        $this->assertArrayNotHasKey('access_code_hash', $log->changes);
    }

    public function test_consent_can_only_be_given_to_an_active_health_worker(): void
    {
        $user = User::factory()->create();
        $headers = $this->authHeader($user);

        $this->withHeaders($headers)
            ->postJson('/api/v1/consents', ['health_worker_id' => User::factory()->create()->id])
            ->assertStatus(422)
            ->assertJsonPath('errors.health_worker_id.0', 'Tenaga kesehatan tidak ditemukan atau akunnya tidak aktif');

        $inactive = User::factory()->create(['role' => 'health_worker', 'is_active' => false]);

        $this->withHeaders($headers)
            ->postJson('/api/v1/consents', ['health_worker_id' => $inactive->id])
            ->assertStatus(422);
    }

    public function test_a_second_active_consent_to_the_same_health_worker_is_rejected(): void
    {
        $user = User::factory()->create();
        $nakes = $this->healthWorker();
        $headers = $this->authHeader($user);

        $this->withHeaders($headers)->postJson('/api/v1/consents', ['health_worker_id' => $nakes->id])
            ->assertCreated();

        $this->withHeaders($headers)->postJson('/api/v1/consents', ['health_worker_id' => $nakes->id])
            ->assertStatus(422);

        // Tapi setelah dicabut, izin baru boleh dibuat lagi — indeks unik
        // parsial hanya berlaku untuk baris yang belum dicabut.
        HealthWorkerConsent::firstOrFail()->revoke();

        $this->withHeaders($headers)->postJson('/api/v1/consents', ['health_worker_id' => $nakes->id])
            ->assertCreated();

        $this->assertSame(2, HealthWorkerConsent::count());
    }

    public function test_regenerating_invalidates_the_previous_code(): void
    {
        $user = User::factory()->create();
        $nakes = $this->healthWorker();

        $first = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/consents', ['health_worker_id' => $nakes->id])
            ->json('data.access_code');

        $consent = HealthWorkerConsent::firstOrFail();

        $second = $this->withHeaders($this->authHeader($user))
            ->postJson("/api/v1/consents/{$consent->id}/regenerate")
            ->assertOk()
            ->json('data.access_code');

        $this->assertNotSame($first, $second);

        $nakesHeaders = $this->authHeader($nakes);
        $this->withHeaders($nakesHeaders)->postJson('/api/v1/health-worker/access', ['code' => $first])
            ->assertStatus(404);
        $this->withHeaders($this->authHeader($nakes))->postJson('/api/v1/health-worker/access', ['code' => $second])
            ->assertOk();
    }

    public function test_revoking_blocks_access_immediately(): void
    {
        $user = User::factory()->create();
        $nakes = $this->healthWorker();

        $code = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/consents', ['health_worker_id' => $nakes->id])
            ->json('data.access_code');

        $consent = HealthWorkerConsent::firstOrFail();

        $this->withHeaders($this->authHeader($nakes))
            ->postJson('/api/v1/health-worker/access', ['code' => $code])
            ->assertOk();

        $this->withHeaders($this->authHeader($user))
            ->deleteJson("/api/v1/consents/{$consent->id}")
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        // Baris tetap ada sebagai riwayat, tapi tidak membuka apa pun lagi.
        $this->assertNotNull($consent->fresh()->revoked_at);

        $this->withHeaders($this->authHeader($nakes))
            ->postJson('/api/v1/health-worker/access', ['code' => $code])
            ->assertStatus(404);
        $this->withHeaders($this->authHeader($nakes))
            ->getJson("/api/v1/health-worker/patients/{$consent->id}")
            ->assertStatus(404);
    }

    public function test_consent_of_another_user_cannot_be_read_or_revoked(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();

        $this->withHeaders($this->authHeader($owner))
            ->postJson('/api/v1/consents', ['health_worker_id' => $this->healthWorker()->id])
            ->assertCreated();

        $consent = HealthWorkerConsent::firstOrFail();
        $headers = $this->authHeader($stranger);

        $this->withHeaders($headers)->deleteJson("/api/v1/consents/{$consent->id}")->assertStatus(404);
        $this->withHeaders($headers)->getJson("/api/v1/consents/{$consent->id}/notes")->assertStatus(404);
        $this->withHeaders($headers)->postJson("/api/v1/consents/{$consent->id}/regenerate")->assertStatus(404);

        $this->assertNull($consent->fresh()->revoked_at);
    }

    public function test_health_worker_lookup_matches_the_full_email_only(): void
    {
        $user = User::factory()->create();
        $nakes = User::factory()->create(['role' => 'health_worker', 'email' => 'bidan.ratna@example.test']);
        $headers = $this->authHeader($user);

        $this->withHeaders($headers)
            ->getJson('/api/v1/consents/health-workers?email=bidan.ratna@example.test')
            ->assertOk()
            ->assertJsonPath('data.0.id', $nakes->id)
            ->assertJsonPath('data.0.name', $nakes->name);

        // Bukan pencarian sebagian: tidak bisa dipakai menyisir direktori.
        $this->withHeaders($headers)
            ->getJson('/api/v1/consents/health-workers?email=bidan@example.test')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // Pengguna biasa tidak pernah muncul di sini meski emailnya tepat.
        $this->withHeaders($headers)
            ->getJson('/api/v1/consents/health-workers?email='.$user->email)
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_expired_consent_stops_working_without_being_revoked(): void
    {
        $user = User::factory()->create();
        $nakes = $this->healthWorker();

        $code = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/consents', [
                'health_worker_id' => $nakes->id,
                'expires_at' => now()->addDay()->toIso8601String(),
            ])
            ->assertCreated()
            ->json('data.access_code');

        $this->travel(2)->days();

        $this->withHeaders($this->authHeader($nakes))
            ->postJson('/api/v1/health-worker/access', ['code' => $code])
            ->assertStatus(404);

        $this->assertNull(HealthWorkerConsent::firstOrFail()->revoked_at);
    }
}
