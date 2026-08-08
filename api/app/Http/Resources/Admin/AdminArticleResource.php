<?php

namespace App\Http\Resources\Admin;

use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin Article */
class AdminArticleResource extends JsonResource
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
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'cover_url' => $this->cover_path ? Storage::disk('public')->url($this->cover_path) : null,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ]),
            'category_id' => $this->category_id,
            'trimester' => $this->trimester,
            'author' => $this->whenLoaded('author', fn () => $this->author ? [
                'id' => $this->author->id,
                'name' => $this->author->name,
            ] : null),
            'life_stage' => $this->life_stage,
            'source_reference' => $this->source_reference,
            'reviewed_at' => $this->reviewed_at?->toDateString(),
            'status' => $this->status,
            'is_scheduled' => $this->status === 'published'
                && $this->published_at !== null
                && now()->lt($this->published_at),
            'published_at' => $this->published_at,
            'views_count' => $this->views_count,
            'reading_minutes' => $this->reading_minutes,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
