<?php

namespace Tests\Unit\Http\Controllers;

use App\Http\Controllers\ReportController;
use App\Models\Client;
use App\Models\Project;
use App\Models\Report;
use App\Models\ReportTemplate;
use App\Models\User;
use App\Services\ReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Mockery;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ReportControllerTest extends TestCase
{
    use RefreshDatabase;
    
    protected $reportService;
    protected $reportController;
    protected $user;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a better Inertia mock that returns an InertiaResponse
        $inertiaMock = Mockery::mock('overload:Inertia\Inertia');
        $inertiaMock->shouldReceive('render')->andReturnUsing(function ($component, $props = []) {
            $responseMock = Mockery::mock(InertiaResponse::class);
            $responseMock->shouldReceive('getStatusCode')->andReturn(200);
            return $responseMock;
        });
        
        // Create a mock for ReportService
        $this->reportService = Mockery::mock(ReportService::class);
        
        // Create the controller with mocked dependencies
        $this->reportController = new ReportController($this->reportService);
        
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
    public function index_method_displays_reports_list()
    {
        // Mock request
        $request = new Request();
        
        // Mock necessary relationships
        $client = Client::factory()->create();
        $project = Project::factory()->create(['client_id' => $client->id]);
        $template = ReportTemplate::factory()->create();
        
        // Create test data
        $report = Report::factory()->create([
            'client_id' => $client->id,
            'project_id' => $project->id,
            'report_template_id' => $template->id,
            'created_by' => $this->user->id
        ]);
        
        // Execute the controller method
        $response = $this->reportController->index($request);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    #[Test]
    public function create_method_returns_form_view()
    {
        // Create test data
        $clients = Client::factory()->count(3)->create();
        $projects = Project::factory()->count(3)->create(['client_id' => $clients->first()->id]);
        $templates = ReportTemplate::factory()->count(3)->create();
        
        // Execute the controller method
        $response = $this->reportController->create();
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    #[Test]
    public function store_method_creates_new_report()
    {
        // Create test data
        $client = Client::factory()->create();
        $project = Project::factory()->create(['client_id' => $client->id]);
        $template = ReportTemplate::factory()->create();
        
        // Setup request data
        $data = [
            'name' => 'Test Report',
            'client_id' => $client->id,
            'project_id' => $project->id,
            'report_template_id' => $template->id,
            'executive_summary' => 'Test summary',
            'generation_method' => 'from_template'
        ];
        
        $request = new Request($data);
        
        // Mock the report service methods
        $report = new Report($data);
        $this->reportService->shouldReceive('createReport')
            ->once()
            ->with(Mockery::type('array'))
            ->andReturn($report);
            
        $this->reportService->shouldReceive('generateReportFile')
            ->once()
            ->with($report)
            ->andReturn('path/to/file.docx');
        
        // Execute the controller method
        $response = $this->reportController->store($request);
        
        // Assert the response
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
    }

    #[Test]
    public function show_method_displays_report_details()
    {
        // Create test data
        $client = Client::factory()->create();
        $project = Project::factory()->create(['client_id' => $client->id]);
        $template = ReportTemplate::factory()->create();
        
        $report = Report::factory()->create([
            'client_id' => $client->id,
            'project_id' => $project->id,
            'report_template_id' => $template->id,
            'created_by' => $this->user->id
        ]);
        
        // Execute the controller method
        $response = $this->reportController->show($report);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    #[Test]
    public function edit_method_returns_edit_form()
    {
        // Create test data
        $client = Client::factory()->create();
        $project = Project::factory()->create(['client_id' => $client->id]);
        $template = ReportTemplate::factory()->create();
        
        $report = Report::factory()->create([
            'client_id' => $client->id,
            'project_id' => $project->id,
            'report_template_id' => $template->id,
            'created_by' => $this->user->id
        ]);
        
        // Execute the controller method
        $response = $this->reportController->edit($report);
        
        // Assert the response
        $this->assertEquals(200, $response->getStatusCode());
    }

    #[Test]
    public function update_method_updates_report()
    {
        // Create test data
        $client = Client::factory()->create();
        $project = Project::factory()->create(['client_id' => $client->id]);
        $template = ReportTemplate::factory()->create();
        
        $report = Report::factory()->create([
            'client_id' => $client->id,
            'project_id' => $project->id,
            'report_template_id' => $template->id,
            'created_by' => $this->user->id
        ]);
        
        // Setup request data
        $data = [
            'name' => 'Updated Report',
            'executive_summary' => 'Updated summary'
        ];
        
        $request = new Request($data);
        
        // Mock the report service's methods
        $this->reportService->shouldReceive('updateReport')
            ->once()
            ->with($report, Mockery::type('array'))
            ->andReturn($report);
            
        $this->reportService->shouldReceive('generateReportFile')
            ->once()
            ->with($report)
            ->andReturn('path/to/updated/file.docx');
        
        // Execute the controller method
        $response = $this->reportController->update($request, $report);
        
        // Assert the response
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
    }

    #[Test]
    public function destroy_method_deletes_report()
    {
        // Create test data
        $client = Client::factory()->create();
        $project = Project::factory()->create(['client_id' => $client->id]);
        $template = ReportTemplate::factory()->create();
        
        $report = Report::factory()->create([
            'client_id' => $client->id,
            'project_id' => $project->id,
            'report_template_id' => $template->id,
            'created_by' => $this->user->id
        ]);
        
        // Mock the report service's deleteReport method
        $this->reportService->shouldReceive('deleteReport')
            ->once()
            ->with($report)
            ->andReturn(true);
        
        // Execute the controller method
        $response = $this->reportController->destroy($report);
        
        // Assert the response
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
    }

    #[Test]
    public function generateReportDocument_method_creates_report_document()
    {
        // Create test data
        $client = Client::factory()->create();
        $project = Project::factory()->create(['client_id' => $client->id]);
        $template = ReportTemplate::factory()->create();
        
        $report = Report::factory()->create([
            'client_id' => $client->id,
            'project_id' => $project->id,
            'report_template_id' => $template->id,
            'created_by' => $this->user->id
        ]);
        
        // Mock the report service's generateReport method
        $this->reportService->shouldReceive('generateReportDocument')
            ->once()
            ->with($report)
            ->andReturn('path/to/generated/file.docx');
        
        // Execute the controller method
        $response = $this->reportController->generateReportDocument($report);
        
        // Assert the response
        $this->assertEquals(302, $response->getStatusCode()); // Redirect status code
    }

    #[Test]
    public function downloadReport_method_returns_file_download()
    {
        // Create test data
        $client = Client::factory()->create();
        $project = Project::factory()->create(['client_id' => $client->id]);
        $template = ReportTemplate::factory()->create();
        
        $report = Report::factory()->create([
            'client_id' => $client->id,
            'project_id' => $project->id,
            'report_template_id' => $template->id,
            'created_by' => $this->user->id,
            'generated_file_path' => 'public/reports/test-report.docx'
        ]);
        
        // Mock Storage to return file exists and get content
        Storage::shouldReceive('exists')->andReturn(true);
        Storage::shouldReceive('get')->andReturn('file content');
        
        // Execute the controller method
        $response = $this->reportController->downloadReport($report);
        
        // Assert the response indicates a file download
        $this->assertTrue(
            str_contains($response->headers->get('content-disposition'), 'attachment')
        );
    }
} 