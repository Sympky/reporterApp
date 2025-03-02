<?php

namespace App\Http\Controllers;

use App\Models\Clients;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientsController extends Controller
{
    public function index(Clients $clients)
    {
        // Fetch all clients and return them as a JSON response
        return response()->json(Clients::all());
    }

    public function create()
    {
        return Inertia::render('Clients/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:clients',
            'address' => 'nullable|string',
        ]);

        Clients::create($request->all());
        return redirect()->route('clients.index')->with('success', 'Client created successfully!');
    }

    public function show(Clients $client)
    {
        $projects = $client->projects;
        return Inertia::render('Clients/Show', ['client' => $client, 'projects' => $projects]);
    }

    public function edit(Clients $client)
    {
        return Inertia::render('Clients/Edit', ['client' => $client]);
    }

    public function update(Request $request, Clients $client)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:clients,email,' . $client->id,
            'address' => 'nullable|string',
        ]);

        $client->update($request->all());
        return redirect()->route('clients.index')->with('success', 'Client updated successfully!');
    }

    public function destroy(Clients $client)
    {
        $client->delete();
        return redirect()->route('clients.index')->with('success', 'Client deleted successfully!');
    }
}