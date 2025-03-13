<?php

namespace App\Services\ReportGeneration;

use App\Models\Report;
use PhpOffice\PhpWord\TemplateProcessor;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\Settings;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TemplateReportGenerator implements ReportGeneratorInterface
{
    /**
     * Generate a report document using a template.
     *
     * @param Report $report The report to generate
     * @return string|null The path to the generated file, or null on failure
     */
    public function generateReport(Report $report): ?string
    {
        try {
            // Increase PHP execution time for complex reports
            $originalTimeout = ini_get('max_execution_time');
            set_time_limit(120); // Set to 2 minutes
            
            Log::info("Generating report from template for report ID: {$report->id}");
            
            // Ensure a template is assigned
            if (!$report->reportTemplate) {
                Log::error("Template-based report generation failed: No template assigned to report ID: {$report->id}");
                return ReportGenerationUtils::generateEmergencyReport($report);
            }
            
            // Get the template file path - this should be stored as a relative path
            $templatePath = $report->reportTemplate->file_path;
            
            Log::info("Original template path from database: {$templatePath}");
            
            // Determine the correct disk - templates should be stored in 'public' disk
            $disk = 'public';
            
            // Remove any disk prefix from the path if present
            if (preg_match('#^public/(.+)$#', $templatePath, $matches)) {
                $templatePath = $matches[1];
                Log::info("Adjusted template path by removing 'public/' prefix: {$templatePath}");
            }
            
            // Check if file exists
            $fileExists = Storage::disk($disk)->exists($templatePath);
            Log::info("File exists in {$disk} disk with path '{$templatePath}': " . ($fileExists ? 'Yes' : 'No'));
            
            if (!$fileExists) {
                // Try some alternative paths for backward compatibility
                $possiblePaths = [
                    $templatePath,
                    'storage/' . $templatePath,
                    str_replace('storage/', '', $templatePath),
                    'templates/' . basename($templatePath)
                ];
                
                foreach ($possiblePaths as $path) {
                    Log::info("Trying alternative path: {$path}");
                    if (Storage::disk($disk)->exists($path)) {
                        $templatePath = $path;
                        $fileExists = true;
                        Log::info("Found template at alternative path: {$path}");
                        break;
                    }
                }
                
                if (!$fileExists) {
                    Log::error("Template file not found after trying all possible paths");
                    return ReportGenerationUtils::generateEmergencyReport($report);
                }
            }
            
            // Get the full local path to the template file
            $templateFullPath = Storage::disk($disk)->path($templatePath);
            Log::info("Template full path: {$templateFullPath}");
            
            // Verify the file exists at OS level
            if (!file_exists($templateFullPath)) {
                Log::error("Template file not found at OS level: {$templateFullPath}");
                return ReportGenerationUtils::generateEmergencyReport($report);
            }
            
            // Create template processor
            $templateProcessor = new TemplateProcessor($templateFullPath);
            
            // Get related data
            $client = $report->client;
            $project = $report->project;
            $findings = $report->findings->sortBy('pivot.order');
            $methodologies = $report->methodologies->sortBy('pivot.order');
            
            // Set basic variables in the template
            $templateProcessor->setValue('report_name', $report->name ?? '');
            $templateProcessor->setValue('client_name', $client->name ?? '');
            $templateProcessor->setValue('project_name', $project->name ?? '');
            $templateProcessor->setValue('date', date('F j, Y'));
            $templateProcessor->setValue('executive_summary', $report->executive_summary ?? '');
            
            // Process project information
            if ($project) {
                $templateProcessor->setValue('project_description', $project->description ?? '');
                $templateProcessor->setValue('project_start_date', $project->start_date ? date('F j, Y', strtotime($project->start_date)) : '');
                $templateProcessor->setValue('project_end_date', $project->end_date ? date('F j, Y', strtotime($project->end_date)) : '');
            }
            
            // Process methodologies if template has the appropriate variables
            $this->processMethodologies($templateProcessor, $methodologies);
            
            // Process findings if template has the appropriate variables
            $this->processFindings($templateProcessor, $findings);
            
            // Generate a unique filename
            $fileName = ReportGenerationUtils::generateUniqueFilename($report, 'template_');
            $saveDirectory = 'reports';
            $savePath = $saveDirectory . '/' . $fileName;
            
            // Ensure the reports directory exists
            if (!ReportGenerationUtils::prepareDirectory($saveDirectory, $disk)) {
                return ReportGenerationUtils::generateEmergencyReport($report);
            }
            
            // Use the public disk for storing reports, consistent with our approach
            $disk = 'public';
            $fullSavePath = Storage::disk($disk)->path($savePath);
            
            try {
                // Save the document
                $templateProcessor->saveAs($fullSavePath);
                
                if (!file_exists($fullSavePath)) {
                    throw new \Exception("Failed to create file");
                }
                
                // Update report with the file path - store as relative to the disk
                if (!ReportGenerationUtils::updateReportWithFilePath($report, $savePath, $disk)) {
                    throw new \Exception("Failed to update report record");
                }
                
                Log::info("Template-based report generated at: {$disk}/{$savePath}");
                return $disk . '/' . $savePath;
            } catch (\Exception $e) {
                Log::error("Error saving template-based document: " . $e->getMessage());
                return ReportGenerationUtils::generateEmergencyReport($report);
            }
        } catch (\Exception $e) {
            Log::error("Error in template-based report generation: " . $e->getMessage());
            Log::error($e->getTraceAsString());
            return ReportGenerationUtils::generateEmergencyReport($report);
        } finally {
            // Restore original timeout
            if (isset($originalTimeout)) {
                set_time_limit((int)$originalTimeout);
            }
        }
    }
    
    /**
     * Process methodologies dynamically for the report.
     *
     * @param TemplateProcessor $templateProcessor The template processor instance
     * @param \Illuminate\Database\Eloquent\Collection $methodologies The methodologies collection
     * @return void
     */
    private function processMethodologies(TemplateProcessor $templateProcessor, $methodologies): void
    {
        // Check if template has methodology placeholder
        try {
            // Basic methodology count
            $templateProcessor->setValue('methodology_count', $methodologies->count());
            
            // Process each methodology as a list item
            if ($methodologies->count() > 0) {
                $methodologyNames = [];
                $methodologyDescriptions = [];
                
                foreach ($methodologies as $methodology) {
                    $methodologyNames[] = $methodology->name ?? 'Untitled Methodology';
                    $methodologyDescriptions[] = $methodology->description ?? 'No description provided.';
                }
                
                // Try to replace methodology variables in the template
                try {
                    $templateProcessor->cloneBlock('methodology_block', $methodologies->count(), true, true);
                    
                    foreach ($methodologies as $index => $methodology) {
                        $i = $index + 1;
                        $templateProcessor->setValue("methodology_name#{$i}", $methodology->name ?? 'Untitled Methodology');
                        $templateProcessor->setValue("methodology_description#{$i}", $methodology->description ?? 'No description provided.');
                    }
                } catch (\Exception $e) {
                    // Fallback: If block-based replacement fails, try simple list
                    Log::info("Block-based methodology replacement failed, trying simple list: " . $e->getMessage());
                    
                    try {
                        $templateProcessor->setValue('methodology_list', implode("\n", $methodologyNames));
                        $templateProcessor->setValue('methodology_descriptions', implode("\n\n", $methodologyDescriptions));
                    } catch (\Exception $e2) {
                        Log::info("Simple methodology list replacement failed: " . $e2->getMessage());
                    }
                }
            } else {
                // If no methodologies, set empty values
                try {
                    $templateProcessor->setValue('methodology_list', 'No methodologies provided.');
                    $templateProcessor->setValue('methodology_descriptions', '');
                } catch (\Exception $e) {
                    Log::info("Empty methodology list replacement failed: " . $e->getMessage());
                }
            }
        } catch (\Exception $e) {
            Log::info("Methodology processing failed: " . $e->getMessage());
        }
    }
    
    /**
     * Process findings (vulnerabilities) dynamically for the report.
     *
     * @param TemplateProcessor $templateProcessor The template processor instance
     * @param \Illuminate\Database\Eloquent\Collection $findings The findings collection
     * @return void
     */
    private function processFindings(TemplateProcessor $templateProcessor, $findings): void
    {
        // Check if template has findings placeholder
        try {
            // Basic findings count
            $templateProcessor->setValue('finding_count', $findings->count());
            
            // Process each finding
            if ($findings->count() > 0) {
                $findingNames = [];
                $severities = [];
                
                foreach ($findings as $vulnerability) {
                    $findingNames[] = $vulnerability->name ?? 'Untitled Finding';
                    $severities[] = $vulnerability->severity ?? 'Unspecified';
                }
                
                // Try to replace finding variables in the template using block clone
                try {
                    $templateProcessor->cloneBlock('finding_block', $findings->count(), true, true);
                    
                    foreach ($findings as $index => $vulnerability) {
                        $i = $index + 1;
                        $templateProcessor->setValue("finding_name#{$i}", $vulnerability->name ?? 'Untitled Finding');
                        $templateProcessor->setValue("finding_severity#{$i}", $vulnerability->severity ?? 'Unspecified');
                        $templateProcessor->setValue("finding_description#{$i}", $vulnerability->description ?? 'No description provided.');
                        $templateProcessor->setValue("finding_impact#{$i}", $vulnerability->impact ?? 'Impact not specified.');
                        $templateProcessor->setValue("finding_recommendations#{$i}", $vulnerability->recommendations ?? 'No recommendations provided.');
                        
                        // Handle evidence if available
                        $pivotData = $vulnerability->pivot;
                        if ($pivotData && $pivotData->include_evidence && !empty($vulnerability->evidence)) {
                            $templateProcessor->setValue("finding_evidence#{$i}", $vulnerability->evidence);
                        } else {
                            $templateProcessor->setValue("finding_evidence#{$i}", 'No evidence provided.');
                        }
                    }
                } catch (\Exception $e) {
                    // Fallback: If block-based replacement fails, try simple list
                    Log::info("Block-based finding replacement failed, trying simple list: " . $e->getMessage());
                    
                    try {
                        $templateProcessor->setValue('finding_list', implode("\n", $findingNames));
                    } catch (\Exception $e2) {
                        Log::info("Simple finding list replacement failed: " . $e2->getMessage());
                    }
                }
            } else {
                // If no findings, set empty values
                try {
                    $templateProcessor->setValue('finding_list', 'No findings identified.');
                } catch (\Exception $e) {
                    Log::info("Empty finding list replacement failed: " . $e->getMessage());
                }
            }
        } catch (\Exception $e) {
            Log::info("Findings processing failed: " . $e->getMessage());
        }
    }
} 