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
    public function index()
    {
        $reports = Report::with([
                'client:id,name', 
                'project:id,name', 
                'reportTemplate:id,name', 
                'createdBy:id,name'
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('reports/index', [
            'reports' => $reports,
        ]);
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
            'template_id' => 'required|exists:report_templates,id',
        ]);

        if ($validator->fails()) {
            return redirect()->route('reports.create')->withErrors($validator);
        }

        $clients = Client::select('id', 'name')->get();
        $projects = Project::select('id', 'name', 'client_id')->get();

        return Inertia::render('reports/create/SelectClientProject', [
            'template_id' => $request->template_id,
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
        $templateId = $request->input('template_id', $request->query('template_id'));
        $clientId = $request->input('client_id', $request->query('client_id'));
        $projectId = $request->input('project_id', $request->query('project_id'));

        $validator = Validator::make([
            'template_id' => $templateId,
            'client_id' => $clientId,
            'project_id' => $projectId,
        ], [
            'template_id' => 'required|exists:report_templates,id',
            'client_id' => 'required|exists:clients,id',
            'project_id' => 'required|exists:projects,id',
        ]);

        if ($validator->fails()) {
            return redirect()->route('reports.create')->withErrors($validator);
        }

        $methodologies = Methodology::select('id', 'title', 'content')->get();
        $vulnerabilities = Vulnerability::where('project_id', $projectId)
            ->with('files')
            ->get();

        return Inertia::render('reports/create/AddDetails', [
            'template_id' => $templateId,
            'client_id' => $clientId,
            'project_id' => $projectId,
            'methodologies' => $methodologies,
            'vulnerabilities' => $vulnerabilities,
        ]);
    }

    /**
     * Store a newly created report in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'report_template_id' => 'required|exists:report_templates,id',
            'client_id' => 'required|exists:clients,id',
            'project_id' => 'required|exists:projects,id',
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

        // Create the report using the service
        $report = $this->reportService->createReport($request->all());

        // Generate the report file
        $filePath = $this->reportService->generateReportFile($report);

        if ($filePath) {
            return redirect()->route('reports.show', $report)
                ->with('success', 'Report created and generated successfully.');
        } else {
            return redirect()->route('reports.show', $report)
                ->with('warning', 'Report created but file generation failed.');
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

        return Inertia::render('reports/show', [
            'report' => $report,
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
            return redirect()->route('reports.show', $report)
                ->with('success', 'Report updated and regenerated successfully.');
        } else {
            return redirect()->route('reports.show', $report)
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
        if (!$report->generated_file_path || !Storage::exists($report->generated_file_path)) {
            return redirect()->back()->with('error', 'Report file not found.');
        }

        return Storage::download($report->generated_file_path, $report->name . '.docx');
    }

    /**
     * Regenerate the report file.
     */
    public function regenerate(Report $report)
    {
        try {
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
                return redirect()->route('reports.show', $report)
                    ->with('error', 'Cannot regenerate report: Template not found.');
            }
            
            $filePath = $this->reportService->generateReportFile($report);

            if ($filePath) {
                return redirect()->route('reports.show', $report)
                    ->with('success', 'Report regenerated successfully.');
            } else {
                Log::error("Failed to regenerate report ID: {$report->id}");
                return redirect()->route('reports.show', $report)
                    ->with('error', 'Failed to regenerate report. Check the error logs for details.');
            }
        } catch (\Exception $e) {
            Log::error("Error regenerating report ID: {$report->id}. Error: " . $e->getMessage());
            return redirect()->route('reports.show', $report)
                ->with('error', 'An unexpected error occurred: ' . $e->getMessage());
        }
    }
}
