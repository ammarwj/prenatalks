<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\LegalDocument;
use App\Models\User;
use Database\Seeders\LegalDocumentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class LegalDocumentControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(LegalDocumentSeeder::class);
    }

    /**
     * @return array<string, string>
     */
    private function authHeader(User $user): array
    {
        $this->app['auth']->forgetGuards();
        $this->app['tymon.jwt']->unsetToken();

        return ['Authorization' => 'Bearer '.JWTAuth::fromUser($user)];
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Kebijakan Privasi',
            'body' => '<p>Isi kebijakan yang sudah ditinjau.</p>',
            'effective_date' => '2026-09-01',
            'is_published' => true,
        ], $overrides);
    }

    public function test_guest_is_rejected(): void
    {
        $this->getJson('/api/v1/admin/legal-documents')->assertStatus(401);
    }

    public function test_regular_user_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/admin/legal-documents')
            ->assertStatus(403);
    }

    /**
     * Dokumen legal mengikat pengguna yang menyetujuinya saat mendaftar, jadi
     * admin konten biasa tidak boleh mengubahnya — sejajar dengan kuesioner
     * risiko dan identitas situs.
     */
    public function test_plain_admin_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $this->withHeaders($headers)->getJson('/api/v1/admin/legal-documents')->assertStatus(403);
        $this->withHeaders($headers)
            ->putJson('/api/v1/admin/legal-documents/kebijakan-privasi', $this->payload())
            ->assertStatus(403);
    }

    public function test_super_admin_sees_both_documents(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $response = $this->withHeaders($this->authHeader($superAdmin))
            ->getJson('/api/v1/admin/legal-documents');

        $response->assertOk()->assertJsonCount(2, 'data');
        $this->assertEqualsCanonicalizing(
            array_keys(LegalDocument::SLUGS),
            array_column($response->json('data'), 'slug')
        );
    }

    /**
     * Binding memakai slug, bukan id — rute publik dan panel admin karenanya
     * berbicara dalam identitas yang sama.
     */
    public function test_document_is_bound_by_slug_not_id(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $headers = $this->authHeader($superAdmin);

        $this->withHeaders($headers)
            ->getJson('/api/v1/admin/legal-documents/syarat-ketentuan')
            ->assertOk()
            ->assertJson(['data' => ['slug' => 'syarat-ketentuan']]);

        $id = LegalDocument::where('slug', 'syarat-ketentuan')->value('id');
        $this->withHeaders($headers)
            ->getJson("/api/v1/admin/legal-documents/{$id}")
            ->assertStatus(404);
    }

    public function test_super_admin_can_update_a_document(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $response = $this->withHeaders($this->authHeader($superAdmin))
            ->putJson('/api/v1/admin/legal-documents/kebijakan-privasi', $this->payload([
                'title' => 'Kebijakan Privasi PrenaTalks',
            ]));

        $response->assertOk()->assertJson([
            'data' => [
                'title' => 'Kebijakan Privasi PrenaTalks',
                'effective_date' => '2026-09-01',
                'is_published' => true,
            ],
        ]);
        $this->assertSame($superAdmin->id, LegalDocument::where('slug', 'kebijakan-privasi')->value('updated_by'));
    }

    public function test_updated_by_is_stamped_from_the_session_not_the_payload(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $other = User::factory()->create(['role' => 'user']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->putJson('/api/v1/admin/legal-documents/kebijakan-privasi', $this->payload([
                'updated_by' => $other->id,
            ]))
            ->assertOk();

        $this->assertSame($superAdmin->id, LegalDocument::where('slug', 'kebijakan-privasi')->value('updated_by'));
    }

    public function test_unpublishing_hides_the_document_from_the_public_endpoint(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->putJson('/api/v1/admin/legal-documents/syarat-ketentuan', $this->payload([
                'title' => 'Syarat & Ketentuan',
                'is_published' => false,
            ]))
            ->assertOk();

        $this->getJson('/api/v1/legal-documents/syarat-ketentuan')->assertStatus(404);
    }

    public function test_title_and_body_are_required(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->putJson('/api/v1/admin/legal-documents/kebijakan-privasi', ['title' => '', 'body' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'body']);
    }

    public function test_invalid_effective_date_is_rejected(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->putJson(
                '/api/v1/admin/legal-documents/kebijakan-privasi',
                $this->payload(['effective_date' => 'bukan-tanggal'])
            )
            ->assertStatus(422)
            ->assertJsonValidationErrors('effective_date');
    }

    /**
     * Himpunan dokumennya tetap dua: tidak ada jalur membuat atau menghapus,
     * dan itu ditegakkan router — bukan sekadar tombol yang disembunyikan.
     */
    public function test_there_is_no_create_or_delete_route(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $headers = $this->authHeader($superAdmin);

        $this->withHeaders($headers)
            ->postJson('/api/v1/admin/legal-documents', $this->payload(['slug' => 'kebijakan-cookie']))
            ->assertStatus(405);

        $this->withHeaders($headers)
            ->deleteJson('/api/v1/admin/legal-documents/kebijakan-privasi')
            ->assertStatus(405);

        $this->assertSame(2, LegalDocument::count());
    }

    /**
     * `auditIgnore()` mengecualikan `body`: satu dokumen legal berukuran
     * puluhan ribu karakter, dan mencatat diff-nya akan membuat satu baris
     * audit lebih besar daripada seluruh tabel lainnya — sekaligus meledakkan
     * tinggi baris di halaman audit log. Yang bermakna sebagai jejak — judul,
     * tanggal berlaku, status terbit, dan siapa penyuntingnya — tetap dicatat.
     */
    public function test_audit_log_records_the_change_without_storing_the_html(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $headers = $this->authHeader($superAdmin);
        $current = LegalDocument::where('slug', 'kebijakan-privasi')->first();

        $this->withHeaders($headers)->putJson('/api/v1/admin/legal-documents/kebijakan-privasi', [
            'title' => $current->title,
            'body' => '<p>Hanya isinya yang berubah.</p>',
            'effective_date' => null,
            'is_published' => $current->is_published,
        ])->assertOk();

        $log = AuditLog::where('model_type', 'LegalDocument')->latest('id')->first();
        $this->assertNotNull($log, 'Suntingan dokumen legal harus meninggalkan jejak audit');
        $this->assertArrayNotHasKey('body', $log->changes);

        $this->withHeaders($headers)->putJson('/api/v1/admin/legal-documents/kebijakan-privasi', [
            'title' => 'Kebijakan Privasi (revisi)',
            'body' => '<p>Hanya isinya yang berubah.</p>',
            'effective_date' => '2026-09-01',
            'is_published' => true,
        ])->assertOk();

        $log = AuditLog::where('model_type', 'LegalDocument')->latest('id')->first();
        $this->assertArrayHasKey('title', $log->changes);
        $this->assertArrayHasKey('effective_date', $log->changes);
        $this->assertArrayNotHasKey('body', $log->changes);
    }
}
