<?php

namespace App\Observers;

use App\Models\Project;
use Illuminate\Support\Facades\Storage;

class ProjectObserver
{
    /**
     * Handle the Project "created" event.
     */
    public function created(Project $project): void
    {
        // Create storage directory for the project
        $path = 'files/clients/' . $project->client_id . '/projects/' . $project->id;
        Storage::disk('public')->makeDirectory($path);
    }

    /**
     * Handle the Project "updated" event.
     */
    public function updated(Project $project): void
    {
        //
    }

    /**
     * Handle the Project "deleted" event.
     */
    public function deleted(Project $project): void
    {
        // Delete the project's files from storage
        $project->files->each(function ($file) {
            Storage::disk('public')->delete($file->path);
        });
        
        // Delete the project's directory
        $path = 'files/clients/' . $project->client_id . '/projects/' . $project->id;
        Storage::disk('public')->deleteDirectory($path);
    }

    /**
     * Handle the Project "restored" event.
     */
    public function restored(Project $project): void
    {
        //
    }

    /**
     * Handle the Project "force deleted" event.
     */
    public function forceDeleted(Project $project): void
    {
        //
    }
}
