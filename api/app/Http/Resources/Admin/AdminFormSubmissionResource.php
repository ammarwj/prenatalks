<?php

namespace App\Http\Resources\Admin;

use App\Models\FormSubmission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FormSubmission */
class AdminFormSubmissionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'respondent' => $this->user ? ['id' => $this->user->id, 'name' => $this->user->name] : null,
            'submitted_at' => $this->submitted_at,
            'answers' => $this->answers->map(fn ($answer) => [
                'field_id' => $answer->field_id,
                'label' => $answer->field->label,
                'value' => $answer->value_json ?? $answer->value,
            ]),
        ];
    }
}
