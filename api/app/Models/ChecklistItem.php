<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Item template checklist persiapan melahirkan — PRD §9 F-11, §10.
 */
#[Fillable(['group_name', 'title', 'description', 'order_index', 'is_active'])]
class ChecklistItem extends Model
{
    use Auditable;

    /**
     * Kelompok tetap sesuai PRD §9 F-11. Urutan array ini juga menentukan
     * urutan tampil kelompok di `GET /checklist` — bukan urutan alfabet.
     *
     * @var list<string>
     */
    public const GROUPS = [
        'Dokumen',
        'Perlengkapan Ibu',
        'Perlengkapan Bayi',
        'Persiapan Transportasi & Donor Darah',
        'Rencana Persalinan',
    ];

    /**
     * Kelompok semu tempat item pribadi pengguna dikumpulkan. Bukan nilai yang
     * valid untuk `checklist_items.group_name` — item pribadi hidup di
     * `user_checklist_progress` dan tidak punya kolom kelompok (skema PRD §10).
     */
    public const CUSTOM_GROUP = 'Item Pribadi';

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function progress(): HasMany
    {
        return $this->hasMany(UserChecklistProgress::class);
    }

    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /**
     * Urut berdasarkan posisi kelompok di `GROUPS`, lalu `order_index`.
     * Diurutkan di PHP karena urutan kelompok bersifat semantik, bukan
     * alfabet, dan jumlah item checklist realistis kecil.
     */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('order_index')->orderBy('id');
    }
}
