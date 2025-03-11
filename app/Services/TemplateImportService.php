<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

class TemplateImportService extends VulnerabilityImportService
{
    /**
     * Import vulnerability templates from a CSV/Excel file
     *
     * @param UploadedFile $file The uploaded file
     * @param int|null $projectId Not used for templates, but required for method signature
     * @param bool $isTemplate Always true for templates
     * @return array The import results, including success count and errors
     */
    public function import(UploadedFile $file, int $projectId = null, bool $isTemplate = true): array
    {
        // Before importing, log that we're calling this specifically for templates
        \Illuminate\Support\Facades\Log::info('Template import service called', [
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType()
        ]);
        
        // Always force isTemplate to true
        return parent::import($file, null, true);
    }
} 