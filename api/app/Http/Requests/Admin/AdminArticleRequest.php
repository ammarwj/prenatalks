<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AdminArticleRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9]+(-[a-z0-9]+)*$/'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'cover' => ['nullable', 'image', 'max:4096'],
            'remove_cover' => ['nullable', 'boolean'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'trimester' => ['nullable', 'integer', 'between:1,3'],
            'life_stage' => ['nullable', 'string', 'in:preconception,pregnancy,birth,postpartum,parenting'],
            'source_reference' => ['required', 'string'],
            'reviewed_at' => ['required', 'date', 'before_or_equal:today'],
            'status' => ['required', 'string', 'in:draft,published'],
            'published_at' => ['nullable', 'date'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Judul artikel wajib diisi',
            'content.required' => 'Isi artikel wajib diisi',
            'source_reference.required' => 'Sumber rujukan wajib diisi',
            'reviewed_at.required' => 'Tanggal tinjauan wajib diisi',
            'reviewed_at.before_or_equal' => 'Tanggal tinjauan tidak boleh di masa depan',
            'cover.image' => 'Cover harus berupa gambar',
            'cover.max' => 'Ukuran cover maksimal 4 MB',
        ];
    }
}
