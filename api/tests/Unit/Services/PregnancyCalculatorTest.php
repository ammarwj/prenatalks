<?php

namespace Tests\Unit\Services;

use App\Services\PregnancyCalculator;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class PregnancyCalculatorTest extends TestCase
{
    private PregnancyCalculator $calculator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->calculator = new PregnancyCalculator;
    }

    public function test_naegele_rule_matches_prd_example(): void
    {
        $result = $this->calculator->calculate(CarbonImmutable::parse('2026-01-15'));

        $this->assertSame('2026-10-22', $result['edd_date']);
    }

    public function test_counts_the_extra_day_in_a_leap_year_february(): void
    {
        // 2024 kabisat: Februari punya 29 hari.
        $result = $this->calculator->calculate(
            CarbonImmutable::parse('2024-02-01'),
            CarbonImmutable::parse('2024-03-01'),
        );

        $this->assertSame(29, $result['gestational_age']['weeks'] * 7 + $result['gestational_age']['days']);
        $this->assertSame(4, $result['gestational_age']['weeks']);
        $this->assertSame(1, $result['gestational_age']['days']);
    }

    public function test_does_not_count_a_phantom_day_in_a_non_leap_year_february(): void
    {
        // 2023 bukan kabisat: Februari cuma 28 hari — hasil harus beda satu hari dari kasus kabisat.
        $result = $this->calculator->calculate(
            CarbonImmutable::parse('2023-02-01'),
            CarbonImmutable::parse('2023-03-01'),
        );

        $this->assertSame(28, $result['gestational_age']['weeks'] * 7 + $result['gestational_age']['days']);
        $this->assertSame(4, $result['gestational_age']['weeks']);
        $this->assertSame(0, $result['gestational_age']['days']);
    }

    public function test_edd_calculation_uses_the_leap_day_when_adding_seven_days(): void
    {
        // 22 Feb 2028 (kabisat) + 7 hari mendarat di 29 Feb — tanpa hari kabisat
        // ini akan meluber ke bulan Maret dan mengubah hasil akhirnya.
        $result = $this->calculator->calculate(CarbonImmutable::parse('2028-02-22'));

        $this->assertSame('2028-11-29', $result['edd_date']);
    }

    public function test_gestational_age_correctly_crosses_the_new_year(): void
    {
        $result = $this->calculator->calculate(
            CarbonImmutable::parse('2025-12-20'),
            CarbonImmutable::parse('2026-01-05'),
        );

        $this->assertSame(2, $result['gestational_age']['weeks']);
        $this->assertSame(2, $result['gestational_age']['days']);
        $this->assertSame('2026-09-27', $result['edd_date']);
    }

    public function test_edd_calculation_crosses_the_new_year_boundary_downward(): void
    {
        // HPHT + 7 hari − 3 bulan turun ke tahun sebelumnya, lalu + 1 tahun kembali maju.
        $result = $this->calculator->calculate(CarbonImmutable::parse('2026-01-01'));

        $this->assertSame('2026-10-08', $result['edd_date']);
    }

    #[DataProvider('trimesterBoundaryProvider')]
    public function test_trimester_boundaries(int $weeksElapsed, int $expectedTrimester): void
    {
        $lmpDate = CarbonImmutable::parse('2026-01-01');
        $today = $lmpDate->addWeeks($weeksElapsed);

        $result = $this->calculator->calculate($lmpDate, $today);

        $this->assertSame($expectedTrimester, $result['trimester']);
    }

    /**
     * @return array<string, array{0: int, 1: int}>
     */
    public static function trimesterBoundaryProvider(): array
    {
        return [
            'week 0 is trimester 1' => [0, 1],
            'week 13 is still trimester 1' => [13, 1],
            'week 14 is trimester 2' => [14, 2],
            'week 27 is still trimester 2' => [27, 2],
            'week 28 is trimester 3' => [28, 3],
            'week 42 is still trimester 3' => [42, 3],
        ];
    }

    public function test_progress_percent_is_capped_at_100_when_overdue(): void
    {
        $lmpDate = CarbonImmutable::parse('2026-01-01');
        $today = $lmpDate->addDays(300);

        $result = $this->calculator->calculate($lmpDate, $today);

        $this->assertSame(100, $result['progress_percent']);
        $this->assertSame(0, $result['days_remaining']);
    }

    public function test_days_remaining_counts_down_to_the_due_date(): void
    {
        $lmpDate = CarbonImmutable::parse('2026-01-01');
        $today = $lmpDate->addDays(200);

        $result = $this->calculator->calculate($lmpDate, $today);

        $this->assertSame(80, $result['days_remaining']);
    }
}
