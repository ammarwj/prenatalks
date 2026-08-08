<?php

namespace Tests\Feature;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_endpoint_falls_back_to_defaults_when_unseeded(): void
    {
        $response = $this->getJson('/api/v1/settings');

        $response->assertOk();
        $this->assertSame(
            Setting::defaults()['community_heading'],
            $response->json('data.community_heading')
        );
        $this->assertIsArray($response->json('data.community_rules'));
    }

    public function test_public_endpoint_returns_stored_values(): void
    {
        Setting::putMany([
            'community_heading' => 'Ruang Bincang Ibu',
            'community_whatsapp_url' => 'https://chat.whatsapp.com/abc123',
        ]);

        $response = $this->getJson('/api/v1/settings');

        $response->assertOk()->assertJson([
            'data' => [
                'community_heading' => 'Ruang Bincang Ibu',
                'community_whatsapp_url' => 'https://chat.whatsapp.com/abc123',
            ],
        ]);
    }

    /**
     * Kelompok non-publik tidak boleh ikut keluar lewat `GET /settings` —
     * satu-satunya penjaga adalah `Setting::PUBLIC_GROUPS`.
     */
    public function test_public_endpoint_only_exposes_whitelisted_groups(): void
    {
        Setting::create([
            'key' => 'smtp_password',
            'value' => 'rahasia',
            'group_name' => 'mail',
        ]);

        $response = $this->getJson('/api/v1/settings');

        $response->assertOk();
        $this->assertArrayNotHasKey('smtp_password', $response->json('data'));
        // Ditulis sebagai "kelompok ini tidak publik", bukan daftar persis,
        // supaya menambah kelompok publik baru (mis. `about` di F-16) tidak
        // memaksa test ini diubah tiap kali.
        $this->assertNotContains('mail', Setting::PUBLIC_GROUPS);
    }

    public function test_rules_are_stored_as_a_list_not_a_string(): void
    {
        Setting::putMany(['community_rules' => ['Saling menghormati.', 'Jaga privasi.']]);

        $response = $this->getJson('/api/v1/settings');

        $response->assertOk();
        $this->assertSame(['Saling menghormati.', 'Jaga privasi.'], $response->json('data.community_rules'));
    }

    public function test_put_many_ignores_unknown_keys(): void
    {
        Setting::putMany([
            'community_heading' => 'Judul baru',
            'kunci_tak_dikenal' => 'nilai',
        ]);

        $this->assertDatabaseHas('settings', ['key' => 'community_heading']);
        $this->assertDatabaseMissing('settings', ['key' => 'kunci_tak_dikenal']);
    }

    public function test_put_many_derives_group_name_from_the_key_registry(): void
    {
        Setting::putMany(['community_heading' => 'Judul baru']);

        $this->assertDatabaseHas('settings', [
            'key' => 'community_heading',
            'group_name' => 'community',
        ]);
    }

    public function test_saving_twice_updates_instead_of_duplicating(): void
    {
        Setting::putMany(['community_heading' => 'Versi satu']);
        Setting::putMany(['community_heading' => 'Versi dua']);

        $this->assertSame(1, Setting::where('key', 'community_heading')->count());
        $this->assertSame('Versi dua', Setting::where('key', 'community_heading')->value('value'));
    }
}
