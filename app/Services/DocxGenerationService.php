<?php

namespace App\Services;

use App\Models\Report;
use PhpOffice\PhpWord\TemplateProcessor;
use PhpOffice\PhpWord\IOFactory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class DocxGenerationService
{
    /**
     * Generate a DOCX report file from a template.
     *
     * @param Report $report The report to generate
     * @return string|null The path to the generated file, or null on failure
     */
    public function generateReport(Report $report): ?string
    {
        try {
            // Get the template file path
            $templatePath = $report->reportTemplate->file_path;
            
            Log::info("Original template path: {$templatePath}");
            
            // Check if file exists at original path
            $fileExists = Storage::exists($templatePath);
            Log::info("File exists at original path: " . ($fileExists ? 'Yes' : 'No'));
            
            if (!$fileExists) {
                // Path correction logic
                $correctedPath = null;
                
                // Case 1: Missing 'storage' in path (public/templates/...)
                if (preg_match('#^public/templates/(.+)$#', $templatePath, $matches)) {
                    $correctedPath = 'public/storage/templates/' . $matches[1];
                    Log::info("Trying corrected path (added storage): {$correctedPath}");
                    
                    // Check if file exists at this corrected path
                    $fileExists = Storage::exists($correctedPath);
                    Log::info("File exists at corrected path (added storage): " . ($fileExists ? 'Yes' : 'No'));
                    
                    if ($fileExists) {
                        Log::info("Template path corrected from {$templatePath} to {$correctedPath}");
                        $templatePath = $correctedPath;
                    }
                }
                
                // Case 2: Double storage in path (public/storage/storage/templates/...)
                if (!$fileExists && preg_match('#^public/storage/storage/templates/(.+)$#', $templatePath, $matches)) {
                    $correctedPath = 'public/storage/templates/' . $matches[1];
                    Log::info("Trying corrected path (removed duplicate storage): {$correctedPath}");
                    
                    // Check if file exists at this corrected path
                    $fileExists = Storage::exists($correctedPath);
                    Log::info("File exists at corrected path (removed duplicate): " . ($fileExists ? 'Yes' : 'No'));
                    
                    if ($fileExists) {
                        Log::info("Template path corrected from {$templatePath} to {$correctedPath}");
                        $templatePath = $correctedPath;
                    }
                }
                
                // Case 3: Check explicitly for public/storage/templates path
                if (!$fileExists) {
                    $explicitPath = 'public/storage/templates/' . basename($templatePath);
                    Log::info("Trying explicit path: {$explicitPath}");
                    
                    // Check if file exists at this explicit path
                    $fileExists = Storage::exists($explicitPath);
                    Log::info("File exists at explicit path: " . ($fileExists ? 'Yes' : 'No'));
                    
                    if ($fileExists) {
                        Log::info("Template path corrected from {$templatePath} to {$explicitPath}");
                        $templatePath = $explicitPath;
                    }
                }
                
                // If no valid path was found, try different disk access methods
                if (!$fileExists) {
                    // Try direct disk access with public disk
                    $publicDiskPath = 'templates/' . basename($templatePath);
                    Log::info("Trying direct public disk path: {$publicDiskPath}");
                    
                    $fileExists = Storage::disk('public')->exists($publicDiskPath);
                    Log::info("File exists with direct public disk access: " . ($fileExists ? 'Yes' : 'No'));
                    
                    if ($fileExists) {
                        Log::info("Template found on public disk at: {$publicDiskPath}");
                        // Convert to a path that Storage::copy can use
                        $templatePath = 'public/storage/templates/' . basename($templatePath);
                        $fileExists = true;
                        
                        // Create a symlink to ensure the file is accessible
                        if (!file_exists(public_path('storage'))) {
                            Log::info("Creating symlink from storage/app/public to public/storage");
                            try {
                                symlink(storage_path('app/public'), public_path('storage'));
                                Log::info("Symlink created successfully");
                            } catch (\Exception $e) {
                                Log::warning("Symlink creation failed: " . $e->getMessage());
                            }
                        }
                    } else {
                        // Make one last direct check for the actual file
                        $physicalPath = storage_path('app/public/storage/templates/' . basename($templatePath));
                        Log::info("Checking physical path as last resort: {$physicalPath}");
                        
                        if (file_exists($physicalPath)) {
                            Log::info("File found at physical path! Using direct path");
                            $templatePath = 'public/storage/templates/' . basename($templatePath);
                            $fileExists = true;
                        } else {
                            throw new \Exception("Template file not found: {$templatePath}");
                        }
                    }
                }
            }

            // Create temp directory if it doesn't exist
            $tempDir = 'temp';
            if (!Storage::exists($tempDir)) {
                Storage::makeDirectory($tempDir);
            }

            // Define the temporary file path
            $tempFileName = basename($templatePath);
            $tempFilePath = $tempDir . '/' . $tempFileName;
            
            // Copy the template to the temp directory
            if (preg_match('#^public/storage/templates/(.+)$#', $templatePath, $matches)) {
                // Direct disk copy for public disk
                $sourceFile = 'templates/' . $matches[1];
                $fileExists = Storage::disk('public')->exists($sourceFile);
                Log::info("Preparing to copy from public disk: {$sourceFile}, Exists: " . ($fileExists ? 'Yes' : 'No'));
                
                if ($fileExists) {
                    $sourceContents = Storage::disk('public')->get($sourceFile);
                    $copySuccess = Storage::put($tempFilePath, $sourceContents);
                    Log::info("Direct disk copy result: " . ($copySuccess ? 'Success' : 'Failed'));
                } else {
                    throw new \Exception("Source template not found for copy operation: {$sourceFile}");
                }
            } else if (!Storage::copy($templatePath, $tempFilePath)) {
                throw new \Exception("Failed to copy template file to temp directory");
            }
            
            // Get the full path to the temporary file
            $tempTemplatePath = Storage::path($tempFilePath);
            
            // Verify the file was created
            if (!file_exists($tempTemplatePath)) {
                throw new \Exception("Failed to create temporary template file: {$tempTemplatePath}");
            }

            // Create template processor
            $templateProcessor = new TemplateProcessor($tempTemplatePath);

            // Set basic report information
            $templateProcessor->setValue('{report_name}', $report->name);
            $templateProcessor->setValue('{client_name}', $report->client->name);
            $templateProcessor->setValue('{project_name}', $report->project->name);
            $templateProcessor->setValue('{date}', now()->format('F j, Y'));
            
            // Set executive summary if available
            if ($report->executive_summary) {
                $templateProcessor->setValue('{executive_summary}', $report->executive_summary);
            } else {
                $templateProcessor->setValue('{executive_summary}', 'No executive summary provided.');
            }

            // Handle methodologies
            $methodologies = $report->methodologies;
            if ($methodologies->count() > 0) {
                // Create a clone block for each methodology
                $templateProcessor->cloneBlock('methodology_block', $methodologies->count(), true, true);
                
                // Set values for each methodology
                foreach ($methodologies as $index => $methodology) {
                    $blockIndex = $index + 1;
                    $templateProcessor->setValue("methodology_title#{$blockIndex}", $methodology->title);
                    $templateProcessor->setValue("methodology_content#{$blockIndex}", $methodology->content);
                }
            } else {
                // If no methodologies, remove the block
                $templateProcessor->deleteBlock('methodology_block');
            }

            // Handle findings (vulnerabilities)
            $findings = $report->findings;
            if ($findings->count() > 0) {
                // Create a clone block for each finding
                $templateProcessor->cloneBlock('finding_block', $findings->count(), true, true);
                
                // Set values for each finding
                foreach ($findings as $index => $vulnerability) {
                    $blockIndex = $index + 1;
                    $templateProcessor->setValue("finding_name#{$blockIndex}", $vulnerability->name);
                    $templateProcessor->setValue("finding_severity#{$blockIndex}", $vulnerability->severity);
                    $templateProcessor->setValue("finding_description#{$blockIndex}", $vulnerability->description);
                    $templateProcessor->setValue("finding_impact#{$blockIndex}", $vulnerability->impact);
                    $templateProcessor->setValue("finding_recommendations#{$blockIndex}", $vulnerability->recommendations);
                    
                    // Include evidence files if needed
                    $pivotData = $vulnerability->pivot;
                    if ($pivotData->include_evidence && $vulnerability->files->count() > 0) {
                        // Here you would add images from evidence files
                        // This requires more complex handling with PhpWord
                        // For simplicity, just mentioning file names for now
                        $fileNames = $vulnerability->files->pluck('original_name')->implode(', ');
                        $templateProcessor->setValue("finding_evidence#{$blockIndex}", "Evidence files: {$fileNames}");
                    } else {
                        $templateProcessor->setValue("finding_evidence#{$blockIndex}", 'No evidence files included.');
                    }
                }
            } else {
                // If no findings, remove the block
                $templateProcessor->deleteBlock('finding_block');
            }

            // Generate a unique filename for the report
            $fileName = 'report_' . Str::slug($report->name) . '_' . time() . '.docx';
            
            // Store the file in the public disk's reports directory
            $disk = 'public'; // Use the public disk explicitly
            $saveDirectory = 'reports';
            $savePath = $saveDirectory . '/' . $fileName;
            
            // Log the paths for debugging
            Log::info("Saving report file in public disk, directory: {$saveDirectory}, Path: {$savePath}");
            
            // Ensure the reports directory exists in the public disk
            if (!Storage::disk($disk)->exists($saveDirectory)) {
                Log::info("Creating directory: {$saveDirectory} in {$disk} disk");
                Storage::disk($disk)->makeDirectory($saveDirectory);
            }

            // Get the storage directory's real path
            $storagePath = storage_path('app/public/' . $saveDirectory);
            if (!is_dir($storagePath)) {
                mkdir($storagePath, 0755, true);
                Log::info("Created physical directory: {$storagePath}");
            }

            // Full path to save the document
            $fullSavePath = storage_path('app/public/' . $savePath);
            Log::info("Full save path: {$fullSavePath}");
            
            // Save the document
            $templateProcessor->saveAs($fullSavePath);
            
            // Verify the file was created
            if (!file_exists($fullSavePath)) {
                Log::error("Failed to save generated report file: {$fullSavePath}");
                throw new \Exception("Failed to save generated report file: {$fullSavePath}");
            } else {
                Log::info("File successfully saved at: {$fullSavePath}");
                Log::info("File size: " . filesize($fullSavePath) . " bytes");
                
                // Set proper file permissions
                chmod($fullSavePath, 0644);
                Log::info("File permissions set to 0644");
            }
            
            // Clean up the temporary file
            if (Storage::exists($tempFilePath)) {
                Storage::delete($tempFilePath);
            }

            // Update the report with the file path and disk info
            // Store the complete path including the disk prefix
            $report->generated_file_path = 'public/' . $savePath;
            $report->status = 'generated';
            $report->updated_by = Auth::id();
            $report->save();
            
            Log::info("Report record updated with file path: public/{$savePath}");

            return 'public/' . $savePath;
        } catch (\Exception $e) {
            Log::error('Error generating report: ' . $e->getMessage());
            return null;
        }
    }
} 