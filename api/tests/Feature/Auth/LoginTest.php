<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_with_correct_credentials_returns_tokens(): void
    {
        $user = User::factory()->create(['email' => 'siti@example.com']);

        $response = $this->withoutMiddleware()->postJson('/api/v1/auth/login', [
            'email' => 'siti@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()->assertJson([
            'success' => true,
            'data' => [
                'token_type' => 'Bearer',
                'user' => ['email' => 'siti@example.com'],
            ],
        ]);
        $response->assertJsonStructure(['data' => ['access_token', 'refresh_token', 'expires_in']]);

        $this->assertDatabaseHas('refresh_tokens', ['user_id' => $user->id]);
        $this->assertNotNull($user->fresh()->last_login_at);
    }

    public function test_login_with_wrong_password_fails(): void
    {
        User::factory()->create(['email' => 'siti@example.com']);

        $response = $this->withoutMiddleware()->postJson('/api/v1/auth/login', [
            'email' => 'siti@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)->assertJson(['success' => false]);
    }

    public function test_login_blocks_inactive_account(): void
    {
        User::factory()->create(['email' => 'siti@example.com', 'is_active' => false]);

        $response = $this->withoutMiddleware()->postJson('/api/v1/auth/login', [
            'email' => 'siti@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)->assertJson(['success' => false]);
    }

    public function test_account_locks_out_after_ten_consecutive_failures(): void
    {
        User::factory()->create(['email' => 'siti@example.com']);

        for ($i = 0; $i < 10; $i++) {
            $this->withoutMiddleware()->postJson('/api/v1/auth/login', [
                'email' => 'siti@example.com',
                'password' => 'wrong-password',
            ])->assertStatus(401);
        }

        $response = $this->withoutMiddleware()->postJson('/api/v1/auth/login', [
            'email' => 'siti@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(429)->assertJson(['success' => false]);
    }

    public function test_successful_login_clears_failure_counter(): void
    {
        User::factory()->create(['email' => 'siti@example.com']);

        $this->withoutMiddleware()->postJson('/api/v1/auth/login', [
            'email' => 'siti@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(401);

        $this->withoutMiddleware()->postJson('/api/v1/auth/login', [
            'email' => 'siti@example.com',
            'password' => 'password123',
        ])->assertOk();

        $this->assertFalse(RateLimiter::tooManyAttempts('login-lockout:siti@example.com', 10));
    }
}
