<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class CalculatorTest extends TestCase
{
    // Endpoint ini murni perhitungan, tapi middleware throttle-nya menulis ke
    // cache store berbasis database — tanpa migrasi, tabel `cache` tidak ada.
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_calculator_returns_gestational_age_edd_trimester_and_progress(): void
    {
        Carbon::setTestNow('2026-08-01');

        $response = $this->postJson('/api/v1/calculator', ['lmp_date' => '2026-01-15']);

        $response->assertOk()->assertJson([
            'success' => true,
            'data' => [
                'edd_date' => '2026-10-22',
                'trimester' => 3,
            ],
        ]);
        $response->assertJsonStructure([
            'data' => [
                'gestational_age' => ['weeks', 'days', 'text'],
                'edd_date',
                'edd_overridden',
                'trimester',
                'days_remaining',
                'days_past_due',
                'progress_percent',
                'milestones' => [['key', 'label', 'week', 'date', 'passed']],
            ],
        ]);
    }

    public function test_calculator_returns_the_pregnancy_milestone_timeline(): void
    {
        Carbon::setTestNow('2026-08-01');

        $response = $this->postJson('/api/v1/calculator', ['lmp_date' => '2026-01-15']);

        $milestones = $response->json('data.milestones');

        $this->assertSame(
            ['trimester_2', 'viability', 'trimester_3', 'term', 'edd'],
            array_column($milestones, 'key'),
        );
        $this->assertSame(
            $response->json('data.edd_date'),
            $milestones[4]['date'],
            'entri HPL harus memakai edd_date yang sama dengan hasil utama',
        );
    }

    public function test_calculator_is_throttled_to_thirty_requests_per_minute(): void
    {
        $payload = ['lmp_date' => now()->toDateString()];

        for ($attempt = 0; $attempt < 30; $attempt++) {
            $this->postJson('/api/v1/calculator', $payload)->assertOk();
        }

        $this->postJson('/api/v1/calculator', $payload)->assertStatus(429);
    }

    public function test_calculator_is_public_and_requires_no_authentication(): void
    {
        $response = $this->postJson('/api/v1/calculator', ['lmp_date' => now()->toDateString()]);

        $response->assertOk();
    }

    public function test_calculator_rejects_a_future_lmp_date(): void
    {
        $response = $this->postJson('/api/v1/calculator', [
            'lmp_date' => now()->addDay()->toDateString(),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('lmp_date');
    }

    public function test_calculator_rejects_an_lmp_date_more_than_300_days_ago(): void
    {
        $response = $this->postJson('/api/v1/calculator', [
            'lmp_date' => now()->subDays(301)->toDateString(),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('lmp_date');
    }

    public function test_calculator_rejects_a_missing_lmp_date(): void
    {
        $response = $this->postJson('/api/v1/calculator', []);

        $response->assertStatus(422)->assertJsonValidationErrors('lmp_date');
    }
}
