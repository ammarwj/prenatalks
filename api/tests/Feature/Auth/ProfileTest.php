<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Profil & keamanan akun (PRD §8 `/dashboard/profil`) — `PATCH /auth/me`
 * dan `POST /auth/change-password`.
 */
class ProfileTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed> payload token hasil login
     */
    private function login(string $email = 'siti@example.com'): array
    {
        User::factory()->create(['email' => $email]);

        return $this->withoutMiddleware()->postJson('/api/v1/auth/login', [
            'email' => $email,
            'password' => 'password123',
        ])->json('data');
    }

    public function test_update_profile_changes_name_and_phone(): void
    {
        $tokens = $this->login();

        $response = $this->withHeader('Authorization', "Bearer {$tokens['access_token']}")
            ->patchJson('/api/v1/auth/me', [
                'name' => 'Siti Nurhaliza',
                'phone' => '081234567890',
            ]);

        $response->assertOk()->assertJson([
            'success' => true,
            'data' => ['user' => ['name' => 'Siti Nurhaliza', 'phone' => '081234567890']],
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'siti@example.com',
            'name' => 'Siti Nurhaliza',
        ]);
    }

    public function test_update_profile_rejects_name_shorter_than_two_characters(): void
    {
        $tokens = $this->login();

        $this->withHeader('Authorization', "Bearer {$tokens['access_token']}")
            ->patchJson('/api/v1/auth/me', ['name' => 'S'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    /** Email hanya bisa diganti lewat alur verifikasi ulang, bukan form profil. */
    public function test_update_profile_ignores_email_field(): void
    {
        $tokens = $this->login();

        $this->withHeader('Authorization', "Bearer {$tokens['access_token']}")
            ->patchJson('/api/v1/auth/me', [
                'name' => 'Siti Baru',
                'email' => 'penyerang@example.com',
            ])
            ->assertOk();

        $this->assertDatabaseHas('users', ['email' => 'siti@example.com']);
        $this->assertDatabaseMissing('users', ['email' => 'penyerang@example.com']);
    }

    public function test_update_profile_requires_authentication(): void
    {
        $this->patchJson('/api/v1/auth/me', ['name' => 'Tanpa Sesi'])
            ->assertStatus(401);
    }

    public function test_change_password_replaces_password_and_keeps_session_alive(): void
    {
        $tokens = $this->login();

        $response = $this->withHeader('Authorization', "Bearer {$tokens['access_token']}")
            ->postJson('/api/v1/auth/change-password', [
                'current_password' => 'password123',
                'password' => 'rahasiabaru9',
                'password_confirmation' => 'rahasiabaru9',
            ]);

        // Sepasang token baru diterbitkan supaya perangkat ini tidak ikut
        // terlempar keluar oleh pencabutan di bawah.
        $response->assertOk()
            ->assertJsonStructure(['data' => ['access_token', 'refresh_token', 'user']]);

        $user = User::where('email', 'siti@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('rahasiabaru9', $user->password_hash));

        $this->withoutMiddleware()->postJson('/api/v1/auth/login', [
            'email' => 'siti@example.com',
            'password' => 'password123',
        ])->assertStatus(401);

        $this->withoutMiddleware()->postJson('/api/v1/auth/login', [
            'email' => 'siti@example.com',
            'password' => 'rahasiabaru9',
        ])->assertOk();
    }

    public function test_change_password_revokes_refresh_tokens_issued_before_it(): void
    {
        $tokens = $this->login();

        $this->withHeader('Authorization', "Bearer {$tokens['access_token']}")
            ->postJson('/api/v1/auth/change-password', [
                'current_password' => 'password123',
                'password' => 'rahasiabaru9',
                'password_confirmation' => 'rahasiabaru9',
            ])->assertOk();

        // Sesi lama (mis. perangkat yang dicuri) tidak bisa lagi menukar
        // refresh token-nya jadi access token baru.
        $this->withoutMiddleware()->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $tokens['refresh_token'],
        ])->assertStatus(401);
    }

    public function test_change_password_rejects_wrong_current_password(): void
    {
        $tokens = $this->login();

        $this->withHeader('Authorization', "Bearer {$tokens['access_token']}")
            ->postJson('/api/v1/auth/change-password', [
                'current_password' => 'salahtotal1',
                'password' => 'rahasiabaru9',
                'password_confirmation' => 'rahasiabaru9',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('current_password');

        $user = User::where('email', 'siti@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('password123', $user->password_hash));
    }

    public function test_change_password_rejects_new_password_without_digit(): void
    {
        $tokens = $this->login();

        $this->withHeader('Authorization', "Bearer {$tokens['access_token']}")
            ->postJson('/api/v1/auth/change-password', [
                'current_password' => 'password123',
                'password' => 'hanyahurufsaja',
                'password_confirmation' => 'hanyahurufsaja',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }

    public function test_change_password_rejects_mismatched_confirmation(): void
    {
        $tokens = $this->login();

        $this->withHeader('Authorization', "Bearer {$tokens['access_token']}")
            ->postJson('/api/v1/auth/change-password', [
                'current_password' => 'password123',
                'password' => 'rahasiabaru9',
                'password_confirmation' => 'rahasialain9',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }

    public function test_change_password_requires_authentication(): void
    {
        $this->postJson('/api/v1/auth/change-password', [
            'current_password' => 'password123',
            'password' => 'rahasiabaru9',
            'password_confirmation' => 'rahasiabaru9',
        ])->assertStatus(401);
    }
}
