<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AdminQuestionnaireRequest extends FormRequest
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
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],

            'questions' => ['required', 'array', 'min:1'],
            'questions.*.text' => ['required', 'string', 'max:255'],
            'questions.*.help_text' => ['nullable', 'string'],
            'questions.*.type' => ['required', 'string', 'in:single_choice,multiple_choice,boolean,number'],
            'questions.*.is_required' => ['boolean'],
            'questions.*.group_label' => ['nullable', 'string', 'max:100'],
            'questions.*.options' => ['required_unless:questions.*.type,number', 'array'],
            'questions.*.options.*.label' => ['required', 'string', 'max:255'],
            'questions.*.options.*.score' => ['required', 'integer'],
            'questions.*.options.*.is_danger_sign' => ['boolean'],

            'risk_levels' => ['required', 'array', 'min:1'],
            'risk_levels.*.name' => ['required', 'string', 'max:100'],
            'risk_levels.*.min_score' => ['required', 'integer'],
            'risk_levels.*.max_score' => ['nullable', 'integer', 'gte:risk_levels.*.min_score'],
            'risk_levels.*.color_hex' => ['required', 'string', 'max:7'],
            'risk_levels.*.recommendation' => ['required', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Judul kuesioner wajib diisi',
            'questions.required' => 'Kuesioner minimal punya 1 pertanyaan',
            'risk_levels.required' => 'Kuesioner minimal punya 1 level risiko',
        ];
    }
}
