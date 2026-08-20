<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AdminLegalDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * `slug` sengaja tidak ada di sini: keduanya dikunci di
     * `LegalDocument::SLUGS` karena ditautkan dari footer dan dari checkbox
     * persetujuan halaman daftar.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],

            // Tanpa batas panjang, sama seperti `content` di AdminArticleRequest:
            // isinya HTML dokumen legal yang panjangnya wajar-wajar saja besar,
            // dan kolomnya `longText`.
            'body' => ['required', 'string'],

            'effective_date' => ['nullable', 'date'],
            'is_published' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Judul dokumen wajib diisi',
            'title.max' => 'Judul dokumen maksimal 150 karakter',
            'body.required' => 'Isi dokumen wajib diisi',
            'effective_date.date' => 'Tanggal berlaku tidak valid',
        ];
    }
}
