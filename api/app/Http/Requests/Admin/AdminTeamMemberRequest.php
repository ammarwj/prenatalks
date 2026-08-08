<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AdminTeamMemberRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:120'],
            'role_title' => ['required', 'string', 'max:120'],

            // Kualifikasi (mis. "Bidan · STR 1234567890") — inilah yang
            // membuat klaim "berbasis bukti" dapat diverifikasi pembaca
            // (PRD §9 F-16 seksi 6). Opsional untuk anggota non-nakes.
            'credential' => ['nullable', 'string', 'max:150'],

            'description' => ['nullable', 'string', 'max:1000'],
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
            'role_title.required' => 'Peran wajib diisi',
            'photo.image' => 'Berkas harus berupa gambar',
            'photo.max' => 'Ukuran foto maksimal 2 MB',
        ];
    }
}
