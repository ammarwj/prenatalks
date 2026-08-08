<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function articleAttributes(array $overrides = []): array
    {
        static $counter = 0;
        $counter++;

        return array_merge([
            'title' => "Artikel Uji {$counter}",
            'slug' => "artikel-uji-{$counter}",
            'content' => '<p>Isi artikel.</p>',
            'source_reference' => 'Kemenkes RI',
            'reviewed_at' => now()->subMonth(),
            'life_stage' => 'pregnancy',
            'status' => 'published',
            'published_at' => now()->subDay(),
        ], $overrides);
    }

    private function createArticle(array $overrides = []): Article
    {
        return Article::create($this->articleAttributes($overrides));
    }

    public function test_public_list_only_shows_published_articles(): void
    {
        $this->createArticle(['title' => 'Terbit', 'slug' => 'terbit']);
        $this->createArticle(['title' => 'Draf', 'slug' => 'draf', 'status' => 'draft', 'published_at' => null]);

        $response = $this->getJson('/api/v1/articles');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Terbit', $response->json('data.0.title'));
    }

    public function test_future_scheduled_article_is_hidden_until_published_at(): void
    {
        $this->createArticle([
            'title' => 'Terjadwal',
            'slug' => 'terjadwal',
            'status' => 'published',
            'published_at' => now()->addWeek(),
        ]);

        $response = $this->getJson('/api/v1/articles');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_filter_by_life_stage(): void
    {
        $this->createArticle(['title' => 'Kehamilan', 'slug' => 'kehamilan', 'life_stage' => 'pregnancy']);
        $this->createArticle(['title' => 'Nifas', 'slug' => 'nifas', 'life_stage' => 'postpartum']);

        $response = $this->getJson('/api/v1/articles?life_stage=postpartum');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Nifas', $response->json('data.0.title'));
    }

    public function test_filter_by_category_slug(): void
    {
        $category = Category::create(['name' => 'Nutrisi', 'slug' => 'nutrisi', 'type' => 'article']);
        $this->createArticle(['title' => 'Dengan Kategori', 'slug' => 'dengan-kategori', 'category_id' => $category->id]);
        $this->createArticle(['title' => 'Tanpa Kategori', 'slug' => 'tanpa-kategori']);

        $response = $this->getJson('/api/v1/articles?category=nutrisi');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Dengan Kategori', $response->json('data.0.title'));
    }

    public function test_filter_by_trimester(): void
    {
        $this->createArticle(['title' => 'Trimester 1', 'slug' => 'trimester-1', 'trimester' => 1]);
        $this->createArticle(['title' => 'Trimester 2', 'slug' => 'trimester-2', 'trimester' => 2]);

        $response = $this->getJson('/api/v1/articles?trimester=1');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Trimester 1', $response->json('data.0.title'));
    }

    public function test_search_matches_title_or_excerpt(): void
    {
        $this->createArticle(['title' => 'Anemia pada Kehamilan', 'slug' => 'anemia']);
        $this->createArticle(['title' => 'Olahraga Ringan', 'slug' => 'olahraga']);

        $response = $this->getJson('/api/v1/articles?search=anemia');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Anemia pada Kehamilan', $response->json('data.0.title'));
    }

    public function test_pagination_defaults_to_12_per_page(): void
    {
        for ($i = 1; $i <= 13; $i++) {
            $this->createArticle(['title' => "Artikel {$i}", 'slug' => "artikel-{$i}"]);
        }

        $response = $this->getJson('/api/v1/articles');

        $response->assertOk();
        $this->assertCount(12, $response->json('data'));
        $this->assertSame(13, $response->json('meta.total'));
        $this->assertSame(12, $response->json('meta.per_page'));
    }

    public function test_show_increments_views_count_and_returns_related_articles(): void
    {
        $category = Category::create(['name' => 'Nutrisi', 'slug' => 'nutrisi', 'type' => 'article']);
        $article = $this->createArticle(['title' => 'Utama', 'slug' => 'utama', 'category_id' => $category->id]);
        $this->createArticle(['title' => 'Terkait', 'slug' => 'terkait', 'category_id' => $category->id]);

        $response = $this->getJson('/api/v1/articles/utama');

        $response->assertOk();
        $this->assertSame(1, $response->json('data.views_count'));
        $this->assertSame(1, $article->fresh()->views_count);
        $this->assertCount(1, $response->json('data.related'));
        $this->assertSame('Terkait', $response->json('data.related.0.title'));
    }

    public function test_show_returns_404_for_draft_article(): void
    {
        $this->createArticle(['status' => 'draft', 'published_at' => null, 'slug' => 'draf-tersembunyi']);

        $this->getJson('/api/v1/articles/draf-tersembunyi')->assertStatus(404);
    }

    public function test_show_returns_404_for_unknown_slug(): void
    {
        $this->getJson('/api/v1/articles/tidak-ada')->assertStatus(404);
    }

    public function test_categories_endpoint_filters_by_type(): void
    {
        Category::create(['name' => 'Nutrisi', 'slug' => 'nutrisi', 'type' => 'article']);
        Category::create(['name' => 'Video A', 'slug' => 'video-a', 'type' => 'video']);

        $response = $this->getJson('/api/v1/categories?type=article');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Nutrisi', $response->json('data.0.name'));
    }
}
