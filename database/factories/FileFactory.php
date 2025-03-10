<?php

namespace Database\Factories;

use App\Models\File;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class FileFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = File::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fileTypes = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png'];
        $extension = $this->faker->randomElement($fileTypes);
        $originalFilename = $this->faker->word . '.' . $extension;
        $uniqueId = Str::uuid()->toString();
        
        return [
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->text(100),
            'original_name' => $originalFilename,
            'path' => 'files/' . $uniqueId . '.' . $extension,
            'size' => $this->faker->numberBetween(1000, 10000000),
            'mime_type' => $this->getMimeType($extension),
            'fileable_type' => 'project', // Default type
            'fileable_id' => 1,           // Default ID
            'uploaded_by' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
    
    /**
     * Get the mime type for a given file extension.
     *
     * @param string $extension
     * @return string
     */
    private function getMimeType(string $extension): string
    {
        return match($extension) {
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt' => 'text/plain',
            'jpg' => 'image/jpeg',
            'png' => 'image/png',
            default => 'application/octet-stream',
        };
    }
} 