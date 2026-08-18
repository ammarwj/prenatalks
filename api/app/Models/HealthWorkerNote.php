<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Catatan edukasi tenaga kesehatan atas hasil cek risiko — PRD §9 F-15.
 *
 * Diaudit karena penulisannya adalah salah satu dari dua tindakan yang
 * boleh dilakukan pemegang izin (yang satu lagi: membaca hasil, dicatat
 * lewat aksi `accessed` di HealthWorkerAccessController).
 */
#[Fillable(['consent_id', 'health_worker_id', 'risk_assessment_id', 'body'])]
class HealthWorkerNote extends Model
{
    use Auditable;

    public function consent(): BelongsTo
    {
        return $this->belongsTo(HealthWorkerConsent::class, 'consent_id');
    }

    public function healthWorker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'health_worker_id');
    }

    public function riskAssessment(): BelongsTo
    {
        return $this->belongsTo(RiskAssessment::class);
    }
}
