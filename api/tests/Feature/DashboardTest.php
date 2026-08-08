<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\ChecklistItem;
use App\Models\Form;
use App\Models\Questionnaire;
use App\Models\RiskAssessment;
use App\Models\RiskLevel;
use App\Models\User;
use App\Models\UserChecklistProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, string>
     */
    private function authHeader(User $user): array
    {
        // Lihat catatan di ChecklistTest: guard `api` dan singleton `tymon.jwt`
        // menyimpan hasil resolusi, sehingga dua request dalam satu test
        // dikenali sebagai pengguna yang sama tanpa reset ini.
        $this->app['auth']->forgetGuards();
        $this->app['tymon.jwt']->unsetToken();

        return ['Authorization' => 'Bearer '.JWTAuth::fromUser($user)];
    }

    private function publishedArticle(string $title, ?int $trimester, string $publishedAt): Article
    {
        return Article::create([
            'title' => $title,
            'slug' => str($title)->slug()->value(),
            'content' => 'Isi artikel.',
            'source_reference' => 'Buku KIA, Kemenkes RI.',
            'reviewed_at' => now()->toDateString(),
            'trimester' => $trimester,
            'status' => 'published',
            'published_at' => $publishedAt,
        ]);
    }

    private function openForm(array $overrides = []): Form
    {
        return Form::create(array_merge([
            'title' => 'Survei Kepuasan',
            'slug' => 'survei-kepuasan',
            'type' => 'survey',
            'is_public' => true,
            'requires_login' => false,
            'is_anonymous' => false,
            'one_response_per_user' => true,
            'status' => 'published',
        ], $overrides));
    }

    public function test_guest_cannot_access_the_dashboard(): void
    {
        $this->getJson('/api/v1/dashboard')->assertStatus(401);
    }

    public function test_new_user_gets_empty_cards_without_errors(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $this->assertNull($response->json('data.pregnancy'));
        $this->assertNull($response->json('data.latest_assessment'));
        $this->assertSame(0, $response->json('data.checklist.total'));
        $this->assertSame([], $response->json('data.pending_forms'));
        $this->assertSame([], $response->json('data.recommended_articles'));
    }

    public function test_pregnancy_card_reports_gestational_age_and_trimester(): void
    {
        $user = User::factory()->create();
        $user->pregnancies()->create([
            'lmp_date' => now()->subWeeks(30)->toDateString(),
            'edd_date' => now()->addWeeks(10)->toDateString(),
            'status' => 'active',
        ]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $this->assertSame(30, $response->json('data.pregnancy.gestational_age.weeks'));
        $this->assertSame(3, $response->json('data.pregnancy.trimester'));
        $this->assertSame(70, $response->json('data.pregnancy.days_remaining'));
    }

    /**
     * HPL yang ditimpa manual (PRD §9 F-03) harus menang atas hasil rumus
     * Naegele — termasuk saat menghitung sisa hari.
     */
    public function test_manually_overridden_due_date_wins_over_the_formula(): void
    {
        $user = User::factory()->create();
        $user->pregnancies()->create([
            'lmp_date' => now()->subWeeks(30)->toDateString(),
            'edd_date' => now()->addDays(20)->toDateString(),
            'edd_overridden' => true,
            'status' => 'active',
        ]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $this->assertTrue($response->json('data.pregnancy.edd_overridden'));
        $this->assertSame(now()->addDays(20)->toDateString(), $response->json('data.pregnancy.edd_date'));
        $this->assertSame(20, $response->json('data.pregnancy.days_remaining'));
    }

    public function test_only_the_active_pregnancy_is_shown(): void
    {
        $user = User::factory()->create();
        $user->pregnancies()->create([
            'lmp_date' => now()->subWeeks(60)->toDateString(),
            'status' => 'completed',
        ]);
        $active = $user->pregnancies()->create([
            'lmp_date' => now()->subWeeks(12)->toDateString(),
            'status' => 'active',
        ]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $this->assertSame($active->id, $response->json('data.pregnancy.id'));
    }

    public function test_latest_completed_assessment_is_shown_with_its_risk_level(): void
    {
        $user = User::factory()->create();
        $questionnaire = Questionnaire::create([
            'title' => 'Kuesioner', 'version' => 1, 'is_active' => true, 'published_at' => now(),
        ]);
        $level = RiskLevel::create([
            'questionnaire_id' => $questionnaire->id,
            'name' => 'Risiko Rendah',
            'min_score' => 2, 'max_score' => 6,
            'color_hex' => '#0D9488',
            'recommendation' => 'Lanjutkan ANC rutin.',
            'order_index' => 10,
        ]);

        RiskAssessment::create([
            'user_id' => $user->id, 'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1, 'total_score' => 4, 'risk_level_id' => $level->id,
            'status' => 'completed', 'completed_at' => now()->subDays(5),
        ]);
        RiskAssessment::create([
            'user_id' => $user->id, 'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1, 'total_score' => 9, 'risk_level_id' => $level->id,
            'has_danger_sign' => true,
            'status' => 'completed', 'completed_at' => now()->subDay(),
        ]);
        // Yang masih berjalan tidak boleh muncul sebagai "hasil terakhir".
        RiskAssessment::create([
            'user_id' => $user->id, 'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1, 'status' => 'in_progress',
        ]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $this->assertSame(9, $response->json('data.latest_assessment.total_score'));
        $this->assertTrue($response->json('data.latest_assessment.has_danger_sign'));
        $this->assertSame('Risiko Rendah', $response->json('data.latest_assessment.risk_level.name'));
        $this->assertSame('#0D9488', $response->json('data.latest_assessment.risk_level.color_hex'));
    }

    public function test_checklist_summary_matches_the_users_progress(): void
    {
        $user = User::factory()->create();
        $item = ChecklistItem::create([
            'group_name' => 'Dokumen', 'title' => 'KTP', 'order_index' => 10, 'is_active' => true,
        ]);
        ChecklistItem::create([
            'group_name' => 'Dokumen', 'title' => 'Buku KIA', 'order_index' => 20, 'is_active' => true,
        ]);
        UserChecklistProgress::create([
            'user_id' => $user->id, 'checklist_item_id' => $item->id, 'is_checked' => true,
        ]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/dashboard');

        $response->assertOk()->assertJson([
            'data' => ['checklist' => ['total' => 2, 'checked' => 1, 'progress_percent' => 50]],
        ]);
    }

    public function test_pending_forms_exclude_ones_the_user_already_submitted(): void
    {
        $user = User::factory()->create();
        $answered = $this->openForm(['title' => 'Sudah Diisi', 'slug' => 'sudah-diisi']);
        $this->openForm(['title' => 'Belum Diisi', 'slug' => 'belum-diisi']);

        $answered->submissions()->create(['user_id' => $user->id, 'submitted_at' => now()]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $titles = array_column($response->json('data.pending_forms'), 'title');
        $this->assertSame(['Belum Diisi'], $titles);
    }

    public function test_pending_forms_of_another_user_do_not_hide_our_own(): void
    {
        $ana = User::factory()->create();
        $budi = User::factory()->create();
        $form = $this->openForm();

        $form->submissions()->create(['user_id' => $ana->id, 'submitted_at' => now()]);

        $response = $this->withHeaders($this->authHeader($budi))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $this->assertCount(1, $response->json('data.pending_forms'));
    }

    public function test_draft_closed_and_private_forms_are_excluded(): void
    {
        $user = User::factory()->create();
        $this->openForm(['title' => 'Draf', 'slug' => 'draf', 'status' => 'draft']);
        $this->openForm(['title' => 'Sudah Tutup', 'slug' => 'sudah-tutup', 'closes_at' => now()->subDay()]);
        $this->openForm(['title' => 'Belum Buka', 'slug' => 'belum-buka', 'opens_at' => now()->addDay()]);
        $this->openForm(['title' => 'Internal', 'slug' => 'internal', 'is_public' => false]);
        $this->openForm(['title' => 'Tampil', 'slug' => 'tampil']);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $this->assertSame(['Tampil'], array_column($response->json('data.pending_forms'), 'title'));
    }

    public function test_recommended_articles_prefer_the_current_trimester(): void
    {
        $user = User::factory()->create();
        $user->pregnancies()->create([
            'lmp_date' => now()->subWeeks(30)->toDateString(),
            'status' => 'active',
        ]);

        $this->publishedArticle('Trimester Tiga A', 3, now()->subDays(9)->toDateTimeString());
        $this->publishedArticle('Trimester Tiga B', 3, now()->subDays(8)->toDateTimeString());
        $this->publishedArticle('Trimester Satu', 1, now()->subDay()->toDateTimeString());

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $titles = array_column($response->json('data.recommended_articles'), 'title');
        $this->assertCount(3, $titles);
        $this->assertSame(['Trimester Tiga B', 'Trimester Tiga A'], array_slice($titles, 0, 2));
        // Kekurangan ditambal artikel terbaru, tanpa menggandakan yang sudah ada.
        $this->assertSame('Trimester Satu', $titles[2]);
    }

    public function test_recommended_articles_fall_back_to_latest_without_pregnancy_data(): void
    {
        $user = User::factory()->create();
        $this->publishedArticle('Artikel Lama', 2, now()->subDays(10)->toDateTimeString());
        $this->publishedArticle('Artikel Baru', 1, now()->subDay()->toDateTimeString());

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $this->assertSame(
            ['Artikel Baru', 'Artikel Lama'],
            array_column($response->json('data.recommended_articles'), 'title')
        );
    }

    public function test_draft_articles_are_never_recommended(): void
    {
        $user = User::factory()->create();
        Article::create([
            'title' => 'Draf Artikel', 'slug' => 'draf-artikel',
            'content' => 'Isi.', 'status' => 'draft',
            'source_reference' => 'Buku KIA, Kemenkes RI.', 'reviewed_at' => now()->toDateString(),
        ]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $this->assertSame([], $response->json('data.recommended_articles'));
    }

    public function test_dashboard_data_is_scoped_per_user(): void
    {
        $item = ChecklistItem::create([
            'group_name' => 'Dokumen', 'title' => 'KTP', 'order_index' => 10, 'is_active' => true,
        ]);
        $ana = User::factory()->create();
        $budi = User::factory()->create();

        $ana->pregnancies()->create([
            'lmp_date' => now()->subWeeks(20)->toDateString(), 'status' => 'active',
        ]);
        UserChecklistProgress::create([
            'user_id' => $ana->id, 'checklist_item_id' => $item->id, 'is_checked' => true,
        ]);

        $response = $this->withHeaders($this->authHeader($budi))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $this->assertNull($response->json('data.pregnancy'));
        $this->assertSame(0, $response->json('data.checklist.checked'));
    }
}
