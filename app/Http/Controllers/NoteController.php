<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\Client;
use App\Models\Project;
use App\Models\Vulnerability;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NoteController extends Controller
{
    /**
     * Store a new note for a model (client, project, vulnerability).
     */
    public function store(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'content' => 'required|string',
            'notable_type' => 'required|string|in:client,project,vulnerability',
            'notable_id' => 'required|integer',
        ]);
        
        // Map the notable_type to the correct model class
        $modelMap = [
            'client' => Client::class,
            'project' => Project::class,
            'vulnerability' => Vulnerability::class,
        ];
        
        // Get the model class
        $modelClass = $modelMap[$validated['notable_type']];
        
        // Find the model instance
        $model = $modelClass::findOrFail($validated['notable_id']);
        
        // Create the note
        $note = $model->notes()->create([
            'content' => $validated['content'],
            'created_by' => Auth::id(),
        ]);
        
        return redirect()->back()->with('success', 'Note added successfully.');
    }
    
    /**
     * Get notes for a model (client, project, vulnerability).
     */
    public function getNotes(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'notable_type' => 'required|string|in:client,project,vulnerability',
            'notable_id' => 'required|integer',
        ]);
        
        // Map the notable_type to the correct model class
        $modelMap = [
            'client' => Client::class,
            'project' => Project::class,
            'vulnerability' => Vulnerability::class,
        ];
        
        // Get the model class
        $modelClass = $modelMap[$validated['notable_type']];
        
        // Find the model instance
        $model = $modelClass::findOrFail($validated['notable_id']);
        
        // Get the notes with creator information
        $notes = $model->notes()
            ->with('creator:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($note) {
                return [
                    'id' => $note->id,
                    'content' => $note->content,
                    'created_at' => $note->created_at,
                    'created_by' => $note->creator ? $note->creator->name : 'Unknown',
                ];
            });
        
        return response()->json($notes);
    }
    
    /**
     * Delete a note.
     */
    public function destroy(Note $note)
    {
        // Check if the current user is the creator of the note
        if ($note->created_by !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $note->delete();
        
        return redirect()->back()->with('success', 'Note deleted successfully.');
    }
}
