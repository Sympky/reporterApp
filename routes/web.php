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
    Route::resource('projects', ProjectController::class);

    
    // Vulnerability routes
    Route::resource('vulnerabilities', VulnerabilityController::class);

    // detailed project routes
    Route::get('projects/{project}/vulnerabilities', [ProjectController::class, 'vulnerabilities']);
  
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
 