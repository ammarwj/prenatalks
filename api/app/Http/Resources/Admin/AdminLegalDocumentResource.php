<?php

namespace App\Http\Resources\Admin;

use App\Models\LegalDocument;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin LegalDocument */
class AdminLegalDocumentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'body' => $this->body,
            'effective_date' => $this->effective_date?->toDateString(),
            'is_published' => $this->is_published,
            'updated_by' => $this->whenLoaded(
                'updatedBy',
                fn () => $this->updatedBy
                    ? ['id' => $this->updatedBy->id, 'name' => $this->updatedBy->name]
                    : null,
                null
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
