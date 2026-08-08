<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'title', 'slug', 'excerpt', 'content', 'cover_path', 'category_id', 'trimester',
    'author_id', 'life_stage', 'source_reference', 'reviewed_at', 'reviewed_by',
    'status', 'published_at', 'views_count', 'reading_minutes', 'meta_title', 'meta_description',
])]
class Article extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'date',
            'published_at' => 'datetime',
            'views_count' => 'integer',
            'trimester' => 'integer',
            'reading_minutes' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Terlihat publik bila status "published" dan `published_at` sudah
     * terlewati — mendukung "jadwal terbit" (PRD §9 F-08) tanpa perlu job
     * terpisah: artikel dengan `published_at` di masa depan otomatis
     * tersembunyi sampai waktunya tiba karena query publik memfilter ini.
     */
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
}
