<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Unggah aset identitas situs — logo, favicon, hero (PRD §1.4).
 */
class BrandAssetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
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

    private function superAdmin(): array
    {
        return $this->authHeader(User::factory()->create(['role' => 'super_admin']));
    }

    // ---------------------------------------------------------------- akses

    public function test_guest_is_rejected(): void
    {
        $this->postJson('/api/v1/admin/brand/logo', [
            'file' => UploadedFile::fake()->image('logo.png', 512, 512),
        ])->assertStatus(401);
    }

    /** Mengganti wajah situs sekelas kelola pengguna — admin biasa tidak boleh. */
    public function test_regular_admin_is_rejected(): void
    {
        $headers = $this->authHeader(User::factory()->create(['role' => 'admin']));

        $this->postJson('/api/v1/admin/brand/logo', [
            'file' => UploadedFile::fake()->image('logo.png', 512, 512),
        ], $headers)->assertStatus(403);

        Storage::disk('public')->assertMissing('brand/logo.webp');
    }

    public function test_unknown_asset_segment_is_not_routable(): void
    {
        $this->postJson('/api/v1/admin/brand/wallpaper', [
            'file' => UploadedFile::fake()->image('x.png', 512, 512),
        ], $this->superAdmin())->assertStatus(404);
    }

    // ----------------------------------------------------------------- logo

    public function test_logo_upload_writes_webp_and_starts_at_version_one(): void
    {
        $response = $this->postJson('/api/v1/admin/brand/logo', [
            'file' => UploadedFile::fake()->image('logo.png', 1024, 1024),
        ], $this->superAdmin());

        $response->assertOk()->assertJsonPath('data.brand_logo.version', 1);

        Storage::disk('public')->assertExists('brand/logo.webp');
        $this->assertStringContainsString('?v=1', $response->json('data.brand_logo.url'));
    }

    /** Nama berkas tetap, versi yang naik — itulah yang memutus cache. */
    public function test_reupload_overwrites_file_and_bumps_version(): void
    {
        $headers = $this->superAdmin();

        $this->postJson('/api/v1/admin/brand/logo', [
            'file' => UploadedFile::fake()->image('logo.png', 512, 512),
        ], $headers)->assertOk();

        $response = $this->postJson('/api/v1/admin/brand/logo', [
            'file' => UploadedFile::fake()->image('logo-baru.png', 400, 400),
        ], $headers);

        $response->assertOk()->assertJsonPath('data.brand_logo.version', 2);
        $this->assertStringContainsString('?v=2', $response->json('data.brand_logo.url'));

        // Hanya satu berkas logo, bukan dua yang menumpuk.
        $this->assertCount(
            1,
            array_filter(
                Storage::disk('public')->files('brand'),
                fn (string $path) => str_contains($path, 'logo')
            )
        );
    }

    public function test_logo_is_scaled_down_to_the_maximum_width(): void
    {
        $response = $this->postJson('/api/v1/admin/brand/logo', [
            'file' => UploadedFile::fake()->image('logo.png', 2000, 1000),
        ], $this->superAdmin());

        $response->assertOk()
            ->assertJsonPath('data.brand_logo.width', 512)
            ->assertJsonPath('data.brand_logo.height', 256);
    }

    /**
     * Logo tanpa alpha akan tampil berlatar kotak hitam di atas header putih,
     * jadi transparansi wajib selamat sampai WebP.
     */
    public function test_logo_keeps_its_transparency(): void
    {
        $source = imagecreatetruecolor(256, 256);
        imagesavealpha($source, true);
        imagefill($source, 0, 0, imagecolorallocatealpha($source, 0, 0, 0, 127));
        $path = tempnam(sys_get_temp_dir(), 'logo').'.png';
        imagepng($source, $path);
        imagedestroy($source);

        $this->postJson('/api/v1/admin/brand/logo', [
            'file' => new UploadedFile($path, 'logo.png', 'image/png', null, true),
        ], $this->superAdmin())->assertOk();

        $webp = Storage::disk('public')->get('brand/logo.webp');
        $decoded = imagecreatefromstring($webp);

        $this->assertNotFalse($decoded);
        $alpha = (imagecolorat($decoded, 128, 128) >> 24) & 0x7F;
        imagedestroy($decoded);

        $this->assertGreaterThan(0, $alpha, 'Transparansi logo hilang saat dikonversi ke WebP.');
    }

    // -------------------------------------------------------------- favicon

    public function test_favicon_upload_produces_ico_and_apple_touch_icon(): void
    {
        $response = $this->postJson('/api/v1/admin/brand/favicon', [
            'file' => UploadedFile::fake()->image('icon.png', 512, 512),
        ], $this->superAdmin());

        $response->assertOk()->assertJsonPath('data.brand_favicon.version', 1);

        Storage::disk('public')->assertExists('brand/favicon.ico');
        Storage::disk('public')->assertExists('brand/apple-touch-icon.png');

        $this->assertStringContainsString('?v=1', $response->json('data.brand_favicon.apple_touch_url'));
    }

    /** Harus ICO sungguhan, bukan PNG yang sekadar dinamai `.ico`. */
    public function test_favicon_is_a_real_ico_container(): void
    {
        $this->postJson('/api/v1/admin/brand/favicon', [
            'file' => UploadedFile::fake()->image('icon.png', 512, 512),
        ], $this->superAdmin())->assertOk();

        $ico = Storage::disk('public')->get('brand/favicon.ico');

        // reserved=0, type=1, count=3 (16/32/48).
        $this->assertSame("\x00\x00\x01\x00\x03\x00", substr($ico, 0, 6));
    }

    public function test_apple_touch_icon_is_flattened_to_180_square(): void
    {
        $this->postJson('/api/v1/admin/brand/favicon', [
            'file' => UploadedFile::fake()->image('icon.png', 512, 512),
        ], $this->superAdmin())->assertOk();

        $png = imagecreatefromstring(Storage::disk('public')->get('brand/apple-touch-icon.png'));

        $this->assertSame(180, imagesx($png));
        $this->assertSame(180, imagesy($png));
        imagedestroy($png);
    }

    public function test_non_square_favicon_is_rejected(): void
    {
        $this->postJson('/api/v1/admin/brand/favicon', [
            'file' => UploadedFile::fake()->image('wide.png', 400, 200),
        ], $this->superAdmin())
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');

        Storage::disk('public')->assertMissing('brand/favicon.ico');
    }

    /** Rasio meleset sepiksel masih layak jadi favicon. */
    public function test_almost_square_favicon_is_accepted(): void
    {
        $this->postJson('/api/v1/admin/brand/favicon', [
            'file' => UploadedFile::fake()->image('icon.png', 512, 511),
        ], $this->superAdmin())->assertOk();
    }

    // ----------------------------------------------------------------- hero

    public function test_hero_upload_produces_webp_and_open_graph_image(): void
    {
        $response = $this->postJson('/api/v1/admin/brand/hero', [
            'file' => UploadedFile::fake()->image('hero.jpg', 1600, 1600),
        ], $this->superAdmin());

        $response->assertOk()->assertJsonPath('data.brand_hero.version', 1);

        Storage::disk('public')->assertExists('brand/hero.webp');
        Storage::disk('public')->assertExists('brand/og.jpg');
    }

    /**
     * Scraper WhatsApp tidak menampilkan og:image berformat WebP, jadi
     * ukurannya maupun formatnya sama-sama harus benar.
     */
    public function test_open_graph_image_is_jpeg_at_1200_by_630(): void
    {
        $this->postJson('/api/v1/admin/brand/hero', [
            'file' => UploadedFile::fake()->image('hero.jpg', 1600, 1600),
        ], $this->superAdmin())->assertOk();

        $bytes = Storage::disk('public')->get('brand/og.jpg');
        $info = getimagesizefromstring($bytes);

        $this->assertSame(IMAGETYPE_JPEG, $info[2]);
        $this->assertSame(1200, $info[0]);
        $this->assertSame(630, $info[1]);
    }

    // ----------------------------------------------------------- penolakan

    public function test_non_image_file_is_rejected(): void
    {
        $this->postJson('/api/v1/admin/brand/logo', [
            'file' => UploadedFile::fake()->create('brosur.pdf', 100, 'application/pdf'),
        ], $this->superAdmin())
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');
    }

    public function test_svg_is_rejected(): void
    {
        $this->postJson('/api/v1/admin/brand/logo', [
            'file' => UploadedFile::fake()->create('logo.svg', 10, 'image/svg+xml'),
        ], $this->superAdmin())
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');
    }

    public function test_image_below_minimum_dimensions_is_rejected(): void
    {
        $this->postJson('/api/v1/admin/brand/logo', [
            'file' => UploadedFile::fake()->image('tiny.png', 64, 64),
        ], $this->superAdmin())
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');
    }

    public function test_oversized_file_is_rejected(): void
    {
        $file = UploadedFile::fake()->image('logo.png', 512, 512)->size(3000);

        $this->postJson('/api/v1/admin/brand/logo', ['file' => $file], $this->superAdmin())
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');
    }

    // ------------------------------------------------------------- hapus

    public function test_delete_removes_every_derived_file_and_clears_the_setting(): void
    {
        $headers = $this->superAdmin();

        $this->postJson('/api/v1/admin/brand/favicon', [
            'file' => UploadedFile::fake()->image('icon.png', 512, 512),
        ], $headers)->assertOk();

        $this->deleteJson('/api/v1/admin/brand/favicon', [], $headers)
            ->assertOk()
            ->assertJsonPath('data.brand_favicon', null);

        Storage::disk('public')->assertMissing('brand/favicon.ico');
        Storage::disk('public')->assertMissing('brand/apple-touch-icon.png');
    }

    /** Menghapus satu aset tidak boleh menyentuh aset lain. */
    public function test_delete_leaves_other_assets_alone(): void
    {
        $headers = $this->superAdmin();

        $this->postJson('/api/v1/admin/brand/logo', [
            'file' => UploadedFile::fake()->image('logo.png', 512, 512),
        ], $headers)->assertOk();
        $this->postJson('/api/v1/admin/brand/hero', [
            'file' => UploadedFile::fake()->image('hero.jpg', 1200, 1200),
        ], $headers)->assertOk();

        $this->deleteJson('/api/v1/admin/brand/logo', [], $headers)->assertOk();

        Storage::disk('public')->assertMissing('brand/logo.webp');
        Storage::disk('public')->assertExists('brand/hero.webp');
        Storage::disk('public')->assertExists('brand/og.jpg');
    }

    // ------------------------------------------------------------- publik

    /** Halaman publik memasang logo & favicon tanpa sesi. */
    public function test_public_settings_endpoint_exposes_brand_assets(): void
    {
        $this->postJson('/api/v1/admin/brand/logo', [
            'file' => UploadedFile::fake()->image('logo.png', 512, 512),
        ], $this->superAdmin())->assertOk();

        $this->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('data.brand_logo.version', 1)
            ->assertJsonStructure(['data' => ['brand_logo' => ['url', 'version']]]);
    }

    public function test_brand_assets_are_null_before_any_upload(): void
    {
        $this->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('data.brand_logo', null)
            ->assertJsonPath('data.brand_favicon', null)
            ->assertJsonPath('data.brand_hero', null);
    }

    /** Trait Auditable pada Setting mencatatnya tanpa kode tambahan. */
    public function test_upload_is_recorded_in_the_audit_log(): void
    {
        $this->postJson('/api/v1/admin/brand/logo', [
            'file' => UploadedFile::fake()->image('logo.png', 512, 512),
        ], $this->superAdmin())->assertOk();

        // `AuditRecorder` menyimpan class_basename, bukan FQCN.
        $this->assertDatabaseHas('audit_logs', ['model_type' => 'Setting', 'action' => 'created']);
    }
}
