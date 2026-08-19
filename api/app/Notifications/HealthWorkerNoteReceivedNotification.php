<?php

namespace App\Notifications;

use App\Traits\QueuedEmailNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;

/**
 * Memberitahu pengguna bahwa ada catatan edukasi baru untuknya —
 * PRD §9 F-15.
 *
 * **Isi catatannya sengaja tidak disalin ke email.** Catatan menanggapi
 * hasil cek risiko, jadi kalimatnya nyaris selalu memuat kondisi kesehatan
 * penerimanya; email tidak terenkripsi ujung-ke-ujung dan sering terbaca di
 * layar bersama. Email ini karena itu hanya mengabarkan bahwa catatan ada
 * dan menautkan ke halaman yang menuntut login (PRD §12.3, §15 "kebocoran
 * data kesehatan").
 */
class HealthWorkerNoteReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable, QueuedEmailNotification;

    public function __construct(private readonly string $healthWorkerName) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = rtrim((string) Config::get('app.frontend_url'), '/');

        return (new MailMessage)
            ->subject('Ada catatan edukasi baru untuk Anda')
            ->greeting('Halo, '.$notifiable->name.'!')
            ->line("{$this->healthWorkerName} menuliskan catatan edukasi atas hasil cek risiko Anda.")
            ->action('Baca Catatan', "{$frontendUrl}/dashboard/privasi")
            ->line('Isi catatannya sengaja tidak kami tulis di email ini — hanya dapat dibaca setelah Anda masuk ke akun Anda.')
            ->line('Catatan ini bersifat edukatif dan bukan pengganti pemeriksaan langsung.');
    }
}
