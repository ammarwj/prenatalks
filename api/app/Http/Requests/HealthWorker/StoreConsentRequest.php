<?php

namespace App\Http\Requests\HealthWorker;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Pemberian izin akses ke satu tenaga kesehatan — PRD §9 F-15.
 */
class StoreConsentRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // "Tenaga kesehatan terverifikasi" (PRD §9 F-15) di sistem ini
            // berarti akun yang perannya dinaikkan super admin lewat
            // /admin/pengguna — itulah langkah verifikasinya. Syarat peran
            // dan status aktif ditegakkan di aturan validasi, bukan hanya di
            // controller, supaya id yang dikarang tetap ditolak 422 dengan
            // pesan yang jelas alih-alih lolos ke query berikutnya.
            'health_worker_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')
                    ->where('role', 'health_worker')
                    ->where('is_active', true)
                    ->whereNull('deleted_at'),
            ],

            // Kedaluwarsa opsional; pencabutan manual tetap jalur utama.
            'expires_at' => ['nullable', 'date', 'after:now'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'health_worker_id.exists' => 'Tenaga kesehatan tidak ditemukan atau akunnya tidak aktif',
            'expires_at.after' => 'Tanggal berakhir harus setelah hari ini',
        ];
    }
}
