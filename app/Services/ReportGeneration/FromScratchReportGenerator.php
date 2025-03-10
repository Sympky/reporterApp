<?php

namespace App\Services\ReportGeneration;

use App\Models\Report;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\Settings;
use PhpOffice\PhpWord\Style\Font;
use PhpOffice\PhpWord\Style\TOC;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class FromScratchReportGenerator implements ReportGeneratorInterface
{
    /**
     * Generate a report document from scratch.
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
            
            Log::info("Generating report from scratch for report ID: {$report->id}");
            
            // Create new PHPWord instance
            $phpWord = new PhpWord();
            
            // Set default font
            $phpWord->setDefaultFontName('Arial');
            $phpWord->setDefaultFontSize(11);
            
            // Add document properties
            $properties = $phpWord->getDocInfo();
            $properties->setCreator('Report Generator App');
            $properties->setCompany($report->client->name ?? 'Company');
            $properties->setTitle($report->name);
            $properties->setDescription('Security Report');
            $properties->setCategory('Security Reports');
            
            // Get related data
            $client = $report->client;
            $project = $report->project;
            $findings = $report->findings->sortBy('pivot.order');
            $methodologies = $report->methodologies->sortBy('pivot.order');
            
            // Create the document content
            $section = $phpWord->addSection();
            
            // Title page
            $section->addText($report->name, ['bold' => true, 'size' => 18], ['alignment' => 'center', 'spaceAfter' => 240]);
            $section->addText('Security Assessment Report', ['italic' => true, 'size' => 14], ['alignment' => 'center', 'spaceAfter' => 240]);
            $section->addText('Prepared for:', ['bold' => true], ['alignment' => 'center']);
            $section->addText($client->name ?? 'Client Name', null, ['alignment' => 'center']);
            $section->addText('Project: ' . ($project->name ?? 'Project Name'), null, ['alignment' => 'center']);
            $section->addText('Date: ' . date('F j, Y'), null, ['alignment' => 'center', 'spaceAfter' => 240]);
            
            // Add page break after title page
            $section->addPageBreak();
            
            // Table of Contents
            $section->addText('Table of Contents', ['bold' => true, 'size' => 16], ['spaceAfter' => 120]);
            $toc = $section->addTOC(['spaceAfter' => 240]);
            
            // Add page break after TOC
            $section->addPageBreak();
            
            // Executive Summary
            $section->addTitle("Executive Summary", 1);
            if (!empty($report->executive_summary)) {
                $section->addText($report->executive_summary);
            } else {
                $section->addText('No executive summary provided.');
            }
            $section->addTextBreak(2);
            
            // Project Information
            $section->addTitle("Project Information", 1);
            $section->addText("Client: " . ($client->name ?? 'N/A'), ['bold' => true]);
            $section->addText("Project: " . ($project->name ?? 'N/A'), ['bold' => true]);
            $section->addTextBreak(1);
            
            if ($project && !empty($project->description)) {
                $section->addText($project->description);
            }
            $section->addTextBreak(2);
            
            // Methodology
            if ($methodologies->count() > 0) {
                $section->addTitle("Methodology", 1);
                
                foreach ($methodologies as $methodology) {
                    $section->addTitle($methodology->name ?? 'Untitled Methodology', 2);
                    $section->addText($methodology->description ?? 'No description provided.');
                    $section->addTextBreak(1);
                }
                
                $section->addTextBreak(1);
            }
            
            // Findings
            if ($findings->count() > 0) {
                $section->addTitle("Findings", 1);
                
                foreach ($findings as $vulnerability) {
                    $section->addTitle($vulnerability->name ?? 'Untitled Finding', 2);
                    
                    // Add severity
                    $section->addText("Severity: " . ($vulnerability->severity ?? 'Unspecified'), ['bold' => true]);
                    $section->addTextBreak(1);
                    
                    // Add description
                    $section->addText("Description:", ['bold' => true]);
                    $section->addText($vulnerability->description ?? 'No description provided.');
                    $section->addTextBreak(1);
                    
                    // Add impact
                    $section->addText("Impact:", ['bold' => true]);
                    $section->addText($vulnerability->impact ?? 'Impact not specified.');
                    $section->addTextBreak(1);
                    
                    // Add recommendations
                    $section->addText("Recommendations:", ['bold' => true]);
                    $section->addText($vulnerability->recommendations ?? 'No recommendations provided.');
                    $section->addTextBreak(2);
                    
                    // Add evidence if available and requested
                    $pivotData = $vulnerability->pivot;
                    if ($pivotData && $pivotData->include_evidence && !empty($vulnerability->evidence)) {
                        $section->addText("Evidence:", ['bold' => true]);
                        $section->addText($vulnerability->evidence);
                        $section->addTextBreak(2);
                    }
                }
            }
            
            // Generate a unique filename
            $fileName = ReportGenerationUtils::generateUniqueFilename($report);
            $saveDirectory = 'reports';
            $savePath = $saveDirectory . '/' . $fileName;
            
            // Ensure the reports directory exists
            if (!ReportGenerationUtils::prepareDirectory($saveDirectory)) {
                return ReportGenerationUtils::generateEmergencyReport($report);
            }
            
            // Full path to save the document
            $fullSavePath = storage_path('app/public/' . $savePath);
            
            // Create writer and save
            try {
                // Use pure PHP implementation with no XML manipulation for stability
                Settings::setOutputEscapingEnabled(true);
                
                $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
                $objWriter->save($fullSavePath);
                
                if (!file_exists($fullSavePath)) {
                    throw new \Exception("Failed to create file");
                }
                
                // Update report with the file path
                if (!ReportGenerationUtils::updateReportWithFilePath($report, 'public/' . $savePath)) {
                    throw new \Exception("Failed to update report record");
                }
                
                Log::info("From scratch report generated at: public/{$savePath}");
                
                return 'public/' . $savePath;
            } catch (\Exception $e) {
                Log::error("Error saving document: " . $e->getMessage());
                return ReportGenerationUtils::generateEmergencyReport($report);
            }
        } catch (\Exception $e) {
            Log::error("Error in from scratch report generation: " . $e->getMessage());
            Log::error($e->getTraceAsString());
            return ReportGenerationUtils::generateEmergencyReport($report);
        } finally {
            // Restore original timeout
            if (isset($originalTimeout)) {
                set_time_limit((int)$originalTimeout);
            }
        }
    }
} 