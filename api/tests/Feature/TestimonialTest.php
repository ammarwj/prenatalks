<?php

namespace Tests\Feature;

use App\Models\Testimonial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TestimonialTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function make(array $overrides = []): Testimonial
    {
        return Testimonial::create(array_merge([
            'name' => 'Siti',
            'pregnancy_age' => '28 minggu',
            'quote' => 'Informasinya lengkap dan mudah dipahami.',
            'rating' => 5,
            'is_published' => true,
        ], $overrides));
    }

    public function test_testimonials_are_readable_without_login(): void
    {
        $this->make();

        $this->getJson('/api/v1/testimonials')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_unpublished_testimonials_are_hidden(): void
    {
        $this->make(['name' => 'Tampil']);
        $this->make(['name' => 'Sembunyi', 'is_published' => false]);

        $response = $this->getJson('/api/v1/testimonials');

        $response->assertOk()->assertJsonCount(1, 'data');
        $this->assertSame('Tampil', $response->json('data.0.name'));
    }

    public function test_testimonials_follow_the_configured_order(): void
    {
        $this->make(['name' => 'Kedua', 'order_index' => 20]);
        $this->make(['name' => 'Pertama', 'order_index' => 10]);

        $response = $this->getJson('/api/v1/testimonials');

        $this->assertSame(['Pertama', 'Kedua'], array_column($response->json('data'), 'name'));
    }

    public function test_photo_url_is_absolute_and_null_when_absent(): void
    {
        Storage::fake('public');
        $this->make(['name' => 'Berfoto', 'photo_path' => 'testimonials/abc.webp', 'order_index' => 10]);
        $this->make(['name' => 'Tanpa Foto', 'order_index' => 20]);

        $response = $this->getJson('/api/v1/testimonials');

        $this->assertStringContainsString('testimonials/abc.webp', $response->json('data.0.photo_url'));
        $this->assertNull($response->json('data.1.photo_url'));
    }

    /**
     * Kolom internal tidak ikut keluar: pengunjung tidak perlu tahu urutan
     * atau status terbit, dan membocorkannya memperluas permukaan API publik
     * tanpa alasan.
     */
    public function test_public_payload_omits_admin_only_columns(): void
    {
        $this->make();

        $item = $this->getJson('/api/v1/testimonials')->json('data.0');

        $this->assertArrayNotHasKey('order_index', $item);
        $this->assertArrayNotHasKey('is_published', $item);
    }
}
