<?php

namespace Tests\Unit\Http\Controllers;

use App\Http\Controllers\MethodologyController;
use App\Models\Methodology;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Mockery;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class MethodologyControllerTest extends TestCase
{
    use RefreshDatabase;
    
    protected $methodologyController;
    protected $user;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock Inertia facade
        // Create a better Inertia mock that returns an InertiaResponse
        $inertiaMock = Mockery::mock('overload:Inertia\Inertia');
        $inertiaMock->shouldReceive('render')->andReturnUsing(function ($component, $props = []) {
            $responseMock = Mockery::mock(InertiaResponse::class);
            $responseMock->shouldReceive('getStatusCode')->andReturn(200);
            return $responseMock;
        });
        
        // Create the controller
        $this->methodologyController = new MethodologyController();
        
        // Create a user and set as authenticated
        $this->user = User::factory()->create();
        Auth::shouldReceive('id')->andReturn($this->user->id);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function index_method_displays_methodologies_list()
    {
        // Mock request
        $request = new Request();
        
        // Create test data
        $methodologies = Methodology::factory()->count(3)->create([
            'created_by' => $this->user->id
        ]);
        
        // Execute the controller method
        $response = $this->methodologyController->index($request);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    /** @test */
    public function store_method_creates_new_methodology()
    {
        // Setup request data
        $data = [
            'name' => 'Test Methodology',
            'description' => 'Test methodology description',
            'category' => 'web'
        ];
        
        $request = new Request($data);
        
        // Execute the controller method
        $response = $this->methodologyController->store($request);
        
        // Assert the response
        $this->assertEquals(201, $response->getStatusCode()); // Created status code
        
        // Assert the methodology was created in the database
        $this->assertDatabaseHas('methodologies', [
            'name' => 'Test Methodology',
            'description' => 'Test methodology description',
            'category' => 'web',
            'created_by' => $this->user->id
        ]);
    }

    /** @test */
    public function show_method_displays_methodology_details()
    {
        // Create test data
        $methodology = Methodology::factory()->create([
            'created_by' => $this->user->id
        ]);
        
        // Execute the controller method
        $response = $this->methodologyController->show($methodology);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
        
        // Convert JSON response to array
        $responseData = json_decode($response->getContent(), true);
        
        // Assert the methodology details are returned
        $this->assertEquals($methodology->id, $responseData['id']);
        $this->assertEquals($methodology->name, $responseData['name']);
    }

    /** @test */
    public function update_method_updates_methodology()
    {
        // Create test data
        $methodology = Methodology::factory()->create([
            'name' => 'Original Methodology',
            'description' => 'Original description',
            'category' => 'mobile',
            'created_by' => $this->user->id
        ]);
        
        // Setup request data
        $data = [
            'name' => 'Updated Methodology',
            'description' => 'Updated description',
            'category' => 'web'
        ];
        
        $request = new Request($data);
        
        // Execute the controller method
        $response = $this->methodologyController->update($request, $methodology);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
        
        // Assert the methodology was updated in the database
        $this->assertDatabaseHas('methodologies', [
            'id' => $methodology->id,
            'name' => 'Updated Methodology',
            'description' => 'Updated description',
            'category' => 'web'
        ]);
    }

    /** @test */
    public function destroy_method_deletes_methodology()
    {
        // Create test data
        $methodology = Methodology::factory()->create([
            'created_by' => $this->user->id
        ]);
        
        // Execute the controller method
        $response = $this->methodologyController->destroy($methodology);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
        
        // Assert the methodology was deleted from the database
        $this->assertDatabaseMissing('methodologies', [
            'id' => $methodology->id
        ]);
    }
} 