<?php

namespace Tests\Feature\Admin;

use App\Models\Questionnaire;
use App\Models\RiskAssessment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class QuestionnaireControllerTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        return ['Authorization' => 'Bearer '.JWTAuth::fromUser($user)];
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Kuesioner Uji',
            'description' => 'Deskripsi',
            'is_active' => true,
            'questions' => [
                [
                    'text' => 'Usia?',
                    'type' => 'single_choice',
                    'options' => [
                        ['label' => '< 16', 'score' => 4],
                        ['label' => '16-34', 'score' => 0],
                    ],
                ],
            ],
            'risk_levels' => [
                ['name' => 'Rendah', 'min_score' => 0, 'max_score' => 6, 'color_hex' => '#0D9488', 'recommendation' => 'Lanjutkan.'],
                ['name' => 'Tinggi', 'min_score' => 7, 'max_score' => null, 'color_hex' => '#E11D48', 'recommendation' => 'Rujuk.'],
            ],
        ], $overrides);
    }

    public function test_non_super_admin_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/admin/questionnaires')
            ->assertStatus(403);
    }

    public function test_super_admin_can_create_a_questionnaire(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/questionnaires', $this->payload());

        $response->assertCreated()->assertJson([
            'data' => ['version' => 1, 'is_active' => true],
        ]);
        $this->assertCount(2, $response->json('data.questions.0.options'));
        $this->assertSame(4, $response->json('data.questions.0.options.0.score'));
    }

    public function test_creating_an_active_questionnaire_deactivates_the_previous_one(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $headers = $this->authHeader($admin);

        $first = $this->withHeaders($headers)->postJson('/api/v1/admin/questionnaires', $this->payload())
            ->json('data.id');
        $this->withHeaders($headers)->postJson('/api/v1/admin/questionnaires', $this->payload(['title' => 'Kedua']));

        $this->assertFalse(Questionnaire::find($first)->fresh()->is_active);
        $this->assertSame(1, Questionnaire::where('is_active', true)->count());
    }

    public function test_editing_a_questionnaire_without_history_updates_in_place(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $headers = $this->authHeader($admin);
        $id = $this->withHeaders($headers)->postJson('/api/v1/admin/questionnaires', $this->payload())
            ->json('data.id');

        $response = $this->withHeaders($headers)->putJson(
            "/api/v1/admin/questionnaires/{$id}",
            $this->payload(['title' => 'Judul Baru'])
        );

        $response->assertOk()->assertJson(['data' => ['id' => $id, 'version' => 1, 'title' => 'Judul Baru']]);
        $this->assertSame(1, Questionnaire::count());
    }

    public function test_editing_a_questionnaire_with_history_creates_a_new_version(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $user = User::factory()->create();
        $headers = $this->authHeader($admin);
        $id = $this->withHeaders($headers)->postJson('/api/v1/admin/questionnaires', $this->payload())
            ->json('data.id');

        RiskAssessment::create([
            'user_id' => $user->id, 'questionnaire_id' => $id,
            'questionnaire_version' => 1, 'status' => 'completed', 'completed_at' => now(), 'total_score' => 6,
        ]);

        $response = $this->withHeaders($headers)->putJson(
            "/api/v1/admin/questionnaires/{$id}",
            $this->payload(['title' => 'Judul Revisi'])
        );

        $response->assertOk()->assertJson(['data' => ['version' => 2, 'title' => 'Judul Revisi']]);
        $this->assertNotSame($id, $response->json('data.id'));
        $this->assertSame(2, Questionnaire::count());
        $this->assertSame('Kuesioner Uji', Questionnaire::find($id)->title, 'versi lama tidak boleh berubah');
        $this->assertFalse(Questionnaire::find($id)->fresh()->is_active);
    }

    public function test_cannot_delete_a_questionnaire_with_history(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $user = User::factory()->create();
        $headers = $this->authHeader($admin);
        $id = $this->withHeaders($headers)->postJson('/api/v1/admin/questionnaires', $this->payload())
            ->json('data.id');

        RiskAssessment::create([
            'user_id' => $user->id, 'questionnaire_id' => $id,
            'questionnaire_version' => 1, 'status' => 'completed', 'completed_at' => now(),
        ]);

        $this->withHeaders($headers)->deleteJson("/api/v1/admin/questionnaires/{$id}")
            ->assertStatus(409);
        $this->assertNotNull(Questionnaire::find($id));
    }

    public function test_can_delete_a_questionnaire_without_history(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $headers = $this->authHeader($admin);
        $id = $this->withHeaders($headers)->postJson('/api/v1/admin/questionnaires', $this->payload())
            ->json('data.id');

        $this->withHeaders($headers)->deleteJson("/api/v1/admin/questionnaires/{$id}")->assertOk();
        $this->assertNull(Questionnaire::find($id));
    }
}
