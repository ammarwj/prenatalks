<?php

namespace Tests\Feature\Admin;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class SettingControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, string>
     */
    private function authHeader(User $user): array
    {
        return ['Authorization' => 'Bearer '.JWTAuth::fromUser($user)];
    }

    public function test_guest_is_rejected(): void
    {
        $this->getJson('/api/v1/admin/settings')->assertStatus(401);
    }

    public function test_regular_user_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/admin/settings')
            ->assertStatus(403);
    }

    public function test_admin_can_read_settings_with_defaults(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->getJson('/api/v1/admin/settings');

        $response->assertOk();
        $this->assertSame(
            Setting::defaults()['community_heading'],
            $response->json('data.community_heading')
        );
        $this->assertContains('community', $response->json('meta.public_groups'));
    }

    public function test_admin_can_save_community_settings(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->putJson('/api/v1/admin/settings', [
                'community_heading' => 'Ruang Bincang Ibu',
                'community_description' => 'Tempat berbagi pengalaman kehamilan.',
                'community_rules' => ['Saling menghormati.', 'Jaga privasi.'],
                'community_whatsapp_url' => 'https://chat.whatsapp.com/abc123',
                'community_telegram_url' => null,
            ]);

        $response->assertOk()->assertJson([
            'data' => [
                'community_heading' => 'Ruang Bincang Ibu',
                'community_whatsapp_url' => 'https://chat.whatsapp.com/abc123',
                'community_telegram_url' => null,
            ],
        ]);
        $this->assertSame(['Saling menghormati.', 'Jaga privasi.'], $response->json('data.community_rules'));
        $this->assertDatabaseHas('settings', ['key' => 'community_heading', 'group_name' => 'community']);
    }

    /**
     * Admin lazim menempel tautan tanpa skema — dilengkapi, bukan ditolak.
     */
    public function test_url_without_scheme_is_normalised_to_https(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->putJson('/api/v1/admin/settings', [
                'community_whatsapp_url' => 'chat.whatsapp.com/abc123',
            ]);

        $response->assertOk();
        $this->assertSame('https://chat.whatsapp.com/abc123', $response->json('data.community_whatsapp_url'));
    }

    public function test_empty_url_is_stored_as_null_so_the_button_stays_hidden(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Setting::putMany(['community_whatsapp_url' => 'https://chat.whatsapp.com/abc123']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->putJson('/api/v1/admin/settings', ['community_whatsapp_url' => '']);

        $response->assertOk();
        $this->assertNull($response->json('data.community_whatsapp_url'));
    }

    public function test_invalid_url_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))
            ->putJson('/api/v1/admin/settings', ['community_telegram_url' => 'bukan url sama sekali'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('community_telegram_url');
    }

    public function test_blank_heading_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))
            ->putJson('/api/v1/admin/settings', ['community_heading' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors('community_heading');
    }

    public function test_blank_rule_item_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))
            ->putJson('/api/v1/admin/settings', ['community_rules' => ['Saling menghormati.', '']])
            ->assertStatus(422)
            ->assertJsonValidationErrors('community_rules.1');
    }

    /**
     * Payload parsial hanya menyentuh kunci yang dikirim — form komunitas
     * tidak boleh mengosongkan pengaturan lain yang ditambahkan F-14 nanti.
     */
    public function test_partial_payload_leaves_other_settings_untouched(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Setting::putMany([
            'community_heading' => 'Judul lama',
            'community_description' => 'Penjelasan lama',
        ]);

        $response = $this->withHeaders($this->authHeader($admin))
            ->putJson('/api/v1/admin/settings', ['community_heading' => 'Judul baru']);

        $response->assertOk();
        $this->assertSame('Judul baru', $response->json('data.community_heading'));
        $this->assertSame('Penjelasan lama', $response->json('data.community_description'));
    }

    public function test_unknown_keys_in_the_payload_are_not_persisted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))
            ->putJson('/api/v1/admin/settings', [
                'community_heading' => 'Judul baru',
                'jwt_secret' => 'bocor',
            ])
            ->assertOk();

        $this->assertDatabaseMissing('settings', ['key' => 'jwt_secret']);
    }

    public function test_super_admin_can_also_manage_settings(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->getJson('/api/v1/admin/settings')
            ->assertOk();
    }

    /**
     * Menyembunyikan form kontak dari sidebar admin tidak menghalangi
     * siapa pun yang memanggil endpoint-nya langsung — penolakannya harus
     * datang dari sini (`Setting::SUPER_ADMIN_GROUPS`).
     */
    public function test_plain_admin_cannot_write_super_admin_only_groups(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        foreach ([
            ['contact_phone' => '0800-0000-0000'],
            ['social_instagram_url' => 'https://instagram.com/prenatalks'],
            ['stats_label_mothers' => 'Angka karangan'],
        ] as $payload) {
            $this->withHeaders($headers)
                ->putJson('/api/v1/admin/settings', $payload)
                ->assertStatus(403);
        }

        $this->assertDatabaseMissing('settings', ['key' => 'contact_phone']);
    }

    public function test_plain_admin_can_still_write_content_groups(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))
            ->putJson('/api/v1/admin/settings', ['community_heading' => 'Judul baru'])
            ->assertOk();
    }

    public function test_super_admin_can_write_contact_social_and_stats(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $response = $this->withHeaders($this->authHeader($superAdmin))
            ->putJson('/api/v1/admin/settings', [
                'contact_phone' => '0812-1111-2222',
                'contact_email' => 'halo@prenatalks.id',
                'contact_address' => 'Gresik, Jawa Timur',
                'stats_enabled' => false,
                'stats_label_mothers' => 'Ibu hamil terdaftar',
            ]);

        $response->assertOk();
        $this->assertSame('0812-1111-2222', $response->json('data.contact_phone'));
        $this->assertFalse($response->json('data.stats_enabled'));
    }

    public function test_social_urls_without_a_scheme_are_completed(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $response = $this->withHeaders($this->authHeader($superAdmin))
            ->putJson('/api/v1/admin/settings', [
                'social_instagram_url' => 'instagram.com/prenatalks',
                'social_tiktok_url' => '',
            ]);

        $response->assertOk();
        $this->assertSame('https://instagram.com/prenatalks', $response->json('data.social_instagram_url'));
        $this->assertNull($response->json('data.social_tiktok_url'));
    }

    public function test_invalid_contact_email_and_social_url_are_rejected(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $headers = $this->authHeader($superAdmin);

        $this->withHeaders($headers)
            ->putJson('/api/v1/admin/settings', ['contact_email' => 'bukan-email'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('contact_email');

        $this->withHeaders($headers)
            ->putJson('/api/v1/admin/settings', ['social_facebook_url' => 'https://'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('social_facebook_url');
    }

    public function test_stats_labels_cannot_be_emptied(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->putJson('/api/v1/admin/settings', ['stats_label_contents' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors('stats_label_contents');
    }
}
