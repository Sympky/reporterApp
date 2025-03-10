<?php

namespace Database\Factories;

use App\Models\Note;
use Illuminate\Database\Eloquent\Factories\Factory;

class NoteFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Note::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'content' => $this->faker->paragraphs(2, true),
            'notable_type' => 'project', // Default type
            'notable_id' => 1,           // Default ID
            'created_by' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
} 