<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\TeamMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AboutPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_about_content_is_readable_without_login(): void
    {
        $response = $this->getJson('/api/v1/settings');

        $response->assertOk();
        $this->assertCount(3, $response->json('data.about_name_philosophy'));
        $this->assertSame("Empowerment Women's Health", $response->json('data.about_commitment_heading'));
        $this->assertNotEmpty($response->json('data.about_logo_philosophy'));
    }

    public function test_name_philosophy_defaults_break_the_brand_name_into_three_parts(): void
    {
        $response = $this->getJson('/api/v1/settings');

        $response->assertOk();
        $this->assertSame(
            ['Pre', 'Natal', 'Talks'],
            array_column($response->json('data.about_name_philosophy'), 'term')
        );
    }

    public function test_milestones_are_returned_as_a_list(): void
    {
        Setting::putMany([
            'about_milestones' => [
                ['year' => '2020', 'title' => 'Berdiri', 'description' => 'Sejak 28 Agustus 2020.'],
                ['year' => '2026', 'title' => 'Platform digital', 'description' => null],
            ],
        ]);

        $response = $this->getJson('/api/v1/settings');

        $response->assertOk();
        $this->assertSame(['2020', '2026'], array_column($response->json('data.about_milestones'), 'year'));
    }

    /**
     * Kode warna merek dikunci di kode (PRD §1.4 — logo tidak pernah
     * diwarnai ulang), jadi tidak boleh ada kuncinya di tabel `settings`.
     */
    public function test_brand_colors_come_from_code_not_from_settings(): void
    {
        $response = $this->getJson('/api/v1/settings');

        $response->assertOk()->assertJson([
            'meta' => ['brand_colors' => ['purple' => '#7C3AED', 'teal' => '#14B8A6']],
        ]);
        $this->assertArrayNotHasKey('about_color_purple_hex', $response->json('data'));
        $this->assertArrayNotHasKey('purple', Setting::KEYS);
    }

    public function test_team_endpoint_only_returns_published_members_in_order(): void
    {
        TeamMember::create([
            'name' => 'Kedua', 'role_title' => 'Bidan', 'order_index' => 20, 'is_published' => true,
        ]);
        TeamMember::create([
            'name' => 'Pertama', 'role_title' => 'Bidan', 'order_index' => 10, 'is_published' => true,
        ]);
        TeamMember::create([
            'name' => 'Disembunyikan', 'role_title' => 'Bidan', 'order_index' => 5, 'is_published' => false,
        ]);

        $response = $this->getJson('/api/v1/team-members');

        $response->assertOk();
        $this->assertSame(['Pertama', 'Kedua'], array_column($response->json('data'), 'name'));
    }

    /**
     * Kualifikasi (profesi + STR) adalah yang membuat klaim "berbasis bukti"
     * bisa diverifikasi pembaca — harus ikut terkirim ke halaman publik.
     */
    public function test_team_member_credential_is_exposed_publicly(): void
    {
        TeamMember::create([
            'name' => 'Siti Rahmawati',
            'role_title' => 'Penanggung Jawab Klinis',
            'credential' => 'Bidan · STR 1234567890',
            'order_index' => 10,
            'is_published' => true,
        ]);

        $response = $this->getJson('/api/v1/team-members');

        $response->assertOk()->assertJson([
            'data' => [['credential' => 'Bidan · STR 1234567890']],
        ]);
    }

    public function test_team_member_without_photo_returns_null_url(): void
    {
        TeamMember::create([
            'name' => 'Tanpa Foto', 'role_title' => 'Relawan', 'order_index' => 10, 'is_published' => true,
        ]);

        $response = $this->getJson('/api/v1/team-members');

        $response->assertOk();
        $this->assertNull($response->json('data.0.photo_url'));
    }
}
