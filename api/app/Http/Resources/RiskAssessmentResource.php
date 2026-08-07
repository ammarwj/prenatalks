<?php

namespace App\Http\Resources;

use App\Models\RiskAssessment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/** @mixin RiskAssessment */
class RiskAssessmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $contributingFactors = $this->whenLoaded('answers', fn () => $this->answers
            ->filter(fn ($answer) => $answer->score > 0)
            ->sortByDesc('score')
            ->values()
        );

        return [
            'id' => $this->id,
            'status' => $this->status,
            'total_score' => $this->total_score,
            'has_danger_sign' => $this->has_danger_sign,
            'risk_level' => new RiskLevelResource($this->whenLoaded('riskLevel')),
            'contributing_factors' => $contributingFactors instanceof Collection
                ? RiskAnswerResource::collection($contributingFactors)
                : [],
            'questionnaire_version' => $this->questionnaire_version,
            'completed_at' => $this->completed_at,
            'created_at' => $this->created_at,
        ];
    }
}
