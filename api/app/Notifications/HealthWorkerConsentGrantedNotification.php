<?php

namespace App\Notifications;

use App\Traits\QueuedEmailNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Memberitahu tenaga kesehatan bahwa seorang pengguna memberinya izin —
 * PRD §9 F-15, BUSINESS_FLOWS §9 ("Sistem buat kode tautan akses").
 *
 * **Kenapa kode tautan boleh masuk email.** Kode ini bukan kredensial
 * pembawa: membukanya tetap menuntut akun dengan peran `health_worker` yang
 * memang ditunjuk izin itu (HealthWorkerAccessController). Mengirimkannya ke
 * alamat email akun tersebut karena itu bukan pelebaran akses — justru
 * saluran tersempit yang tersedia, lebih sempit daripada alternatif
 * sebelumnya, yaitu pengguna meneruskan tautan lewat WhatsApp.
 *
 * Yang **tidak** ikut: skor, tingkat risiko, usia kehamilan, dan data
 * kehamilan apa pun. Nama pemberi izin ikut karena tanpa itu penerima tidak
 * tahu tautan ini milik siapa dan tidak bisa menindaklanjutinya; selebihnya
 * baru terbuka setelah kode ditukar (minimalisasi data, PRD §12.3).
 */
class HealthWorkerConsentGrantedNotification extends Notification implements ShouldQueue
{
    use Queueable, QueuedEmailNotification;

    /**
     * @param  string  $patientName  nama pemberi izin
     * @param  string  $accessLink  tautan berisi kode — hanya ada di memori,
     *                              yang tersimpan di basis data cuma hash-nya
     * @param  bool  $isRenewed  true bila kode dibuat ulang, bukan izin baru
     */
    public function __construct(
        private readonly string $patientName,
        private readonly string $accessLink,
        private readonly bool $isRenewed = false,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->greeting('Halo, '.$notifiable->name.'!');

        // Pembuatan ulang kode mematikan tautan lama seketika. Tanpa kalimat
        // itu, penerima yang menyimpan tautan sebelumnya hanya akan menemukan
        // halaman penolakan tanpa tahu sebabnya.
        $message = $this->isRenewed
            ? $message
                ->subject("Tautan akses baru dari {$this->patientName}")
                ->line("{$this->patientName} membuat ulang tautan akses ke hasil cek risikonya.")
                ->line('Tautan yang Anda terima sebelumnya sudah tidak berlaku — gunakan yang di bawah ini.')
            : $message
                ->subject("{$this->patientName} memberi Anda akses ke hasil cek risikonya")
                ->line("{$this->patientName} memberi Anda izin untuk melihat hasil cek risiko kehamilannya dan menuliskan catatan edukasi.");

        return $message
            ->action('Buka Hasil Cek Risiko', $this->accessLink)
            ->line('Tautan ini hanya bisa dibuka dengan akun PrenaTalks Anda sendiri, jadi meneruskannya ke orang lain tidak akan memberi mereka akses.')
            ->line('Pemberi izin dapat mencabutnya kapan saja, dan setiap kali Anda membuka hasilnya, akses itu tercatat.');
    }
}
