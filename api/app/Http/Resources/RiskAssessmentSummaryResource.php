<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Untuk daftar riwayat (GET /assessments) — lebih ringan dari RiskAssessmentResource. */
class RiskAssessmentSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'total_score' => $this->total_score,
            'has_danger_sign' => $this->has_danger_sign,
            'risk_level' => new RiskLevelResource($this->whenLoaded('riskLevel')),
            'completed_at' => $this->completed_at,
        ];
    }
}
