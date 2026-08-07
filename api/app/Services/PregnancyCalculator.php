<?php

namespace App\Services;

use Carbon\CarbonImmutable;

/**
 * Perhitungan usia kehamilan & HPL — rumus Naegele: HPHT + 7 hari − 3 bulan + 1 tahun (PRD §9 F-04).
 * Dipakai baik untuk mengisi `edd_date` saat data kehamilan disimpan (F-03)
 * maupun endpoint kalkulator publik `POST /calculator` (F-04).
 */
class PregnancyCalculator
{
    /** Lama kehamilan penuh menurut siklus 28 hari (40 minggu). */
    private const FULL_TERM_DAYS = 280;

    public function estimatedDueDate(CarbonImmutable $lastMenstrualPeriod): CarbonImmutable
    {
        return $lastMenstrualPeriod
            ->addDays(7)
            ->subMonths(3)
            ->addYear();
    }

    /**
     * @return array<string, mixed>
     */
    public function calculate(CarbonImmutable $lmpDate, ?CarbonImmutable $referenceDate = null): array
    {
        $lmpDate = $lmpDate->startOfDay();
        $today = ($referenceDate ?? CarbonImmutable::today())->startOfDay();
        $eddDate = $this->estimatedDueDate($lmpDate);

        $elapsedDays = max(0, (int) $lmpDate->diffInDays($today, false));
        $weeks = intdiv($elapsedDays, 7);
        $days = $elapsedDays % 7;

        return [
            'gestational_age' => [
                'weeks' => $weeks,
                'days' => $days,
                'text' => "{$weeks} minggu {$days} hari",
            ],
            'edd_date' => $eddDate->toDateString(),
            'trimester' => $this->trimesterFor($weeks),
            'days_remaining' => max(0, (int) $today->diffInDays($eddDate, false)),
            'progress_percent' => (int) round(min(100, $elapsedDays / self::FULL_TERM_DAYS * 100)),
        ];
    }

    private function trimesterFor(int $weeks): int
    {
        return match (true) {
            $weeks < 14 => 1,
            $weeks < 28 => 2,
            default => 3,
        };
    }
}
