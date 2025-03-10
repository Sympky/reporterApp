<?php

namespace Tests\Unit\Http\Controllers;

use App\Http\Controllers\ClientController;
use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Mockery;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ClientControllerTest extends TestCase
{
    use RefreshDatabase;
    
    protected $clientController;
    protected $user;
    
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
        $this->clientController = new ClientController();
        
        // Create a user and set as authenticated
        $this->user = User::factory()->create();
        Auth::shouldReceive('id')->andReturn($this->user->id);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    #[Test]
    public function index_method_displays_clients_list()
    {
        // Execute the controller method
        $response = $this->clientController->index();
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    #[Test]
    public function create_method_returns_form_view()
    {
        // Execute the controller method
        $response = $this->clientController->create();
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    #[Test]
    public function store_method_creates_new_client()
    {
        // Setup request data
        $data = [
            'name' => 'Test Client',
            'contact_name' => 'John Doe',
            'contact_email' => 'john@example.com',
            'contact_phone' => '123-456-7890',
            'address' => '123 Main St',
            'notes' => 'Test notes'
        ];
        
        $request = new Request($data);
        
        // Mock validation to pass
        $request->shouldReceive('validate')->andReturn($data);
        
        // Execute the controller method
        $response = $this->clientController->store($request);
        
        // Assert the response
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
        
        // Assert the client was created in the database with appropriate fields
        $this->assertDatabaseHas('clients', [
            'name' => 'Test Client'
        ]);
    }

    #[Test]
    public function show_method_displays_client_details()
    {
        // Create test data
        $client = Client::factory()->create([
            'created_by' => $this->user->id
        ]);
        
        // Create request
        $request = new Request();
        $request->shouldReceive('expectsJson')->andReturn(true);
        
        // Execute the controller method
        $response = $this->clientController->show($request, $client);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    #[Test]
    public function edit_method_returns_edit_form()
    {
        // Create test data
        $client = Client::factory()->create([
            'created_by' => $this->user->id
        ]);
        
        // Execute the controller method
        $response = $this->clientController->edit($client);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    #[Test]
    public function update_method_updates_client()
    {
        // Create test data
        $client = Client::factory()->create([
            'name' => 'Original Name',
            'created_by' => $this->user->id
        ]);
        
        // Setup request data
        $data = [
            'name' => 'Updated Client',
            'contact_name' => 'Jane Doe',
            'contact_email' => 'jane@example.com'
        ];
        
        $request = new Request($data);
        
        // Mock validation to pass
        $request->shouldReceive('validate')->andReturn($data);
        
        // Execute the controller method
        $response = $this->clientController->update($request, $client);
        
        // Assert the response
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
        
        // Assert the client was updated in the database
        $this->assertDatabaseHas('clients', [
            'id' => $client->id,
            'name' => 'Updated Client'
        ]);
    }

    #[Test]
    public function destroy_method_deletes_client()
    {
        // Create test data
        $client = Client::factory()->create([
            'created_by' => $this->user->id
        ]);
        
        // Create request
        $request = new Request();
        
        // Mock client->projects()->count() to return 0
        $projectsRelation = Mockery::mock();
        $projectsRelation->shouldReceive('count')->andReturn(0);
        $client->shouldReceive('projects')->andReturn($projectsRelation);
        
        // Execute the controller method
        $response = $this->clientController->destroy($request, $client);
        
        // Assert the response
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
    }
} 