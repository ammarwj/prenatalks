<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Panduan penggunaan situs — langkah-langkah yang ditampilkan di `/panduan`
 * dan ditautkan dari blok "Bantuan" di footer.
 *
 * Urutannya bermakna (langkah 1, 2, 3, …), bukan sekadar preferensi tampilan
 * seperti pada testimoni: karena itu `order_index` disimpan dan nomor langkah
 * di halaman publik dihitung dari posisi, bukan dari kolom terpisah yang bisa
 * bentrok saat satu langkah dihapus.
 */
#[Fillable(['title', 'summary', 'body', 'order_index', 'is_published'])]
class Guide extends Model
{
    use Auditable;

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
        ];
    }

    /**
     * Alasan sama seperti `LegalDocument::auditIgnore()`: isi HTML panduan
     * bisa panjang, dan diff-nya akan membuat satu baris audit log lebih besar
     * daripada seluruh baris lain sekaligus meledakkan tinggi baris di
     * `/admin/audit-log`. Judul, ringkasan, urutan, dan status terbit tetap
     * tercatat — itulah yang bermakna sebagai jejak perubahan.
     *
     * @return list<string>
     */
    public function auditIgnore(): array
    {
        return ['body'];
    }

    public function scopePublished(Builder $query): void
    {
        $query->where('is_published', true);
    }

    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('order_index')->orderBy('id');
    }
}
