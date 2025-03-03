<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index(Client $client)
    {
         // Fetch all clients and return them as a JSON response
         return response()->json(Project::all());
    }

    public function create(Client $client)
    {

    }

    public function store(Request $request, Client $client)
    {

    }

    public function show(Client $client, Project $project)
    {

    }

    public function edit(Client $client, Project $project)
    {

    }

    public function update(Request $request, Client $client, Project $project)
    {

    }

    public function destroy(Client $client, Project $project)
    {

    }
}

