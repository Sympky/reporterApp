<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Client;
use App\Models\Project;
use App\Models\Vulnerability;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'id' => 1,
            'name' => 'supermario',
            'email' => 'supermario@me.com',
            'password' => bcrypt('S3cur1ty!'),
            'email_verified_at' => time()
        ]);

        // Create 30 clients, each with 30 projects
        Client::factory()
            ->count(10) 
            ->has(
                Project::factory()
                    ->count(rand(1, 3)) 
                    ->has(
                        Vulnerability::factory()
                            ->count(rand(3, 5)) 
                    )
            )
            ->create();
    }
}
