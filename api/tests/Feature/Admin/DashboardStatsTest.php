<?php

namespace Tests\Feature\Admin;

use App\Models\Article;
use App\Models\Faq;
use App\Models\Form;
use App\Models\Questionnaire;
use App\Models\RiskAssessment;
use App\Models\RiskLevel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class DashboardStatsTest extends TestCase
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

    public function test_guest_and_regular_user_are_rejected(): void
    {
        $this->getJson('/api/v1/admin/dashboard')->assertStatus(401);

        $user = User::factory()->create(['role' => 'user']);
        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/admin/dashboard')
            ->assertStatus(403);
    }

    public function test_empty_system_returns_zeroes_without_errors(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))->getJson('/api/v1/admin/dashboard');

        $response->assertOk();
        $this->assertSame(1, $response->json('data.users.total'));
        $this->assertSame(0, $response->json('data.assessments.total'));
        $this->assertSame([], $response->json('data.risk_distribution'));
        $this->assertSame(0, $response->json('data.content.articles_published'));
        $this->assertSame(0, $response->json('data.form_responses.total'));
    }

    public function test_user_counts_separate_admins_and_inactive_accounts(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->create(['role' => 'super_admin']);
        User::factory()->create(['role' => 'user']);
        User::factory()->create(['role' => 'user', 'is_active' => false]);

        $response = $this->withHeaders($this->authHeader($admin))->getJson('/api/v1/admin/dashboard');

        $response->assertOk()->assertJson([
            'data' => ['users' => ['total' => 4, 'active' => 3, 'admins' => 2, 'new_this_month' => 4]],
        ]);
    }

    public function test_assessments_this_month_excludes_older_and_unfinished_ones(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $questionnaire = Questionnaire::create([
            'title' => 'Kuesioner', 'version' => 1, 'is_active' => true, 'published_at' => now(),
        ]);

        $base = [
            'user_id' => $admin->id, 'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1, 'total_score' => 4,
        ];

        RiskAssessment::create([...$base, 'status' => 'completed', 'completed_at' => now()]);
        RiskAssessment::create([...$base, 'status' => 'completed', 'completed_at' => now()->subMonths(2)]);
        RiskAssessment::create([...$base, 'status' => 'in_progress']);
        RiskAssessment::create([
            ...$base, 'status' => 'completed', 'completed_at' => now(), 'has_danger_sign' => true,
        ]);

        $response = $this->withHeaders($this->authHeader($admin))->getJson('/api/v1/admin/dashboard');

        $response->assertOk()->assertJson([
            'data' => ['assessments' => ['this_month' => 2, 'total' => 3, 'with_danger_sign' => 1]],
        ]);
    }

    /**
     * Level yang belum pernah dipakai tetap muncul dengan count 0, supaya
     * komposisi legenda grafik tidak berubah-ubah seiring data masuk.
     */
    public function test_risk_distribution_includes_unused_levels_as_zero(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $questionnaire = Questionnaire::create([
            'title' => 'Kuesioner', 'version' => 1, 'is_active' => true, 'published_at' => now(),
        ]);

        $low = RiskLevel::create([
            'questionnaire_id' => $questionnaire->id, 'name' => 'Risiko Rendah',
            'min_score' => 2, 'max_score' => 6, 'color_hex' => '#0D9488',
            'recommendation' => 'ANC rutin', 'order_index' => 10,
        ]);
        RiskLevel::create([
            'questionnaire_id' => $questionnaire->id, 'name' => 'Risiko Tinggi',
            'min_score' => 12, 'max_score' => 99, 'color_hex' => '#E11D48',
            'recommendation' => 'Rujuk', 'order_index' => 30,
        ]);

        RiskAssessment::create([
            'user_id' => $admin->id, 'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1, 'total_score' => 4, 'risk_level_id' => $low->id,
            'status' => 'completed', 'completed_at' => now(),
        ]);

        $response = $this->withHeaders($this->authHeader($admin))->getJson('/api/v1/admin/dashboard');

        $response->assertOk();
        $distribution = $response->json('data.risk_distribution');
        $this->assertCount(2, $distribution);
        $this->assertSame(['Risiko Rendah', 'Risiko Tinggi'], array_column($distribution, 'name'));
        $this->assertSame([1, 0], array_column($distribution, 'count'));
    }

    public function test_content_counts_only_published_items(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        foreach ([['Terbit', 'published'], ['Draf', 'draft']] as [$title, $status]) {
            Article::create([
                'title' => $title, 'slug' => strtolower($title), 'content' => 'Isi.',
                'source_reference' => 'Buku KIA.', 'reviewed_at' => now()->toDateString(),
                'status' => $status, 'published_at' => $status === 'published' ? now() : null,
            ]);
        }

        Faq::create(['question' => 'Terbit', 'answer' => 'A', 'order_index' => 10, 'is_published' => true]);
        Faq::create(['question' => 'Draf', 'answer' => 'A', 'order_index' => 20, 'is_published' => false]);

        $response = $this->withHeaders($this->authHeader($admin))->getJson('/api/v1/admin/dashboard');

        $response->assertOk()->assertJson([
            'data' => [
                'content' => [
                    'articles_published' => 1,
                    'articles_draft' => 1,
                    'videos_published' => 0,
                    'faqs_published' => 1,
                ],
            ],
        ]);
    }

    public function test_form_responses_are_counted_with_open_form_total(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $open = Form::create([
            'title' => 'Survei Terbuka', 'slug' => 'survei-terbuka', 'type' => 'survey',
            'is_public' => true, 'status' => 'published',
        ]);
        Form::create([
            'title' => 'Draf', 'slug' => 'draf', 'type' => 'form',
            'is_public' => true, 'status' => 'draft',
        ]);

        $open->submissions()->create(['submitted_at' => now()]);
        $open->submissions()->create(['submitted_at' => now()->subMonths(2)]);

        $response = $this->withHeaders($this->authHeader($admin))->getJson('/api/v1/admin/dashboard');

        $response->assertOk()->assertJson([
            'data' => ['form_responses' => ['total' => 2, 'this_month' => 1, 'open_forms' => 1]],
        ]);
    }
}
