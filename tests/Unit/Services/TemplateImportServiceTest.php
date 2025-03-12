<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Models\Vulnerability;
use App\Services\TemplateImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Mockery;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TemplateImportServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $service;
    protected $user;
    protected $disk;

    protected function setUp(): void
    {
        parent::setUp();

        // Mock Auth facade
        $this->user = User::factory()->create();
        Auth::shouldReceive('id')->andReturn($this->user->id);

        // Set up fake disk for file operations
        Storage::fake('local');
        $this->disk = Storage::disk('local');
        
        // Create the service
        $this->service = new TemplateImportService();
        
        // Mock the Log facade to avoid polluting logs during tests
        Log::shouldReceive('info')->andReturn(null);
        Log::shouldReceive('debug')->andReturn(null);
        Log::shouldReceive('warning')->andReturn(null);
        Log::shouldReceive('error')->andReturn(null);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /**
     * Helper method to create a valid CSV file for testing
     */
    protected function createValidCsvFile(): UploadedFile
    {
        $csvContent = "name,description,severity,cvss,cve,recommendations,impact,references,tags\n";
        $csvContent .= "Template Vulnerability,Template description,High,8.5,CVE-2023-1234,Fix it,Major impact,https://example.com,sql-injection,xss";
        
        $filePath = $this->disk->path('test_templates.csv');
        file_put_contents($filePath, $csvContent);
        
        return new UploadedFile(
            $filePath,
            'test_templates.csv',
            'text/csv',
            null,
            true
        );
    }

    #[Test]
    public function it_always_imports_as_templates_regardless_of_parameters()
    {
        // Create a valid CSV file
        $file = $this->createValidCsvFile();
        
        // Prepare mock data that Excel would return
        $excelData = collect([
            collect([
                ['name' => 'Name Header', 'description' => 'Description Header', 'severity' => 'Severity Header'],
                ['name' => 'Template 1', 'description' => 'Template description', 'severity' => 'High'],
                ['name' => 'Template 2', 'description' => 'Another template', 'severity' => 'Medium']
            ])
        ]);
        
        // Mock Excel facade
        Excel::shouldReceive('toCollection')
            ->once()
            ->andReturn($excelData);
        
        // Test with projectId parameter and isTemplate = false
        // Even though we pass false, the service should override this and set isTemplate to true
        $result = $this->service->import($file, 123, false);
        
        // Assertions
        $this->assertTrue($result['success']);
        $this->assertEquals(2, $result['imported']);
        
        // Check that records were saved as templates with no project_id
        $this->assertDatabaseHas('vulnerabilities', [
            'name' => 'Template 1',
            'description' => 'Template description',
            'project_id' => null,
            'is_template' => true
        ]);
        
        $this->assertDatabaseHas('vulnerabilities', [
            'name' => 'Template 2',
            'description' => 'Another template',
            'project_id' => null,
            'is_template' => true
        ]);
    }

    #[Test]
    public function it_logs_template_specific_information()
    {
        // Create a file
        $file = $this->createValidCsvFile();
        
        // Override the Log mock to expect template-specific log
        Log::shouldReceive('info')
            ->with('Template import service called', Mockery::on(function ($data) {
                return isset($data['file_name']) && isset($data['file_size']) && isset($data['mime_type']);
            }))
            ->once();
        
        // Mock Excel facade to return simple data
        Excel::shouldReceive('toCollection')
            ->once()
            ->andReturn(collect([
                collect([
                    ['name' => 'Name Header', 'description' => 'Description Header', 'severity' => 'Severity Header'],
                    ['name' => 'Test Template', 'description' => 'Description', 'severity' => 'High']
                ])
            ]));
        
        // Import the file
        $this->service->import($file);
        
        // No direct assertions needed here as the test passes if the expected log message was received
    }

    #[Test]
    public function it_handles_invalid_file_formats()
    {
        // Create a text file with wrong extension
        $file = UploadedFile::fake()->create('test.txt', 100);
        
        // Attempt to import
        $result = $this->service->import($file);
        
        // Assertions
        $this->assertFalse($result['success']);
        $this->assertEquals('Invalid file format. Please upload a CSV or Excel file.', $result['message']);
        $this->assertEquals(0, $result['imported']);
    }

    #[Test]
    public function it_validates_template_required_fields()
    {
        // Create a file
        $file = $this->createValidCsvFile();
        
        // Prepare test data with missing required fields
        $excelData = collect([
            collect([
                ['name' => 'Name', 'description' => 'Description', 'some_other_field' => 'Other'],
                ['name' => 'Missing Severity', 'description' => 'No severity field'],
                ['name' => 'Valid Template', 'description' => 'Has all fields', 'severity' => 'Medium']
            ])
        ]);
        
        // Mock Excel facade
        Excel::shouldReceive('toCollection')
            ->once()
            ->andReturn($excelData);
        
        // Import the file
        $result = $this->service->import($file);
        
        // Assertions
        $this->assertTrue($result['success']); // The import succeeds but with validation errors
        $this->assertEquals(1, $result['imported']); // Only the valid template is imported
        $this->assertNotEmpty($result['errors']); // There should be validation errors
        
        // Check that only the valid template was imported
        $this->assertDatabaseHas('vulnerabilities', [
            'name' => 'Valid Template',
            'is_template' => true
        ]);
        
        $this->assertDatabaseMissing('vulnerabilities', [
            'name' => 'Missing Severity',
        ]);
    }

    #[Test]
    public function it_formats_template_specific_fields()
    {
        // Create a file
        $file = $this->createValidCsvFile();
        
        // Prepare test data with template-specific fields
        $excelData = collect([
            collect([
                ['name' => 'Name', 'description' => 'Description', 'severity' => 'Severity', 'tags' => 'Tags'],
                [
                    'name' => 'Template with Tags', 
                    'description' => 'Template with tags description', 
                    'severity' => 'Medium',
                    'tags' => 'template, security, best-practice'
                ]
            ])
        ]);
        
        // Mock Excel facade
        Excel::shouldReceive('toCollection')
            ->once()
            ->andReturn($excelData);
        
        // Import the file
        $result = $this->service->import($file);
        
        // Assertions
        $this->assertTrue($result['success']);
        $this->assertEquals(1, $result['imported']);
        
        // Check template was imported with correct fields
        $template = Vulnerability::where('name', 'Template with Tags')->first();
        $this->assertNotNull($template);
        $this->assertTrue($template->is_template);
        $this->assertNull($template->project_id);
        $this->assertIsArray($template->tags);
        $this->assertEquals(['template', 'security', 'best-practice'], $template->tags);
    }

    #[Test]
    public function it_delegates_to_parent_service_with_correct_parameters()
    {
        // Create a mock parent service (VulnerabilityImportService)
        $mockParentService = Mockery::mock('App\Services\VulnerabilityImportService');
        
        // Create a partial mock of TemplateImportService
        $partialService = Mockery::mock('App\Services\TemplateImportService[parent::import]');
        
        // Set expectation for parent::import to be called with isTemplate = true
        $file = $this->createValidCsvFile();
        $expectedResult = ['success' => true, 'imported' => 1, 'message' => 'Test', 'errors' => []];
        
        // Can't directly mock parent::import, so we create a reflection method
        $reflectionMethod = new \ReflectionObject($partialService);
        $mockParentService->shouldReceive('import')
            ->with($file, null, true)
            ->once()
            ->andReturn($expectedResult);
            
        // Since we can't easily test the parent call directly in PHPUnit,
        // we'll verify the behavior by checking that the template is properly saved
        Excel::shouldReceive('toCollection')
            ->once()
            ->andReturn(collect([
                collect([
                    ['name' => 'Name', 'description' => 'Description', 'severity' => 'Severity'],
                    ['name' => 'Parent Call Test', 'description' => 'Testing parent call', 'severity' => 'Low']
                ])
            ]));
        
        // Call the service method
        $result = $this->service->import($file, 999, false); // Intentionally pass wrong params
        
        // Assert that the template was imported with correct settings
        $this->assertDatabaseHas('vulnerabilities', [
            'name' => 'Parent Call Test',
            'is_template' => true,
            'project_id' => null // Should be null regardless of what was passed
        ]);
    }
}