<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Client>
 */
class ClientFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'description' => fake()->realText(),
            'emails' => json_encode(fake()->randomElements([
                fake()->unique()->safeEmail(),
                fake()->unique()->safeEmail(), 
                fake()->unique()->safeEmail(),
                fake()->unique()->safeEmail(),
                fake()->unique()->safeEmail()
            ], fake()->numberBetween(1, 3))),
            'phone_numbers' => json_encode(fake()->randomElements([
                fake()->phoneNumber(),
                fake()->phoneNumber(),
                fake()->phoneNumber()
            ], fake()->numberBetween(1, 3))),
            'addresses' => fake()->address(),
            'website_urls' => fake()->url(),
            'other_contact_info' => json_encode([
                'skype' => fake()->userName(),
                'telegram' => fake()->userName(),
                'whatsapp' => fake()->phoneNumber()
            ]),
            'created_by' => 1,
            'updated_by' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
