<?php

namespace Tests\Feature;

use App\Models\HealthWorkerConsent;
use App\Models\User;
use App\Notifications\HealthWorkerConsentGrantedNotification;
use App\Notifications\HealthWorkerConsentRevokedNotification;
use App\Notifications\HealthWorkerNoteReceivedNotification;
use App\Services\HealthWorkerConsentService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Notifikasi email F-15 — PRD §9 F-15, BUSINESS_FLOWS §9.
 */
class HealthWorkerNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
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

    private function healthWorker(): User
    {
        return User::factory()->create(['role' => 'health_worker']);
    }

    /**
     * Seluruh baris & tombol satu email, digabung jadi satu teks supaya bisa
     * diperiksa isinya tanpa bergantung pada posisi baris.
     */
    private function mailBody(object $notification, User $notifiable): string
    {
        $mail = $notification->toMail($notifiable);

        return implode(' ', [
            $mail->subject ?? '',
            ...$mail->introLines,
            ...$mail->outroLines,
            $mail->actionUrl ?? '',
        ]);
    }

    public function test_granting_emails_the_access_link_to_the_named_health_worker(): void
    {
        $user = User::factory()->create();
        $nakes = $this->healthWorker();

        $code = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/consents', ['health_worker_id' => $nakes->id])
            ->assertCreated()
            ->json('data.access_code');

        Notification::assertSentTo(
            $nakes,
            HealthWorkerConsentGrantedNotification::class,
            function (HealthWorkerConsentGrantedNotification $notification) use ($nakes, $user, $code) {
                $body = $this->mailBody($notification, $nakes);

                // Nama pemberi izin ikut supaya penerima tahu tautan ini
                // milik siapa; kodenya ikut karena email akun terikat adalah
                // saluran tersempit yang tersedia untuk mengirimkannya.
                $this->assertStringContainsString($user->name, $body);
                $this->assertStringContainsString($code, $body);

                return true;
            }
        );

        // Pemberi izin tidak ikut dikirimi apa pun — tautannya sudah ada di
        // layar, dan mengirimkannya lagi hanya menambah salinan kode.
        Notification::assertNotSentTo($user, HealthWorkerConsentGrantedNotification::class);
    }

    public function test_regenerating_emails_the_new_link_and_says_the_old_one_is_dead(): void
    {
        $user = User::factory()->create();
        $nakes = $this->healthWorker();

        [$firstCode, $consent] = app(HealthWorkerConsentService::class)->issue($user, $nakes);

        $secondCode = $this->withHeaders($this->authHeader($user))
            ->postJson("/api/v1/consents/{$consent->id}/regenerate")
            ->assertOk()
            ->json('data.access_code');

        Notification::assertSentTo(
            $nakes,
            HealthWorkerConsentGrantedNotification::class,
            function (HealthWorkerConsentGrantedNotification $notification) use ($nakes, $firstCode, $secondCode) {
                $body = $this->mailBody($notification, $nakes);

                $this->assertStringContainsString($secondCode, $body);
                $this->assertStringNotContainsString($firstCode, $body);
                $this->assertStringContainsString('tidak berlaku', $body);

                return true;
            }
        );
    }

    public function test_revoking_emails_the_health_worker_once(): void
    {
        $user = User::factory()->create();
        $nakes = $this->healthWorker();
        [, $consent] = app(HealthWorkerConsentService::class)->issue($user, $nakes);

        $this->withHeaders($this->authHeader($user))
            ->deleteJson("/api/v1/consents/{$consent->id}")
            ->assertOk();

        // Menekan tombol yang sama dua kali tidak mengabari hal yang sama
        // untuk kedua kalinya.
        $this->withHeaders($this->authHeader($user))
            ->deleteJson("/api/v1/consents/{$consent->id}")
            ->assertOk();

        Notification::assertSentToTimes($nakes, HealthWorkerConsentRevokedNotification::class, 1);
    }

    public function test_note_email_tells_the_patient_it_exists_without_quoting_it(): void
    {
        $user = User::factory()->create();
        $nakes = $this->healthWorker();
        [, $consent] = app(HealthWorkerConsentService::class)->issue($user, $nakes);

        $body = 'Tekanan darah Ibu perlu diperiksa ulang minggu ini di puskesmas terdekat.';

        $this->withHeaders($this->authHeader($nakes))
            ->postJson("/api/v1/health-worker/patients/{$consent->id}/notes", ['body' => $body])
            ->assertCreated();

        Notification::assertSentTo(
            $user,
            HealthWorkerNoteReceivedNotification::class,
            function (HealthWorkerNoteReceivedNotification $notification) use ($user, $nakes, $body) {
                $mailBody = $this->mailBody($notification, $user);

                $this->assertStringContainsString($nakes->name, $mailBody);
                $this->assertStringContainsString('/dashboard/privasi', $mailBody);

                // Isi catatan hampir selalu memuat kondisi kesehatan
                // penerimanya, jadi tidak boleh ikut ke email.
                $this->assertStringNotContainsString($body, $mailBody);

                return true;
            }
        );
    }

    /**
     * Ketiganya ter-antre di "emails" (bukan "default") supaya ekspor
     * submission yang berjalan lama tidak menahan email di belakangnya —
     * aturan yang sama dengan notifikasi auth.
     */
    public function test_all_f15_emails_are_queued_on_the_emails_queue(): void
    {
        $notifications = [
            new HealthWorkerConsentGrantedNotification('Ibu Uji', 'http://localhost/nakes/akses/kode'),
            new HealthWorkerConsentRevokedNotification('Ibu Uji'),
            new HealthWorkerNoteReceivedNotification('Bidan Uji'),
        ];

        foreach ($notifications as $notification) {
            $this->assertInstanceOf(ShouldQueue::class, $notification);
            $this->assertSame(['mail' => 'emails'], $notification->viaQueues());
        }
    }

    public function test_revoked_consent_notifies_nobody_when_it_was_already_revoked(): void
    {
        $user = User::factory()->create();
        $nakes = $this->healthWorker();
        [, $consent] = app(HealthWorkerConsentService::class)->issue($user, $nakes);
        $consent->revoke();

        $this->withHeaders($this->authHeader($user))
            ->deleteJson("/api/v1/consents/{$consent->id}")
            ->assertOk();

        Notification::assertNothingSentTo($nakes);
        $this->assertSame(1, HealthWorkerConsent::count());
    }
}
