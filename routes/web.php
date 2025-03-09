<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\VulnerabilityController;
use App\Http\Controllers\VulnerabilityTemplateController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\MethodologyController;
use App\Http\Controllers\ReportTemplateController;
use App\Http\Controllers\ReportController;
use App\Services\DocxGenerationService;
use App\Models\Report;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Client routes
    Route::resource('clients', ClientController::class);

    // Project routes
    Route::get('projects', [ProjectController::class, 'allProjects'])->name('projects.index');
    Route::post('projects', [ProjectController::class, 'storeProject'])->name('projects.store');
    Route::resource('projects', ProjectController::class)->except(['index', 'store']);

    // Vulnerability routes
    Route::get('vulnerabilities', [VulnerabilityController::class, 'allVulnerabilities'])->name('vulnerabilities.index');
    Route::post('vulnerabilities', [VulnerabilityController::class, 'storeVulnerability'])->name('vulnerabilities.store');
    Route::resource('vulnerabilities', VulnerabilityController::class)->except(['index', 'store']);

    // Vulnerability templates routes
    Route::get('vulnerability-templates', [VulnerabilityTemplateController::class, 'index'])->name('vulnerability.templates');
    Route::post('vulnerability-templates', [VulnerabilityTemplateController::class, 'store'])->name('vulnerability.templates.store');
    Route::get('vulnerability-templates/{template}/edit', [VulnerabilityTemplateController::class, 'edit'])->name('vulnerability.templates.edit');
    Route::put('vulnerability-templates/{template}', [VulnerabilityTemplateController::class, 'update'])->name('vulnerability.templates.update');
    Route::post('vulnerability-templates/apply', [VulnerabilityTemplateController::class, 'apply'])->name('vulnerability.templates.apply');
    Route::delete('vulnerability-templates/{template}', [VulnerabilityTemplateController::class, 'destroy'])->name('vulnerability.templates.destroy');

    // detailed project routes
    Route::get('projects/{project}/vulnerabilities', [ProjectController::class, 'vulnerabilities']);

    // Notes routes
    Route::post('notes', [NoteController::class, 'store'])->name('notes.store');
    Route::get('notes', [NoteController::class, 'getNotes'])->name('notes.get');
    Route::delete('notes/{note}', [NoteController::class, 'destroy'])->name('notes.destroy');

    // Files routes
    Route::post('files/upload', [FileController::class, 'upload'])->name('files.upload');
    Route::get('files', [FileController::class, 'getFiles'])->name('files.get');
    Route::get('files/{file}/download', [FileController::class, 'download'])->name('files.download');
    Route::delete('files/{file}', [FileController::class, 'destroy'])->name('files.destroy');
    
    // Methodology routes
    Route::resource('methodologies', MethodologyController::class);
});

// Report Templates
Route::middleware(['auth'])->group(function () {
    Route::resource('report-templates', ReportTemplateController::class);
    Route::get('report-templates/{reportTemplate}/download', [ReportTemplateController::class, 'download'])->name('report-templates.download');
});

// Reports
Route::middleware(['auth'])->group(function () {
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/create', [ReportController::class, 'create'])->name('reports.create');
    Route::post('reports/select-client-project', [ReportController::class, 'selectClientProject'])->name('reports.select-client-project');
    Route::match(['get', 'post'], 'reports/add-details', [ReportController::class, 'addReportDetails'])->name('reports.add-details');
    Route::post('reports', [ReportController::class, 'store'])->name('reports.store');
    Route::get('reports/{report}', [ReportController::class, 'show'])->name('reports.show');
    Route::get('reports/{report}/edit', [ReportController::class, 'edit'])->name('reports.edit');
    Route::put('reports/{report}', [ReportController::class, 'update'])->name('reports.update');
    Route::delete('reports/{report}', [ReportController::class, 'destroy'])->name('reports.destroy');
    Route::get('reports/{report}/download', [ReportController::class, 'download'])->name('reports.download');
    Route::get('reports/{report}/direct-download', [ReportController::class, 'directDownload'])->name('reports.direct-download');
    Route::post('reports/{report}/regenerate', [ReportController::class, 'regenerate'])->name('reports.regenerate');
    
    // Debug route - remove in production
    Route::get('reports-debug', [ReportController::class, 'debug'])->name('reports.debug');
});

