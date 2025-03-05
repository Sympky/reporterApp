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
        // Fetch projects for the specified client
        $projects = $client->projects;
        return response()->json($projects);
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

    public function latestProjects()
    {
        $projects = Project::with('client')->orderBy('created_at', 'desc')->take(10)->get();

        // Map the projects to include client_name
        $projectsWithClientNames = $projects->map(function ($project) {
            return [
                'id' => $project->id,
                'client_name' => $project->client->name,
                'name' => $project->name,
                'status' => $project->status,
                'due_date' => $project->due_date,
                // Include other fields as needed
            ];
        });

        return response()->json($projectsWithClientNames);
    }
}

