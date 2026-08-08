<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'title', 'slug', 'description', 'youtube_id', 'thumbnail_path', 'category_id',
    'duration_seconds', 'life_stage', 'status', 'published_at',
])]
class Video extends Model
{
    use Auditable, SoftDeletes;

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'duration_seconds' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function isPubliclyVisible(): bool
    {
        return $this->status === 'published'
            && $this->published_at !== null
            && now()->gte($this->published_at);
    }

    public function scopePublished(Builder $query): void
    {
        $query->where('status', 'published')->where('published_at', '<=', now());
    }

    /** Embed unlisted/privat via domain tanpa cookie — PRD §9 F-09. */
    public function embedUrl(): string
    {
        return "https://www.youtube-nocookie.com/embed/{$this->youtube_id}";
    }

    /** Thumbnail bawaan YouTube dipakai bila admin tidak mengunggah manual. */
    public function autoThumbnailUrl(): string
    {
        return "https://img.youtube.com/vi/{$this->youtube_id}/hqdefault.jpg";
    }
}
