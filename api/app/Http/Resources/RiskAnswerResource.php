<?php

namespace App\Http\Resources;

use App\Models\RiskAnswer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Dipakai untuk "rincian faktor penyumbang skor" di halaman hasil (PRD §9 F-05) —
 * di sinilah skor & status tanda bahaya per jawaban baru terbuka ke pengguna.
 *
 * @mixin RiskAnswer
 */
class RiskAnswerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'question_text' => $this->question?->text,
            'group_label' => $this->question?->group_label,
            'answer_label' => $this->option?->label ?? $this->value_number ?? $this->value_text,
            'score' => $this->score,
            'is_danger_sign' => (bool) $this->option?->is_danger_sign,
        ];
    }
}
