<?php

namespace App\Http\Resources;

use App\Models\LegalDocument;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Yang keluar ke publik sengaja lebih sempit daripada versi admin: pengunjung
 * tidak perlu tahu status terbit atau siapa penyuntingnya.
 *
 * @mixin LegalDocument
 */
class LegalDocumentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'title' => $this->title,
            'body' => $this->body,
            'effective_date' => $this->effective_date?->toDateString(),
            'updated_at' => $this->updated_at,
        ];
    }
}
