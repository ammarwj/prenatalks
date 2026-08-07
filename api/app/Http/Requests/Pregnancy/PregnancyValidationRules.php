<?php

namespace App\Http\Requests\Pregnancy;

use Illuminate\Validation\Rule;

/**
 * Aturan bersama untuk Store/UpdatePregnancyRequest — PRD §9 F-03.
 */
trait PregnancyValidationRules
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'lmp_date' => [
                'required',
                'date',
                'before_or_equal:today',
                'after_or_equal:'.now()->subDays(300)->toDateString(),
            ],
            'edd_date' => ['nullable', 'date'],
            'gravida' => ['nullable', 'integer', 'min:0', 'max:20'],
            'para' => ['nullable', 'integer', 'min:0', 'max:20'],
            'abortus' => ['nullable', 'integer', 'min:0', 'max:20'],
            'height_cm' => ['nullable', 'numeric', 'min:100', 'max:250'],
            'weight_prepregnancy_kg' => ['nullable', 'numeric', 'min:20', 'max:300'],
            'weight_current_kg' => ['nullable', 'numeric', 'min:20', 'max:300'],
            'blood_type' => ['nullable', 'string', 'max:5'],
            'medical_history' => ['nullable', 'array'],
            'medical_history.*' => [
                'string',
                Rule::in(['hipertensi', 'diabetes', 'anemia', 'asma', 'jantung', 'lainnya']),
            ],
            'facility_name' => ['nullable', 'string', 'max:150'],
            'facility_contact' => ['nullable', 'string', 'max:50'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'lmp_date.required' => 'HPHT wajib diisi',
            'lmp_date.before_or_equal' => 'HPHT tidak boleh di masa depan',
            'lmp_date.after_or_equal' => 'HPHT tidak boleh lebih dari 300 hari lalu',
            'medical_history.*.in' => 'Riwayat penyakit tidak dikenali',
        ];
    }
}
