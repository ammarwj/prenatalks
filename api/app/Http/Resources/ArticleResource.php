<?php

namespace App\Http\Resources;

use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin Article */
class ArticleResource extends JsonResource
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
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ] : null),
            'life_stage' => $this->life_stage,
            'trimester' => $this->trimester,
            'author' => $this->whenLoaded('author', fn () => $this->author ? [
                'name' => $this->author->name,
            ] : null),
            'source_reference' => $this->source_reference,
            'reviewed_at' => $this->reviewed_at?->toDateString(),
            'reading_minutes' => $this->reading_minutes,
            'views_count' => $this->views_count,
            'published_at' => $this->published_at,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'related' => ArticleSummaryResource::collection($this->whenLoaded('related')),
        ];
    }
}
