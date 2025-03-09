<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use App\Models\ReportTemplate;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all templates that don't already have a disk prefix
        $templates = ReportTemplate::whereRaw("file_path NOT LIKE 'public/%'")->get();
        
        foreach ($templates as $template) {
            // Old path in default disk
            $oldPath = $template->file_path;
            
            // New path in public disk
            $newFileName = basename($oldPath);
            $newDir = 'templates';
            $newPath = $newDir . '/' . $newFileName;
            
            // Check if old file exists
            if (Storage::exists($oldPath)) {
                // Ensure the public directory exists
                if (!Storage::disk('public')->exists($newDir)) {
                    Storage::disk('public')->makeDirectory($newDir);
                }
                
                // Copy the file to the public disk
                $fileContents = Storage::get($oldPath);
                Storage::disk('public')->put($newPath, $fileContents);
                
                // Update the template record
                $template->file_path = 'public/' . $newPath;
                $template->save();
                
                // Remove old file
                Storage::delete($oldPath);
                
                echo "Moved template ID {$template->id} from {$oldPath} to public/{$newPath}\n";
            } else {
                // If file doesn't exist, just update the path format
                $template->file_path = 'public/' . $oldPath;
                $template->save();
                
                echo "Updated template ID {$template->id} path format to public/{$oldPath}\n";
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This is a one-way migration - reverting would be complex and potentially destructive
        // We're not implementing a down method to avoid potential data loss
    }
};
