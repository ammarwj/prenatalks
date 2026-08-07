<?php

namespace App\Http\Resources\Admin;

use App\Models\RiskLevel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin RiskLevel */
class AdminRiskLevelResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'min_score' => $this->min_score,
            'max_score' => $this->max_score,
            'color_hex' => $this->color_hex,
            'recommendation' => $this->recommendation,
            'order_index' => $this->order_index,
        ];
    }
}
