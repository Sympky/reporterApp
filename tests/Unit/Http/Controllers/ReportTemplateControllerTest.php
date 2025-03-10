<?php

namespace Tests\Unit\Http\Controllers;

use App\Http\Controllers\ReportTemplateController;
use App\Models\ReportTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Mockery;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ReportTemplateControllerTest extends TestCase
{
    use RefreshDatabase;
    
    protected $reportTemplateController;
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
        
        // Create fake storage disk for testing
        Storage::fake('public');
        
        // Create the controller
        $this->reportTemplateController = new ReportTemplateController();
        
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
    public function index_method_displays_templates_list()
    {
        // Mock request
        $request = new Request();
        
        // Create test data
        $templates = ReportTemplate::factory()->count(3)->create([
            'created_by' => $this->user->id
        ]);
        
        // Execute the controller method
        $response = $this->reportTemplateController->index($request);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    /** @test */
    public function create_method_returns_form_view()
    {
        // Execute the controller method
        $response = $this->reportTemplateController->create();
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    /** @test */
    public function store_method_creates_new_template()
    {
        // Create fake template file
        $fakeFile = UploadedFile::fake()->create('template.docx', 1024);
        
        // Setup request data
        $data = [
            'name' => 'Test Template',
            'description' => 'Test template description',
            'template_file' => $fakeFile
        ];
        
        $request = new Request($data);
        
        // Set up request file
        $request->files->set('template_file', $fakeFile);
        
        // Execute the controller method
        $response = $this->reportTemplateController->store($request);
        
        // Assert the response
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
        
        // Assert the template was created in the database
        $this->assertDatabaseHas('report_templates', [
            'name' => 'Test Template',
            'description' => 'Test template description',
            'created_by' => $this->user->id
        ]);
        
        // Assert that a file was stored on the disk
        $template = ReportTemplate::where('name', 'Test Template')->first();
        $this->assertTrue(Storage::disk('public')->exists(str_replace('public/', '', $template->file_path)));
    }

    /** @test */
    public function show_method_displays_template_details()
    {
        // Create test data
        $template = ReportTemplate::factory()->create([
            'created_by' => $this->user->id,
            'file_path' => 'public/templates/template.docx'
        ]);
        
        // Add fake file to storage
        Storage::disk('public')->put('templates/template.docx', 'Test file content');
        
        // Execute the controller method
        $response = $this->reportTemplateController->show($template);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    /** @test */
    public function edit_method_returns_edit_form()
    {
        // Create test data
        $template = ReportTemplate::factory()->create([
            'created_by' => $this->user->id
        ]);
        
        // Execute the controller method
        $response = $this->reportTemplateController->edit($template);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    /** @test */
    public function update_method_updates_template()
    {
        // Create test data
        $template = ReportTemplate::factory()->create([
            'name' => 'Original Template',
            'description' => 'Original description',
            'created_by' => $this->user->id,
            'file_path' => 'public/templates/original.docx'
        ]);
        
        // Add fake file to storage
        Storage::disk('public')->put('templates/original.docx', 'Original file content');
        
        // Create new file for update
        $fakeFile = UploadedFile::fake()->create('updated.docx', 1024);
        
        // Setup request data
        $data = [
            'name' => 'Updated Template',
            'description' => 'Updated description',
            'template_file' => $fakeFile
        ];
        
        $request = new Request($data);
        
        // Set up request file
        $request->files->set('template_file', $fakeFile);
        
        // Execute the controller method
        $response = $this->reportTemplateController->update($request, $template);
        
        // Assert the response
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
        
        // Assert the template was updated in the database
        $this->assertDatabaseHas('report_templates', [
            'id' => $template->id,
            'name' => 'Updated Template',
            'description' => 'Updated description'
        ]);
    }

    /** @test */
    public function destroy_method_deletes_template()
    {
        // Create test data
        $template = ReportTemplate::factory()->create([
            'created_by' => $this->user->id,
            'file_path' => 'public/templates/template.docx'
        ]);
        
        // Add fake file to storage
        Storage::disk('public')->put('templates/template.docx', 'Test file content');
        
        // Execute the controller method
        $response = $this->reportTemplateController->destroy($template);
        
        // Assert the response
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
        
        // Assert the template was deleted from the database
        $this->assertDatabaseMissing('report_templates', [
            'id' => $template->id
        ]);
        
        // Assert the file was deleted from storage
        $this->assertFalse(Storage::disk('public')->exists('templates/template.docx'));
    }
} 