<?php

namespace Tests\Feature;

use Illuminate\Support\Carbon;
use Tests\TestCase;

class CalculatorTest extends TestCase
{
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
                'trimester',
                'days_remaining',
                'progress_percent',
            ],
        ]);
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
