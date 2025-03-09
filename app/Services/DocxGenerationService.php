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
            if (!Storage::exists($templatePath)) {
                throw new \Exception("Template file not found: {$templatePath}");
            }

            // Create temp directory if it doesn't exist
            $tempDirPath = storage_path('app/temp');
            if (!file_exists($tempDirPath)) {
                mkdir($tempDirPath, 0755, true);
            }

            // Define the temporary file path
            $tempTemplatePath = $tempDirPath . '/' . basename($templatePath);
            
            // Get the template content and save it to the temporary location
            $templateContent = Storage::get($templatePath);
            file_put_contents($tempTemplatePath, $templateContent);
            
            // Verify the file was created
            if (!file_exists($tempTemplatePath)) {
                throw new \Exception("Failed to create temporary template file: {$tempTemplatePath}");
            }

            // Create template processor
            $templateProcessor = new TemplateProcessor($tempTemplatePath);

            // Set basic report information
            $templateProcessor->setValue('report_name', $report->name);
            $templateProcessor->setValue('client_name', $report->client->name);
            $templateProcessor->setValue('project_name', $report->project->name);
            $templateProcessor->setValue('date', now()->format('F j, Y'));
            
            // Set executive summary if available
            if ($report->executive_summary) {
                $templateProcessor->setValue('executive_summary', $report->executive_summary);
            } else {
                $templateProcessor->setValue('executive_summary', 'No executive summary provided.');
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
            $saveDirectory = 'reports';
            $savePath = $saveDirectory . '/' . $fileName;
            
            // Ensure the reports directory exists in storage
            $storageReportsDirPath = storage_path('app/' . $saveDirectory);
            if (!file_exists($storageReportsDirPath)) {
                mkdir($storageReportsDirPath, 0755, true);
            }

            // Full path to save the document
            $fullSavePath = storage_path('app/' . $savePath);
            
            // Save the document
            $templateProcessor->saveAs($fullSavePath);
            
            // Verify the file was created
            if (!file_exists($fullSavePath)) {
                throw new \Exception("Failed to save generated report file: {$fullSavePath}");
            }
            
            // Clean up the temporary file
            if (file_exists($tempTemplatePath)) {
                unlink($tempTemplatePath);
            }

            // Update the report with the file path
            $report->generated_file_path = $savePath;
            $report->status = 'generated';
            $report->updated_by = Auth::id();
            $report->save();

            return $savePath;
        } catch (\Exception $e) {
            Log::error('Error generating report: ' . $e->getMessage());
            return null;
        }
    }
} 