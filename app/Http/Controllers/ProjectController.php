<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ProjectController extends Controller
{
    // List all projects for a specific client
    public function index(Client $client)
    {
        // Fetch projects for the specified client
        $projects = $client->projects;
        return response()->json($projects);
    }

    // List all projects for display in the projects page
    public function allProjects()
    {
        $projects = Project::with(['client', 'vulnerabilities'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Map the projects to include client_name and vulnerability count
        $projectsWithDetails = $projects->map(function ($project) {
            return [
                'id' => $project->id,
                'client_id' => $project->client_id,
                'client_name' => $project->client->name,
                'name' => $project->name,
                'description' => $project->description,
                'status' => $project->status,
                'due_date' => $project->due_date,
                'vulnerability_count' => $project->vulnerabilities->count(),
            ];
        });

        $clients = Client::select('id', 'name')->get();

        return Inertia::render('projects/index', [
            'projects' => $projectsWithDetails,
            'clients' => $clients,
        ]);
    }

    // Store a new project for a specific client
    public function store(Request $request, Client $client)
    {
        $project = $client->projects()->create($request->all());
        return response()->json($project, 201);
    }

    // Store a new project from the projects page
    public function storeProject(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);
        
        $project = new Project($validated);
        $project->created_by = Auth::id();
        $project->updated_by = Auth::id();
        $project->save();
        
        return redirect()->route('projects.index');
    }

    // Show a specific project
    public function show(Project $project)
    {
        return $project;
    }

    // Update a specific project
    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);
        
        $project->update($validated);
        $project->updated_by = Auth::id();
        $project->save();
        
        return redirect()->route('projects.index');
    }

    // Delete a specific project
    public function destroy(Project $project)
    {
        $project->delete();
        return response()->json(null, 204);
    }

    public function latestProjects()
    {
        $projects = Project::with(['client', 'vulnerabilities'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        // Map the projects to include client_name and vulnerability count
        $projectsWithDetails = $projects->map(function ($project) {
            return [
                'id' => $project->id,
                'client_name' => $project->client->name,
                'name' => $project->name,
                'status' => $project->status,
                'due_date' => $project->due_date,
                'vulnerability_count' => $project->vulnerabilities->count(),
            ];
        });

        return response()->json($projectsWithDetails);
    }
}

