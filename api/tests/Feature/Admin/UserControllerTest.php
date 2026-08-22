<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class UserControllerTest extends TestCase
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

    public function test_only_super_admin_can_manage_users(): void
    {
        $this->getJson('/api/v1/admin/users')->assertStatus(401);

        $user = User::factory()->create(['role' => 'user']);
        $this->withHeaders($this->authHeader($user))->getJson('/api/v1/admin/users')->assertStatus(403);

        $admin = User::factory()->create(['role' => 'admin']);
        $this->withHeaders($this->authHeader($admin))->getJson('/api/v1/admin/users')->assertStatus(403);

        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $this->withHeaders($this->authHeader($superAdmin))->getJson('/api/v1/admin/users')->assertOk();
    }

    public function test_list_is_paginated_server_side(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        User::factory()->count(20)->create();

        $response = $this->withHeaders($this->authHeader($superAdmin))->getJson('/api/v1/admin/users');

        $response->assertOk();
        $this->assertCount(15, $response->json('data'));
        $this->assertSame(21, $response->json('meta.total'));
        $this->assertSame(2, $response->json('meta.last_page'));
    }

    public function test_search_matches_name_or_email(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin', 'name' => 'Super Admin']);
        User::factory()->create(['name' => 'Siti Rahmawati', 'email' => 'siti@contoh.test']);
        User::factory()->create(['name' => 'Budi Santoso', 'email' => 'budi@contoh.test']);

        $headers = $this->authHeader($superAdmin);

        $byName = $this->withHeaders($headers)->getJson('/api/v1/admin/users?search=Rahmawati');
        $byName->assertOk();
        $this->assertSame(['Siti Rahmawati'], array_column($byName->json('data'), 'name'));

        $byEmail = $this->withHeaders($headers)->getJson('/api/v1/admin/users?search=budi@');
        $byEmail->assertOk();
        $this->assertSame(['Budi Santoso'], array_column($byEmail->json('data'), 'name'));
    }

    public function test_filter_by_role_and_status(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        User::factory()->create(['role' => 'admin']);
        User::factory()->create(['role' => 'user', 'is_active' => false]);

        $headers = $this->authHeader($superAdmin);

        $byRole = $this->withHeaders($headers)->getJson('/api/v1/admin/users?role=admin');
        $byRole->assertOk();
        $this->assertSame(1, $byRole->json('meta.total'));

        $inactive = $this->withHeaders($headers)->getJson('/api/v1/admin/users?status=inactive');
        $inactive->assertOk();
        $this->assertSame(1, $inactive->json('meta.total'));
        $this->assertFalse($inactive->json('data.0.is_active'));
    }

    public function test_sorting_is_limited_to_a_whitelist(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin', 'name' => 'Zulfa']);
        User::factory()->create(['name' => 'Ana']);

        $headers = $this->authHeader($superAdmin);

        $sorted = $this->withHeaders($headers)->getJson('/api/v1/admin/users?sort=name&direction=asc');
        $sorted->assertOk();
        $this->assertSame('Ana', $sorted->json('data.0.name'));

        $this->withHeaders($headers)
            ->getJson('/api/v1/admin/users?sort=password_hash')
            ->assertStatus(422)
            ->assertJsonValidationErrors('sort');
    }

    public function test_listing_never_exposes_the_password_hash(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $response = $this->withHeaders($this->authHeader($superAdmin))->getJson('/api/v1/admin/users');

        $response->assertOk();
        $this->assertArrayNotHasKey('password_hash', $response->json('data.0'));
    }

    public function test_super_admin_can_change_role_and_status(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $target = User::factory()->create(['role' => 'user']);

        $response = $this->withHeaders($this->authHeader($superAdmin))
            ->putJson("/api/v1/admin/users/{$target->id}", ['role' => 'admin', 'is_active' => false]);

        $response->assertOk()->assertJson(['data' => ['role' => 'admin', 'is_active' => false]]);
        $this->assertDatabaseHas('users', ['id' => $target->id, 'role' => 'admin', 'is_active' => false]);
    }

    public function test_unknown_role_is_rejected(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $target = User::factory()->create(['role' => 'user']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->putJson("/api/v1/admin/users/{$target->id}", ['role' => 'dewa'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('role');
    }

    /**
     * Menurunkan peran diri sendiri langsung mencabut akses ke halaman yang
     * dipakai untuk membatalkannya.
     */
    public function test_super_admin_cannot_demote_themselves(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->putJson("/api/v1/admin/users/{$superAdmin->id}", ['role' => 'admin'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('role');

        $this->assertSame('super_admin', $superAdmin->fresh()->role);
    }

    public function test_super_admin_cannot_deactivate_themselves(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->putJson("/api/v1/admin/users/{$superAdmin->id}", ['is_active' => false])
            ->assertStatus(422)
            ->assertJsonValidationErrors('is_active');

        $this->assertTrue($superAdmin->fresh()->is_active);
    }

    /**
     * Sistem harus selalu menyisakan satu super admin aktif, kalau tidak
     * pengelolaan akun dan kuesioner terkunci permanen dari antarmuka.
     */
    public function test_the_last_active_super_admin_cannot_be_demoted(): void
    {
        $actor = User::factory()->create(['role' => 'super_admin']);
        $other = User::factory()->create(['role' => 'super_admin', 'is_active' => false]);

        $this->withHeaders($this->authHeader($actor))
            ->putJson("/api/v1/admin/users/{$other->id}", ['role' => 'admin'])
            ->assertOk();

        // Tersisa satu super admin aktif: $actor. Ia tidak boleh diturunkan
        // oleh siapa pun — termasuk lewat penjaga "bukan diri sendiri".
        $second = User::factory()->create(['role' => 'super_admin']);
        $this->withHeaders($this->authHeader($second))
            ->putJson("/api/v1/admin/users/{$actor->id}", ['role' => 'admin'])
            ->assertOk();

        $this->withHeaders($this->authHeader($second))
            ->putJson("/api/v1/admin/users/{$second->id}", ['role' => 'admin'])
            ->assertStatus(422);
    }

    public function test_show_returns_a_single_user(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $target = User::factory()->create(['name' => 'Siti Rahmawati']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->getJson("/api/v1/admin/users/{$target->id}")
            ->assertOk()
            ->assertJson(['data' => ['name' => 'Siti Rahmawati']]);
    }

    public function test_super_admin_can_reset_another_users_password(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $target = User::factory()->create();

        $refreshToken = $target->refreshTokens()->create([
            'token_hash' => hash('sha256', 'plain-token'),
            'expires_at' => now()->addDays(30),
        ]);

        $this->withHeaders($this->authHeader($superAdmin))
            ->postJson("/api/v1/admin/users/{$target->id}/reset-password", [
                'password' => 'rahasiabaru9',
                'password_confirmation' => 'rahasiabaru9',
            ])
            ->assertOk();

        $this->assertTrue(Hash::check('rahasiabaru9', $target->fresh()->password_hash));

        // Sesi lama pengguna dicabut, sama seperti ganti kata sandi mandiri.
        $this->assertNotNull($refreshToken->fresh()->revoked_at);

        // password_hash diredaksi dari diff otomatis, jadi harus dicatat eksplisit.
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'password_reset',
            'model_type' => 'User',
            'model_id' => $target->id,
            'user_id' => $superAdmin->id,
        ]);
    }

    public function test_reset_password_rejects_short_password(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $target = User::factory()->create();

        $this->withHeaders($this->authHeader($superAdmin))
            ->postJson("/api/v1/admin/users/{$target->id}/reset-password", [
                'password' => 'short1',
                'password_confirmation' => 'short1',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }

    public function test_reset_password_rejects_password_without_digit(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $target = User::factory()->create();

        $this->withHeaders($this->authHeader($superAdmin))
            ->postJson("/api/v1/admin/users/{$target->id}/reset-password", [
                'password' => 'hanyahurufsaja',
                'password_confirmation' => 'hanyahurufsaja',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }

    public function test_reset_password_rejects_mismatched_confirmation(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $target = User::factory()->create();

        $this->withHeaders($this->authHeader($superAdmin))
            ->postJson("/api/v1/admin/users/{$target->id}/reset-password", [
                'password' => 'rahasiabaru9',
                'password_confirmation' => 'rahasialain9',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }

    public function test_reset_password_requires_super_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $target = User::factory()->create();

        $this->withHeaders($this->authHeader($admin))
            ->postJson("/api/v1/admin/users/{$target->id}/reset-password", [
                'password' => 'rahasiabaru9',
                'password_confirmation' => 'rahasiabaru9',
            ])
            ->assertStatus(403);
    }
}
