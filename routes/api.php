<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ClientController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\VulnerabilityController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


// Clients API Routes
Route::apiResource('clients', ClientController::class);

// Projects API Routes
Route::apiResource('clients.projects', ProjectController::class)
    ->shallow();

// Vulnerabilities API Routes
Route::apiResource('projects.vulnerabilities', VulnerabilityController::class)
    ->shallow();
