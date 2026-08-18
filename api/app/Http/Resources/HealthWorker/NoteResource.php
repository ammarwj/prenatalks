<?php

namespace App\Http\Resources\HealthWorker;

use App\Models\HealthWorkerNote;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Catatan edukasi — bentuknya sama untuk kedua pihak: yang menulis dan
 * yang menerima. Tidak ada field yang perlu disembunyikan dari salah satu
 * sisi, jadi tidak ada varian kedua.
 *
 * @mixin HealthWorkerNote
 */
class NoteResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'risk_assessment_id' => $this->risk_assessment_id,
            'health_worker_name' => $this->healthWorker?->name,
            'created_at' => $this->created_at,
        ];
    }
}
