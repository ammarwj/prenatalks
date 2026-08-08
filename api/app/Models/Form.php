<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'title', 'slug', 'description', 'type', 'is_public', 'requires_login',
    'is_anonymous', 'one_response_per_user', 'status', 'opens_at', 'closes_at', 'created_by',
])]
class Form extends Model
{
    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'requires_login' => 'boolean',
            'is_anonymous' => 'boolean',
            'one_response_per_user' => 'boolean',
            'opens_at' => 'datetime',
            'closes_at' => 'datetime',
        ];
    }

    public function fields(): HasMany
    {
        return $this->hasMany(FormField::class)->orderBy('order_index');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(FormSubmission::class);
    }

    public function exports(): HasMany
    {
        return $this->hasMany(FormExport::class);
    }

    /**
     * Versi kueri dari `isOpenForSubmission()` — dipakai saat menyaring
     * banyak form sekaligus (mis. kartu "form belum diisi" di dashboard,
     * PRD §9 F-13) tanpa memuat semuanya lebih dulu ke memori.
     */
    public function scopeOpenNow(Builder $query): void
    {
        $now = now();

        $query->where('status', 'published')
            ->where(fn (Builder $q) => $q->whereNull('opens_at')->orWhere('opens_at', '<=', $now))
            ->where(fn (Builder $q) => $q->whereNull('closes_at')->orWhere('closes_at', '>=', $now));
    }

    /**
     * Terbuka bagi pengisian bila status "published" dan waktu saat ini
     * berada dalam rentang opens_at/closes_at (PRD §9 F-06).
     */
    public function isOpenForSubmission(): bool
    {
        if ($this->status !== 'published') {
            return false;
        }

        $now = now();

        if ($this->opens_at && $now->lt($this->opens_at)) {
            return false;
        }

        if ($this->closes_at && $now->gt($this->closes_at)) {
            return false;
        }

        return true;
    }
}
