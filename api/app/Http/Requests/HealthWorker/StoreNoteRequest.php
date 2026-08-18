<?php

namespace App\Http\Requests\HealthWorker;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Catatan edukasi dari tenaga kesehatan — PRD §9 F-15.
 */
class StoreNoteRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:5', 'max:2000'],

            // Boleh kosong: catatan umum yang tidak menanggapi satu hasil
            // tertentu. Bila diisi, kepemilikannya dicek di controller —
            // hasil itu harus milik pemberi izin, bukan sembarang id.
            'risk_assessment_id' => ['nullable', 'integer'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'body.required' => 'Catatan edukasi tidak boleh kosong',
            'body.min' => 'Catatan edukasi terlalu pendek',
            'body.max' => 'Catatan edukasi maksimal 2000 karakter',
        ];
    }
}
