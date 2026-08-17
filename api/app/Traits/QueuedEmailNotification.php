<?php

namespace App\Traits;

/**
 * Pengaturan antrean bersama untuk notifikasi email auth
 * (App\Notifications\{ResetPassword,VerifyEmail}Notification).
 */
trait QueuedEmailNotification
{
    /**
     * Antrean "emails" dipisah dari "default" supaya ekspor submission yang
     * berjalan lama tidak menahan email di belakangnya — worker menguras
     * "emails" lebih dulu (docker-compose.yml: --queue=emails,default).
     *
     * @return array<string, string>
     */
    public function viaQueues(): array
    {
        return ['mail' => 'emails'];
    }

    /**
     * Jeda (detik) sebelum percobaan ulang, berpasangan dengan --tries=3.
     * Tanpa ini ketiga percobaan habis dalam hitungan detik dan sama-sama
     * menabrak gangguan sementara yang sama — batas rate SMTP, misalnya —
     * sehingga email hangus padahal kirim ulang beberapa detik kemudian
     * kemungkinan besar berhasil.
     *
     * @return list<int>
     */
    public function backoff(): array
    {
        return [10, 60];
    }
}
