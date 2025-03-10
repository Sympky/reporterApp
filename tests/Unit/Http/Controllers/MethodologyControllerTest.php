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

    #[Test]
    public function index_method_displays_methodologies_list()
    {
        // Create test data
        $methodologies = Methodology::factory()->count(3)->create([
            'created_by' => $this->user->id
        ]);
        
        // Execute the controller method
        $response = $this->methodologyController->index();
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    #[Test]
    public function store_method_creates_new_methodology()
    {
        // Setup request data
        $data = [
            'title' => 'Test Methodology',
            'content' => 'Test methodology content',
        ];
        
        $request = new Request($data);
        
        // Execute the controller method
        $response = $this->methodologyController->store($request);
        
        // Assert the response
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
        
        // Assert the methodology was created in the database
        $this->assertDatabaseHas('methodologies', [
            'title' => 'Test Methodology',
            'content' => 'Test methodology content',
            'created_by' => $this->user->id
        ]);
    }

    #[Test]
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
    }

    #[Test]
    public function update_method_updates_methodology()
    {
        // Create test data
        $methodology = Methodology::factory()->create([
            'title' => 'Original Methodology',
            'content' => 'Original content',
            'created_by' => $this->user->id
        ]);
        
        // Setup request data
        $data = [
            'title' => 'Updated Methodology',
            'content' => 'Updated content'
        ];
        
        $request = new Request($data);
        
        // Execute the controller method
        $response = $this->methodologyController->update($request, $methodology);
        
        // Assert the response
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
        
        // Assert the methodology was updated in the database
        $this->assertDatabaseHas('methodologies', [
            'id' => $methodology->id,
            'title' => 'Updated Methodology',
            'content' => 'Updated content'
        ]);
    }

    #[Test]
    public function destroy_method_deletes_methodology()
    {
        // Create test data
        $methodology = Methodology::factory()->create([
            'created_by' => $this->user->id
        ]);
        
        $methodologyId = $methodology->id;
        
        // Execute the controller method
        $response = $this->methodologyController->destroy($methodology);
        
        // Assert the response
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
        
        // Assert the methodology was deleted from the database
        $this->assertDatabaseMissing('methodologies', [
            'id' => $methodologyId
        ]);
    }
} 