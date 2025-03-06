<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

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
        \Log::info('Received client data for creation: ' . json_encode($request->all()));
        
        // Validare
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

        \Log::info('Validated client data (after defaults): ' . json_encode($validated));

        // Adăugare utilizator curent ca creator și editor
        // If the user isn't authenticated, default to user ID 1 (likely an admin)
        $userId = Auth::id() ?? 1;
        $validated['created_by'] = $userId;
        $validated['updated_by'] = $userId;

        // Creare client
        $client = Client::create($validated);
        
        // Log the client that was actually saved
        \Log::info('Saved client data: ' . json_encode($client->toArray()));

        // Check if this is an API request or an Inertia request
        if ($request->expectsJson()) {
            return response()->json($client, 201);
        }
        
        // Return an Inertia redirect response for web requests
        return redirect()->route('clients.index')->with('message', 'Client created successfully');
    }

    public function show(Request $request, Client $client)
    {
        if ($request->expectsJson()) {
            return response()->json($client);
        }
        
        // Redirect to edit page since we don't have a separate show view
        return redirect()->route('clients.edit', $client);
    }

    public function edit(Client $client)
    {
        return Inertia::render('clients/edit', [
            'client' => $client
        ]);
    }

    public function update(Request $request, Client $client)
    {
        \Log::info('Received client data for update: ' . json_encode($request->all()));
        
        // Validare
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

        \Log::info('Validated client data (after defaults): ' . json_encode($validated));

        // Adăugare utilizator curent ca editor
        // Ensure updated_by is not null by using Auth::id() if available,
        // or falling back to the client's created_by value
        $userId = Auth::id();
        if ($userId) {
            $validated['updated_by'] = $userId;
        } else {
            // If no authenticated user, use the original creator
            $validated['updated_by'] = $client->created_by;
        }

        // Actualizare client
        $client->update($validated);

        // Check if this is an API request or an Inertia request
        if ($request->expectsJson()) {
            return response()->json($client, 200);
        }
        
        // Return an Inertia redirect response for web requests
        return redirect()->route('clients.index')->with('message', 'Client updated successfully');
    }

    public function destroy(Request $request, Client $client)
    {
        // Verificare dacă clientul are proiecte asociate
        if ($client->projects()->count() > 0) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Nu se poate șterge clientul deoarece are proiecte asociate.'], 422);
            }
            return redirect()->back()->with('error', 'Nu se poate șterge clientul deoarece are proiecte asociate.');
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