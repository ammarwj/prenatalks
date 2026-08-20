<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\Guide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class GuideControllerTest extends TestCase
{
    use RefreshDatabase;

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
            'title' => 'Membuat Akun',
            'summary' => 'Daftar, verifikasi email, lalu masuk.',
            'body' => '<p>Buka halaman daftar dan isi data Anda.</p>',
            'is_published' => true,
        ], $overrides);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function make(string $title, array $overrides = []): Guide
    {
        return Guide::create(array_merge([
            'title' => $title,
            'summary' => null,
            'body' => '<p>Isi panduan.</p>',
            'order_index' => 10,
            'is_published' => true,
        ], $overrides));
    }

    public function test_guest_is_rejected(): void
    {
        $this->getJson('/api/v1/admin/guides')->assertStatus(401);
    }

    public function test_regular_user_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/admin/guides')
            ->assertStatus(403);
    }

    /**
     * Panduan penggunaan ditautkan dari footer setiap halaman, sejajar dengan
     * dokumen legal — jadi dibatasi super_admin, bukan admin konten biasa.
     */
    public function test_plain_admin_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $this->withHeaders($headers)->getJson('/api/v1/admin/guides')->assertStatus(403);
        $this->withHeaders($headers)->postJson('/api/v1/admin/guides', $this->payload())->assertStatus(403);
        $this->withHeaders($headers)
            ->patchJson('/api/v1/admin/guides/reorder', ['ids' => [1]])
            ->assertStatus(403);
    }

    public function test_super_admin_sees_drafts_too_in_the_admin_list(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $this->make('Terbit');
        $this->make('Masih draf', ['order_index' => 20, 'is_published' => false]);

        $this->withHeaders($this->authHeader($superAdmin))
            ->getJson('/api/v1/admin/guides')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_super_admin_can_create_a_guide(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->postJson('/api/v1/admin/guides', $this->payload())
            ->assertStatus(201)
            ->assertJson(['data' => ['title' => 'Membuat Akun', 'is_published' => true]]);

        $this->assertDatabaseHas('guides', ['title' => 'Membuat Akun']);
    }

    /**
     * Panduan baru selalu masuk di urutan paling akhir, bukan menumpuk di
     * `order_index` 0 bersama panduan pertama.
     */
    public function test_new_guide_is_appended_to_the_end(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $this->make('Sudah ada', ['order_index' => 40]);

        $this->withHeaders($this->authHeader($superAdmin))
            ->postJson('/api/v1/admin/guides', $this->payload())
            ->assertStatus(201)
            ->assertJson(['data' => ['order_index' => 50]]);
    }

    public function test_super_admin_can_update_a_guide(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $guide = $this->make('Judul lama');

        $this->withHeaders($this->authHeader($superAdmin))
            ->putJson("/api/v1/admin/guides/{$guide->id}", $this->payload(['title' => 'Judul baru']))
            ->assertOk()
            ->assertJson(['data' => ['title' => 'Judul baru']]);

        $this->assertSame('Judul baru', $guide->fresh()->title);
    }

    public function test_super_admin_can_delete_a_guide(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $guide = $this->make('Akan dihapus');

        $this->withHeaders($this->authHeader($superAdmin))
            ->deleteJson("/api/v1/admin/guides/{$guide->id}")
            ->assertOk();

        $this->assertDatabaseMissing('guides', ['id' => $guide->id]);
    }

    public function test_unpublishing_hides_the_guide_from_the_public_endpoint(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $guide = $this->make('Terbit dulu');

        $this->withHeaders($this->authHeader($superAdmin))
            ->putJson("/api/v1/admin/guides/{$guide->id}", $this->payload([
                'title' => 'Terbit dulu',
                'is_published' => false,
            ]))
            ->assertOk();

        $this->getJson('/api/v1/guides')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_title_and_body_are_required(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->postJson('/api/v1/admin/guides', ['title' => '', 'body' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'body']);
    }

    public function test_overlong_title_and_summary_are_rejected(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->postJson('/api/v1/admin/guides', $this->payload([
                'title' => str_repeat('a', 151),
                'summary' => str_repeat('b', 256),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'summary']);
    }

    /**
     * "reorder" didaftarkan sebelum `apiResource`; kalau urutannya terbalik,
     * permintaan ini akan diikat sebagai `{guide}` dengan id "reorder" dan
     * berakhir 404 alih-alih menyimpan urutan.
     */
    public function test_super_admin_can_reorder_guides(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $first = $this->make('Pertama', ['order_index' => 10]);
        $second = $this->make('Kedua', ['order_index' => 20]);
        $third = $this->make('Ketiga', ['order_index' => 30]);

        $response = $this->withHeaders($this->authHeader($superAdmin))
            ->patchJson('/api/v1/admin/guides/reorder', [
                'ids' => [$third->id, $first->id, $second->id],
            ]);

        $response->assertOk();
        $this->assertSame(
            ['Ketiga', 'Pertama', 'Kedua'],
            array_column($response->json('data'), 'title')
        );
        $this->assertSame(10, $third->fresh()->order_index);
        $this->assertSame(30, $second->fresh()->order_index);
    }

    public function test_reorder_rejects_unknown_ids(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $guide = $this->make('Pertama');

        $this->withHeaders($this->authHeader($superAdmin))
            ->patchJson('/api/v1/admin/guides/reorder', ['ids' => [$guide->id, 99999]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('ids.1');

        $this->assertSame(10, $guide->fresh()->order_index);
    }

    /**
     * `auditIgnore()` mengecualikan `body` dengan alasan yang sama seperti
     * dokumen legal: HTML panduan bisa panjang dan diff-nya akan meledakkan
     * baris di `/admin/audit-log`. Judul, ringkasan, dan status terbit tetap
     * tercatat.
     */
    public function test_audit_log_records_the_change_without_storing_the_html(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $headers = $this->authHeader($superAdmin);
        $guide = $this->make('Judul lama');

        $this->withHeaders($headers)
            ->putJson("/api/v1/admin/guides/{$guide->id}", $this->payload(['title' => 'Judul baru']))
            ->assertOk();

        $log = AuditLog::where('model_type', 'Guide')->latest('id')->first();
        $this->assertNotNull($log, 'Suntingan panduan harus meninggalkan jejak audit');
        $this->assertArrayHasKey('title', $log->changes);
        $this->assertArrayNotHasKey('body', $log->changes);
    }
}
