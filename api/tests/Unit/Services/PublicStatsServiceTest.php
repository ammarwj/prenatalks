<?php

namespace Tests\Unit\Services;

use App\Services\PublicStatsService;
use PHPUnit\Framework\TestCase;

class PublicStatsServiceTest extends TestCase
{
    private PublicStatsService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PublicStatsService;
    }

    public function test_small_numbers_are_shown_as_is(): void
    {
        $this->assertSame('0', $this->service->display(0));
        $this->assertSame('4', $this->service->display(4));
        $this->assertSame('9', $this->service->display(9));
    }

    public function test_numbers_are_rounded_down_to_the_nearest_step(): void
    {
        $this->assertSame('10+', $this->service->display(10));
        $this->assertSame('40+', $this->service->display(42));
        $this->assertSame('200+', $this->service->display(213));
        $this->assertSame('1.000+', $this->service->display(1024));
        $this->assertSame('12.000+', $this->service->display(12345));
    }

    /**
     * Inti aturannya: angka yang tampil tidak boleh lebih besar dari angka
     * sebenarnya. Ini yang membedakannya dari "1000+" karangan yang dulu
     * ditulis mati di komponen landing.
     */
    public function test_display_never_overstates_the_real_value(): void
    {
        foreach ([1, 9, 10, 19, 99, 100, 101, 999, 1000, 1001, 9999] as $value) {
            $shown = (int) str_replace(['.', '+'], '', $this->service->display($value));

            $this->assertLessThanOrEqual($value, $shown, "display({$value}) melebihi nilai asli");
        }
    }
}
