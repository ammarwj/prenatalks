<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AdminTestimonialRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:80'],

            // Teks bebas, bukan angka — lihat alasannya di migrasi.
            'pregnancy_age' => ['required', 'string', 'max:40'],

            'quote' => ['required', 'string', 'max:500'],

            // Kartu testimoni hanya punya ruang lima bintang.
            'rating' => ['required', 'integer', 'min:1', 'max:5'],

            'is_published' => ['boolean'],

            // Batas 2 MB mengikuti aturan unggah berkas di PRD §9 F-06.
            'photo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'remove_photo' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama wajib diisi',
            'pregnancy_age.required' => 'Usia kehamilan wajib diisi',
            'quote.required' => 'Kutipan testimoni wajib diisi',
            'quote.max' => 'Kutipan maksimal 500 karakter',
            'rating.required' => 'Rating wajib diisi',
            'rating.min' => 'Rating harus antara 1 sampai 5 bintang',
            'rating.max' => 'Rating harus antara 1 sampai 5 bintang',
            'photo.image' => 'Berkas harus berupa gambar',
            'photo.max' => 'Ukuran foto maksimal 2 MB',
        ];
    }
}
