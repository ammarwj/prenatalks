<?php

namespace App\Notifications;

use App\Traits\QueuedEmailNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Memberitahu tenaga kesehatan bahwa izinnya dicabut — PRD §9 F-15.
 *
 * Pencabutan berlaku seketika di sisi server tanpa email ini; gunanya
 * semata agar penerima tahu **sebabnya** saat tautan yang tadi berfungsi
 * mendadak menolak, alih-alih mengiranya gangguan sistem dan mencoba
 * berulang kali.
 *
 * Tidak ada tautan aksi di sini: tidak ada yang bisa dibuka lagi.
 */
class HealthWorkerConsentRevokedNotification extends Notification implements ShouldQueue
{
    use Queueable, QueuedEmailNotification;

    public function __construct(private readonly string $patientName) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Akses ke hasil cek risiko {$this->patientName} telah dicabut")
            ->greeting('Halo, '.$notifiable->name.'!')
            ->line("{$this->patientName} mencabut izin akses ke hasil cek risikonya.")
            ->line('Tautan yang Anda simpan sudah tidak berlaku. Catatan edukasi yang sudah Anda tulis tetap dapat dibaca olehnya.')
            ->line('Bila akses masih dibutuhkan, mintalah izin baru kepada yang bersangkutan.');
    }
}
