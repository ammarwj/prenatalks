<?php

namespace Tests\Feature;

use App\Models\Guide;
use Database\Seeders\GuideSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuideTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function make(string $title, array $overrides = []): Guide
    {
        return Guide::create(array_merge([
            'title' => $title,
            'summary' => 'Ringkasan singkat.',
            'body' => '<p>Isi panduan.</p>',
            'order_index' => 10,
            'is_published' => true,
        ], $overrides));
    }

    public function test_published_guides_are_readable_without_login(): void
    {
        $this->make('Membuat Akun');

        $this->getJson('/api/v1/guides')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJson(['data' => [['title' => 'Membuat Akun', 'summary' => 'Ringkasan singkat.']]]);
    }

    public function test_draft_guides_are_hidden(): void
    {
        $this->make('Terbit', ['order_index' => 10]);
        $this->make('Masih draf', ['order_index' => 20, 'is_published' => false]);

        $titles = array_column($this->getJson('/api/v1/guides')->json('data'), 'title');

        $this->assertSame(['Terbit'], $titles);
    }

    /**
     * Nomor langkah di halaman publik dihitung dari posisi dalam daftar, jadi
     * urutan yang salah bukan sekadar soal estetika — langkah 3 bisa tampil
     * sebagai langkah 1.
     */
    public function test_guides_come_back_in_the_order_the_admin_set(): void
    {
        $this->make('Langkah ketiga', ['order_index' => 30]);
        $this->make('Langkah pertama', ['order_index' => 10]);
        $this->make('Langkah kedua', ['order_index' => 20]);

        $titles = array_column($this->getJson('/api/v1/guides')->json('data'), 'title');

        $this->assertSame(['Langkah pertama', 'Langkah kedua', 'Langkah ketiga'], $titles);
    }

    public function test_public_payload_omits_admin_only_fields(): void
    {
        $this->make('Membuat Akun');

        $data = $this->getJson('/api/v1/guides')->json('data.0');

        $this->assertArrayNotHasKey('is_published', $data);
        $this->assertArrayNotHasKey('order_index', $data);
    }

    public function test_seeder_publishes_the_default_guides_and_is_repeatable(): void
    {
        $this->seed(GuideSeeder::class);
        $count = Guide::count();

        $this->seed(GuideSeeder::class);

        $this->assertSame($count, Guide::count());
        $this->getJson('/api/v1/guides')->assertOk()->assertJsonCount($count, 'data');
    }

    /**
     * Dijalankan ulang setelah super admin menyunting tidak boleh
     * mengembalikan teks bawaan.
     */
    public function test_seeder_does_not_overwrite_edited_text(): void
    {
        $this->seed(GuideSeeder::class);
        $first = Guide::ordered()->first();
        $first->update(['body' => '<p>Teks hasil suntingan.</p>']);

        $this->seed(GuideSeeder::class);

        $this->assertSame('<p>Teks hasil suntingan.</p>', $first->fresh()->body);
    }

    /**
     * Isi bawaan hanya boleh memakai tag yang lolos `sanitizeRichTextHtml()`
     * di frontend — `h1`, tabel, gambar, dan `hr` dibuang saat render, jadi
     * memakainya akan membuat bagian panduan hilang diam-diam.
     */
    public function test_seeded_html_only_uses_tags_that_survive_sanitising(): void
    {
        $this->seed(GuideSeeder::class);

        foreach (Guide::pluck('body') as $body) {
            $this->assertDoesNotMatchRegularExpression('/<(h1|table|hr|img|script)\b/i', $body);
            $this->assertStringNotContainsString(' id=', $body);
        }
    }
}
