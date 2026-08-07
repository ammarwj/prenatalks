<?php

namespace App\Http\Requests\Pregnancy;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePregnancyRequest extends FormRequest
{
    use PregnancyValidationRules;

    public function authorize(): bool
    {
        return true;
    }
}
