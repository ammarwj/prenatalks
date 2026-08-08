<?php

namespace App\Http\Requests\Admin;

use App\Models\ChecklistItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminChecklistItemRequest extends FormRequest
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
            // Kelompok dikunci ke lima nilai di PRD §9 F-11 — admin memilih,
            // bukan mengetik, supaya tidak lahir kelompok kembar akibat salah ketik.
            'group_name' => ['required', 'string', Rule::in(ChecklistItem::GROUPS)],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'group_name.required' => 'Kelompok wajib dipilih',
            'group_name.in' => 'Kelompok tidak dikenali',
            'title.required' => 'Judul item wajib diisi',
            'title.max' => 'Judul item maksimal 200 karakter',
        ];
    }
}
