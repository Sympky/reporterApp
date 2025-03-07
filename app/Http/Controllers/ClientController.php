<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ClientController extends Controller
{
    public function index()
    {
        return Inertia::render('clients/index', [
            'clients' => $this->getClients()
        ]);
    }

    public function create()
    {
        return Inertia::render('clients/create');
    }

    public function store(Request $request)
    {
        Log::info('Received client data for creation: ' . json_encode($request->all()));
        
        // Validation
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'emails' => 'nullable|string',
            'phone_numbers' => 'nullable|string',
            'addresses' => 'nullable|string',
            'website_urls' => 'nullable|string',
            'other_contact_info' => 'nullable|string',
        ]);

        // Default empty JSON arrays
        foreach (['emails', 'phone_numbers', 'website_urls', 'other_contact_info'] as $field) {
            if (empty($validated[$field])) {
                $validated[$field] = '[]';
            }
        }

        Log::info('Validated client data: ' . json_encode($validated));

        // Create the client
        $client = new Client($validated);
        $client->created_by = Auth::id();
        $client->updated_by = Auth::id();
        $client->save();

        Log::info('Client created successfully with ID: ' . $client->id);

        return redirect()->route('clients.index');
    }

    public function show(Request $request, Client $client)
    {
        if ($request->expectsJson()) {
            return response()->json($client);
        }
        
        // Get projects for this client
        $projects = $client->projects()
            ->with('vulnerabilities')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'client_id' => $project->client_id,
                    'name' => $project->name,
                    'description' => $project->description,
                    'status' => $project->status,
                    'due_date' => $project->due_date,
                    'vulnerability_count' => $project->vulnerabilities->count(),
                ];
            });
            
        return Inertia::render('clients/show', [
            'client' => $client,
            'projects' => $projects,
        ]);
    }

    public function edit(Client $client)
    {
        return Inertia::render('clients/edit', [
            'client' => $client
        ]);
    }

    public function update(Request $request, Client $client)
    {
        Log::info('Received client data for update: ' . json_encode($request->all()));
        
        // Validation
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'emails' => 'nullable|string',
            'phone_numbers' => 'nullable|string',
            'addresses' => 'nullable|string',
            'website_urls' => 'nullable|string',
            'other_contact_info' => 'nullable|string',
        ]);

        // Default empty JSON arrays
        foreach (['emails', 'phone_numbers', 'website_urls', 'other_contact_info'] as $field) {
            if (empty($validated[$field])) {
                $validated[$field] = '[]';
            }
        }

        Log::info('Validated client data: ' . json_encode($validated));

        // Update the client
        $client->fill($validated);
        $client->updated_by = Auth::id();
        $client->save();

        Log::info('Client updated successfully with ID: ' . $client->id);

        return redirect()->route('clients.index');
    }

    public function destroy(Request $request, Client $client)
    {
        // Check if the client has associated projects
        if ($client->projects()->count() > 0) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Cannot delete the client because they have associated projects.'], 422);
            }
            return redirect()->back()->with('error', 'Cannot delete the client because they have associated projects.');
        }

        // Ștergere client
        $client->delete();

        // Check if this is an API request or an Inertia request
        if ($request->expectsJson()) {
            return response()->json(null, 204);
        }
        
        // Return an Inertia redirect response for web requests
        return redirect()->route('clients.index')->with('message', 'Client deleted successfully');
    }

    public function latestClients()
    {
        $clients = Client::orderBy('created_at', 'desc')->take(5)->get();
        return response()->json($clients);
    }

    private function getClients()
    {
        return Client::orderBy('created_at', 'desc')->get();
    }
}