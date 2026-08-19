<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Ganti kata sandi dari dalam sesi yang sudah masuk.
 *
 * Aturan `password` disalin persis dari ResetPasswordRequest — kekuatan
 * kata sandi tidak boleh bercabang dua tergantung pintu mana yang dipakai
 * penggunanya.
 */
class ChangePasswordRequest extends FormRequest
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
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'regex:/^(?=.*[A-Za-z])(?=.*\d).+$/', 'confirmed', 'different:current_password'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_password.required' => 'Kata sandi saat ini wajib diisi',
            'password.required' => 'Kata sandi baru wajib diisi',
            'password.min' => 'Kata sandi minimal 8 karakter',
            'password.regex' => 'Kata sandi harus mengandung huruf dan angka',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok',
            'password.different' => 'Kata sandi baru harus berbeda dari kata sandi saat ini',
        ];
    }
}
