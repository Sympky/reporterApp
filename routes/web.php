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
    Route::post('reports/{report}/regenerate', [ReportController::class, 'regenerate'])->name('reports.regenerate');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
 