<?php

namespace App\Services;

use App\Models\RiskAssessment;

/**
 * Skor & klasifikasi risiko — PRD §9 F-05.
 */
class RiskScoringService
{
    /**
     * Skor awal yang melekat pada setiap ibu hamil (Lampiran A: "Skor awal — Setiap
     * ibu hamil — 2"), bukan pertanyaan yang dijawab, jadi ditambahkan di sini
     * alih-alih dimodelkan sebagai Question tanpa pilihan nyata.
     */
    public const BASE_SCORE = 2;

    /**
     * Menghitung ulang total_score, has_danger_sign, dan risk_level_id dari
     * jawaban yang sudah tersimpan. Tidak menyimpan — pemanggil yang memutuskan
     * kapan persis harus di-save (submit() vs pratinjau berjalan).
     */
    public function score(RiskAssessment $assessment): RiskAssessment
    {
        $assessment->loadMissing(['answers.option', 'questionnaire.riskLevels']);

        $totalScore = self::BASE_SCORE + (int) $assessment->answers->sum('score');
        $hasDangerSign = $assessment->answers->contains(
            fn ($answer) => (bool) ($answer->option?->is_danger_sign)
        );

        $riskLevel = $assessment->questionnaire->riskLevels
            ->first(fn ($level) => $level->coversScore($totalScore));

        $assessment->total_score = $totalScore;
        $assessment->has_danger_sign = $hasDangerSign;
        $assessment->risk_level_id = $riskLevel?->id;

        return $assessment;
    }
}
