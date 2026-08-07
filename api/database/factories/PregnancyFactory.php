<?php

namespace Database\Factories;

use App\Models\Pregnancy;
use App\Models\User;
use App\Services\PregnancyCalculator;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pregnancy>
 */
class PregnancyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $lmpDate = CarbonImmutable::instance(fake()->dateTimeBetween('-250 days', '-10 days'));

        return [
            'user_id' => User::factory(),
            'lmp_date' => $lmpDate->toDateString(),
            'edd_date' => (new PregnancyCalculator)->estimatedDueDate($lmpDate)->toDateString(),
            'edd_overridden' => false,
            'gravida' => fake()->numberBetween(1, 4),
            'para' => fake()->numberBetween(0, 3),
            'abortus' => 0,
            'blood_type' => fake()->randomElement(['A+', 'B+', 'AB+', 'O+']),
            'medical_history' => [],
            'status' => 'active',
        ];
    }
}
