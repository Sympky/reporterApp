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
        
        // Create a user
        $this->user = User::factory()->create();
        
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
    public function getFiles_method_returns_files_for_a_specific_fileable()
    {
        // Create test data with the correct fully-qualified class name
        $file1 = File::factory()->create([
            'fileable_type' => Client::class,
            'fileable_id' => $this->client->id,
            'uploaded_by' => $this->user->id
        ]);
        
        $file2 = File::factory()->create([
            'fileable_type' => Client::class,
            'fileable_id' => $this->client->id,
            'uploaded_by' => $this->user->id
        ]);
        
        // Create a mock request with validation
        $request = Mockery::mock(Request::class);
        $request->shouldReceive('validate')
            ->andReturn([
                'fileable_type' => 'client',
                'fileable_id' => $this->client->id
            ]);
        
        // Execute the controller method
        $response = $this->fileController->getFiles($request);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
        
        // Convert JSON response to array
        $responseData = json_decode($response->getContent(), true);
        
        // Assert that files are returned
        $this->assertNotEmpty($responseData);
        $this->assertCount(2, $responseData);
    }

    #[Test]
    public function upload_method_uploads_new_file()
    {
        // Set up Auth facade for this test
        Auth::shouldReceive('id')
            ->andReturn($this->user->id);
        
        // Create fake file
        $fakeFile = UploadedFile::fake()->create('test-document.pdf', 1024);
        
        // Setup request data
        $request = Mockery::mock(Request::class);
        $request->shouldReceive('validate')
            ->andReturn([
                'file' => $fakeFile,
                'fileable_type' => 'project',
                'fileable_id' => $this->project->id,
                'description' => 'Test file description'
            ]);
        $request->shouldReceive('file')
            ->with('file')
            ->andReturn($fakeFile);
        $request->shouldReceive('input')
            ->with('description')
            ->andReturn('Test file description');
        
        // Execute the controller method
        $response = $this->fileController->upload($request);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
        
        // Assert the file was created in the database - checking for either format of fileable_type
        $this->assertTrue(
            $this->inDatabase('files', [
                'fileable_type' => 'project',
                'fileable_id' => $this->project->id,
                'description' => 'Test file description',
                'uploaded_by' => $this->user->id
            ]) ||
            $this->inDatabase('files', [
                'fileable_type' => Project::class,
                'fileable_id' => $this->project->id,
                'description' => 'Test file description',
                'uploaded_by' => $this->user->id
            ])
        );
    }

    /**
     * Helper method to check if a record exists in the database
     */
    private function inDatabase(string $table, array $data): bool
    {
        return $this->app->make('db')->table($table)->where($data)->exists();
    }

    #[Test]
    public function download_method_returns_file_details()
    {
        // Create test data
        $file = File::factory()->create([
            'fileable_type' => 'vulnerability',
            'fileable_id' => $this->vulnerability->id,
            'uploaded_by' => $this->user->id,
            'path' => 'files/test-file.txt',
            'original_name' => 'test-file.txt'
        ]);
        
        // Create fake file in storage
        Storage::disk('public')->put($file->path, 'Test file content');
        
        // Execute the controller method
        $response = $this->fileController->download($file);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
        
        // Assert that the response is a file download
        $this->assertEquals('attachment; filename=test-file.txt', $response->headers->get('content-disposition'));
    }

    #[Test]
    public function destroy_method_deletes_file()
    {
        // Set up Auth facade for this test
        Auth::shouldReceive('id')
            ->andReturn($this->user->id);
        
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