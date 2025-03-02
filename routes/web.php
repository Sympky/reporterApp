<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ClientsController;
use App\Http\Controllers\ProjectsController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Client routes
    Route::get('/clients/{client}', [ClientsController::class, 'index']);

    // Project routes
    Route::resource('projects', ProjectsController::class);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
 