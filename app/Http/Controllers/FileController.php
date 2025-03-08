<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Client;
use App\Models\Project;
use App\Models\Vulnerability;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileController extends Controller
{
    /**
     * Upload a file to a model (client, project, vulnerability).
     */
    public function upload(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'file' => 'required|file|max:25600', // 25MB max file size
            'fileable_type' => 'required|string|in:client,project,vulnerability',
            'fileable_id' => 'required|integer',
            'description' => 'nullable|string|max:1000',
        ]);
        
        // Map the fileable_type to the correct model class
        $modelMap = [
            'client' => Client::class,
            'project' => Project::class,
            'vulnerability' => Vulnerability::class,
        ];
        
        // Get the model class
        $modelClass = $modelMap[$validated['fileable_type']];
        
        // Find the model instance
        $model = $modelClass::findOrFail($validated['fileable_id']);
        
        // Get the uploaded file
        $uploadedFile = $request->file('file');
        
        // Generate a unique name for the file
        $fileName = Str::uuid() . '.' . $uploadedFile->getClientOriginalExtension();
        
        // Determine the storage path based on the hierarchy
        $storagePath = $this->getStoragePath($model);
        
        // Store the file in the storage
        $path = $uploadedFile->storeAs($storagePath, $fileName, 'public');
        
        // Create a file record in the database
        $file = new File([
            'name' => $fileName,
            'original_name' => $uploadedFile->getClientOriginalName(),
            'mime_type' => $uploadedFile->getMimeType(),
            'size' => $uploadedFile->getSize(),
            'path' => $path,
            'description' => $request->input('description'),
            'uploaded_by' => Auth::id(),
        ]);
        
        // Associate the file with the model
        $file = $model->files()->save($file);
        
        // Return response
        return response()->json([
            'message' => 'File uploaded successfully',
            'file' => $file,
        ]);
    }
    
    /**
     * Get files for a model (client, project, vulnerability).
     */
    public function getFiles(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'fileable_type' => 'required|string|in:client,project,vulnerability',
            'fileable_id' => 'required|integer',
        ]);
        
        // Map the fileable_type to the correct model class
        $modelMap = [
            'client' => Client::class,
            'project' => Project::class,
            'vulnerability' => Vulnerability::class,
        ];
        
        // Get the model class
        $modelClass = $modelMap[$validated['fileable_type']];
        
        // Find the model instance
        $model = $modelClass::findOrFail($validated['fileable_id']);
        
        // Get the files with uploader information
        $files = $model->files()
            ->with('uploader:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($file) {
                return [
                    'id' => $file->id,
                    'name' => $file->original_name,
                    'size' => $this->formatFileSize($file->size),
                    'mime_type' => $file->mime_type,
                    'description' => $file->description,
                    'uploaded_at' => $file->created_at,
                    'uploaded_by' => $file->uploader ? $file->uploader->name : 'Unknown',
                    'download_url' => route('files.download', $file->id),
                    'is_image' => $file->isImage(),
                    'is_pdf' => $file->isPdf(),
                ];
            });
        
        return response()->json($files);
    }
    
    /**
     * Download a file.
     */
    public function download(File $file)
    {
        $filePath = Storage::disk('public')->path($file->path);
        
        if (!file_exists($filePath)) {
            abort(404, 'File not found');
        }
        
        return response()->download($filePath, $file->original_name);
    }
    
    /**
     * Delete a file.
     */
    public function destroy(File $file)
    {
        // Check if the current user is the uploader of the file
        if ($file->uploaded_by !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Delete the file from storage
        Storage::disk('public')->delete($file->path);
        
        // Delete the file record
        $file->delete();
        
        return response()->json(['message' => 'File deleted successfully']);
    }
    
    /**
     * Determine the storage path based on the entity and its hierarchy.
     */
    private function getStoragePath($model)
    {
        if ($model instanceof Client) {
            return 'files/clients/' . $model->id;
        } elseif ($model instanceof Project) {
            return 'files/clients/' . $model->client_id . '/projects/' . $model->id;
        } elseif ($model instanceof Vulnerability) {
            $project = $model->project;
            return 'files/clients/' . $project->client_id . '/projects/' . $project->id . '/vulnerabilities/' . $model->id;
        }
        
        return 'files/others';
    }
    
    /**
     * Format file size to human-readable format.
     */
    private function formatFileSize($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
    
    /**
     * Create storage directories for a model if they don't exist.
     */
    public function createStorageDirectories($model)
    {
        $path = $this->getStoragePath($model);
        Storage::disk('public')->makeDirectory($path);
        return response()->json(['message' => 'Storage directories created successfully']);
    }
}
