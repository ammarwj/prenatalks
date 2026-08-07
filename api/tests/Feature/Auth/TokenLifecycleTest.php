<?php

namespace Tests\Feature\Auth;

use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class TokenLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function login(): array
    {
        User::factory()->create(['email' => 'siti@example.com']);

        $response = $this->withoutMiddleware()->postJson('/api/v1/auth/login', [
            'email' => 'siti@example.com',
            'password' => 'password123',
        ]);

        return $response->json('data');
    }

    public function test_me_returns_authenticated_user(): void
    {
        $tokens = $this->login();

        $response = $this->withHeader('Authorization', "Bearer {$tokens['access_token']}")
            ->getJson('/api/v1/auth/me');

        $response->assertOk()->assertJson([
            'data' => ['user' => ['email' => 'siti@example.com']],
        ]);
    }

    public function test_me_without_token_returns_401_without_crashing(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401)->assertJson(['success' => false]);
    }

    public function test_refresh_rotates_token_and_denylists_the_old_one(): void
    {
        $tokens = $this->login();

        $first = $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $tokens['refresh_token'],
        ]);
        $first->assertOk();
        $this->assertNotSame($tokens['refresh_token'], $first->json('data.refresh_token'));

        // Token lama sudah dirotasi — pakai ulang harus ditolak.
        $reuse = $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $tokens['refresh_token'],
        ]);
        $reuse->assertStatus(401)->assertJson(['success' => false]);
    }

    public function test_refresh_with_unknown_token_fails(): void
    {
        $response = $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => 'not-a-real-token',
        ]);

        $response->assertStatus(401)->assertJson(['success' => false]);
    }

    public function test_logout_blacklists_the_current_access_token(): void
    {
        $tokens = $this->login();

        $this->withHeader('Authorization', "Bearer {$tokens['access_token']}")
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        // Diverifikasi lewat manager JWT langsung (bukan request HTTP kedua):
        // AuthManager meng-cache instance guard per proses, jadi dalam satu
        // metode pengujian (satu proses PHP untuk beberapa "request" simulasi)
        // guard yang sama akan menyimpan user hasil resolusi pertama. Ini
        // murni artefak pengujian — tiap request sungguhan punya proses baru.
        // Perilaku middleware-nya sendiri diuji terpisah di
        // test_blacklisted_token_is_rejected_by_me_endpoint().
        $this->assertFalse(JWTAuth::setToken($tokens['access_token'])->check());
    }

    public function test_blacklisted_token_is_rejected_by_me_endpoint(): void
    {
        $user = User::factory()->create();
        $token = JWTAuth::fromUser($user);
        JWTAuth::setToken($token)->invalidate();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me')
            ->assertStatus(401)
            ->assertJson(['success' => false]);
    }

    public function test_logout_revokes_the_refresh_token(): void
    {
        $tokens = $this->login();

        $this->withHeader('Authorization', "Bearer {$tokens['access_token']}")
            ->postJson('/api/v1/auth/logout', ['refresh_token' => $tokens['refresh_token']])
            ->assertOk();

        // Endpoint /refresh tidak dijaga guard 'api', jadi tidak terpengaruh
        // isu cache guard di atas.
        $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $tokens['refresh_token']])
            ->assertStatus(401);

        $this->assertNotNull(
            RefreshToken::where('token_hash', hash('sha256', $tokens['refresh_token']))->first()->revoked_at
        );
    }
}
