<?php

namespace App\Http\Resources\Admin;

use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin Video */
class AdminVideoResource extends JsonResource
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
            'youtube_id' => $this->youtube_id,
            'embed_url' => $this->resource->embedUrl(),
            'thumbnail_url' => $this->thumbnail_path
                ? Storage::disk('public')->url($this->thumbnail_path)
                : $this->resource->autoThumbnailUrl(),
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ] : null),
            'category_id' => $this->category_id,
            'duration_seconds' => $this->duration_seconds,
            'life_stage' => $this->life_stage,
            'status' => $this->status,
            'is_scheduled' => $this->status === 'published'
                && $this->published_at !== null
                && now()->lt($this->published_at),
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
