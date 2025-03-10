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

    #[Test]
    public function index_method_returns_notes_for_a_specific_noteable()
    {
        // Create test data
        $note1 = Note::factory()->create([
            'notable_type' => Project::class,
            'notable_id' => $this->project->id,
            'created_by' => $this->user->id
        ]);
        
        $note2 = Note::factory()->create([
            'notable_type' => Project::class,
            'notable_id' => $this->project->id,
            'created_by' => $this->user->id
        ]);
        
        // Create request with notable parameters
        $request = new Request([
            'notable_type' => 'project', // The controller expects shorthand names
            'notable_id' => $this->project->id
        ]);
        
        // Execute the controller method - using getNotes instead of index
        $response = $this->noteController->getNotes($request);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
        
        // Convert JSON response to array
        $responseData = json_decode($response->getContent(), true);
        
        // Assert that both notes are returned
        $this->assertCount(2, $responseData);
        $this->assertEquals($note1->id, $responseData[0]['id']);
        $this->assertEquals($note2->id, $responseData[1]['id']);
    }

    #[Test]
    public function store_method_creates_new_note()
    {
        // Setup request data
        $data = [
            'content' => 'This is a test note content',
            'notable_type' => 'vulnerability', // Controller input uses shorthand
            'notable_id' => $this->vulnerability->id
        ];
        
        $request = new Request($data);
        
        // Execute the controller method
        $response = $this->noteController->store($request);
        
        // Assert redirect response since the controller returns a redirect
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
        
        // Assert the note was created in the database with the fully qualified class name
        $this->assertDatabaseHas('notes', [
            'content' => 'This is a test note content',
            'notable_type' => Vulnerability::class,
            'notable_id' => $this->vulnerability->id,
            'created_by' => $this->user->id
        ]);
    }

    #[Test]
    public function destroy_method_deletes_note()
    {
        // Create test data
        $note = Note::factory()->create([
            'notable_type' => Project::class,
            'notable_id' => $this->project->id,
            'created_by' => $this->user->id
        ]);
        
        $noteId = $note->id;
        
        // Execute the controller method
        $response = $this->noteController->destroy($note);
        
        // Assert redirect response since the controller returns a redirect
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
        
        // Assert the note was deleted from the database
        $this->assertDatabaseMissing('notes', [
            'id' => $noteId
        ]);
    }
} 