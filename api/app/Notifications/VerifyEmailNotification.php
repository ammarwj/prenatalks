<?php

namespace App\Notifications;

use App\Traits\QueuedEmailNotification;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\URL;

/**
 * Versi ter-antre dari notifikasi bawaan Laravel (PRD §4 — queue database
 * untuk email): pengiriman SMTP dilepas ke worker supaya respons
 * POST /auth/register tidak menunggu Mailtrap.
 *
 * Masa berlaku tautan dihitung saat worker menjalankan job ini (bukan saat
 * job diantre), jadi antrean yang padat tidak memangkas jatah 60 menitnya.
 */
class VerifyEmailNotification extends VerifyEmail implements ShouldQueue
{
    use Queueable, QueuedEmailNotification;

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Verifikasi Email PrenaTalks Anda')
            ->greeting('Halo, '.$notifiable->name.'!')
            ->line('Terima kasih sudah bergabung dengan PrenaTalks. Yuk, verifikasi email Anda supaya bisa menyimpan hasil cek kondisi kehamilan.')
            ->action('Verifikasi Email', $this->verificationUrl($notifiable))
            ->line('Jika Anda tidak membuat akun ini, abaikan saja email ini.');
    }

    /**
     * Signed URL-nya tetap dibuat persis seperti bawaan Laravel supaya
     * tanda tangannya valid, tapi id/hash/expires/signature diteruskan ke
     * halaman Next.js — lihat web/app/(auth)/verifikasi-email/[id]/[hash]/page.tsx.
     * Tanpa itu tautan email (GET) menabrak route API yang hanya menerima POST.
     */
    protected function verificationUrl($notifiable): string
    {
        $hash = sha1($notifiable->getEmailForVerification());

        $backendUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(config('auth.verification.expire', 60)),
            ['id' => $notifiable->getKey(), 'hash' => $hash]
        );

        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
        $query = parse_url($backendUrl, PHP_URL_QUERY);

        return "{$frontendUrl}/verifikasi-email/{$notifiable->getKey()}/{$hash}?{$query}";
    }
}
