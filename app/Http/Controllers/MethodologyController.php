<?php

namespace App\Http\Controllers;

use App\Models\Methodology;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class MethodologyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $methodologies = Methodology::with(['createdBy:id,name', 'updatedBy:id,name'])
            ->orderBy('title')
            ->get();

        return Inertia::render('methodologies/index', [
            'methodologies' => $methodologies
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('methodologies/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $methodology = new Methodology($validated);
        $methodology->created_by = Auth::id();
        $methodology->updated_by = Auth::id();
        $methodology->save();

        return redirect()->route('methodologies.index')
            ->with('message', 'Methodology created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Methodology $methodology)
    {
        $methodology->load(['createdBy:id,name', 'updatedBy:id,name']);
        
        return Inertia::render('methodologies/show', [
            'methodology' => $methodology
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Methodology $methodology)
    {
        return Inertia::render('methodologies/edit', [
            'methodology' => $methodology
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Methodology $methodology)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $methodology->fill($validated);
        $methodology->updated_by = Auth::id();
        $methodology->save();

        return redirect()->route('methodologies.show', $methodology)
            ->with('message', 'Methodology updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Methodology $methodology)
    {
        $methodology->delete();

        return redirect()->route('methodologies.index')
            ->with('message', 'Methodology deleted successfully');
    }
}
