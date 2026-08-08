<?php

namespace App\Http\Requests\Admin;

use App\Services\YoutubeUrlParser;
use Illuminate\Foundation\Http\FormRequest;

class AdminVideoRequest extends FormRequest
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
            'description' => ['nullable', 'string'],
            'youtube_url' => [
                'required', 'string',
                function ($attribute, $value, $fail) {
                    if (! YoutubeUrlParser::isValidUrl($value)) {
                        $fail('URL YouTube tidak valid atau tidak bisa dikenali. Gunakan tautan lengkap (mis. https://youtu.be/... atau https://www.youtube.com/watch?v=...).');
                    }
                },
            ],
            'thumbnail' => ['nullable', 'image', 'max:4096'],
            'remove_thumbnail' => ['nullable', 'boolean'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'duration_seconds' => ['nullable', 'integer', 'min:1'],
            'life_stage' => ['nullable', 'string', 'in:preconception,pregnancy,birth,postpartum,parenting'],
            'status' => ['required', 'string', 'in:draft,published'],
            'published_at' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Judul video wajib diisi',
            'youtube_url.required' => 'URL YouTube wajib diisi',
            'thumbnail.image' => 'Thumbnail harus berupa gambar',
            'thumbnail.max' => 'Ukuran thumbnail maksimal 4 MB',
        ];
    }
}
