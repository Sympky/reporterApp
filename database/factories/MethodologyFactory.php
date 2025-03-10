<?php

namespace Database\Factories;

use App\Models\Methodology;
use Illuminate\Database\Eloquent\Factories\Factory;

class MethodologyFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Methodology::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = ['web', 'network', 'mobile', 'cloud', 'iot', 'api'];
        
        return [
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->text(150),
            'category' => $this->faker->randomElement($categories),
            'created_by' => 1,
            'updated_by' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
} 