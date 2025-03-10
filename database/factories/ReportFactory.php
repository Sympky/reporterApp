<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Project;
use App\Models\ReportTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Report>
 */
class ReportFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(4),
            'executive_summary' => $this->faker->text(200), // Limit text length
            'client_id' => Client::factory(),
            'project_id' => Project::factory(),
            'report_template_id' => ReportTemplate::factory(),
            'status' => $this->faker->randomElement(['draft', 'in_progress', 'completed']),
            'generate_from_scratch' => false,
            'generated_file_path' => null,
            'created_by' => 1,
            'updated_by' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
} 