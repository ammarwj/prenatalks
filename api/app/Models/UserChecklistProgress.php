<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Progres checklist per pengguna — PRD §9 F-11, §10.
 *
 * Satu tabel menampung dua jenis baris: progres atas item template admin
 * (`checklist_item_id` terisi) dan item pribadi pengguna (`custom_title`
 * terisi, `checklist_item_id` NULL).
 */
#[Fillable(['user_id', 'checklist_item_id', 'custom_title', 'is_checked', 'checked_at'])]
class UserChecklistProgress extends Model
{
    // Laravel akan menebak "user_checklist_progresses" — nama tabel di skema
    // PRD §10 memakai bentuk tak terhitung, jadi ditetapkan eksplisit.
    protected $table = 'user_checklist_progress';

    protected function casts(): array
    {
        return [
            'is_checked' => 'boolean',
            'checked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function checklistItem(): BelongsTo
    {
        return $this->belongsTo(ChecklistItem::class);
    }

    public function scopeCustom(Builder $query): void
    {
        $query->whereNull('checklist_item_id');
    }
}
