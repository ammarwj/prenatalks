<?php

namespace App\Http\Resources;

use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin Video */
class VideoResource extends JsonResource
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
            'embed_url' => $this->resource->embedUrl(),
            'thumbnail_url' => $this->thumbnail_path
                ? Storage::disk('public')->url($this->thumbnail_path)
                : $this->resource->autoThumbnailUrl(),
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ] : null),
            'life_stage' => $this->life_stage,
            'duration_seconds' => $this->duration_seconds,
            'published_at' => $this->published_at,
        ];
    }
}