// Route to demonstrate generating a report from scratch and downloading it
Route::get('/demo/generate-report-from-scratch/{reportId}', function ($reportId) {
    try {
        // Get the report
        $report = Report::findOrFail($reportId);
        
        // Force generate-from-scratch mode
        $report->generate_from_scratch = true;
        $report->save();
        
        // Generate the report
        $docxService = new DocxGenerationService();
        $filePath = $docxService->generateReport($report);
        
        if (!$filePath) {
            return response()->json(['error' => 'Failed to generate report'], 500);
        }
        
        // If the path starts with 'public/', remove it for correct storage access
        $filePath = str_replace('public/', '', $filePath);
        
        // Check if file exists
        if (!Storage::exists($filePath)) {
            return response()->json(['error' => 'Generated file not found'], 404);
        }
        
        // Generate a friendly filename
        $filename = $report->name . '_' . date('Y-m-d') . '.docx';
        
        // Return file for download
        return Storage::download($filePath, $filename);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
})->name('demo.generate.from.scratch');

// Better route for generating reports from scratch that follows RESTful conventions
Route::get('/reports/{report}/generate-from-scratch', function (Report $report) {
    try {
        // Force generate-from-scratch mode
        $report->generate_from_scratch = true;
        $report->save();
        
        // Generate the report
        $docxService = new DocxGenerationService();
        $filePath = $docxService->generateReport($report);
        
        if (!$filePath) {
            return response()->json(['error' => 'Failed to generate report'], 500);
        }
        
        // Extract disk and path information
        $path = $filePath;
        $disk = 'local';
        
        // Check if path starts with a disk prefix
        if (preg_match('#^(public)/(.+)$#', $path, $matches)) {
            $disk = $matches[1];
            $path = $matches[2];
        }
        
        // Check if the file exists in storage
        if (!Storage::disk($disk)->exists($path)) {
            return response()->json(['error' => 'Generated file not found'], 404);
        }
        
        // Get the full path to the file
        $fullPath = Storage::disk($disk)->path($path);
        
        // Generate a friendly filename
        $filename = $report->name . '_standardized_' . date('Y-m-d') . '.docx';
        
        // Return file for download
        return response()->download($fullPath, $filename);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
})->name('reports.generate-from-scratch');

// Route for generating reports using the selected template
Route::get('/reports/{report}/generate-from-template', function (Report $report) {
    try {
        // Ensure we're using the template by setting generate_from_scratch to false
        $report->generate_from_scratch = false;
        $report->save();
        
        // Make sure the report has a template assigned
        if (!$report->reportTemplate) {
            return response()->json(['error' => 'No template assigned to this report'], 400);
        }
        
        // Generate the report using the template
        $docxService = new DocxGenerationService();
        $filePath = $docxService->generateReport($report);
        
        if (!$filePath) {
            return response()->json(['error' => 'Failed to generate report'], 500);
        }
        
        // Extract disk and path information
        $path = $filePath;
        $disk = 'local';
        
        // Check if path starts with a disk prefix
        if (preg_match('#^(public)/(.+)$#', $path, $matches)) {
            $disk = $matches[1];
            $path = $matches[2];
        }
        
        // Check if the file exists in storage
        if (!Storage::disk($disk)->exists($path)) {
            return response()->json(['error' => 'Generated file not found'], 404);
        }
        
        // Get the full path to the file
        $fullPath = Storage::disk($disk)->path($path);
        
        // Generate a friendly filename
        $filename = $report->name . '_template_' . date('Y-m-d') . '.docx';
        
        // Return file for download
        return response()->download($fullPath, $filename);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
})->name('reports.generate-from-template');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
 