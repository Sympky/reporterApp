<?php

namespace App\Http\Controllers;

use App\Models\Clients;
use App\Models\Projects;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectsController extends Controller
{
    public function index(Clients $client)
    {
         // Fetch all clients and return them as a JSON response
         return response()->json(Projects::all());
    }

    public function create(Clients $client)
    {
        return Inertia::render('Projects/Create', ['client' => $client]);
    }

    public function store(Request $request, Clients $client)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $client->projects()->create($request->all());
        return redirect()->route('clients.projects.index', $client)->with('success', 'Project created successfully!');
    }

    public function show(Clients $client, Projects $project)
    {
        return Inertia::render('Projects/Show', ['client' => $client, 'project' => $project]);
    }

    public function edit(Clients $client, Projects $project)
    {
        return Inertia::render('Projects/Edit', ['client' => $client, 'project' => $project]);
    }

    public function update(Request $request, Clients $client, Projects $project)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $project->update($request->all());
        return redirect()->route('clients.projects.index', $client)->with('success', 'Project updated successfully!');
    }

    public function destroy(Clients $client, Projects $project)
    {
        $project->delete();
        return redirect()->route('clients.projects.index', $client)->with('success', 'Project deleted successfully!');
    }
}

