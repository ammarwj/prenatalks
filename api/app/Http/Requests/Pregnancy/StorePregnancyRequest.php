<?php

namespace App\Http\Requests\Pregnancy;

use Illuminate\Foundation\Http\FormRequest;

class StorePregnancyRequest extends FormRequest
{
    use PregnancyValidationRules;

    public function authorize(): bool
    {
        return true;
    }
}
