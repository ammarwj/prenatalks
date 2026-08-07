<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CalculatorRequest extends FormRequest
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
            'lmp_date' => [
                'required',
                'date_format:Y-m-d',
                'before_or_equal:today',
                'after_or_equal:'.now()->subDays(300)->toDateString(),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'lmp_date.required' => 'HPHT wajib diisi',
            'lmp_date.date_format' => 'Format HPHT harus YYYY-MM-DD',
            'lmp_date.before_or_equal' => 'HPHT tidak boleh melebihi tanggal hari ini',
            'lmp_date.after_or_equal' => 'HPHT tidak boleh lebih dari 300 hari yang lalu',
        ];
    }
}
