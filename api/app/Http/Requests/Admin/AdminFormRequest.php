<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class AdminFormRequest extends FormRequest
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
            'type' => ['nullable', 'string', 'in:form,survey'],
            'is_public' => ['boolean'],
            'requires_login' => ['boolean'],
            'is_anonymous' => ['boolean'],
            'one_response_per_user' => ['boolean'],
            'status' => ['required', 'string', 'in:draft,published,closed'],
            'opens_at' => ['nullable', 'date'],
            'closes_at' => ['nullable', 'date', 'after_or_equal:opens_at'],

            'fields' => ['required', 'array', 'min:1'],
            'fields.*.label' => ['required', 'string', 'max:255'],
            'fields.*.description' => ['nullable', 'string'],
            'fields.*.type' => [
                'required', 'string',
                'in:text,textarea,number,date,radio,checkbox,select,scale,file',
            ],
            'fields.*.placeholder' => ['nullable', 'string', 'max:255'],
            'fields.*.is_required' => ['boolean'],
            'fields.*.options' => ['nullable', 'array'],
            'fields.*.validation' => ['nullable', 'array'],
            'fields.*.validation.min' => ['nullable', 'integer'],
            'fields.*.validation.max' => ['nullable', 'integer'],
            'fields.*.validation.regex' => ['nullable', 'string', 'max:255'],
            'fields.*.validation.max_size_kb' => ['nullable', 'integer'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Judul form wajib diisi',
            'status.required' => 'Status form wajib dipilih',
            'closes_at.after_or_equal' => 'Tanggal tutup harus setelah atau sama dengan tanggal buka',
            'fields.required' => 'Form minimal punya 1 field',
        ];
    }

    /**
     * Aturan struktural yang bentuknya berbeda per tipe field (opsi pilihan,
     * skala, regex, ukuran berkas) tidak bisa ditulis sebagai rule statis
     * dot-notation seragam — divalidasi manual per field di sini.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            foreach ($this->input('fields', []) as $index => $field) {
                $type = $field['type'] ?? null;
                $options = $field['options'] ?? null;
                $validation = $field['validation'] ?? [];

                if (in_array($type, ['radio', 'checkbox', 'select'], true)) {
                    $choices = is_array($options)
                        ? array_filter($options, fn ($o) => is_string($o) && trim($o) !== '')
                        : [];
                    if (count($choices) < 1) {
                        $validator->errors()->add(
                            "fields.{$index}.options",
                            'Minimal 1 pilihan untuk tipe field ini'
                        );
                    }
                }

                if ($type === 'scale') {
                    $min = $options['min'] ?? null;
                    $max = $options['max'] ?? null;
                    if (! is_int($min) || ! is_int($max) || $min >= $max) {
                        $validator->errors()->add(
                            "fields.{$index}.options",
                            'Skala butuh nilai minimum dan maksimum (minimum harus lebih kecil dari maksimum)'
                        );
                    }
                }

                if (! empty($validation['regex']) && @preg_match("/{$validation['regex']}/u", '') === false) {
                    $validator->errors()->add(
                        "fields.{$index}.validation.regex",
                        'Pola regex tidak valid'
                    );
                }

                if (isset($validation['min'], $validation['max']) && $validation['min'] > $validation['max']) {
                    $validator->errors()->add(
                        "fields.{$index}.validation.max",
                        'Nilai maksimum harus lebih besar atau sama dengan minimum'
                    );
                }

                if ($type === 'file' && isset($validation['max_size_kb']) && $validation['max_size_kb'] > 2048) {
                    $validator->errors()->add(
                        "fields.{$index}.validation.max_size_kb",
                        'Ukuran maksimum berkas tidak boleh lebih dari 2048 KB (2 MB)'
                    );
                }
            }
        });
    }
}
