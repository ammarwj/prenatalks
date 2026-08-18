<?php

namespace App\Http\Resources\HealthWorker;

use App\Models\HealthWorkerConsent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Satu izin dilihat dari sisi pemberinya — halaman `/dashboard/privasi`.
 *
 * Kode tautan tidak ada di sini dan memang tidak bisa ada: yang tersimpan
 * hanya hash-nya (lihat HealthWorkerConsentService).
 *
 * @mixin HealthWorkerConsent
 */
class ConsentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'health_worker' => [
                'id' => $this->health_worker_id,
                'name' => $this->healthWorker?->name,
                'email' => $this->healthWorker?->email,
            ],
            'is_active' => $this->isActive(),
            'expires_at' => $this->expires_at,
            'revoked_at' => $this->revoked_at,
            'last_accessed_at' => $this->last_accessed_at,
            'notes_count' => $this->whenCounted('notes'),
            'created_at' => $this->created_at,
        ];
    }
}
