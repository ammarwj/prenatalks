<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Dokumen legal situs — Syarat & Ketentuan dan Kebijakan Privasi
 * (PRD §12.3, Lampiran C).
 */
#[Fillable(['slug', 'title', 'body', 'effective_date', 'is_published', 'updated_by'])]
class LegalDocument extends Model
{
    use Auditable;

    /**
     * Slug dikunci di kode, bukan diisi admin: keduanya ditautkan dari footer
     * dan dari checkbox persetujuan di halaman daftar. Slug yang bisa berubah
     * berarti tautan itu bisa mati tanpa ada yang menyadarinya.
     *
     * Daftar ini juga yang membatasi segmen `{slug}` di rute publik, sehingga
     * nilai di luar daftar berhenti sebagai 404 rute — bukan merambat ke
     * controller.
     *
     * @var array<string, string>
     */
    public const SLUGS = [
        'syarat-ketentuan' => 'Syarat & Ketentuan',
        'kebijakan-privasi' => 'Kebijakan Privasi',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected function casts(): array
    {
        return [
            'effective_date' => 'date',
            'is_published' => 'boolean',
        ];
    }

    /**
     * Isi HTML bisa puluhan ribu karakter — mencatat diff-nya akan membuat
     * satu baris audit log lebih besar daripada seluruh tabel lainnya,
     * sekaligus meledakkan tinggi baris di `/admin/audit-log`. Judul, tanggal
     * berlaku, status terbit, dan `updated_by` tetap tercatat: itulah yang
     * bermakna sebagai jejak "kapan kebijakan ini berubah dan oleh siapa".
     *
     * Konsekuensi yang perlu diketahui: bila super admin yang sama menyunting
     * **hanya** isi dokumen dua kali berturut-turut, suntingan kedua tidak
     * meninggalkan baris audit — tidak ada kolom terpantau yang berubah.
     * `updated_at` pada dokumennya sendiri tetap menjadi catatan kapan teksnya
     * terakhir berubah, dan itulah yang ditampilkan di halaman publik.
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

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
