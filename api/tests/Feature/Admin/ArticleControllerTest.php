<?php

namespace Tests\Feature\Admin;

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ArticleControllerTest extends TestCase
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
            'title' => 'Nutrisi Penting Trimester Pertama',
            'excerpt' => 'Ringkasan singkat artikel.',
            'content' => '<p>'.str_repeat('kata ', 250).'</p>',
            'source_reference' => 'Kemenkes RI, Buku KIA 2024',
            'reviewed_at' => now()->subDay()->toDateString(),
            'status' => 'draft',
        ], $overrides);
    }

    public function test_regular_user_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/admin/articles')
            ->assertStatus(403);
    }

    public function test_admin_can_create_an_article(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/articles', $this->payload());

        $response->assertCreated()->assertJson([
            'data' => ['title' => 'Nutrisi Penting Trimester Pertama', 'status' => 'draft'],
        ]);
        $this->assertNotEmpty($response->json('data.slug'));
        $this->assertNull($response->json('data.published_at'));
        $this->assertGreaterThanOrEqual(1, $response->json('data.reading_minutes'));
    }

    public function test_slug_is_auto_generated_and_unique(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $first = $this->withHeaders($headers)->postJson('/api/v1/admin/articles', $this->payload())->json('data');
        $second = $this->withHeaders($headers)->postJson('/api/v1/admin/articles', $this->payload())->json('data');

        $this->assertSame('nutrisi-penting-trimester-pertama', $first['slug']);
        $this->assertSame('nutrisi-penting-trimester-pertama-2', $second['slug']);
    }

    public function test_source_reference_and_reviewed_at_are_required(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))->postJson('/api/v1/admin/articles', [
            'title' => 'Judul',
            'content' => '<p>Isi</p>',
            'status' => 'draft',
        ]);

        $response->assertStatus(422);
        $this->assertArrayHasKey('source_reference', $response->json('errors'));
        $this->assertArrayHasKey('reviewed_at', $response->json('errors'));
    }

    public function test_reviewed_at_cannot_be_in_the_future(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))->postJson('/api/v1/admin/articles', $this->payload([
            'reviewed_at' => now()->addDay()->toDateString(),
        ]));

        $response->assertStatus(422);
        $this->assertArrayHasKey('reviewed_at', $response->json('errors'));
    }

    public function test_publishing_now_sets_published_at_to_current_time(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/articles', $this->payload(['status' => 'published']));

        $response->assertCreated();
        $this->assertNotNull($response->json('data.published_at'));
        $this->assertFalse($response->json('data.is_scheduled'));
    }

    public function test_scheduling_a_future_published_at_marks_it_as_scheduled(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))->postJson('/api/v1/admin/articles', $this->payload([
            'status' => 'published',
            'published_at' => now()->addWeek()->toIso8601String(),
        ]));

        $response->assertCreated();
        $this->assertTrue($response->json('data.is_scheduled'));
    }

    public function test_cover_upload_is_converted_to_webp(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $cover = UploadedFile::fake()->image('cover.jpg', 1200, 800);

        $response = $this->withHeaders($this->authHeader($admin))
            ->post('/api/v1/admin/articles', array_merge($this->payload(), ['cover' => $cover]));

        $response->assertCreated();
        $article = Article::first();
        $this->assertNotNull($article->cover_path);
        $this->assertStringEndsWith('.webp', $article->cover_path);
        Storage::disk('public')->assertExists($article->cover_path);
        $this->assertNotNull($response->json('data.cover_url'));
    }

    public function test_admin_can_update_an_article_and_remove_its_cover(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);
        $cover = UploadedFile::fake()->image('cover.jpg');

        $created = $this->withHeaders($headers)
            ->post('/api/v1/admin/articles', array_merge($this->payload(), ['cover' => $cover]))
            ->json('data');

        $response = $this->withHeaders($headers)->post("/api/v1/admin/articles/{$created['id']}", array_merge(
            $this->payload(['title' => 'Judul Diperbarui']),
            ['_method' => 'PUT', 'remove_cover' => '1']
        ));

        $response->assertOk()->assertJson(['data' => ['title' => 'Judul Diperbarui']]);
        $this->assertNull($response->json('data.cover_url'));
    }

    public function test_admin_can_delete_an_article(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $created = $this->withHeaders($headers)->postJson('/api/v1/admin/articles', $this->payload())->json('data');

        $this->withHeaders($headers)->deleteJson("/api/v1/admin/articles/{$created['id']}")->assertOk();
        $this->assertSoftDeleted('articles', ['id' => $created['id']]);
    }

    public function test_category_can_be_attached(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $category = Category::create(['name' => 'Nutrisi', 'slug' => 'nutrisi', 'type' => 'article']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/articles', $this->payload(['category_id' => $category->id]));

        $response->assertCreated()->assertJson(['data' => ['category' => ['name' => 'Nutrisi']]]);
    }
}
