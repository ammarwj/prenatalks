<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_sends_reset_link_pointing_to_frontend(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'siti@example.com']);

        $response = $this->withoutMiddleware()->postJson('/api/v1/auth/forgot-password', [
            'email' => 'siti@example.com',
        ]);

        $response->assertOk()->assertJson(['success' => true]);

        Notification::assertSentTo($user, ResetPasswordNotification::class, function (ResetPasswordNotification $notification) use ($user) {
            $mail = $notification->toMail($user);
            $url = $mail->actionUrl;

            return str_starts_with($url, 'http://localhost:3000/reset-password')
                && str_contains($url, 'token=')
                && str_contains($url, 'email=siti%40example.com');
        });
    }

    public function test_forgot_password_does_not_reveal_whether_email_exists(): void
    {
        $response = $this->withoutMiddleware()->postJson('/api/v1/auth/forgot-password', [
            'email' => 'tidak-terdaftar@example.com',
        ]);

        $response->assertOk()->assertJson(['success' => true]);
    }

    public function test_reset_password_with_valid_token_updates_password(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'siti@example.com']);

        $this->withoutMiddleware()->postJson('/api/v1/auth/forgot-password', ['email' => 'siti@example.com']);

        $token = null;
        Notification::assertSentTo($user, ResetPasswordNotification::class, function (ResetPasswordNotification $notification) use (&$token) {
            $token = $notification->token;

            return true;
        });

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'siti@example.com',
            'token' => $token,
            'password' => 'newpassword123',
        ]);

        $response->assertOk()->assertJson(['success' => true]);
        $this->assertTrue(password_verify('newpassword123', $user->fresh()->password_hash));
    }

    public function test_reset_password_with_invalid_token_fails(): void
    {
        User::factory()->create(['email' => 'siti@example.com']);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'siti@example.com',
            'token' => 'token-palsu',
            'password' => 'newpassword123',
        ]);

        $response->assertStatus(422)->assertJson(['success' => false]);
    }
}
