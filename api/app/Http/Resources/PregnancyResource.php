<?php

namespace App\Http\Resources;

use App\Models\Pregnancy;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Pregnancy */
class PregnancyResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lmp_date' => $this->lmp_date?->toDateString(),
            'edd_date' => $this->edd_date?->toDateString(),
            'edd_overridden' => $this->edd_overridden,
            'gravida' => $this->gravida,
            'para' => $this->para,
            'abortus' => $this->abortus,
            'height_cm' => $this->height_cm !== null ? (float) $this->height_cm : null,
            'weight_prepregnancy_kg' => $this->weight_prepregnancy_kg !== null ? (float) $this->weight_prepregnancy_kg : null,
            'weight_current_kg' => $this->weight_current_kg !== null ? (float) $this->weight_current_kg : null,
            'blood_type' => $this->blood_type,
            'medical_history' => $this->medical_history ?? [],
            'facility_name' => $this->facility_name,
            'facility_contact' => $this->facility_contact,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
