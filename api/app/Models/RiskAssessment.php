<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'pregnancy_id',
    'questionnaire_id',
    'questionnaire_version',
    'total_score',
    'risk_level_id',
    'has_danger_sign',
    'status',
    'completed_at',
])]
class RiskAssessment extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'has_danger_sign' => 'boolean',
            'completed_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pregnancy(): BelongsTo
    {
        return $this->belongsTo(Pregnancy::class);
    }

    public function questionnaire(): BelongsTo
    {
        return $this->belongsTo(Questionnaire::class);
    }

    public function riskLevel(): BelongsTo
    {
        return $this->belongsTo(RiskLevel::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(RiskAnswer::class, 'assessment_id');
    }
}
