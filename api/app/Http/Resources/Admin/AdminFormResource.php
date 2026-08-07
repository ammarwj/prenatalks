<?php

namespace App\Http\Resources\Admin;

use App\Models\Form;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Form */
class AdminFormResource extends JsonResource
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
            'is_public' => $this->is_public,
            'requires_login' => $this->requires_login,
            'is_anonymous' => $this->is_anonymous,
            'one_response_per_user' => $this->one_response_per_user,
            'status' => $this->status,
            'opens_at' => $this->opens_at,
            'closes_at' => $this->closes_at,
            'fields' => AdminFormFieldResource::collection($this->whenLoaded('fields')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
