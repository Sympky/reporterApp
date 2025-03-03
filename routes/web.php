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
    Route::get('clients', [ClientController::class, 'index']);

    // Project routes
    Route::resource('projects', ProjectController::class);

    // Vulnerability routes
    Route::resource('vulnerabilities', VulnerabilityController::class);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
 