<?php

namespace App\Http\Resources;

use App\Models\Form;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Form */
class PublicFormResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'type' => $this->type,
            'requires_login' => $this->requires_login,
            'is_anonymous' => $this->is_anonymous,
            'one_response_per_user' => $this->one_response_per_user,
            'is_open' => $this->isOpenForSubmission(),
            'fields' => PublicFormFieldResource::collection($this->whenLoaded('fields')),
        ];
    }
}
