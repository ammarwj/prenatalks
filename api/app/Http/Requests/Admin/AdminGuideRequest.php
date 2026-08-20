<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AdminGuideRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:150'],
            'summary' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'is_published' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Judul panduan wajib diisi',
            'title.max' => 'Judul maksimal 150 karakter',
            'summary.max' => 'Ringkasan maksimal 255 karakter',
            'body.required' => 'Isi panduan wajib diisi',
        ];
    }
}
