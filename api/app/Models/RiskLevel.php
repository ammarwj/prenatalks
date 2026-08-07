<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['questionnaire_id', 'name', 'min_score', 'max_score', 'color_hex', 'recommendation', 'order_index'])]
class RiskLevel extends Model
{
    public function questionnaire(): BelongsTo
    {
        return $this->belongsTo(Questionnaire::class);
    }

    public function coversScore(int $score): bool
    {
        return $score >= $this->min_score && ($this->max_score === null || $score <= $this->max_score);
    }
}
