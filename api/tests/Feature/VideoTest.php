<?php

namespace Tests\Feature;

use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VideoTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function videoAttributes(array $overrides = []): array
    {
        static $counter = 0;
        $counter++;

        return array_merge([
            'title' => "Video Uji {$counter}",
            'slug' => "video-uji-{$counter}",
            'youtube_id' => 'dQw4w9WgXcQ',
            'status' => 'published',
            'published_at' => now()->subDay(),
        ], $overrides);
    }

    private function createVideo(array $overrides = []): Video
    {
        return Video::create($this->videoAttributes($overrides));
    }

    public function test_public_list_only_shows_published_videos(): void
    {
        $this->createVideo(['title' => 'Terbit', 'slug' => 'terbit']);
        $this->createVideo(['title' => 'Draf', 'slug' => 'draf', 'status' => 'draft', 'published_at' => null]);

        $response = $this->getJson('/api/v1/videos');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Terbit', $response->json('data.0.title'));
    }

    public function test_future_scheduled_video_is_hidden_until_published_at(): void
    {
        $this->createVideo(['status' => 'published', 'published_at' => now()->addWeek()]);

        $response = $this->getJson('/api/v1/videos');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_summary_thumbnail_falls_back_to_youtube_cdn(): void
    {
        $this->createVideo();

        $response = $this->getJson('/api/v1/videos');

        $this->assertStringContainsString('img.youtube.com/vi/dQw4w9WgXcQ', $response->json('data.0.thumbnail_url'));
    }

    public function test_show_returns_embed_url(): void
    {
        $this->createVideo(['slug' => 'senam-hamil']);

        $response = $this->getJson('/api/v1/videos/senam-hamil');

        $response->assertOk();
        $this->assertSame(
            'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
            $response->json('data.embed_url')
        );
    }

    public function test_show_returns_404_for_draft_video(): void
    {
        $this->createVideo(['status' => 'draft', 'published_at' => null, 'slug' => 'draf-tersembunyi']);

        $this->getJson('/api/v1/videos/draf-tersembunyi')->assertStatus(404);
    }

    public function test_show_returns_404_for_unknown_slug(): void
    {
        $this->getJson('/api/v1/videos/tidak-ada')->assertStatus(404);
    }
}
