<?php

namespace App\Services;

use App\Models\HealthWorkerConsent;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;

/**
 * Pembuatan & penukaran kode tautan akses tenaga kesehatan — PRD §9 F-15.
 *
 * Kode diperlakukan seperti refresh token (§6.1): dibuat acak panjang,
 * disimpan sebagai hash SHA-256, dan hanya dikembalikan dalam bentuk teks
 * satu kali — saat dibuat atau dibuat ulang.
 */
class HealthWorkerConsentService
{
    /** Panjang kode acak; alfanumerik, aman ditempel di URL. */
    private const CODE_LENGTH = 40;

    /**
     * @return array{0: string, 1: HealthWorkerConsent} kode teks & barisnya
     */
    public function issue(User $patient, User $healthWorker, ?string $expiresAt = null): array
    {
        $plainCode = $this->generateCode();

        $consent = HealthWorkerConsent::create([
            'user_id' => $patient->id,
            'health_worker_id' => $healthWorker->id,
            'access_code_hash' => $this->hash($plainCode),
            'expires_at' => $expiresAt,
        ]);

        return [$plainCode, $consent];
    }

    /**
     * Mengganti kode tautan tanpa menyentuh status izin. Dipakai saat
     * pengguna kehilangan tautannya — kode lama langsung tidak berlaku,
     * karena hanya satu hash yang tersimpan per izin.
     */
    public function regenerate(HealthWorkerConsent $consent): string
    {
        $plainCode = $this->generateCode();

        $consent->access_code_hash = $this->hash($plainCode);
        $consent->save();

        return $plainCode;
    }

    /**
     * Menukar kode teks dengan izinnya. Mengembalikan null bila kode tidak
     * dikenali **atau** izinnya sudah dicabut/kedaluwarsa — pemanggil tidak
     * perlu membedakan keduanya, dan memang tidak boleh: membedakan pesan
     * "kode salah" dari "izin dicabut" membocorkan keberadaan izin kepada
     * siapa pun yang menebak kode.
     */
    public function findActiveByCode(string $plainCode): ?HealthWorkerConsent
    {
        return HealthWorkerConsent::query()
            ->active()
            ->where('access_code_hash', $this->hash($plainCode))
            ->first();
    }

    /** Tautan yang dibagikan pengguna ke tenaga kesehatannya. */
    public function linkFor(string $plainCode): string
    {
        $frontendUrl = rtrim((string) Config::get('app.frontend_url'), '/');

        return "{$frontendUrl}/nakes/akses/{$plainCode}";
    }

    private function generateCode(): string
    {
        return Str::random(self::CODE_LENGTH);
    }

    private function hash(string $plainCode): string
    {
        return hash('sha256', $plainCode);
    }
}
