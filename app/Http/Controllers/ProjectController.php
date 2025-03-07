<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Vulnerability;

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
        // Load the project with its client and vulnerabilities
        $project->load('client');
        
        // Get vulnerabilities for this project
        $vulnerabilities = $project->vulnerabilities()
            ->where('is_template', false)
            ->orderBy('severity', 'desc')
            ->get()
            ->map(function ($vulnerability) {
                // Parse JSON fields
                $evidence = json_decode($vulnerability->evidence, true) ?? [];
                $tags = json_decode($vulnerability->tags, true) ?? [];
                
                return [
                    'id' => $vulnerability->id,
                    'project_id' => $vulnerability->project_id,
                    'name' => $vulnerability->name,
                    'description' => $vulnerability->description,
                    'recommendations' => $vulnerability->recommendations,
                    'impact' => $vulnerability->impact,
                    'references' => $vulnerability->references,
                    'affected_components' => $vulnerability->affected_components,
                    'affected_resources' => $vulnerability->affected_resources,
                    'tags' => $tags,
                    'severity' => ucfirst(strtolower($vulnerability->severity)),
                    'cvss' => $vulnerability->cvss ? (float)$vulnerability->cvss : null,
                    'cve' => $vulnerability->cve,
                    'likelihood_score' => ucfirst(strtolower($vulnerability->likelihood_score)),
                    'remediation_score' => ucfirst(strtolower($vulnerability->remediation_score)),
                    'impact_score' => ucfirst(strtolower($vulnerability->impact_score)),
                    'status' => $vulnerability->status,
                    'remediation_steps' => $vulnerability->remediation_steps,
                    'proof_of_concept' => $vulnerability->proof_of_concept,
                    'discovered_at' => $vulnerability->discovered_at,
                    'evidence' => [
                        'screenshot' => $evidence['screenshot'] ?? null,
                        'logs' => $evidence['logs'] ?? null
                    ],
                    'created_at' => $vulnerability->created_at,
                    'updated_at' => $vulnerability->updated_at
                ];
            });
            
        // Get vulnerability templates for the add vulnerability form
        $templates = Vulnerability::where('is_template', true)
            ->orderBy('name')
            ->get();
        
        return Inertia::render('projects/show', [
            'project' => $project,
            'vulnerabilities' => $vulnerabilities,
            'templates' => $templates,
        ]);
    }

    // Show form to edit a project
    public function edit(Project $project)
    {
        // Load the related client for the project
        $project->load('client');
        
        // Get the list of available clients for the dropdown
        $clients = Client::select('id', 'name')->get();
        
        return Inertia::render('projects/edit', [
            'project' => $project,
            'clients' => $clients,
        ]);
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
                'client_id' => $project->client_id,
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

