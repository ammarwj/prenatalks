<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Questionnaire;
use App\Models\RiskAssessment;
use App\Models\Setting;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_stats_are_readable_without_login(): void
    {
        $response = $this->getJson('/api/v1/stats');

        $response->assertOk();
        $this->assertSame(
            ['mothers', 'contents', 'assessments', 'health_workers'],
            array_column($response->json('data.items'), 'key')
        );
    }

    /**
     * Sistem yang baru dipasang harus menjawab angka nol, bukan galat — bar
     * statistik dirender sebelum ada satu pun pengguna.
     */
    public function test_empty_system_returns_zeros(): void
    {
        $response = $this->getJson('/api/v1/stats');

        $response->assertOk();
        foreach ($response->json('data.items') as $item) {
            $this->assertSame(0, $item['value']);
            $this->assertSame('0', $item['display']);
        }
    }

    public function test_only_active_users_with_the_user_role_count_as_mothers(): void
    {
        User::factory()->create(['role' => 'user', 'is_active' => true]);
        User::factory()->create(['role' => 'user', 'is_active' => false]);
        User::factory()->create(['role' => 'admin', 'is_active' => true]);
        User::factory()->create(['role' => 'super_admin', 'is_active' => true]);
        User::factory()->create(['role' => 'health_worker', 'is_active' => true]);

        $data = $this->getJson('/api/v1/stats')->json('data.items');

        $this->assertSame(1, $data[0]['value']);
        $this->assertSame(1, $data[3]['value']);
    }

    /**
     * Konten terjadwal belum bisa dibaca pengunjung, jadi tidak boleh ikut
     * diklaim di halaman depan.
     */
    public function test_draft_and_scheduled_content_is_not_counted(): void
    {
        $this->article('terbit');
        $this->article('draf', ['status' => 'draft', 'published_at' => null]);
        $this->article('terjadwal', ['published_at' => now()->addWeek()]);
        $this->video('video-terbit');
        $this->video('video-terjadwal', ['published_at' => now()->addWeek()]);

        $data = $this->getJson('/api/v1/stats')->json('data.items');

        $this->assertSame(2, $data[1]['value']);
    }

    public function test_unfinished_assessments_are_not_counted(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $questionnaire = Questionnaire::create([
            'title' => 'Kuesioner', 'version' => 1, 'is_active' => true, 'published_at' => now(),
        ]);
        $base = [
            'user_id' => $user->id, 'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => 1, 'total_score' => 4,
        ];

        RiskAssessment::create([...$base, 'status' => 'completed', 'completed_at' => now()]);
        RiskAssessment::create([...$base, 'status' => 'in_progress']);

        $data = $this->getJson('/api/v1/stats')->json('data.items');

        $this->assertSame(1, $data[2]['value']);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function article(string $slug, array $overrides = []): void
    {
        Article::create(array_merge([
            'title' => $slug,
            'slug' => $slug,
            'content' => '<p>Isi artikel.</p>',
            'source_reference' => 'Kemenkes RI',
            'reviewed_at' => now()->subMonth(),
            'life_stage' => 'pregnancy',
            'status' => 'published',
            'published_at' => now()->subDay(),
        ], $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function video(string $slug, array $overrides = []): void
    {
        Video::create(array_merge([
            'title' => $slug,
            'slug' => $slug,
            'youtube_id' => 'dQw4w9WgXcQ',
            'status' => 'published',
            'published_at' => now()->subDay(),
        ], $overrides));
    }

    public function test_labels_come_from_settings(): void
    {
        Setting::putMany(['stats_label_mothers' => 'Ibu yang sudah bergabung']);

        $data = $this->getJson('/api/v1/stats')->json('data.items');

        $this->assertSame('Ibu yang sudah bergabung', $data[0]['label']);
    }

    /**
     * Bar tetap dikirim lengkap saat dimatikan — yang memutuskan
     * menampilkannya adalah landing page, dan form pengaturan tetap perlu
     * membaca angkanya untuk pratinjau.
     */
    public function test_disabled_flag_is_reported_without_hiding_the_numbers(): void
    {
        Setting::putMany(['stats_enabled' => false]);

        $response = $this->getJson('/api/v1/stats');

        $response->assertOk();
        $this->assertFalse($response->json('data.enabled'));
        $this->assertCount(4, $response->json('data.items'));
    }
}
