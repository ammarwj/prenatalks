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

    /**
     * Penanda usia kehamilan yang ditampilkan sebagai lini masa tanggal penting.
     * Minggu 40 sengaja tidak ada di sini — entri HPL memakai `edd_date`
     * sesungguhnya supaya tetap benar saat HPL ditimpa manual dari USG.
     *
     * @var list<array{key: string, label: string, week: int}>
     */
    private const MILESTONES = [
        ['key' => 'trimester_2', 'label' => 'Mulai Trimester 2', 'week' => 14],
        ['key' => 'viability', 'label' => 'Usia viabilitas', 'week' => 24],
        ['key' => 'trimester_3', 'label' => 'Mulai Trimester 3', 'week' => 28],
        ['key' => 'term', 'label' => 'Cukup bulan (aterm)', 'week' => 37],
    ];

    public function estimatedDueDate(CarbonImmutable $lastMenstrualPeriod): CarbonImmutable
    {
        return $lastMenstrualPeriod
            ->addDays(7)
            ->subMonths(3)
            ->addYear();
    }

    /**
     * @param  CarbonImmutable|null  $overrideEdd  HPL yang ditimpa manual (mis. dari USG).
     *                                             Bila diisi, dipakai menggantikan hasil Naegele
     *                                             untuk `edd_date`, `days_remaining`, dan lini masa.
     * @return array<string, mixed>
     */
    public function calculate(
        CarbonImmutable $lmpDate,
        ?CarbonImmutable $referenceDate = null,
        ?CarbonImmutable $overrideEdd = null,
    ): array {
        $lmpDate = $lmpDate->startOfDay();
        $today = ($referenceDate ?? CarbonImmutable::today())->startOfDay();
        $eddDate = ($overrideEdd ?? $this->estimatedDueDate($lmpDate))->startOfDay();

        $elapsedDays = max(0, (int) $lmpDate->diffInDays($today, false));
        $weeks = intdiv($elapsedDays, 7);
        $days = $elapsedDays % 7;

        // Selisih bertanda: positif = belum sampai HPL, negatif = sudah lewat.
        $daysToEdd = (int) $today->diffInDays($eddDate, false);

        return [
            'gestational_age' => [
                'weeks' => $weeks,
                'days' => $days,
                'text' => "{$weeks} minggu {$days} hari",
            ],
            'edd_date' => $eddDate->toDateString(),
            'edd_overridden' => $overrideEdd !== null,
            'trimester' => $this->trimesterFor($weeks),
            'days_remaining' => max(0, $daysToEdd),
            'days_past_due' => max(0, -$daysToEdd),
            'progress_percent' => (int) round(min(100, $elapsedDays / self::FULL_TERM_DAYS * 100)),
            'milestones' => $this->milestones($lmpDate, $eddDate, $today),
        ];
    }

    /**
     * Lini masa tanggal penting kehamilan (PRD §9 F-04 — progres per trimester).
     *
     * @return list<array{key: string, label: string, week: int, date: string, passed: bool}>
     */
    private function milestones(
        CarbonImmutable $lmpDate,
        CarbonImmutable $eddDate,
        CarbonImmutable $today,
    ): array {
        $milestones = [];

        foreach (self::MILESTONES as $milestone) {
            $date = $lmpDate->addWeeks($milestone['week']);

            $milestones[] = [
                ...$milestone,
                'date' => $date->toDateString(),
                'passed' => $date->lessThanOrEqualTo($today),
            ];
        }

        $milestones[] = [
            'key' => 'edd',
            'label' => 'Perkiraan lahir (HPL)',
            'week' => 40,
            'date' => $eddDate->toDateString(),
            'passed' => $eddDate->lessThanOrEqualTo($today),
        ];

        return $milestones;
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
