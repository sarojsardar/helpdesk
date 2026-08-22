<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TicketFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title'       => fake()->sentence(6),
            'description' => fake()->paragraph(),
            'priority'    => fake()->randomElement(['low', 'medium', 'high', 'critical']),
            'status'      => 'open',
            'user_id'     => User::factory(),
        ];
    }
}
