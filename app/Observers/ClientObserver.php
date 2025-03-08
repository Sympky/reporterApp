<?php

namespace App\Observers;

use App\Models\Client;
use Illuminate\Support\Facades\Storage;

class ClientObserver
{
    /**
     * Handle the Client "created" event.
     */
    public function created(Client $client): void
    {
        // Create storage directory for the client
        $path = 'files/clients/' . $client->id;
        Storage::disk('public')->makeDirectory($path);
    }

    /**
     * Handle the Client "updated" event.
     */
    public function updated(Client $client): void
    {
        //
    }

    /**
     * Handle the Client "deleted" event.
     */
    public function deleted(Client $client): void
    {
        // Delete the client's files from storage
        $client->files->each(function ($file) {
            Storage::disk('public')->delete($file->path);
        });
        
        // Delete the client's directory
        $path = 'files/clients/' . $client->id;
        Storage::disk('public')->deleteDirectory($path);
    }

    /**
     * Handle the Client "restored" event.
     */
    public function restored(Client $client): void
    {
        //
    }

    /**
     * Handle the Client "force deleted" event.
     */
    public function forceDeleted(Client $client): void
    {
        //
    }
}
