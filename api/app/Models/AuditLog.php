<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Jejak perubahan oleh admin — PRD §9 F-14, §10 (`audit_logs`).
 *
 * Baris audit tidak pernah disunting, jadi `updated_at` dimatikan; `created_at`
 * tetap dikelola Eloquent.
 */
#[Fillable(['user_id', 'action', 'model_type', 'model_id', 'changes', 'ip'])]
class AuditLog extends Model
{
    public const UPDATED_AT = null;

    /**
     * Label ramah untuk nama model, dipakai di panel admin. Kuncinya nama
     * kelas pendek supaya tidak bocor namespace ke antarmuka.
     *
     * @var array<string, string>
     */
    public const MODEL_LABELS = [
        'Article' => 'Artikel',
        'Video' => 'Video',
        'Faq' => 'FAQ',
        'Form' => 'Form & Survei',
        'Questionnaire' => 'Kuesioner Risiko',
        'ChecklistItem' => 'Item Checklist',
        'Setting' => 'Pengaturan',
        'User' => 'Pengguna',
    ];

    /** @var array<string, string> */
    public const ACTION_LABELS = [
        'created' => 'Dibuat',
        'updated' => 'Diubah',
        'deleted' => 'Dihapus',
    ];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
