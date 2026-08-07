<?php

namespace Tests\Feature;

use App\Models\Pregnancy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class PregnancyTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        return ['Authorization' => 'Bearer '.JWTAuth::fromUser($user)];
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/pregnancies')->assertStatus(401);
    }

    public function test_store_computes_edd_date_via_naegele_rule(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))->postJson('/api/v1/pregnancies', [
            'lmp_date' => '2026-05-15',
        ]);

        $response->assertCreated()->assertJson([
            'success' => true,
            'data' => [
                'lmp_date' => '2026-05-15',
                'edd_date' => '2027-02-22',
                'edd_overridden' => false,
                'status' => 'active',
            ],
        ]);
    }

    public function test_store_respects_explicit_edd_date_override(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))->postJson('/api/v1/pregnancies', [
            'lmp_date' => '2026-05-15',
            'edd_date' => '2027-03-01',
        ]);

        $response->assertCreated()->assertJson([
            'data' => [
                'edd_date' => '2027-03-01',
                'edd_overridden' => true,
            ],
        ]);
    }

    public function test_store_rejects_future_lmp_date(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))->postJson('/api/v1/pregnancies', [
            'lmp_date' => now()->addDay()->toDateString(),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('lmp_date');
    }

    public function test_store_rejects_lmp_date_older_than_300_days(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))->postJson('/api/v1/pregnancies', [
            'lmp_date' => now()->subDays(301)->toDateString(),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('lmp_date');
    }

    public function test_store_rejects_unknown_medical_history_value(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))->postJson('/api/v1/pregnancies', [
            'lmp_date' => '2026-05-15',
            'medical_history' => ['kanker'],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('medical_history.0');
    }

    public function test_creating_a_new_pregnancy_completes_the_previous_active_one(): void
    {
        $user = User::factory()->create();
        $first = Pregnancy::factory()->for($user)->create(['status' => 'active']);

        $response = $this->withHeaders($this->authHeader($user))->postJson('/api/v1/pregnancies', [
            'lmp_date' => '2026-06-01',
        ]);

        $response->assertCreated()->assertJson(['data' => ['status' => 'active']]);
        $this->assertSame('completed', $first->fresh()->status);
        $this->assertSame(1, Pregnancy::where('user_id', $user->id)->where('status', 'active')->count());
    }

    public function test_index_returns_only_the_authenticated_users_pregnancies(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        Pregnancy::factory()->for($user)->create();
        Pregnancy::factory()->for($other)->create();

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/pregnancies');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_update_recalculates_edd_date_when_lmp_date_changes(): void
    {
        $user = User::factory()->create();
        $pregnancy = Pregnancy::factory()->for($user)->create([
            'lmp_date' => '2026-05-15',
            'edd_date' => '2027-02-22',
        ]);

        $response = $this->withHeaders($this->authHeader($user))->putJson("/api/v1/pregnancies/{$pregnancy->id}", [
            'lmp_date' => '2026-04-01',
        ]);

        $response->assertOk()->assertJson([
            'data' => ['lmp_date' => '2026-04-01', 'edd_date' => '2027-01-08'],
        ]);
    }

    public function test_user_cannot_view_or_update_another_users_pregnancy(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $pregnancy = Pregnancy::factory()->for($owner)->create();

        $this->withHeaders($this->authHeader($intruder))
            ->getJson("/api/v1/pregnancies/{$pregnancy->id}")
            ->assertStatus(404);

        $this->withHeaders($this->authHeader($intruder))
            ->putJson("/api/v1/pregnancies/{$pregnancy->id}", ['lmp_date' => '2026-05-15'])
            ->assertStatus(404);
    }
}
