<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Ubah profil sendiri (PRD §8 `/dashboard/profil`).
 *
 * Email sengaja tidak ada di sini: menggantinya menuntut alur verifikasi
 * ulang — tautan dikirim ke alamat baru dan perubahan ditahan sampai
 * diklik — bukan sekadar satu kolom tambahan di form profil. Selama alur
 * itu belum ada, alamat lama tetap satu-satunya jalur pemulihan akun.
 */
class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'phone' => ['nullable', 'string', 'max:20'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama wajib diisi',
            'name.min' => 'Nama minimal 2 karakter',
            'name.max' => 'Nama maksimal 150 karakter',
            'phone.max' => 'Nomor telepon maksimal 20 karakter',
        ];
    }
}
