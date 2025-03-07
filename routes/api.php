<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ClientController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\VulnerabilityController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::get('latest-clients', [ClientController::class, 'latestClients']);
Route::get('latest-projects', [ProjectController::class, 'latestProjects']);
Route::get('common-vulnerabilities', [VulnerabilityController::class, 'commonVulnerabilities']);

// Clients API Routes
Route::apiResource('clients', ClientController::class);

// Projects API Routes
Route::apiResource('clients.projects', ProjectController::class)
    ->shallow();

// Vulnerabilities API Routes
Route::apiResource('projects.vulnerabilities', VulnerabilityController::class)
    ->shallow();

// Clients API Routes
Route::get('clients/{client}/projects', [ClientController::class, 'clientProjects']);

// Projects API Routes
Route::get('projects/{project}/vulnerabilities', [ProjectController::class, 'projectVulnerabilities']);

// Vulnerabilities API Routes
Route::get('vulnerabilities/{vulnerability}', [VulnerabilityController::class, 'show']);


