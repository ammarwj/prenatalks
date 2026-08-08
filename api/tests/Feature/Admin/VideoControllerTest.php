<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class VideoControllerTest extends TestCase
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
            'title' => 'Senam Hamil Trimester Ketiga',
            'description' => 'Panduan senam ringan untuk ibu hamil.',
            'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'status' => 'draft',
        ], $overrides);
    }

    public function test_regular_user_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/admin/videos')
            ->assertStatus(403);
    }

    public function test_admin_can_create_a_video(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/videos', $this->payload());

        $response->assertCreated()->assertJson([
            'data' => ['title' => 'Senam Hamil Trimester Ketiga', 'youtube_id' => 'dQw4w9WgXcQ', 'status' => 'draft'],
        ]);
        $this->assertNotEmpty($response->json('data.slug'));
        $this->assertSame(
            'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
            $response->json('data.embed_url')
        );
        $this->assertStringContainsString('dQw4w9WgXcQ', $response->json('data.thumbnail_url'));
    }

    public function test_invalid_youtube_url_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))->postJson('/api/v1/admin/videos', $this->payload([
            'youtube_url' => 'https://vimeo.com/12345',
        ]));

        $response->assertStatus(422);
        $this->assertArrayHasKey('youtube_url', $response->json('errors'));
    }

    public function test_slug_is_auto_generated_and_unique(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $first = $this->withHeaders($headers)->postJson('/api/v1/admin/videos', $this->payload())->json('data');
        $second = $this->withHeaders($headers)->postJson('/api/v1/admin/videos', $this->payload())->json('data');

        $this->assertSame('senam-hamil-trimester-ketiga', $first['slug']);
        $this->assertSame('senam-hamil-trimester-ketiga-2', $second['slug']);
    }

    public function test_publishing_now_sets_published_at(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/videos', $this->payload(['status' => 'published']));

        $response->assertCreated();
        $this->assertNotNull($response->json('data.published_at'));
        $this->assertFalse($response->json('data.is_scheduled'));
    }

    public function test_scheduling_a_future_published_at_marks_it_as_scheduled(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))->postJson('/api/v1/admin/videos', $this->payload([
            'status' => 'published',
            'published_at' => now()->addWeek()->toIso8601String(),
        ]));

        $response->assertCreated();
        $this->assertTrue($response->json('data.is_scheduled'));
    }

    public function test_manual_thumbnail_upload_is_converted_to_webp(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $thumbnail = UploadedFile::fake()->image('thumb.jpg', 640, 360);

        $response = $this->withHeaders($this->authHeader($admin))
            ->post('/api/v1/admin/videos', array_merge($this->payload(), ['thumbnail' => $thumbnail]));

        $response->assertCreated();
        $video = Video::first();
        $this->assertNotNull($video->thumbnail_path);
        $this->assertStringEndsWith('.webp', $video->thumbnail_path);
        Storage::disk('public')->assertExists($video->thumbnail_path);
    }

    public function test_admin_can_update_a_video_and_remove_its_thumbnail(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);
        $thumbnail = UploadedFile::fake()->image('thumb.jpg');

        $created = $this->withHeaders($headers)
            ->post('/api/v1/admin/videos', array_merge($this->payload(), ['thumbnail' => $thumbnail]))
            ->json('data');

        $response = $this->withHeaders($headers)->post("/api/v1/admin/videos/{$created['id']}", array_merge(
            $this->payload(['title' => 'Judul Diperbarui']),
            ['_method' => 'PUT', 'remove_thumbnail' => '1']
        ));

        $response->assertOk()->assertJson(['data' => ['title' => 'Judul Diperbarui']]);
        // thumbnail_url falls back to YouTube's own CDN once the manual upload is removed.
        $this->assertStringContainsString('img.youtube.com', $response->json('data.thumbnail_url'));
    }

    public function test_admin_can_delete_a_video(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $created = $this->withHeaders($headers)->postJson('/api/v1/admin/videos', $this->payload())->json('data');

        $this->withHeaders($headers)->deleteJson("/api/v1/admin/videos/{$created['id']}")->assertOk();
        $this->assertSoftDeleted('videos', ['id' => $created['id']]);
    }

    public function test_category_can_be_attached(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $category = Category::create(['name' => 'Persiapan Persalinan', 'slug' => 'persiapan-persalinan', 'type' => 'video']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/videos', $this->payload(['category_id' => $category->id]));

        $response->assertCreated()->assertJson(['data' => ['category' => ['name' => 'Persiapan Persalinan']]]);
    }
}
