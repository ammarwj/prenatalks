<?php

namespace Tests\Feature;

use App\Models\LegalDocument;
use Database\Seeders\LegalDocumentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LegalDocumentTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function make(string $slug, array $overrides = []): LegalDocument
    {
        return LegalDocument::create(array_merge([
            'slug' => $slug,
            'title' => LegalDocument::SLUGS[$slug],
            'body' => '<p>Isi dokumen.</p>',
            'is_published' => true,
        ], $overrides));
    }

    public function test_published_document_is_readable_without_login(): void
    {
        $this->make('kebijakan-privasi', ['effective_date' => '2026-08-20']);

        $this->getJson('/api/v1/legal-documents/kebijakan-privasi')
            ->assertOk()
            ->assertJson([
                'data' => [
                    'slug' => 'kebijakan-privasi',
                    'title' => 'Kebijakan Privasi',
                    'effective_date' => '2026-08-20',
                ],
            ]);
    }

    /**
     * Halaman publiknya tetap merender keadaan "sedang difinalisasi" saat
     * menerima 404 ini — yang tidak boleh terjadi adalah menyajikan teks yang
     * belum ditinjau sebagai kebijakan yang berlaku.
     */
    public function test_unpublished_document_is_hidden(): void
    {
        $this->make('syarat-ketentuan', ['is_published' => false]);

        $this->getJson('/api/v1/legal-documents/syarat-ketentuan')->assertStatus(404);
    }

    /**
     * Slug dibatasi di rute, jadi nilai di luar daftar berhenti sebagai 404
     * rute — tidak pernah sampai ke controller.
     */
    public function test_unknown_slug_is_rejected_by_the_route(): void
    {
        $this->getJson('/api/v1/legal-documents/kebijakan-cookie')->assertStatus(404);
    }

    public function test_public_payload_omits_admin_only_fields(): void
    {
        $this->make('kebijakan-privasi');

        $data = $this->getJson('/api/v1/legal-documents/kebijakan-privasi')->json('data');

        $this->assertArrayNotHasKey('is_published', $data);
        $this->assertArrayNotHasKey('updated_by', $data);
        $this->assertArrayNotHasKey('id', $data);
    }

    public function test_seeder_publishes_both_documents_and_is_repeatable(): void
    {
        $this->seed(LegalDocumentSeeder::class);
        $this->seed(LegalDocumentSeeder::class);

        $this->assertSame(2, LegalDocument::count());

        foreach (array_keys(LegalDocument::SLUGS) as $slug) {
            $this->getJson("/api/v1/legal-documents/{$slug}")->assertOk();
        }
    }

    /**
     * Dijalankan ulang setelah admin menyunting tidak boleh mengembalikan
     * teks draf bawaan.
     */
    public function test_seeder_does_not_overwrite_edited_text(): void
    {
        $this->seed(LegalDocumentSeeder::class);
        LegalDocument::where('slug', 'syarat-ketentuan')->update(['body' => '<p>Teks hasil suntingan.</p>']);

        $this->seed(LegalDocumentSeeder::class);

        $this->assertSame(
            '<p>Teks hasil suntingan.</p>',
            LegalDocument::where('slug', 'syarat-ketentuan')->value('body')
        );
    }

    /**
     * Isi draf hanya boleh memakai tag yang lolos `sanitizeRichTextHtml()` di
     * frontend — `h1`, tabel, dan `hr` dibuang saat render, jadi memakainya
     * akan membuat bagian dokumen hilang diam-diam di halaman publik.
     */
    public function test_seeded_html_only_uses_tags_that_survive_sanitising(): void
    {
        $this->seed(LegalDocumentSeeder::class);

        foreach (LegalDocument::pluck('body') as $body) {
            $this->assertDoesNotMatchRegularExpression('/<(h1|table|hr|img|script)\b/i', $body);
            $this->assertStringNotContainsString(' id=', $body);
        }
    }
}
