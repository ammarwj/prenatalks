<?php

namespace App\Http\Resources\Admin;

use App\Models\Questionnaire;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Questionnaire */
class AdminQuestionnaireResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'version' => $this->version,
            'is_active' => $this->is_active,
            'published_at' => $this->published_at,
            'has_history' => $this->when(
                isset($this->risk_assessments_count),
                fn () => $this->risk_assessments_count > 0
            ),
            'questions' => AdminQuestionResource::collection($this->whenLoaded('questions')),
            'risk_levels' => AdminRiskLevelResource::collection($this->whenLoaded('riskLevels')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
