<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Faq;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FaqTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_list_only_shows_published_faqs(): void
    {
        Faq::create(['question' => 'Terbit', 'answer' => 'Jawaban', 'order_index' => 10, 'is_published' => true]);
        Faq::create(['question' => 'Draf', 'answer' => 'Jawaban', 'order_index' => 20, 'is_published' => false]);

        $response = $this->getJson('/api/v1/faqs');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Terbit', $response->json('data.0.question'));
    }

    public function test_list_is_ordered_by_order_index(): void
    {
        Faq::create(['question' => 'Kedua', 'answer' => 'A', 'order_index' => 20, 'is_published' => true]);
        Faq::create(['question' => 'Pertama', 'answer' => 'B', 'order_index' => 10, 'is_published' => true]);

        $response = $this->getJson('/api/v1/faqs');

        $response->assertOk();
        $this->assertSame('Pertama', $response->json('data.0.question'));
        $this->assertSame('Kedua', $response->json('data.1.question'));
    }

    public function test_list_includes_category(): void
    {
        $category = Category::create(['name' => 'Umum', 'slug' => 'umum', 'type' => 'faq']);
        Faq::create([
            'question' => 'Apa itu PrenaTalks?',
            'answer' => 'Platform edukasi kehamilan.',
            'category_id' => $category->id,
            'order_index' => 10,
            'is_published' => true,
        ]);

        $response = $this->getJson('/api/v1/faqs');

        $response->assertOk();
        $this->assertSame('Umum', $response->json('data.0.category.name'));
    }
}
