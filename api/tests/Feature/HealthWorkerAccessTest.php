<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\HealthWorkerConsent;
use App\Models\HealthWorkerNote;
use App\Models\Pregnancy;
use App\Models\Questionnaire;
use App\Models\RiskAssessment;
use App\Models\User;
use App\Services\HealthWorkerConsentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Sisi tenaga kesehatan — PRD §9 F-15, BUSINESS_FLOWS §9.
 */
class HealthWorkerAccessTest extends TestCase
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

    /**
     * Satu pasangan lengkap: pemberi izin dengan satu hasil cek risiko
     * selesai, tenaga kesehatan penerima, dan kode tautannya.
     *
     * @return array{user: User, nakes: User, consent: HealthWorkerConsent, code: string, assessment: RiskAssessment}
     */
    private function scenario(): array
    {
        $user = User::factory()->create();
        $nakes = User::factory()->create(['role' => 'health_worker']);

        Pregnancy::factory()->create([
            'user_id' => $user->id,
            'lmp_date' => now()->subWeeks(20)->toDateString(),
            'status' => 'active',
        ]);

        $questionnaire = Questionnaire::create([
            'title' => 'Kuesioner Uji', 'version' => 1, 'is_active' => true, 'published_at' => now(),
        ]);
        $riskLevel = $questionnaire->riskLevels()->create([
            'name' => 'Risiko Tinggi', 'min_score' => 0, 'max_score' => null,
            'color_hex' => '#E11D48', 'recommendation' => 'Segera rujuk.', 'order_index' => 10,
        ]);

        $assessment = RiskAssessment::create([
            'user_id' => $user->id,
            'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1,
            'total_score' => 8,
            'risk_level_id' => $riskLevel->id,
            'has_danger_sign' => true,
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        [$code, $consent] = app(HealthWorkerConsentService::class)->issue($user, $nakes);

        return compact('user', 'nakes', 'consent', 'code', 'assessment');
    }

    public function test_redeeming_the_link_code_opens_the_assessment_results(): void
    {
        ['nakes' => $nakes, 'code' => $code, 'user' => $user, 'assessment' => $assessment] = $this->scenario();

        $response = $this->withHeaders($this->authHeader($nakes))
            ->postJson('/api/v1/health-worker/access', ['code' => $code])
            ->assertOk()
            ->assertJsonPath('data.patient_name', $user->name)
            ->assertJsonPath('data.assessments.0.id', $assessment->id)
            ->assertJsonPath('data.assessments.0.total_score', 8)
            ->assertJsonPath('data.assessments.0.risk_level.name', 'Risiko Tinggi');

        // Usia kehamilan ikut karena skor risiko tidak terbaca tanpanya…
        $this->assertSame(20, $response->json('data.pregnancy.gestational_age.weeks'));

        // …tapi tidak ada data kehamilan lain dan tidak ada kontak pemberi izin.
        $this->assertArrayNotHasKey('blood_type', $response->json('data.pregnancy'));
        $this->assertArrayNotHasKey('medical_history', $response->json('data.pregnancy'));
        $this->assertArrayNotHasKey('patient_email', $response->json('data'));
    }

    public function test_a_leaked_link_is_useless_to_anyone_but_the_named_health_worker(): void
    {
        ['code' => $code] = $this->scenario();

        $otherNakes = User::factory()->create(['role' => 'health_worker']);
        $this->withHeaders($this->authHeader($otherNakes))
            ->postJson('/api/v1/health-worker/access', ['code' => $code])
            ->assertStatus(404);

        // Peran biasa tidak bisa masuk ke area ini sama sekali.
        $this->withHeaders($this->authHeader(User::factory()->create()))
            ->postJson('/api/v1/health-worker/access', ['code' => $code])
            ->assertStatus(403);

        // Begitu pula admin: F-15 menyebut tenaga kesehatan, bukan pengelola.
        $this->withHeaders($this->authHeader(User::factory()->create(['role' => 'admin'])))
            ->postJson('/api/v1/health-worker/access', ['code' => $code])
            ->assertStatus(403);
    }

    public function test_an_unknown_code_is_indistinguishable_from_a_revoked_one(): void
    {
        ['nakes' => $nakes, 'code' => $code, 'consent' => $consent] = $this->scenario();

        $unknown = $this->withHeaders($this->authHeader($nakes))
            ->postJson('/api/v1/health-worker/access', ['code' => 'kode-yang-tidak-pernah-ada'])
            ->assertStatus(404);

        $consent->revoke();

        $revoked = $this->withHeaders($this->authHeader($nakes))
            ->postJson('/api/v1/health-worker/access', ['code' => $code])
            ->assertStatus(404);

        $this->assertSame($unknown->json('message'), $revoked->json('message'));
    }

    public function test_reading_results_is_recorded_in_audit_logs(): void
    {
        ['nakes' => $nakes, 'code' => $code, 'consent' => $consent, 'assessment' => $assessment] = $this->scenario();

        $headers = $this->authHeader($nakes);

        $this->withHeaders($headers)->postJson('/api/v1/health-worker/access', ['code' => $code])->assertOk();
        $this->withHeaders($this->authHeader($nakes))
            ->getJson("/api/v1/health-worker/patients/{$consent->id}/assessments/{$assessment->id}")
            ->assertOk();

        $logs = AuditLog::where('action', 'accessed')->orderBy('id')->get();

        $this->assertCount(2, $logs);
        $this->assertSame($nakes->id, $logs[0]->user_id);
        $this->assertSame('HealthWorkerConsent', $logs[0]->model_type);
        $this->assertSame($consent->id, $logs[0]->model_id);
        $this->assertSame('redeem', $logs[0]->changes['via']);
        $this->assertSame($assessment->id, $logs[1]->changes['risk_assessment_id']);

        // Pembacaan hanya menulis baris `accessed`; `last_accessed_at` ada di
        // auditIgnore() sehingga tidak ada baris `updated` yang ikut lahir.
        $this->assertSame(0, AuditLog::where('action', 'updated')->count());
        $this->assertNotNull($consent->fresh()->last_accessed_at);
    }

    public function test_a_valid_consent_does_not_open_other_patients_results(): void
    {
        ['nakes' => $nakes, 'consent' => $consent] = $this->scenario();

        // Hasil milik orang lain yang tidak pernah memberi izin apa pun.
        $otherScenario = $this->scenario();

        $this->withHeaders($this->authHeader($nakes))
            ->getJson("/api/v1/health-worker/patients/{$consent->id}/assessments/{$otherScenario['assessment']->id}")
            ->assertStatus(404);
    }

    public function test_health_worker_writes_an_education_note_that_the_patient_can_read(): void
    {
        ['nakes' => $nakes, 'consent' => $consent, 'user' => $user, 'assessment' => $assessment] = $this->scenario();

        $this->withHeaders($this->authHeader($nakes))
            ->postJson("/api/v1/health-worker/patients/{$consent->id}/notes", [
                'body' => 'Skor Anda tinggi karena anemia. Konsumsi tablet tambah darah dan kontrol dua minggu lagi.',
                'risk_assessment_id' => $assessment->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.health_worker_name', $nakes->name);

        $this->withHeaders($this->authHeader($user))
            ->getJson("/api/v1/consents/{$consent->id}/notes")
            ->assertOk()
            ->assertJsonPath('data.0.risk_assessment_id', $assessment->id)
            ->assertJsonPath('data.0.health_worker_name', $nakes->name);

        $log = AuditLog::where('model_type', 'HealthWorkerNote')->firstOrFail();
        $this->assertSame('created', $log->action);
        $this->assertSame($nakes->id, $log->user_id);
    }

    public function test_a_note_cannot_be_attached_to_someone_elses_assessment(): void
    {
        ['nakes' => $nakes, 'consent' => $consent] = $this->scenario();
        $otherScenario = $this->scenario();

        $this->withHeaders($this->authHeader($nakes))
            ->postJson("/api/v1/health-worker/patients/{$consent->id}/notes", [
                'body' => 'Catatan yang menunjuk hasil milik orang lain.',
                'risk_assessment_id' => $otherScenario['assessment']->id,
            ])
            ->assertStatus(404);

        $this->assertSame(0, HealthWorkerNote::count());
    }

    public function test_notes_survive_revocation_for_the_patient(): void
    {
        ['nakes' => $nakes, 'consent' => $consent, 'user' => $user] = $this->scenario();

        $this->withHeaders($this->authHeader($nakes))
            ->postJson("/api/v1/health-worker/patients/{$consent->id}/notes", [
                'body' => 'Kontrol kembali dua minggu lagi ya, Bu.',
            ])
            ->assertCreated();

        $this->withHeaders($this->authHeader($user))
            ->deleteJson("/api/v1/consents/{$consent->id}")
            ->assertOk();

        // Catatan edukasi adalah milik pengguna — mencabut izin menutup akses
        // tenaga kesehatan, bukan menghapus apa yang sudah diberikan kepadanya.
        $this->withHeaders($this->authHeader($user))
            ->getJson("/api/v1/consents/{$consent->id}/notes")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->withHeaders($this->authHeader($nakes))
            ->postJson("/api/v1/health-worker/patients/{$consent->id}/notes", ['body' => 'Tambahan setelah dicabut.'])
            ->assertStatus(404);
    }

    public function test_patient_list_only_shows_active_consents(): void
    {
        ['nakes' => $nakes, 'consent' => $consent, 'user' => $user] = $this->scenario();

        $this->withHeaders($this->authHeader($nakes))
            ->getJson('/api/v1/health-worker/patients')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.patient_name', $user->name);

        $consent->revoke();

        $this->withHeaders($this->authHeader($nakes))
            ->getJson('/api/v1/health-worker/patients')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
