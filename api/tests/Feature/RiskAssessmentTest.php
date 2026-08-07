<?php

namespace Tests\Feature;

use App\Models\Pregnancy;
use App\Models\Question;
use App\Models\Questionnaire;
use App\Models\RiskAnswer;
use App\Models\RiskAssessment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class RiskAssessmentTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        return ['Authorization' => 'Bearer '.JWTAuth::fromUser($user)];
    }

    /**
     * Kuesioner minimal: 1 pertanyaan single_choice biasa + 1 pertanyaan boolean
     * tanda bahaya + 1 pertanyaan multiple_choice, cukup untuk menguji skor,
     * deteksi tanda bahaya, dan validasi wajib-jawab tanpa memuat seluruh draf KSPR.
     */
    private function createQuestionnaire(): Questionnaire
    {
        $questionnaire = Questionnaire::create([
            'title' => 'Kuesioner Uji',
            'version' => 1,
            'is_active' => true,
            'published_at' => now(),
        ]);

        $age = $questionnaire->questions()->create([
            'text' => 'Usia?', 'type' => 'single_choice', 'is_required' => true, 'order_index' => 10,
        ]);
        $age->options()->create(['label' => '< 16', 'score' => 4, 'order_index' => 10]);
        $age->options()->create(['label' => '16-34', 'score' => 0, 'order_index' => 20]);

        $conditions = $questionnaire->questions()->create([
            'text' => 'Kondisi?', 'type' => 'multiple_choice', 'is_required' => true, 'order_index' => 20,
        ]);
        $conditions->options()->create(['label' => 'Anemia', 'score' => 4, 'order_index' => 10]);
        $conditions->options()->create(['label' => 'Hipertensi', 'score' => 4, 'order_index' => 20]);

        $bleeding = $questionnaire->questions()->create([
            'text' => 'Perdarahan?', 'type' => 'boolean', 'is_required' => true, 'order_index' => 30,
        ]);
        $bleeding->options()->create(['label' => 'Ya', 'score' => 8, 'is_danger_sign' => true, 'order_index' => 10]);
        $bleeding->options()->create(['label' => 'Tidak', 'score' => 0, 'order_index' => 20]);

        $questionnaire->riskLevels()->create([
            'name' => 'Risiko Rendah', 'min_score' => 2, 'max_score' => 6,
            'color_hex' => '#0D9488', 'recommendation' => 'Lanjutkan ANC rutin.', 'order_index' => 10,
        ]);
        $questionnaire->riskLevels()->create([
            'name' => 'Risiko Tinggi', 'min_score' => 7, 'max_score' => null,
            'color_hex' => '#E11D48', 'recommendation' => 'Segera rujuk.', 'order_index' => 20,
        ]);

        return $questionnaire;
    }

    public function test_active_questionnaire_hides_score_and_danger_sign_from_options(): void
    {
        $this->createQuestionnaire();
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/questionnaires/active');

        $response->assertOk();
        $firstOption = $response->json('data.questions.0.options.0');
        $this->assertArrayNotHasKey('score', $firstOption);
        $this->assertArrayNotHasKey('is_danger_sign', $firstOption);
    }

    public function test_active_questionnaire_returns_404_when_none_is_active(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/questionnaires/active')
            ->assertStatus(404);
    }

    public function test_full_flow_computes_base_score_plus_answers(): void
    {
        $questionnaire = $this->createQuestionnaire();
        $user = User::factory()->create();
        $headers = $this->authHeader($user);

        $start = $this->withHeaders($headers)->postJson('/api/v1/assessments');
        $start->assertCreated();
        $assessmentId = $start->json('data.assessment.id');

        $ageOption = Question::where('text', 'Usia?')->first()->options()->where('label', '16-34')->first();
        $this->withHeaders($headers)
            ->patchJson("/api/v1/assessments/{$assessmentId}/answers", [
                'question_id' => Question::where('text', 'Usia?')->first()->id,
                'option_id' => $ageOption->id,
            ])->assertOk()->assertJson(['data' => ['total_score' => 2, 'has_danger_sign' => false]]);

        $conditionsQuestion = Question::where('text', 'Kondisi?')->first();
        $anemia = $conditionsQuestion->options()->where('label', 'Anemia')->first();
        $hipertensi = $conditionsQuestion->options()->where('label', 'Hipertensi')->first();
        $this->withHeaders($headers)
            ->patchJson("/api/v1/assessments/{$assessmentId}/answers", [
                'question_id' => $conditionsQuestion->id,
                'option_ids' => [$anemia->id, $hipertensi->id],
            ])->assertOk()->assertJson(['data' => ['total_score' => 10]]);

        $bleedingQuestion = Question::where('text', 'Perdarahan?')->first();
        $yes = $bleedingQuestion->options()->where('label', 'Ya')->first();
        $this->withHeaders($headers)
            ->patchJson("/api/v1/assessments/{$assessmentId}/answers", [
                'question_id' => $bleedingQuestion->id,
                'option_id' => $yes->id,
            ])->assertOk()->assertJson([
                'data' => ['total_score' => 18, 'has_danger_sign' => true, 'triggered_danger_sign' => true],
            ]);

        $submit = $this->withHeaders($headers)->postJson("/api/v1/assessments/{$assessmentId}/submit");
        $submit->assertOk()->assertJson([
            'data' => [
                'status' => 'completed',
                'total_score' => 18,
                'has_danger_sign' => true,
                'risk_level' => ['name' => 'Risiko Tinggi'],
                'questionnaire_version' => 1,
            ],
        ]);
        $this->assertCount(3, $submit->json('data.contributing_factors'));
    }

    public function test_submit_is_blocked_until_email_is_verified(): void
    {
        $questionnaire = $this->createQuestionnaire();
        $user = User::factory()->unverified()->create();
        $assessment = RiskAssessment::create([
            'user_id' => $user->id,
            'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1,
            'status' => 'in_progress',
        ]);
        $age = Question::where('text', 'Usia?')->first();
        $answer = $age->options()->where('label', '16-34')->first();
        RiskAnswer::create([
            'assessment_id' => $assessment->id, 'question_id' => $age->id,
            'option_id' => $answer->id, 'score' => 0,
        ]);

        $this->withHeaders($this->authHeader($user))
            ->postJson("/api/v1/assessments/{$assessment->id}/submit")
            ->assertStatus(403);

        $this->assertSame('in_progress', $assessment->fresh()->status);
    }

    public function test_answering_the_same_question_twice_replaces_the_previous_answer(): void
    {
        $questionnaire = $this->createQuestionnaire();
        $user = User::factory()->create();
        $headers = $this->authHeader($user);
        $assessmentId = $this->withHeaders($headers)->postJson('/api/v1/assessments')->json('data.assessment.id');

        $ageQuestion = Question::where('text', 'Usia?')->first();
        $young = $ageQuestion->options()->where('label', '< 16')->first();
        $mid = $ageQuestion->options()->where('label', '16-34')->first();

        $this->withHeaders($headers)->patchJson("/api/v1/assessments/{$assessmentId}/answers", [
            'question_id' => $ageQuestion->id, 'option_id' => $young->id,
        ])->assertJson(['data' => ['total_score' => 6]]); // base 2 + 4

        $this->withHeaders($headers)->patchJson("/api/v1/assessments/{$assessmentId}/answers", [
            'question_id' => $ageQuestion->id, 'option_id' => $mid->id,
        ])->assertJson(['data' => ['total_score' => 2]]); // diganti, bukan ditambah

        $this->assertSame(1, RiskAnswer::where('assessment_id', $assessmentId)->count());
    }

    public function test_submit_rejects_when_required_questions_unanswered(): void
    {
        $this->createQuestionnaire();
        $user = User::factory()->create();
        $headers = $this->authHeader($user);
        $assessmentId = $this->withHeaders($headers)->postJson('/api/v1/assessments')->json('data.assessment.id');

        $this->withHeaders($headers)->postJson("/api/v1/assessments/{$assessmentId}/submit")
            ->assertStatus(422);
    }

    public function test_cannot_modify_a_completed_assessment(): void
    {
        $questionnaire = $this->createQuestionnaire();
        $user = User::factory()->create();
        $headers = $this->authHeader($user);
        $assessment = RiskAssessment::create([
            'user_id' => $user->id,
            'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1,
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $this->withHeaders($headers)
            ->postJson("/api/v1/assessments/{$assessment->id}/submit")
            ->assertStatus(422);
    }

    public function test_user_cannot_view_or_modify_another_users_assessment(): void
    {
        $questionnaire = $this->createQuestionnaire();
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $assessment = RiskAssessment::create([
            'user_id' => $owner->id,
            'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1,
            'status' => 'in_progress',
        ]);

        $this->withHeaders($this->authHeader($intruder))
            ->getJson("/api/v1/assessments/{$assessment->id}")
            ->assertStatus(404);

        $this->withHeaders($this->authHeader($intruder))
            ->postJson("/api/v1/assessments/{$assessment->id}/submit")
            ->assertStatus(404);
    }

    public function test_history_lists_only_completed_assessments_for_the_authenticated_user(): void
    {
        $questionnaire = $this->createQuestionnaire();
        $user = User::factory()->create();
        $other = User::factory()->create();

        RiskAssessment::create([
            'user_id' => $user->id, 'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1, 'status' => 'completed', 'completed_at' => now(), 'total_score' => 6,
        ]);
        RiskAssessment::create([
            'user_id' => $user->id, 'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1, 'status' => 'in_progress',
        ]);
        RiskAssessment::create([
            'user_id' => $other->id, 'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1, 'status' => 'completed', 'completed_at' => now(),
        ]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/assessments');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_new_assessment_links_to_the_users_active_pregnancy(): void
    {
        $this->createQuestionnaire();
        $user = User::factory()->create();
        $pregnancy = Pregnancy::factory()->for($user)->create(['status' => 'active']);

        $response = $this->withHeaders($this->authHeader($user))->postJson('/api/v1/assessments');

        $response->assertCreated();
        $this->assertSame($pregnancy->id, RiskAssessment::first()->pregnancy_id);
    }

    public function test_pdf_download_requires_a_completed_assessment(): void
    {
        $questionnaire = $this->createQuestionnaire();
        $user = User::factory()->create();
        $assessment = RiskAssessment::create([
            'user_id' => $user->id,
            'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1,
            'status' => 'in_progress',
        ]);

        $this->withHeaders($this->authHeader($user))
            ->getJson("/api/v1/assessments/{$assessment->id}/pdf")
            ->assertStatus(422);
    }

    public function test_pdf_download_returns_a_pdf_for_the_owner(): void
    {
        $questionnaire = $this->createQuestionnaire();
        $user = User::factory()->create();
        $riskLevel = $questionnaire->riskLevels()->first();
        $assessment = RiskAssessment::create([
            'user_id' => $user->id,
            'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1,
            'status' => 'completed',
            'completed_at' => now(),
            'total_score' => 6,
            'risk_level_id' => $riskLevel->id,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->get("/api/v1/assessments/{$assessment->id}/pdf");

        $response->assertOk();
        $this->assertSame('application/pdf', $response->headers->get('content-type'));
    }

    public function test_pdf_download_is_blocked_for_a_non_owner(): void
    {
        $questionnaire = $this->createQuestionnaire();
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $assessment = RiskAssessment::create([
            'user_id' => $owner->id,
            'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1,
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $this->withHeaders($this->authHeader($intruder))
            ->getJson("/api/v1/assessments/{$assessment->id}/pdf")
            ->assertStatus(404);
    }
}
