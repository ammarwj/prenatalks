<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Izin eksplisit satu pengguna kepada satu tenaga kesehatan — PRD §9 F-15.
 *
 * `Auditable` dipasang di sini justru karena pemberian dan pencabutan izin
 * adalah kejadian yang wajib punya jejak (PRD §9 F-15: "tercatat di audit
 * log"). Bedanya dengan model lain yang memakai trait ini: pelakunya
 * pengguna biasa, bukan admin — dan itu memang yang ingin dicatat.
 *
 * @property-read bool $is_active
 */
#[Fillable(['user_id', 'health_worker_id', 'access_code_hash', 'expires_at'])]
#[Hidden(['access_code_hash'])]
class HealthWorkerConsent extends Model
{
    use Auditable;

    /**
     * Hash kode tautan tidak pernah ikut ke audit log: baris audit bisa
     * dibaca super admin, sedangkan kode adalah kredensial akses.
     *
     * @return list<string>
     */
    public function auditIgnore(): array
    {
        return ['access_code_hash', 'last_accessed_at'];
    }

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
            'last_accessed_at' => 'datetime',
        ];
    }

    /**
     * Sumber kebenaran tunggal "apakah izin ini masih berlaku". Pencabutan
     * berlaku seketika — tidak menunggu `expires_at` (BUSINESS_FLOWS §9).
     */
    public function isActive(): bool
    {
        return $this->revoked_at === null
            && ($this->expires_at === null || $this->expires_at->isFuture());
    }

    /**
     * Pencabutan sengaja tidak lewat mass assignment: `revoked_at` tidak
     * masuk `$fillable` supaya tidak ada payload permintaan yang bisa
     * menghidupkan kembali izin dengan mengirim `revoked_at: null`.
     */
    public function revoke(): void
    {
        if ($this->revoked_at !== null) {
            return;
        }

        $this->revoked_at = now();
        $this->save();
    }

    /** Versi query dari isActive() — dipakai untuk daftar & pencarian kode. */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('revoked_at')
            ->where(fn (Builder $q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()));
    }

    /** Pemberi izin — pemilik data kehamilan & hasil cek risiko. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function healthWorker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'health_worker_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(HealthWorkerNote::class, 'consent_id');
    }
}
