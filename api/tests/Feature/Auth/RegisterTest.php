<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_user_and_sends_verification_email(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Siti Rahma',
            'email' => 'siti@example.com',
            'phone' => '08123456789',
            'password' => 'password123',
            'agree' => true,
        ]);

        $response->assertCreated()->assertJson([
            'success' => true,
            'data' => [
                'user' => [
                    'email' => 'siti@example.com',
                    'role' => 'user',
                    'is_active' => true,
                ],
            ],
        ]);

        $user = User::where('email', 'siti@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue(password_verify('password123', $user->password_hash));
        $this->assertNull($user->email_verified_at);

        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_register_rejects_weak_password(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Siti Rahma',
            'email' => 'siti@example.com',
            'password' => 'onlyletters',
            'agree' => true,
        ]);

        $response->assertStatus(422)->assertJson(['success' => false]);
        $response->assertJsonValidationErrors('password');
    }

    public function test_register_requires_agreement_checkbox(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Siti Rahma',
            'email' => 'siti@example.com',
            'password' => 'password123',
            'agree' => false,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('agree');
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'siti@example.com']);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Siti Rahma',
            'email' => 'siti@example.com',
            'password' => 'password123',
            'agree' => true,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
    }
}
