<?php

namespace Tests\Unit\Http\Controllers;

use App\Http\Controllers\FileController;
use App\Models\Client;
use App\Models\File;
use App\Models\Project;
use App\Models\User;
use App\Models\Vulnerability;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Mockery;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FileControllerTest extends TestCase
{
    use RefreshDatabase;
    
    protected $fileController;
    protected $user;
    protected $client;
    protected $project;
    protected $vulnerability;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // Create fake storage disk for testing
        Storage::fake('public');
        
        // Create the controller
        $this->fileController = new FileController();
        
        // Create a user and set as authenticated
        $this->user = User::factory()->create();
        Auth::shouldReceive('id')->andReturn($this->user->id);
        Auth::shouldReceive('user')->andReturn($this->user);
        
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
    public function index_method_returns_files_for_a_specific_fileable()
    {
        // Create test data
        $file1 = File::factory()->create([
            'fileable_type' => 'client',
            'fileable_id' => $this->client->id,
            'uploaded_by' => $this->user->id
        ]);
        
        $file2 = File::factory()->create([
            'fileable_type' => 'client',
            'fileable_id' => $this->client->id,
            'uploaded_by' => $this->user->id
        ]);
        
        // Create request with fileable parameters
        $request = new Request([
            'fileable_type' => 'client',
            'fileable_id' => $this->client->id
        ]);
        
        // Execute the controller method
        $response = $this->fileController->index($request);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
        
        // Convert JSON response to array
        $responseData = json_decode($response->getContent(), true);
        
        // Assert that both files are returned
        $this->assertCount(2, $responseData);
        $this->assertEquals($file1->id, $responseData[0]['id']);
        $this->assertEquals($file2->id, $responseData[1]['id']);
    }

    /** @test */
    public function store_method_uploads_new_file()
    {
        // Create fake file
        $fakeFile = UploadedFile::fake()->create('test-document.pdf', 1024);
        
        // Setup request data
        $request = new Request([
            'file' => $fakeFile,
            'fileable_type' => 'project',
            'fileable_id' => $this->project->id,
            'description' => 'Test file description'
        ]);
        
        // Set up request file
        $request->files->set('file', $fakeFile);
        
        // Execute the controller method
        $response = $this->fileController->store($request);
        
        // Assert the response
        $this->assertEquals(201, $response->getStatusCode());
        
        // Assert the file was created in the database
        $this->assertDatabaseHas('files', [
            'fileable_type' => 'project',
            'fileable_id' => $this->project->id,
            'description' => 'Test file description',
            'original_filename' => 'test-document.pdf',
            'mime_type' => 'application/pdf',
            'uploaded_by' => $this->user->id
        ]);
        
        // Assert that the file was stored on the disk
        $file = File::where('fileable_type', 'project')
                    ->where('fileable_id', $this->project->id)
                    ->first();
                    
        $this->assertTrue(Storage::disk('public')->exists($file->path));
    }

    /** @test */
    public function show_method_returns_file_details()
    {
        // Create test data
        $file = File::factory()->create([
            'fileable_type' => 'vulnerability',
            'fileable_id' => $this->vulnerability->id,
            'uploaded_by' => $this->user->id,
            'path' => 'files/test-file.txt'
        ]);
        
        // Create fake file in storage
        Storage::disk('public')->put($file->path, 'Test file content');
        
        // Execute the controller method
        $response = $this->fileController->show($file);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
        
        // Assert that the response is a file download
        $this->assertEquals('attachment; filename=test-file.txt', $response->headers->get('content-disposition'));
    }

    /** @test */
    public function destroy_method_deletes_file()
    {
        // Create test data
        $file = File::factory()->create([
            'fileable_type' => 'project',
            'fileable_id' => $this->project->id,
            'uploaded_by' => $this->user->id,
            'path' => 'files/test-file.txt'
        ]);
        
        // Create fake file in storage
        Storage::disk('public')->put($file->path, 'Test file content');
        
        // Execute the controller method
        $response = $this->fileController->destroy($file);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
        
        // Assert the file was deleted from the database
        $this->assertDatabaseMissing('files', [
            'id' => $file->id
        ]);
        
        // Assert the file was deleted from storage
        $this->assertFalse(Storage::disk('public')->exists($file->path));
    }
} 