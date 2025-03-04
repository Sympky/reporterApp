<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectController extends Controller
{
    // List all projects for a specific client
    public function index(Client $client)
    {
         // Fetch all clients and return them as a JSON response
         return response()->json(Project::all());
    }

    // Store a new project for a specific client
    public function store(Request $request, Client $client)
    {
        $project = $client->projects()->create($request->all());
        return response()->json($project, 201);
    }

    // Show a specific project
    public function show(Project $project)
    {
        return $project;
    }

    // Update a specific project
    public function update(Request $request, Project $project)
    {
        $project->update($request->all());
        return response()->json($project, 200);
    }

    // Delete a specific project
    public function destroy(Project $project)
    {
        $project->delete();
        return response()->json(null, 204);
    }
}

