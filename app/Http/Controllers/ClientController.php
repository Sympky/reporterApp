<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientController extends Controller
{
    public function index(Client $client)
    {
        // Fetch all clients and return them as a JSON response
        return response()->json(Client::all());
    }

    public function create()
    {

    }

    public function store(Request $request)
    {

    }

    public function show(Client $client)
    {
        return response()->json($client);
    }

    public function edit(Client $client)
    {

    }

    public function update(Request $request, Client $client)
    {

    }

    public function destroy(Client $client)
    {

    }

    public function latestClients()
    {
        $clients = Client::orderBy('created_at', 'desc')->take(5)->get();
        return response()->json($clients);
    }
}