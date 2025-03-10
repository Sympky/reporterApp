<?php

namespace Tests\Unit\Http\Controllers;

use App\Http\Controllers\NoteController;
use App\Models\Client;
use App\Models\Note;
use App\Models\Project;
use App\Models\User;
use App\Models\Vulnerability;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Mockery;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class NoteControllerTest extends TestCase
{
    use RefreshDatabase;
    
    protected $noteController;
    protected $user;
    protected $client;
    protected $project;
    protected $vulnerability;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // Create the controller
        $this->noteController = new NoteController();
        
        // Create a user and set as authenticated
        $this->user = User::factory()->create();
        Auth::shouldReceive('id')->andReturn($this->user->id);
        
        // Create client, project and vulnerability for the tests
        $this->client = Client::factory()->create([
            'created_by' => $this->user->id
        ]);
        
        $this->project = Project::factory()->create([
            'client_id' => $this->client->id,
            'created_by' => $this->user->id
        ]);
        
        $this->vulnerability = Vulnerability::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->user->id
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function index_method_returns_notes_for_a_specific_noteable()
    {
        // Create test data
        $note1 = Note::factory()->create([
            'noteable_type' => 'project',
            'noteable_id' => $this->project->id,
            'created_by' => $this->user->id
        ]);
        
        $note2 = Note::factory()->create([
            'noteable_type' => 'project',
            'noteable_id' => $this->project->id,
            'created_by' => $this->user->id
        ]);
        
        // Create request with noteable parameters
        $request = new Request([
            'noteable_type' => 'project',
            'noteable_id' => $this->project->id
        ]);
        
        // Execute the controller method
        $response = $this->noteController->index($request);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
        
        // Convert JSON response to array
        $responseData = json_decode($response->getContent(), true);
        
        // Assert that both notes are returned
        $this->assertCount(2, $responseData);
        $this->assertEquals($note1->id, $responseData[0]['id']);
        $this->assertEquals($note2->id, $responseData[1]['id']);
    }

    /** @test */
    public function store_method_creates_new_note()
    {
        // Setup request data
        $data = [
            'content' => 'This is a test note content',
            'noteable_type' => 'vulnerability',
            'noteable_id' => $this->vulnerability->id
        ];
        
        $request = new Request($data);
        
        // Execute the controller method
        $response = $this->noteController->store($request);
        
        // Assert the response
        $this->assertEquals(201, $response->getStatusCode()); // Created status code
        
        // Assert the note was created in the database
        $this->assertDatabaseHas('notes', [
            'content' => 'This is a test note content',
            'noteable_type' => 'vulnerability',
            'noteable_id' => $this->vulnerability->id,
            'created_by' => $this->user->id
        ]);
    }

    /** @test */
    public function update_method_updates_note()
    {
        // Create test data
        $note = Note::factory()->create([
            'content' => 'Original note content',
            'noteable_type' => 'client',
            'noteable_id' => $this->client->id,
            'created_by' => $this->user->id
        ]);
        
        // Setup request data
        $data = [
            'content' => 'Updated note content'
        ];
        
        $request = new Request($data);
        
        // Execute the controller method
        $response = $this->noteController->update($request, $note);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
        
        // Assert the note was updated in the database
        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'content' => 'Updated note content'
        ]);
    }

    /** @test */
    public function destroy_method_deletes_note()
    {
        // Create test data
        $note = Note::factory()->create([
            'noteable_type' => 'project',
            'noteable_id' => $this->project->id,
            'created_by' => $this->user->id
        ]);
        
        // Execute the controller method
        $response = $this->noteController->destroy($note);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
        
        // Assert the note was deleted from the database
        $this->assertDatabaseMissing('notes', [
            'id' => $note->id
        ]);
    }
} 