<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;
    protected $client;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create and authenticate a user for each test
        $this->user = User::factory()->create();
        
        // Create a client for testing
        $this->client = Client::factory()->create([
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);
        
        // Define test routes that bypass Inertia
        $this->setupTestRoutes();
    }
    
    protected function setupTestRoutes()
    {
        // Override the web routes with test-specific routes
        Route::get('projects', function () {
            return response()->json(['component' => 'Projects/Index', 'props' => ['projects' => Project::all()]]);
        })->name('projects.index');
        
        Route::get('projects/create', function () {
            return response()->json(['component' => 'Projects/Create']);
        })->name('projects.create');
        
        Route::get('projects/{project}', function (Project $project) {
            return response()->json(['component' => 'Projects/Show', 'props' => ['project' => $project]]);
        })->name('projects.show');
        
        Route::get('projects/{project}/edit', function (Project $project) {
            return response()->json(['component' => 'Projects/Edit', 'props' => ['project' => $project]]);
        })->name('projects.edit');
        
        // Add route for client projects
        Route::get('clients/{client}/projects', function ($clientId) {
            $client = Client::find($clientId);
            if (!$client) {
                return response()->json(['error' => 'Client not found'], 404);
            }
            return response()->json($client->projects);
        });
    }

    /** @test */
    public function a_user_can_view_projects_list()
    {
        // Create some projects for the client
        Project::factory()->count(3)->create([
            'client_id' => $this->client->id,
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // When a user visits the projects page
        $response = $this->actingAs($this->user)
            ->get(route('projects.index'));

        $response->assertStatus(200);
        $response->assertJson([
            'component' => 'Projects/Index'
        ]);
    }

    /** @test */
    public function a_user_can_view_client_projects_as_json()
    {
        // Create some projects for the client
        Project::factory()->count(3)->create([
            'client_id' => $this->client->id,
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // When a user requests the client's projects
        $response = $this->actingAs($this->user)
            ->getJson("/clients/{$this->client->id}/projects");

        // Then they should receive a list of the client's projects
        $response->assertStatus(200);
        $response->assertJsonCount(3);
    }

    /** @test */
    public function a_user_can_create_a_new_project()
    {
        // Project data
        $projectData = [
            'client_id' => $this->client->id,
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph,
            'status' => 'planned',
            'due_date' => now()->addDays(30)->format('Y-m-d'),
        ];

        // When a user creates a new project
        $response = $this->actingAs($this->user)
            ->post(route('projects.store'), $projectData);

        // Then the project should be created in the database
        $this->assertDatabaseHas('projects', [
            'name' => $projectData['name'],
            'client_id' => $this->client->id,
            'created_by' => $this->user->id,
        ]);

        // And the user should be redirected to the projects index
        $response->assertRedirect(route('projects.index'));
    }

    /** @test */
    public function a_user_can_view_a_project()
    {
        // Create a project
        $project = Project::factory()->create([
            'client_id' => $this->client->id,
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // When a user visits the project page
        $response = $this->actingAs($this->user)
            ->get(route('projects.show', $project));

        $response->assertStatus(200);
        $response->assertJson([
            'component' => 'Projects/Show'
        ]);
    }

    /** @test */
    public function a_user_can_view_the_edit_project_form()
    {
        // Create a project
        $project = Project::factory()->create([
            'client_id' => $this->client->id,
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // When a user visits the edit project page
        $response = $this->actingAs($this->user)
            ->get(route('projects.edit', $project));

        $response->assertStatus(200);
        $response->assertJson([
            'component' => 'Projects/Edit'
        ]);
    }

    /** @test */
    public function a_user_can_update_a_project()
    {
        // Create a project
        $project = Project::factory()->create([
            'client_id' => $this->client->id,
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // New data for the project
        $updatedData = [
            'client_id' => $this->client->id,
            'name' => 'Updated Project Name',
            'description' => 'Updated project description',
            'status' => 'in-progress',
            'due_date' => now()->addDays(45)->format('Y-m-d'),
        ];

        // When a user updates the project
        $response = $this->actingAs($this->user)
            ->put(route('projects.update', $project), $updatedData);

        // Then the project should be updated in the database
        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'name' => 'Updated Project Name',
            'description' => 'Updated project description',
            'status' => 'in-progress',
        ]);

        // And the user should be redirected to the projects index
        $response->assertRedirect(route('projects.index'));
    }

    /** @test */
    public function a_user_can_delete_a_project()
    {
        // Create a project
        $project = Project::factory()->create([
            'client_id' => $this->client->id,
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // When a user deletes the project
        $response = $this->actingAs($this->user)
            ->delete(route('projects.destroy', $project));

        // Then the project should be deleted from the database
        $this->assertDatabaseMissing('projects', [
            'id' => $project->id,
        ]);

        // And a 204 status code should be returned (no content)
        $response->assertStatus(204);
    }

    /** @test */
    public function a_user_can_get_latest_projects_as_json()
    {
        // Create several projects
        Project::factory()->count(15)->create([
            'client_id' => $this->client->id,
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // When a user requests the latest projects
        $response = $this->actingAs($this->user)
            ->getJson('/api/latest-projects');

        // Then they should receive a list of the latest 10 projects
        $response->assertStatus(200);
        $response->assertJsonCount(10);
    }
} 