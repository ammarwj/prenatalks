<?php

namespace App\Traits;

use App\Services\AuditRecorder;
use Illuminate\Database\Eloquent\Model;

/**
 * Mencatat create/update/delete model ke `audit_logs` — PRD §9 F-14.
 *
 * Dipasang pada model yang memang dikelola dari panel admin. Model anak yang
 * dibuat massal bersama induknya (mis. `questions`/`question_options` saat
 * menyimpan kuesioner) sengaja tidak diaudit: satu penyuntingan kuesioner
 * akan menghasilkan puluhan baris yang menenggelamkan kejadian pentingnya.
 *
 * Model boleh meng-override `auditIgnore()` untuk kolom yang berubah rutin
 * dan tidak bernilai sebagai jejak (mis. `last_login_at`).
 */
trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function (Model $model) {
            AuditRecorder::record('created', $model, AuditRecorder::snapshot($model, $model->auditIgnore()));
        });

        static::updated(function (Model $model) {
            $changes = AuditRecorder::diff($model, $model->auditIgnore());

            // Seluruh perubahan masuk daftar abaikan — tidak ada yang perlu dicatat.
            if ($changes === null) {
                return;
            }

            AuditRecorder::record('updated', $model, $changes);
        });

        static::deleted(function (Model $model) {
            AuditRecorder::record('deleted', $model, AuditRecorder::snapshot($model, $model->auditIgnore()));
        });
    }

    /**
     * Kolom yang tidak ikut dicatat. Override di model bila perlu.
     *
     * @return list<string>
     */
    public function auditIgnore(): array
    {
        return [];
    }
}
