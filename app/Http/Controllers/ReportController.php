<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Methodology;
use App\Models\Project;
use App\Models\Report;
use App\Models\ReportTemplate;
use App\Models\Vulnerability;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    protected $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * Display a listing of the reports.
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 10); // Default 10 items per page
            $page = $request->input('page', 1);
            
            Log::info('Starting reports index method');
            
            $reportsQuery = Report::with([
                    'client', 
                    'project', 
                    'reportTemplate', 
                    'createdBy:id,name'
                ])
                ->orderBy('created_at', 'desc');
            
            // Get the total count for pagination
            $total = $reportsQuery->count();
            
            // Execute the paginated query
            $paginatedReports = $reportsQuery->skip(($page - 1) * $perPage)
                                            ->take($perPage)
                                            ->get();
            
            Log::info('Reports query executed. Raw count: ' . $paginatedReports->count());
            
            // Filter out reports that don't have required relationships (except for generate_from_scratch reports)
            $filteredReports = $paginatedReports->filter(function ($report) {
                // If generate_from_scratch is true, we don't need a template
                if ($report->generate_from_scratch) {
                    return $report->client && $report->project;
                }
                
                // Otherwise check all relationships
                return $report->client && $report->project && $report->reportTemplate;
            });
            
            Log::info('Filtered reports count: ' . $filteredReports->count());
            
            // Explicitly add file existence data
            $processedReports = $filteredReports->map(function($report) {
                // Check if the file exists but don't throw error if it doesn't
                $fileExists = false;
                if ($report->generated_file_path) {
                    try {
                        // Extract disk and path if present
                        $path = $report->generated_file_path;
                        $disk = 'local';
                        
                        if (preg_match('#^(public)/(.+)$#', $path, $matches)) {
                            $disk = $matches[1];
                            $path = $matches[2];
                        }
                        
                        $fileExists = Storage::disk($disk)->exists($path);
                    } catch (\Exception $e) {
                        Log::error("Failed to check file existence for report {$report->id}: " . $e->getMessage());
                    }
                }
                
                // Add the file exists flag to the report
                $reportArray = $report->toArray();
                $reportArray['file_exists'] = $fileExists;
                
                return $reportArray;
            });
            
            Log::info('Processed reports with file existence check. Count: ' . $processedReports->count());

            return Inertia::render('reports/index', [
                'reports' => $processedReports->values(),
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Exception in reports index: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            // Still render the page with empty reports array
            return Inertia::render('reports/index', [
                'reports' => [],
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => 10,
                    'total' => 0
                ],
                'error' => 'An error occurred while loading reports: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Show the form for creating a new report - Step 1: Select Template.
     */
    public function create()
    {
        $templates = ReportTemplate::select('id', 'name', 'description')->get();

        return Inertia::render('reports/create/SelectTemplate', [
            'templates' => $templates,
        ]);
    }

    /**
     * Step 2: Select Client and Project.
     */
    public function selectClientProject(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'template_id' => $request->boolean('generate_from_scratch') ? 'nullable' : 'required|exists:report_templates,id',
            'generate_from_scratch' => 'boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->route('reports.create')->withErrors($validator);
        }

        $clients = Client::select('id', 'name')->get();
        $projects = Project::select('id', 'name', 'client_id')->get();

        return Inertia::render('reports/create/SelectClientProject', [
            'template_id' => $request->input('template_id'),
            'generate_from_scratch' => $request->boolean('generate_from_scratch'),
            'clients' => $clients,
            'projects' => $projects,
        ]);
    }

    /**
     * Step 3: Add Report Details.
     */
    public function addReportDetails(Request $request)
    {
        // For GET requests, get parameters from query string
        // For POST requests, get parameters from POST data
        $clientId = $request->input('client_id');
        $projectId = $request->input('project_id');
        $templateId = $request->input('template_id');
        $generateFromScratch = $request->boolean('generate_from_scratch');
        $generationMethod = $request->input('generation_method', $generateFromScratch ? 'from_scratch' : 'from_template');

        // For backward compatibility, check both formats
        $generateFromScratch = $generationMethod === 'from_scratch' || $generateFromScratch;

        $validationRules = [
            'client_id' => 'required|exists:clients,id',
            'project_id' => 'required|exists:projects,id',
            'generation_method' => 'required|in:from_scratch,from_template',
        ];

        // Only validate template_id if using template-based generation
        if ($generationMethod === 'from_template') {
            $validationRules['template_id'] = 'required|exists:report_templates,id';
        }

        $validator = Validator::make([
            'client_id' => $clientId,
            'project_id' => $projectId,
            'template_id' => $templateId,
            'generation_method' => $generationMethod,
        ], $validationRules);

        if ($validator->fails()) {
            return redirect()->route('reports.select-client-project')
                ->withErrors($validator)
                ->with('template_id', $templateId)
                ->with('generation_method', $generationMethod);
        }

        // Get vulnerabilities specific to the selected project only
        $projectVulnerabilities = Vulnerability::select('id', 'name', 'severity', 'description', 'impact', 'recommendations')
            ->where('project_id', $projectId)
            ->get();

        return Inertia::render('reports/create/AddDetails', [
            'client_id' => $clientId,
            'project_id' => $projectId,
            'template_id' => $templateId,
            'generation_method' => $generationMethod,
            'generate_from_scratch' => $generateFromScratch, // For backward compatibility
            'methodologies' => Methodology::select('id', 'title', 'content')->get(),
            'vulnerabilities' => $projectVulnerabilities,
        ]);
    }

    /**
     * Store a newly created report in storage.
     */
    public function store(Request $request)
    {
        // Use generation_method if provided, fallback to generate_from_scratch for backward compatibility
        $generationMethod = $request->input('generation_method', $request->boolean('generate_from_scratch') ? 'from_scratch' : 'from_template');
        $generateFromScratch = $generationMethod === 'from_scratch';
        
        $validationRules = [
            'name' => 'required|string|max:255',
            'client_id' => 'required|exists:clients,id',
            'project_id' => 'required|exists:projects,id',
            'executive_summary' => 'nullable|string',
            'methodologies' => 'nullable|array',
            'methodologies.*' => 'exists:methodologies,id',
            'findings' => 'nullable|array',
            'findings.*.vulnerability_id' => 'exists:vulnerabilities,id',
            'findings.*.include_evidence' => 'boolean',
            'generation_method' => 'required|in:from_scratch,from_template',
        ];
        
        // Only validate report_template_id if using template-based generation
        if ($generationMethod === 'from_template') {
            $validationRules['report_template_id'] = 'required|exists:report_templates,id';
        }

        $validator = Validator::make($request->all(), $validationRules);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // Ensure consistency between template selection and generation method
        $requestData = $request->all();
        
        // If a template ID is provided but generation method is from_scratch, correct it
        if (!empty($requestData['report_template_id']) && $generationMethod === 'from_scratch') {
            $requestData['generation_method'] = 'from_template';
            $requestData['generate_from_scratch'] = false;
            Log::info('Corrected generation method to from_template based on template ID presence');
        }
        
        // If no template ID but generation method is from_template, correct it
        if ((empty($requestData['report_template_id']) || !isset($requestData['report_template_id'])) && $generationMethod === 'from_template') {
            $requestData['generation_method'] = 'from_scratch';
            $requestData['generate_from_scratch'] = true;
            $requestData['report_template_id'] = null;
            Log::info('Corrected generation method to from_scratch due to missing template ID');
        }
        
        // Ensure generate_from_scratch is correctly set based on generation_method
        $requestData['generate_from_scratch'] = $requestData['generation_method'] === 'from_scratch';
        
        // Create the report using the service with the corrected data
        $report = $this->reportService->createReport($requestData);

        // Generate the report file
        $filePath = $this->reportService->generateReportFile($report);

        if ($filePath) {
            return redirect()->route('reports.index')
                ->with('success', 'Report created and generated successfully.');
        } else {
            return redirect()->route('reports.index')
                ->with('error', 'Report created but there was an issue generating the document.');
        }
    }

    /**
     * Display the specified report.
     */
    public function show(Report $report)
    {
        $report->load([
            'client',
            'project',
            'reportTemplate',
            'methodologies',
            'findings.files',
            'createdBy:id,name',
        ]);

        // Check if the file exists
        $fileExists = false;
        if ($report->generated_file_path) {
            try {
                // Extract disk and path if present
                $path = $report->generated_file_path;
                $disk = 'local';
                
                if (preg_match('#^(public)/(.+)$#', $path, $matches)) {
                    $disk = $matches[1];
                    $path = $matches[2];
                }
                
                $fileExists = Storage::disk($disk)->exists($path);
            } catch (\Exception $e) {
                Log::error("Failed to check file existence for report {$report->id}: " . $e->getMessage());
            }
        }

        // Convert to array and add file_exists
        $reportData = $report->toArray();
        $reportData['file_exists'] = $fileExists;

        return Inertia::render('reports/show', [
            'report' => $reportData,
        ]);
    }

    /**
     * Show the form for editing the specified report.
     */
    public function edit(Report $report)
    {
        $report->load([
            'methodologies',
            'findings',
        ]);

        $methodologies = Methodology::select('id', 'title', 'content')->get();
        $vulnerabilities = Vulnerability::where('project_id', $report->project_id)
            ->with('files')
            ->get();

        return Inertia::render('reports/edit', [
            'report' => $report,
            'methodologies' => $methodologies,
            'vulnerabilities' => $vulnerabilities,
        ]);
    }

    /**
     * Update the specified report in storage.
     */
    public function update(Request $request, Report $report)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'executive_summary' => 'nullable|string',
            'methodologies' => 'nullable|array',
            'methodologies.*' => 'exists:methodologies,id',
            'findings' => 'nullable|array',
            'findings.*.vulnerability_id' => 'exists:vulnerabilities,id',
            'findings.*.include_evidence' => 'boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // Update the report using the service
        $report = $this->reportService->updateReport($report, $request->all());

        // Regenerate the report file
        $filePath = $this->reportService->generateReportFile($report);

        if ($filePath) {
            return redirect()->route('reports.index')
                ->with('success', 'Report updated and regenerated successfully.');
        } else {
            return redirect()->route('reports.index')
                ->with('warning', 'Report updated but file regeneration failed.');
        }
    }

    /**
     * Remove the specified report from storage.
     */
    public function destroy(Report $report)
    {
        $this->reportService->deleteReport($report);

        return redirect()->route('reports.index')
            ->with('success', 'Report deleted successfully.');
    }

    /**
     * Download the generated report file.
     */
    public function download(Report $report)
    {
        try {
            Log::info("=== Starting forceful download process for report ID: {$report->id} ===");
            
            // First, check if file path exists in the database
            if (!$report->generated_file_path) {
                Log::error("Download failed: generated_file_path is empty for report ID: {$report->id}");
                return response()->json(['error' => 'Report file path not found in database.'], 404);
            }
            
            Log::info("Report file path from database: {$report->generated_file_path}");
            
            // Determine the disk to use (default to 'local' if no disk prefix)
            $path = $report->generated_file_path;
            $disk = 'local';
            
            // Check if path starts with a disk prefix
            if (preg_match('#^(public)/(.+)$#', $path, $matches)) {
                $disk = $matches[1];
                $path = $matches[2];
                Log::info("Extracted disk: {$disk}, path: {$path}");
            }
            
            // Check if the file exists in storage
            $fileExists = Storage::disk($disk)->exists($path);
            Log::info("File exists in {$disk} disk: " . ($fileExists ? 'Yes' : 'No'));
            
            if (!$fileExists) {
                Log::error("Download failed: File does not exist at path: {$path} in disk: {$disk}");
                return response()->json(['error' => 'Report file not found in storage.'], 404);
            }
            
            // Get the full path to the file
            $fullPath = Storage::disk($disk)->path($path);
            Log::info("Using full local path: {$fullPath}");
            
            // Verify the file at OS level
            if (!file_exists($fullPath)) {
                Log::error("File not found at OS level: {$fullPath}");
                return response()->json(['error' => 'File not found on server.'], 404);
            }
            
            // Create a filename for the download
            $fileName = $report->name . '.docx';
            Log::info("Sending file as: {$fileName}");
            
            // Serve file directly as a download attachment
            return response()->download(
                $fullPath, 
                $fileName, 
                [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
                    'Pragma' => 'no-cache',
                ]
            );
        } catch (\Exception $e) {
            Log::error("Exception during download: " . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            return response()->json(['error' => 'Download failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Regenerate the report file.
     */
    public function regenerate(Report $report)
    {
        try {
            Log::info("Starting report regeneration for report ID: {$report->id}");
            
            // Make sure all necessary relationships are loaded
            $report->load([
                'client',
                'project',
                'reportTemplate',
                'methodologies',
                'findings.files',
                'createdBy:id,name',
            ]);
            
            // Check if the template exists
            if (!$report->reportTemplate) {
                Log::error("Cannot regenerate report: Template not found for report ID: {$report->id}");
                return redirect()->route('reports.index')
                    ->with('error', 'Cannot regenerate report: Template not found.');
            }
            
            // If there's an existing file, delete it first to ensure clean regeneration
            if ($report->generated_file_path) {
                // Remove the file from storage
                if (Storage::exists($report->generated_file_path)) {
                    Log::info("Deleting existing report file: {$report->generated_file_path}");
                    Storage::delete($report->generated_file_path);
                }
                
                // Also check for any alternate locations that might exist
                $possiblePaths = [
                    // Regular path
                    $report->generated_file_path,
                    // Without public/ prefix (if present)
                    preg_replace('#^public/#', '', $report->generated_file_path),
                    // With public/ prefix (if not present)
                    'public/' . $report->generated_file_path
                ];
                
                foreach ($possiblePaths as $path) {
                    if ($path != $report->generated_file_path && Storage::exists($path)) {
                        Log::info("Deleting report file from alternate location: {$path}");
                        Storage::delete($path);
                    }
                }
            }
            
            $filePath = $this->reportService->generateReportFile($report);

            if ($filePath) {
                Log::info("Report regenerated successfully. New file path: {$filePath}");
                
                // Check if the storage:link command has been run
                $publicPath = str_replace('public/', 'storage/', $filePath);
                $publicUrl = url($publicPath);
                Log::info("Public URL for the report: {$publicUrl}");
                
                return redirect()->route('reports.index')
                    ->with('success', 'Report regenerated successfully.');
            } else {
                Log::error("Failed to regenerate report ID: {$report->id}");
                return redirect()->route('reports.index')
                    ->with('error', 'Failed to regenerate report. Check the error logs for details.');
            }
        } catch (\Exception $e) {
            Log::error("Error regenerating report ID: {$report->id}. Error: " . $e->getMessage());
            Log::error($e->getTraceAsString());
            return redirect()->route('reports.index')
                ->with('error', 'An unexpected error occurred: ' . $e->getMessage());
        }
    }

    /**
     * Debug endpoint to check report data.
     */
    public function debug()
    {
        try {
            // Get all reports with relationships
            $reports = Report::with([
                'client',
                'project',
                'reportTemplate',
                'methodologies',
                'findings',
                'createdBy:id,name',
            ])->get();
            
            // Get all available docx files in storage
            $docxFiles = [];
            
            // Check in both locations we've seen files stored
            $locations = [
                'reports',
                'private/reports'
            ];
            
            foreach ($locations as $location) {
                if (Storage::exists($location)) {
                    $files = Storage::files($location);
                    $docxFiles[$location] = array_filter($files, function($file) {
                        return pathinfo($file, PATHINFO_EXTENSION) === 'docx';
                    });
                }
            }
            
            // Also do a general search
            $generalSearch = [];
            $searchResults = [];
            exec('find ' . storage_path('app') . ' -name "*.docx"', $searchResults);
            foreach ($searchResults as $result) {
                $generalSearch[] = str_replace(storage_path('app') . '/', '', $result);
            }
            
            // Get the disk configuration
            $diskConfig = config('filesystems.disks.local');
            
            return response()->json([
                'reports_count' => $reports->count(),
                'reports' => $reports->map(function($report) {
                    return [
                        'id' => $report->id,
                        'name' => $report->name,
                        'status' => $report->status,
                        'generated_file_path' => $report->generated_file_path,
                        'file_exists' => $report->generated_file_path ? 
                            Storage::exists($report->generated_file_path) : false,
                        'has_client' => !!$report->client,
                        'has_project' => !!$report->project,
                        'has_template' => !!$report->reportTemplate,
                    ];
                }),
                'storage_config' => $diskConfig,
                'storage_path' => storage_path(),
                'docx_files' => $docxFiles,
                'all_docx_files' => $generalSearch
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Direct download method using simple PHP.
     */
    public function directDownload(Report $report)
    {
        try {
            Log::info("=== Starting DIRECT download process for report ID: {$report->id} ===");
            
            if (!$report->generated_file_path) {
                Log::error("Download failed: generated_file_path is empty");
                echo "Error: Report file path not found in database.";
                exit;
            }
            
            // Determine the full path
            $path = $report->generated_file_path;
            $disk = 'local';
            
            if (preg_match('#^(public)/(.+)$#', $path, $matches)) {
                $disk = $matches[1];
                $path = $matches[2];
            }
            
            $fullPath = Storage::disk($disk)->path($path);
            Log::info("Direct download path: {$fullPath}");
            
            if (!file_exists($fullPath)) {
                Log::error("File not found: {$fullPath}");
                echo "Error: File not found on server.";
                exit;
            }
            
            $fileSize = filesize($fullPath);
            Log::info("File size: {$fileSize} bytes");
            
            if ($fileSize <= 0) {
                Log::error("File is empty: {$fullPath}");
                echo "Error: File is empty.";
                exit;
            }
            
            // Set headers to force download
            header('Content-Description: File Transfer');
            header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            header('Content-Disposition: attachment; filename="' . $report->name . '.docx"');
            header('Content-Length: ' . $fileSize);
            header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
            header('Expires: 0');
            header('Pragma: public');
            
            // Clear any output buffers
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            // Read the file and output it directly
            readfile($fullPath);
            exit;
        } catch (\Exception $e) {
            Log::error("Exception in direct download: " . $e->getMessage());
            echo "Error: " . $e->getMessage();
            exit;
        }
    }
}
