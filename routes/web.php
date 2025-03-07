<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\VulnerabilityController;

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
    Route::get('vulnerability-templates', [VulnerabilityController::class, 'templates'])->name('vulnerability.templates');
    Route::post('vulnerability-templates', [VulnerabilityController::class, 'storeTemplate'])->name('vulnerability.templates.store');
    Route::put('vulnerability-templates/{template}', [VulnerabilityController::class, 'updateTemplate'])->name('vulnerability.templates.update');
    Route::post('vulnerability-templates/apply', [VulnerabilityController::class, 'applyTemplate'])->name('vulnerability.templates.apply');

    // detailed project routes
    Route::get('projects/{project}/vulnerabilities', [ProjectController::class, 'vulnerabilities']);
  
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
 