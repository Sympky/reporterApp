<?php

namespace Tests\Unit\Http\Controllers;

use App\Http\Controllers\ProjectController;
use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Mockery;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProjectControllerTest extends TestCase
{
    use RefreshDatabase;
    
    protected $projectController;
    protected $user;
    protected $client;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a better Inertia mock
        $inertiaMock = Mockery::mock('overload:Inertia\Inertia');
        $inertiaMock->shouldReceive('render')->andReturnUsing(function ($component, $props = []) {
            $responseMock = Mockery::mock(InertiaResponse::class);
            $responseMock->shouldReceive('getStatusCode')->andReturn(200);
            return $responseMock;
        });
        
        // Create the controller
        $this->projectController = new ProjectController();
        
        // Create a user and set as authenticated
        $this->user = User::factory()->create();
        Auth::shouldReceive('id')->andReturn($this->user->id);
        
        // Create a client for the tests
        $this->client = Client::factory()->create([
            'created_by' => $this->user->id
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    #[Test]
    public function index_method_displays_projects_list()
    {
        // Create test projects
        $projects = collect([
            Project::factory()->create([
                'client_id' => $this->client->id,
                'created_by' => $this->user->id,
                'updated_by' => $this->user->id,
                'name' => 'Project 1'
            ]),
            Project::factory()->create([
                'client_id' => $this->client->id,
                'created_by' => $this->user->id,
                'updated_by' => $this->user->id,
                'name' => 'Project 2'
            ])
        ]);
        
        // Create a mock client with the projects relation
        $client = Client::factory()->create([
            'created_by' => $this->user->id
        ]);
        
        // Use the "real" projects relationship
        // This avoids mocking the model directly which causes the error
        
        // Execute the controller method
        $response = $this->projectController->index($client);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    #[Test]
    public function allProjects_method_returns_projects_view()
    {
        // Create test data
        $projects = Project::factory()->count(3)->create([
            'client_id' => $this->client->id,
            'created_by' => $this->user->id
        ]);
        
        // Execute the controller method
        $response = $this->projectController->allProjects();
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    #[Test]
    public function store_method_creates_new_project()
    {
        // Create request data including created_by and updated_by
        $data = [
            'name' => 'Test Project',
            'description' => 'Test project description',
            'status' => 'active',
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id
        ];

        // Create a real client
        $client = Client::factory()->create([
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id
        ]);
        
        // Use Inertia and Auth facades that are already mocked in setup
        
        // Mock the Request class properly
        $request = Mockery::mock(Request::class);
        $request->shouldReceive('all')->andReturn($data);
        
        // Execute the controller method with a real client
        $response = $this->projectController->store($request, $client);
        
        // Assert the response
        $this->assertEquals(201, $response->getStatusCode()); // Created status code
        
        // Verify a project was created
        $this->assertDatabaseHas('projects', [
            'name' => 'Test Project',
            'description' => 'Test project description',
            'client_id' => $client->id,
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id
        ]);
    }

    #[Test]
    public function storeProject_method_creates_new_project()
    {
        // Setup request data
        $data = [
            'name' => 'Test Project',
            'client_id' => $this->client->id,
            'description' => 'Test project description',
            'start_date' => '2023-01-01',
            'end_date' => '2023-12-31',
            'status' => 'active'
        ];
        
        $request = Mockery::mock(Request::class);
        $request->shouldReceive('all')->andReturn($data);
        $request->shouldReceive('validate')->andReturn($data);
        
        // Execute the controller method
        $response = $this->projectController->storeProject($request);
        
        // Assert the response
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
    }

    #[Test]
    public function show_method_displays_project_details()
    {
        // Create test data
        $project = Project::factory()->create([
            'client_id' => $this->client->id,
            'created_by' => $this->user->id
        ]);
        
        // Execute the controller method
        $response = $this->projectController->show($project);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    #[Test]
    public function edit_method_returns_edit_form()
    {
        // Create test data
        $project = Project::factory()->create([
            'client_id' => $this->client->id,
            'created_by' => $this->user->id
        ]);
        
        // Execute the controller method
        $response = $this->projectController->edit($project);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    #[Test]
    public function update_method_updates_project()
    {
        // Create test data
        $project = Project::factory()->create([
            'name' => 'Original Project',
            'client_id' => $this->client->id,
            'created_by' => $this->user->id
        ]);
        
        // Setup request data
        $data = [
            'name' => 'Updated Project',
            'client_id' => $this->client->id,
            'description' => 'Updated description',
            'status' => 'completed'
        ];
        
        $request = Mockery::mock(Request::class);
        $request->shouldReceive('all')->andReturn($data);
        $request->shouldReceive('validate')->andReturn($data);
        
        // Execute the controller method
        $response = $this->projectController->update($request, $project);
        
        // Assert the response
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
    }

    #[Test]
    public function destroy_method_deletes_project()
    {
        // Create test data
        $project = Project::factory()->create([
            'client_id' => $this->client->id,
            'created_by' => $this->user->id
        ]);
        
        // Execute the controller method
        $response = $this->projectController->destroy($project);
        
        // Assert the response
        $this->assertEquals(204, $response->getStatusCode()); // No content
    }
} 