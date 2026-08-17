<?php

namespace App\Notifications;

use App\Traits\QueuedEmailNotification;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Versi ter-antre dari notifikasi bawaan Laravel (PRD §4 — queue database
 * untuk email): pengiriman SMTP dilepas ke worker supaya
 * POST /auth/forgot-password langsung membalas tanpa menunggu Mailtrap.
 *
 * Tautannya mengarah ke halaman Next.js, bukan route Blade — lihat
 * web/app/(auth)/reset-password/page.tsx.
 */
class ResetPasswordNotification extends ResetPassword implements ShouldQueue
{
    use Queueable, QueuedEmailNotification;

    public function toMail($notifiable): MailMessage
    {
        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
        $url = "{$frontendUrl}/reset-password?token={$this->token}&email="
            .urlencode($notifiable->getEmailForPasswordReset());
        $expireMinutes = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

        return (new MailMessage)
            ->subject('Atur Ulang Password PrenaTalks Anda')
            ->greeting('Halo, '.$notifiable->name.'!')
            ->line('Kami menerima permintaan untuk mengatur ulang password akun PrenaTalks Anda.')
            ->action('Atur Ulang Password', $url)
            ->line("Tautan ini berlaku selama {$expireMinutes} menit.")
            ->line('Jika Anda tidak meminta ini, abaikan saja email ini — password Anda tetap aman.');
    }
}
