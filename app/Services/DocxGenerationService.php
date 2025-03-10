<?php

namespace App\Services;

use App\Models\Report;
use PhpOffice\PhpWord\TemplateProcessor;
use PhpOffice\PhpWord\IOFactory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * @deprecated This service is deprecated and will be removed in a future version.
 * Use App\Services\ReportGeneration\FromScratchReportGenerator or
 * App\Services\ReportGeneration\TemplateReportGenerator instead.
 */
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
            // Increase PHP execution time for complex reports
            $originalTimeout = ini_get('max_execution_time');
            set_time_limit(120); // Set to 2 minutes
            
            // If generate_from_scratch is enabled, bypass template processing completely
            if ($report->generate_from_scratch) {
                Log::info("Generate from scratch option enabled. Skipping template processing.");
                return $this->generateHybridReport($report);
            }
            
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

            // Skip all the template processing and just create a new document from scratch
            // This is the most reliable approach given the consistent corruption issues
            return $this->generateHybridReport($report);
        } catch (\Exception $e) {
            Log::error('Error generating report: ' . $e->getMessage());
            Log::error('Trace: ' . $e->getTraceAsString());
            
            // In case of timeout or other critical error, try one last fallback approach
            try {
                Log::warning("Attempting emergency fallback report generation");
                return $this->generateEmergencyReport($report);
            } catch (\Exception $fallbackException) {
                Log::error("Emergency fallback also failed: " . $fallbackException->getMessage());
                return null;
            }
        }
    }

    /**
     * Generate a super simple but reliable report when other methods fail
     *
     * @param Report $report The report to generate
     * @return string|null The path to the generated file, or null on failure
     */
    private function generateHybridReport(Report $report): ?string
    {
        try {
            Log::info("Generating structured report from scratch based on standardized format");
            
            // Create a PhpWord document with proper formatting according to guidelines
            $phpWord = new \PhpOffice\PhpWord\PhpWord();
            
            // Define styles based on our style guide
            $styles = [
                'heading1' => ['name' => 'Georgia', 'size' => 18, 'color' => '003366', 'bold' => true],
                'heading2' => ['name' => 'Georgia', 'size' => 16, 'color' => '003366', 'bold' => true],
                'heading3' => ['name' => 'Georgia', 'size' => 14, 'color' => '003366', 'bold' => true],
                'heading4' => ['name' => 'Georgia', 'size' => 12, 'color' => '003366', 'bold' => true],
                'normal' => ['name' => 'Calibri', 'size' => 11, 'color' => '333333'],
                'tablehead' => ['bgColor' => '003366', 'color' => 'FFFFFF', 'bold' => true]
            ];
            
            // Define standard severity colors
            $severityColors = [
                'Critical' => 'FF0000',  // Red
                'High'     => 'FF7F00',  // Orange
                'Medium'   => 'FFFF00',  // Yellow
                'Low'      => '0000FF',  // Blue
                'Info'     => '00FF00'   // Green
            ];
            
            // Add a section with standard margins
            $section = $phpWord->addSection();
            
            // === COVER PAGE ===
            // Title
            $section->addText($report->name, $styles['heading1']);
            $section->addTextBreak(1);
            
            // Report metadata
            $section->addText('Client: ' . ($report->client->name ?? 'Unknown Client'), $styles['normal']);
            $section->addText('Project: ' . ($report->project->name ?? 'Unknown Project'), $styles['normal']);
            $section->addText('Assessment Period: ' . now()->subDays(30)->format('F j, Y') . ' to ' . now()->format('F j, Y'), $styles['normal']);
            $section->addText('Report Date: ' . now()->format('F j, Y'), $styles['normal']);
            $section->addText('Report Version: 1.0', $styles['normal']);
            $section->addPageBreak();
            
            // === TABLE OF CONTENTS ===
            $section->addText('TABLE OF CONTENTS', $styles['heading2']);
            $section->addText('[Table of contents will be generated automatically]', $styles['normal']);
            $section->addPageBreak();
            
            // === EXECUTIVE SUMMARY ===
            $section->addText('EXECUTIVE SUMMARY', $styles['heading2']);
            
            $section->addText('Assessment Overview', $styles['heading3']);
            $section->addText($report->executive_summary ?? 'This security assessment evaluated the systems and applications within scope for security vulnerabilities and configuration weaknesses. The assessment followed industry standard methodologies and utilized a combination of automated and manual testing techniques.', $styles['normal']);
            $section->addTextBreak(1);
            
            $section->addText('Key Findings Summary', $styles['heading3']);
            // Generate a summary based on the severity counts
            $findings = $report->findings;
            $findingCounts = [
                'Critical' => $findings->where('severity', 'Critical')->count(),
                'High' => $findings->where('severity', 'High')->count(),
                'Medium' => $findings->where('severity', 'Medium')->count(),
                'Low' => $findings->where('severity', 'Low')->count(),
                'Info' => $findings->where('severity', 'Informational')->count(),
            ];
            
            $findingSummary = "This assessment identified a total of " . $findings->count() . " findings: ";
            $findingSummary .= $findingCounts['Critical'] . " Critical, ";
            $findingSummary .= $findingCounts['High'] . " High, ";
            $findingSummary .= $findingCounts['Medium'] . " Medium, ";
            $findingSummary .= $findingCounts['Low'] . " Low, and ";
            $findingSummary .= $findingCounts['Info'] . " Informational issues.";
            
            $section->addText($findingSummary, $styles['normal']);
            $section->addTextBreak(1);
            
            // Risk Heat Map - placeholder text since we would generate this as an image
            $section->addText('Risk Assessment', $styles['heading3']);
            $section->addText('[Risk heat map visualization would be placed here showing the distribution of findings by severity and impact]', $styles['normal']);
            $section->addTextBreak(1);
            
            // Summary Statistics
            $section->addText('Summary Statistics', $styles['heading4']);
            $statsTable = $section->addTable(['borderSize' => 0, 'cellMargin' => 80]);
            $statsTable->addRow();
            $statsTable->addCell(3000)->addText('Total Vulnerabilities Found:', $styles['normal']);
            $statsTable->addCell(1000)->addText($findings->count(), $styles['normal']);
            
            foreach ($findingCounts as $severity => $count) {
                $statsTable->addRow();
                $statsTable->addCell(3000)->addText($severity . ' Severity Issues:', $styles['normal']);
                $statsTable->addCell(1000)->addText($count, $styles['normal']);
            }
            $section->addTextBreak(1);
            
            // Priority Recommendations
            $section->addText('Priority Recommendations', $styles['heading3']);
            // Generate recommendations based on Critical and High findings
            $criticalHighFindings = $findings->filter(function($finding) {
                return in_array($finding->severity, ['Critical', 'High']);
            })->take(5);
            
            if ($criticalHighFindings->count() > 0) {
                foreach ($criticalHighFindings as $index => $finding) {
                    $section->addListItem($finding->title, 0, $styles['normal']);
                }
            } else {
                $section->addText('No critical or high priority recommendations identified.', $styles['normal']);
            }
            
            $section->addPageBreak();
            
            // === INTRODUCTION ===
            $section->addText('INTRODUCTION', $styles['heading2']);
            
            $section->addText('Assessment Scope', $styles['heading3']);
            $scopeText = 'This assessment covered the following systems and applications:';
            $section->addText($scopeText, $styles['normal']);
            // In a real implementation, you would get this from the project scope
            $section->addListItem('Web applications and services', 0, $styles['normal']);
            $section->addListItem('Network infrastructure', 0, $styles['normal']);
            $section->addListItem('Internal systems and databases', 0, $styles['normal']);
            $section->addTextBreak(1);
            
            $section->addText('Assessment Objectives', $styles['heading3']);
            $section->addText('The objectives of this security assessment were to:', $styles['normal']);
            $section->addListItem('Identify security vulnerabilities in the in-scope systems', 0, $styles['normal']);
            $section->addListItem('Assess the impact of identified vulnerabilities', 0, $styles['normal']);
            $section->addListItem('Provide actionable remediation guidance', 0, $styles['normal']);
            $section->addTextBreak(1);
            
            $section->addText('Client Environment', $styles['heading3']);
            $section->addText('The client environment consists of [environment description would be inserted here based on project information].', $styles['normal']);
            $section->addPageBreak();
            
            // === METHODOLOGY ===
            $section->addText('METHODOLOGY', $styles['heading2']);
            
            // Add methodology section content from linked methodologies if available
            $methodologies = $report->methodologies;
            if ($methodologies->count() > 0) {
                foreach ($methodologies as $methodology) {
                    $section->addText($methodology->title, $styles['heading3']);
                    $content = $methodology->content ?? 'No content provided.';
                    $paragraphs = explode("\n\n", $content);
                    
                    foreach ($paragraphs as $paragraph) {
                        if (trim($paragraph) !== '') {
                            $section->addText(trim($paragraph), $styles['normal']);
                            $section->addTextBreak(1);
                        }
                    }
                }
            } else {
                // Standard methodology text if none provided
                $section->addText('Testing Approach', $styles['heading3']);
                $section->addText('This assessment utilized a combination of automated scanning and manual testing techniques following industry standard methodologies.', $styles['normal']);
                $section->addTextBreak(1);
                
                $section->addText('Tools Utilized', $styles['heading3']);
                $section->addText('The assessment utilized various security testing tools including:', $styles['normal']);
                $section->addListItem('Vulnerability scanners and analyzers', 0, $styles['normal']);
                $section->addListItem('Web application security testing tools', 0, $styles['normal']);
                $section->addListItem('Network security assessment tools', 0, $styles['normal']);
                $section->addTextBreak(1);
            }
            
            // Severity Rating System
            $section->addText('Severity Rating System', $styles['heading3']);
            $section->addText('The following severity ratings were used to classify findings:', $styles['normal']);
            
            $severityTable = $section->addTable(['borderSize' => 1, 'borderColor' => '000000']);
            
            // Table header
            $severityTable->addRow();
            $header = $severityTable->addCell(1500);
            $header->addText('Severity', $styles['tablehead']);
            $header = $severityTable->addCell(4500);
            $header->addText('Description', $styles['tablehead']);
            $header = $severityTable->addCell(2000);
            $header->addText('Risk Level', $styles['tablehead']);
            
            // Severity definitions
            $severityDefinitions = [
                'Critical' => [
                    'desc' => 'Vulnerabilities that can be easily exploited and result in complete system compromise or significant data breach.',
                    'risk' => 'Immediate'
                ],
                'High' => [
                    'desc' => 'Vulnerabilities that are harder to exploit but could still lead to system compromise or data breach.',
                    'risk' => 'Urgent'
                ],
                'Medium' => [
                    'desc' => 'Vulnerabilities that require specific conditions to exploit or have limited impact.',
                    'risk' => 'Moderate'
                ],
                'Low' => [
                    'desc' => 'Vulnerabilities that have minimal impact or are very difficult to exploit.',
                    'risk' => 'Low'
                ],
                'Info' => [
                    'desc' => 'Informational findings that don\'t pose a direct security risk but may be useful to know.',
                    'risk' => 'Minimal'
                ]
            ];
            
            foreach ($severityDefinitions as $severity => $details) {
                $severityTable->addRow();
                $cell = $severityTable->addCell(1500);
                $textRun = $cell->addTextRun();
                $textRun->addText($severity, array_merge($styles['normal'], ['color' => isset($severityColors[$severity]) ? $severityColors[$severity] : '000000']));
                $severityTable->addCell(4500)->addText($details['desc'], $styles['normal']);
                $severityTable->addCell(2000)->addText($details['risk'], $styles['normal']);
            }
            
            $section->addPageBreak();
            
            // === FINDINGS MATRIX ===
            $section->addText('FINDINGS MATRIX', $styles['heading2']);
            
            $section->addText('Overview of Findings', $styles['heading3']);
            
            // Findings matrix table
            if ($findings->count() > 0) {
                $findingsTable = $section->addTable(['borderSize' => 1, 'borderColor' => '000000']);
                
                // Table header
                $findingsTable->addRow();
                $headers = ['ID', 'Title', 'Severity', 'Affected Systems', 'Remediation Difficulty'];
                $widths = [800, 3000, 1200, 2000, 1500];
                
                foreach ($headers as $index => $header) {
                    $cell = $findingsTable->addCell($widths[$index]);
                    $cell->addText($header, $styles['tablehead']);
                }
                
                // Add findings to table
                foreach ($findings as $index => $finding) {
                    $findingsTable->addRow();
                    
                    // ID column
                    $findingsTable->addCell($widths[0])->addText('F' . ($index + 1), $styles['normal']);
                    
                    // Title column
                    $findingsTable->addCell($widths[1])->addText($finding->title, $styles['normal']);
                    
                    // Severity column with color
                    $cell = $findingsTable->addCell($widths[2]);
                    $textRun = $cell->addTextRun();
                    $textRun->addText($finding->severity, array_merge($styles['normal'], [
                        'color' => isset($severityColors[$finding->severity]) ? $severityColors[$finding->severity] : '000000',
                        'bold' => true
                    ]));
                    
                    // Affected systems
                    $affectedSystems = $finding->affected_components ?? 'All systems';
                    $findingsTable->addCell($widths[3])->addText($affectedSystems, $styles['normal']);
                    
                    // Remediation difficulty
                    $difficulty = $finding->remediation_difficulty ?? 'Medium';
                    $findingsTable->addCell($widths[4])->addText($difficulty, $styles['normal']);
                }
            } else {
                $section->addText('No findings were identified during this assessment.', $styles['normal']);
            }
            
            $section->addTextBreak(1);
            
            // Findings Distribution section
            $section->addText('Findings Distribution', $styles['heading3']);
            $section->addText('[Charts showing finding distribution by severity, category, and affected systems would be placed here]', $styles['normal']);
            
            $section->addPageBreak();
            
            // === DETAILED FINDINGS ===
            $section->addText('DETAILED FINDINGS', $styles['heading2']);
            
            if ($findings->count() > 0) {
                // Group findings by category
                $categories = $findings->groupBy(function($finding) {
                    return $finding->category ?? 'General';
                });
                
                foreach ($categories as $category => $categoryFindings) {
                    $section->addText("Category: {$category}", $styles['heading3']);
                    
                    foreach ($categoryFindings as $index => $finding) {
                        // Finding title
                        $section->addText($finding->title, $styles['heading4']);
                        
                        // Severity with color
                        $textRun = $section->addTextRun();
                        $textRun->addText('Severity: ', ['bold' => true]);
                        $textRun->addText($finding->severity, array_merge($styles['normal'], [
                            'color' => isset($severityColors[$finding->severity]) ? $severityColors[$finding->severity] : '000000',
                            'bold' => true
                        ]));
                        
                        // Affected Components
                        $section->addText('Affected Components:', ['bold' => true]);
                        $components = $finding->affected_components ?? 'All systems';
                        $componentsArray = explode(',', $components);
                        foreach ($componentsArray as $component) {
                            $section->addListItem(trim($component), 0, $styles['normal']);
                        }
                        
                        // Description
                        $section->addText('Description:', ['bold' => true]);
                        $description = $finding->description ?? 'No description provided.';
                        $section->addText($description, $styles['normal']);
                        
                        // Proof of Concept
                        $section->addText('Proof of Concept:', ['bold' => true]);
                        $poc = $finding->proof_of_concept ?? 'No proof of concept provided.';
                        $section->addText($poc, $styles['normal']);
                        
                        // Impact
                        $section->addText('Impact:', ['bold' => true]);
                        $impact = $finding->impact ?? 'Impact not specified.';
                        $section->addText($impact, $styles['normal']);
                        
                        // Remediation Steps
                        $section->addText('Remediation Steps:', ['bold' => true]);
                        $remediation = $finding->remediation ?? 'No remediation steps provided.';
                        $section->addText($remediation, $styles['normal']);
                        
                        // Verification Steps
                        $section->addText('Verification Steps:', ['bold' => true]);
                        $verification = $finding->verification_steps ?? 'No verification steps provided.';
                        $section->addText($verification, $styles['normal']);
                        
                        $section->addTextBreak(2);
                    }
                }
            } else {
                $section->addText('No findings were identified during this assessment.', $styles['normal']);
            }
            
            $section->addPageBreak();
            
            // === REMEDIATION RECOMMENDATIONS ===
            $section->addText('REMEDIATION RECOMMENDATIONS', $styles['heading2']);
            
            // Critical and High Priority Actions
            $section->addText('Critical and High Priority Actions', $styles['heading3']);
            $criticalHighFindings = $findings->filter(function($finding) {
                return in_array($finding->severity, ['Critical', 'High']);
            });
            
            if ($criticalHighFindings->count() > 0) {
                foreach ($criticalHighFindings as $finding) {
                    $section->addListItem("{$finding->title} - Address immediately", 0, $styles['normal']);
                }
            } else {
                $section->addText('No critical or high priority actions required.', $styles['normal']);
            }
            $section->addTextBreak(1);
            
            // Medium Priority Actions
            $section->addText('Medium Priority Actions', $styles['heading3']);
            $mediumFindings = $findings->filter(function($finding) {
                return $finding->severity === 'Medium';
            });
            
            if ($mediumFindings->count() > 0) {
                foreach ($mediumFindings as $finding) {
                    $section->addListItem("{$finding->title} - Address within 1-3 months", 0, $styles['normal']);
                }
            } else {
                $section->addText('No medium priority actions required.', $styles['normal']);
            }
            $section->addTextBreak(1);
            
            // Long-term Security Improvements
            $section->addText('Long-term Security Improvements', $styles['heading3']);
            $section->addText('The following strategic recommendations will improve the overall security posture:', $styles['normal']);
            $section->addListItem('Implement a formal security awareness training program', 0, $styles['normal']);
            $section->addListItem('Establish a vulnerability management program', 0, $styles['normal']);
            $section->addListItem('Conduct regular security assessments', 0, $styles['normal']);
            $section->addTextBreak(1);
            
            // Remediation Timeline
            $section->addText('Remediation Timeline', $styles['heading3']);
            $section->addText('[A Gantt chart or timeline visualization would be placed here showing suggested remediation schedule]', $styles['normal']);
            
            $section->addPageBreak();
            
            // === CONCLUSION ===
            $section->addText('CONCLUSION', $styles['heading2']);
            $section->addText('This security assessment identified several areas where security controls could be improved. By addressing the findings according to the recommended prioritization, the organization will significantly improve its security posture and reduce the risk of successful attacks.', $styles['normal']);
            
            $section->addPageBreak();
            
            // === APPENDICES ===
            $section->addText('APPENDICES', $styles['heading2']);
            
            // Appendix A
            $section->addText('Appendix A: Detailed Testing Methodology', $styles['heading3']);
            $section->addText('The assessment utilized industry standard methodologies including OWASP Testing Guide and NIST guidelines.', $styles['normal']);
            
            // Appendix B
            $section->addText('Appendix B: Raw Tool Output', $styles['heading3']);
            $section->addText('Raw output from scanning tools is available upon request.', $styles['normal']);
            
            // Appendix C
            $section->addText('Appendix C: Detailed Code Samples', $styles['heading3']);
            $section->addText('Relevant code samples demonstrating vulnerabilities or fixes are included in the finding details.', $styles['normal']);
            
            // Appendix D
            $section->addText('Appendix D: Glossary of Terms', $styles['heading3']);
            $section->addText('A glossary of technical terms used in this report is available upon request.', $styles['normal']);
            
            $section->addPageBreak();
            
            // === DISCLAIMERS AND LIMITATIONS ===
            $section->addText('DISCLAIMERS AND LIMITATIONS', $styles['heading2']);
            $section->addText('This report represents a point-in-time assessment of security vulnerabilities and may not reflect the current state of the systems if changes have been made since the assessment. The assessment was conducted according to the agreed scope and methodology, and findings are limited to what could be discovered within that scope.', $styles['normal']);
            
            // === FOOTER ===
            $section->addTextBreak(2);
            $section->addText('Prepared by: ' . (Auth::user()->name ?? 'Security Assessor'), $styles['normal']);
            $section->addText('Contact: ' . (Auth::user()->email ?? 'security@example.com'), $styles['normal']);
            
            // Generate unique filename for the report
            $timestamp = now()->format('YmdHis');
            $reportSlug = Str::slug($report->name);
            $savePath = 'reports/' . $reportSlug . '_' . $timestamp . '.docx';
            // Ensure we're using the public disk for storage
            $fullSavePath = storage_path('app/public/' . $savePath);
            
            // Make sure directory exists
            $dirPath = dirname($fullSavePath);
            if (!is_dir($dirPath)) {
                mkdir($dirPath, 0755, true);
            }
            
            try {
                // Create writer and save directly - no temp files or complex processing
                $objWriter = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'Word2007');
                
                // Use pure PHP implementation with no XML manipulation
                \PhpOffice\PhpWord\Settings::setOutputEscapingEnabled(true);
                
                // Save the document
                $objWriter->save($fullSavePath);
                
                if (!file_exists($fullSavePath)) {
                    throw new \Exception("Failed to create file");
                }
                
                // Update report record with public path for proper access
                $report->generated_file_path = 'public/' . $savePath;
                $report->status = 'generated';
                $report->updated_by = Auth::id();
                $report->save();
                
                return 'public/' . $savePath;
            } catch (\Exception $e) {
                Log::error("Error saving document: " . $e->getMessage());
                
                // If normal save fails, try fallback HTML save
                return $this->generateEmergencyReport($report);
            }
        } catch (\Exception $e) {
            Log::error("Error in simplified report generation: " . $e->getMessage());
            Log::error($e->getTraceAsString());
            return $this->generateEmergencyReport($report);
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
        try {
            // Set a time limit specifically for methodology processing to prevent timeouts
            $timeLimit = 10; // seconds
            $startTime = time();
            
            // Check if the special block markers are in the document - these should NEVER appear in the final document
            try {
                $docText = $templateProcessor->getVariableCount('methodology_block');
                if ($docText > 0) {
                    Log::warning("Found literal 'methodology_block' text in the document. This indicates the template may not be properly formatted for PhpWord.");
                    
                    // This is likely to cause problems, so we'll use a simplified approach
                    // Instead of trying complex block replacements, just replace the literal text with formatted content
                    $allMethodologies = '';
                    foreach ($methodologies as $index => $methodology) {
                        $allMethodologies .= "## " . ($methodology->title ?? 'Methodology ' . ($index + 1)) . "\n\n";
                        $allMethodologies .= ($methodology->content ?? 'No content provided.') . "\n\n";
                    }
                    
                    // Replace the literal block marker with the formatted methodologies
                    $templateProcessor->setValue('methodology_block', $allMethodologies);
                    
                    // Early return to avoid potentially problematic block processing
                    return;
                }
            } catch (\Exception $e) {
                Log::warning("Error checking for methodology_block: " . $e->getMessage());
                // Continue with normal processing
            }
            
            // Check if we're approaching the time limit
            if (time() - $startTime > $timeLimit * 0.7) {
                Log::warning("Approaching time limit for methodology processing. Using simplified approach.");
                
                // Use simplified text replacement instead of block cloning
                $placeholders = ['{methodologies}', '{methodology}', '{methodology_section}'];
                
                foreach ($placeholders as $placeholder) {
                    try {
                        if ($templateProcessor->getVariableCount($placeholder) > 0) {
                            // Build a combined methodology text
                            $allMethodologies = '';
                            foreach ($methodologies as $index => $methodology) {
                                $allMethodologies .= "### " . ($methodology->title ?? 'Methodology ' . ($index + 1)) . "\n\n";
                                $allMethodologies .= ($methodology->content ?? 'No content provided.') . "\n\n";
                            }
                            
                            // Replace the placeholder with all methodologies
                            $templateProcessor->setValue($placeholder, $allMethodologies);
                            return;
                        }
                    } catch (\Exception $e) {
                        continue;
                    }
                }
                
                // If we're here, we couldn't find a suitable placeholder
                return;
            }
            
            // Continue with existing block processing code
            if ($methodologies->count() > 0) {
                // Attempt to find various methodology block patterns using more reliable approach
                $blockPatterns = ['methodology_block', 'methodologies_block', 'methodology_section'];
                $foundBlock = false;
                
                foreach ($blockPatterns as $pattern) {
                    // Direct check if the document contains the block tag in PhpWord's format
                    try {
                        // First try the documented approach - proper block tags should be ${pattern}
                        $blockName = $pattern;
                        $templateProcessor->cloneBlock($blockName, $methodologies->count(), true, true);
                        $foundBlock = true;
                        Log::info("Successfully found and cloned methodology block: {$blockName}");
                        break;
                    } catch (\Exception $e) {
                        Log::info("Block pattern '{$pattern}' not found as a proper block. Trying next pattern.");
                        continue;
                    }
                }
                
                if (!$foundBlock) {
                    Log::warning("No methodology block found for cloning. Attempting to insert methodologies directly.");
                    
                    // Fallback: Look for a methodology placeholder we can replace with all methodologies
                    $placeholders = ['{methodologies}', '{methodology}', '{methodology_section}'];
                    
                    foreach ($placeholders as $placeholder) {
                        if ($templateProcessor->getVariableCount($placeholder) > 0) {
                            Log::info("Found placeholder {$placeholder} - using for methodology insertion.");
                            
                            // Build a combined methodology text
                            $allMethodologies = '';
                            foreach ($methodologies as $index => $methodology) {
                                $allMethodologies .= "### " . ($methodology->title ?? 'Methodology ' . ($index + 1)) . "\n\n";
                                $allMethodologies .= ($methodology->content ?? 'No content provided.') . "\n\n";
                            }
                            
                            // Replace the placeholder with all methodologies
                            $templateProcessor->setValue($placeholder, $allMethodologies);
                            $foundBlock = true;
                            break;
                        }
                    }
                    
                    if (!$foundBlock) {
                        Log::warning("Could not find any methodology placeholders. Methodologies will not appear in the document.");
                    }
                } else {
                    // Block was found and cloned successfully, now set values
                    foreach ($methodologies as $index => $methodology) {
                        $blockIndex = $index + 1;
                        
                        // Try different variable naming patterns for flexibility with curly braces
                        $titlePatterns = ["{methodology_title#{$blockIndex}}", "{methodology#{$blockIndex}_title}", "{title#{$blockIndex}}"];
                        $contentPatterns = ["{methodology_content#{$blockIndex}}", "{methodology#{$blockIndex}_content}", "{content#{$blockIndex}}"];
                        
                        // Set the methodology title with null handling
                        $title = $methodology->title ?? 'Methodology ' . $blockIndex;
                        if (!$this->setValueWithFallbacks($templateProcessor, $titlePatterns, $title)) {
                            Log::warning("Could not set methodology title for index {$blockIndex}. Title patterns not found in template.");
                        }
                        
                        // Set the methodology content with null handling
                        $content = $methodology->content ?? 'No content provided.';
                        if (!$this->setValueWithFallbacks($templateProcessor, $contentPatterns, $content)) {
                            Log::warning("Could not set methodology content for index {$blockIndex}. Content patterns not found in template.");
                        }
                    }
                }
            } else {
                // If no methodologies, attempt to remove any methodology blocks
                Log::info("No methodologies to add to the document.");
                $this->tryDeleteBlocks($templateProcessor, ['methodology_block', 'methodologies_block', 'methodology_section']);
                
                // Also try to clear any methodology placeholders
                $placeholders = ['{methodologies}', '{methodology}', '{methodology_section}'];
                foreach ($placeholders as $placeholder) {
                    if ($templateProcessor->getVariableCount($placeholder) > 0) {
                        $templateProcessor->setValue($placeholder, 'No methodologies provided.');
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Error processing methodologies: ' . $e->getMessage());
            Log::error('Trace: ' . $e->getTraceAsString());
        }
    }

    /**
     * Process findings dynamically for the report.
     *
     * @param TemplateProcessor $templateProcessor The template processor instance
     * @param \Illuminate\Database\Eloquent\Collection $findings The findings (vulnerabilities) collection
     * @return void
     */
    private function processFindings(TemplateProcessor $templateProcessor, $findings): void
    {
        try {
            // Check if the special block markers are in the document - these should NEVER appear in the final document
            $docText = $templateProcessor->getVariableCount('finding_block');
            if ($docText > 0) {
                Log::warning("Found literal 'finding_block' text in the document. This indicates the template may not be properly formatted for PhpWord.");
                
                // Try to replace these literal text markers with proper block markers
                for ($i = 0; $i < $docText; $i++) {
                    // Clear the literal block text to prevent it from appearing in the output
                    $templateProcessor->setValue('finding_block', '');
                }
            }
            
            if ($findings->count() > 0) {
                // Attempt to find various finding block patterns using more reliable approach
                $blockPatterns = ['finding_block', 'findings_block', 'vulnerability_block', 'vulnerabilities_block'];
                $foundBlock = false;
                
                foreach ($blockPatterns as $pattern) {
                    // Direct check if the document contains the block tag in PhpWord's format
                    try {
                        // First try the documented approach - proper block tags should be ${pattern}
                        $blockName = $pattern;
                        $templateProcessor->cloneBlock($blockName, $findings->count(), true, true);
                        $foundBlock = true;
                        Log::info("Successfully found and cloned finding block: {$blockName}");
                        break;
                    } catch (\Exception $e) {
                        Log::info("Block pattern '{$pattern}' not found as a proper block. Trying next pattern.");
                        continue;
                    }
                }
                
                if (!$foundBlock) {
                    Log::warning("No finding block found for cloning. Attempting to insert findings directly.");
                    
                    // Fallback: Look for a findings placeholder we can replace with all findings
                    $placeholders = ['{findings}', '{vulnerabilities}', '{finding_section}', '{vulnerability_section}'];
                    
                    foreach ($placeholders as $placeholder) {
                        if ($templateProcessor->getVariableCount($placeholder) > 0) {
                            Log::info("Found placeholder {$placeholder} - using for findings insertion.");
                            
                            // Build a combined findings text
                            $allFindings = '';
                            foreach ($findings as $index => $vulnerability) {
                                $allFindings .= "### " . ($vulnerability->name ?? 'Finding ' . ($index + 1)) . "\n\n";
                                $allFindings .= "**Severity:** " . ($vulnerability->severity ?? 'Unspecified') . "\n\n";
                                $allFindings .= "**Description:** " . ($vulnerability->description ?? 'No description provided.') . "\n\n";
                                $allFindings .= "**Impact:** " . ($vulnerability->impact ?? 'Impact not specified.') . "\n\n";
                                $allFindings .= "**Recommendations:** " . ($vulnerability->recommendations ?? 'No recommendations provided.') . "\n\n";
                            }
                            
                            // Replace the placeholder with all findings
                            $templateProcessor->setValue($placeholder, $allFindings);
                            $foundBlock = true;
                            break;
                        }
                    }
                    
                    if (!$foundBlock) {
                        Log::warning("Could not find any findings placeholders. Findings will not appear in the document.");
                    }
                } else {
                    // Block was found and cloned successfully, now set values
                    foreach ($findings as $index => $vulnerability) {
                        $blockIndex = $index + 1;
                        
                        // Define possible variable patterns for each field - with curly braces
                        $fieldPatterns = [
                            'name' => ["{finding_name#{$blockIndex}}", "{finding#{$blockIndex}_name}", "{vulnerability_name#{$blockIndex}}"],
                            'severity' => ["{finding_severity#{$blockIndex}}", "{finding#{$blockIndex}_severity}", "{vulnerability_severity#{$blockIndex}}"],
                            'description' => ["{finding_description#{$blockIndex}}", "{finding#{$blockIndex}_description}", "{vulnerability_description#{$blockIndex}}"],
                            'impact' => ["{finding_impact#{$blockIndex}}", "{finding#{$blockIndex}_impact}", "{vulnerability_impact#{$blockIndex}}"],
                            'recommendations' => ["{finding_recommendations#{$blockIndex}}", "{finding#{$blockIndex}_recommendations}", "{vulnerability_recommendations#{$blockIndex}}"],
                            'evidence' => ["{finding_evidence#{$blockIndex}}", "{finding#{$blockIndex}_evidence}", "{vulnerability_evidence#{$blockIndex}}"],
                            'affected_components' => ["{finding_affected_components#{$blockIndex}}", "{finding#{$blockIndex}_affected_components}", "{vulnerability_affected_components#{$blockIndex}}"],
                            'remediation_steps' => ["{finding_remediation_steps#{$blockIndex}}", "{finding#{$blockIndex}_remediation_steps}", "{vulnerability_remediation_steps#{$blockIndex}}"],
                            'proof_of_concept' => ["{finding_proof_of_concept#{$blockIndex}}", "{finding#{$blockIndex}_proof_of_concept}", "{vulnerability_proof_of_concept#{$blockIndex}}"],
                            'references' => ["{finding_references#{$blockIndex}}", "{finding#{$blockIndex}_references}", "{vulnerability_references#{$blockIndex}}"],
                            'affected_resources' => ["{finding_affected_resources#{$blockIndex}}", "{finding#{$blockIndex}_affected_resources}", "{vulnerability_affected_resources#{$blockIndex}}"],
                            'cvss' => ["{finding_cvss#{$blockIndex}}", "{finding#{$blockIndex}_cvss}", "{vulnerability_cvss#{$blockIndex}}"],
                            'cve' => ["{finding_cve#{$blockIndex}}", "{finding#{$blockIndex}_cve}", "{vulnerability_cve#{$blockIndex}}"]
                        ];
                        
                        // Set values for basic fields with enhanced error handling
                        $this->setValueWithFallbacks($templateProcessor, $fieldPatterns['name'], $vulnerability->name ?? 'Untitled Finding');
                        $this->setValueWithFallbacks($templateProcessor, $fieldPatterns['severity'], $vulnerability->severity ?? 'Unspecified');
                        $this->setValueWithFallbacks($templateProcessor, $fieldPatterns['description'], $vulnerability->description ?? 'No description provided.');
                        $this->setValueWithFallbacks($templateProcessor, $fieldPatterns['impact'], $vulnerability->impact ?? 'Impact not specified.');
                        $this->setValueWithFallbacks($templateProcessor, $fieldPatterns['recommendations'], $vulnerability->recommendations ?? 'No recommendations provided.');
                        
                        // Set values for optional fields with enhanced error handling
                        $this->setValueWithFallbacks($templateProcessor, $fieldPatterns['affected_components'], 
                            $vulnerability->affected_components ?? 'Not specified');
                        
                        $this->setValueWithFallbacks($templateProcessor, $fieldPatterns['remediation_steps'], 
                            $vulnerability->remediation_steps ?? 'No remediation steps provided.');
                        
                        $this->setValueWithFallbacks($templateProcessor, $fieldPatterns['proof_of_concept'], 
                            $vulnerability->proof_of_concept ?? 'No proof of concept provided.');
                        
                        $this->setValueWithFallbacks($templateProcessor, $fieldPatterns['references'], 
                            $vulnerability->references ?? 'No references provided.');
                        
                        $this->setValueWithFallbacks($templateProcessor, $fieldPatterns['affected_resources'], 
                            $vulnerability->affected_resources ?? 'None specified.');
                        
                        $this->setValueWithFallbacks($templateProcessor, $fieldPatterns['cvss'], 
                            $vulnerability->cvss ?? 'Not scored.');
                        
                        $this->setValueWithFallbacks($templateProcessor, $fieldPatterns['cve'], 
                            $vulnerability->cve ?? 'N/A');
                        
                        // Include evidence files if needed
                        $pivotData = $vulnerability->pivot;
                        if ($pivotData->include_evidence && $vulnerability->files->count() > 0) {
                            // For now, just list the file names
                            $fileNames = $vulnerability->files->pluck('original_name')->implode(', ');
                            $this->setValueWithFallbacks($templateProcessor, $fieldPatterns['evidence'], "Evidence files: {$fileNames}");
                        } else {
                            $this->setValueWithFallbacks($templateProcessor, $fieldPatterns['evidence'], 'No evidence files included.');
                        }
                    }
                }
            } else {
                // If no findings, attempt to remove any finding blocks
                $this->tryDeleteBlocks($templateProcessor, ['finding_block', 'findings_block', 'vulnerability_block', 'vulnerabilities_block']);
                
                // Also try to clear any findings placeholders
                $placeholders = ['{findings}', '{vulnerabilities}', '{finding_section}', '{vulnerability_section}'];
                foreach ($placeholders as $placeholder) {
                    if ($templateProcessor->getVariableCount($placeholder) > 0) {
                        $templateProcessor->setValue($placeholder, 'No findings to report.');
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Error processing findings: ' . $e->getMessage());
            Log::error('Trace: ' . $e->getTraceAsString());
        }
    }

    /**
     * Attempt to find an existing block in the template that matches one of the given patterns.
     *
     * @param TemplateProcessor $templateProcessor The template processor instance
     * @param array $patterns Array of possible block patterns to look for
     * @return string|null The first block name that exists, or null if none exist
     */
    private function findExistingBlock(TemplateProcessor $templateProcessor, array $patterns): ?string
    {
        foreach ($patterns as $pattern) {
            try {
                // This is a workaround since TemplateProcessor doesn't provide a direct way to check
                // if a block exists. We try to clone it with count=0, which should do nothing if it exists
                // and throw an exception if it doesn't.
                $templateProcessor->cloneBlock($pattern, 0, true, true);
                return $pattern;
            } catch (\Exception $e) {
                continue;
            }
        }
        
        return null;
    }

    /**
     * Attempt to set a value using multiple possible variable names.
     *
     * @param TemplateProcessor $templateProcessor The template processor instance
     * @param array $patterns Array of possible variable patterns to try
     * @param mixed $value The value to set
     * @return bool Whether the value was successfully set
     */
    private function setValueWithFallbacks(TemplateProcessor $templateProcessor, array $patterns, $value): bool
    {
        // Convert null to empty string to avoid type errors
        $value = $value ?? '';
        
        // Make sure the value is a string
        if (!is_string($value)) {
            $value = (string)$value;
        }
        
        foreach ($patterns as $pattern) {
            try {
                $templateProcessor->setValue($pattern, $value);
                return true;
            } catch (\Exception $e) {
                continue;
            }
        }
        
        return false;
    }

    /**
     * Attempt to delete blocks with various names.
     *
     * @param TemplateProcessor $templateProcessor The template processor instance
     * @param array $blockNames Array of block names to try to delete
     * @return void
     */
    private function tryDeleteBlocks(TemplateProcessor $templateProcessor, array $blockNames): void
    {
        foreach ($blockNames as $blockName) {
            try {
                $templateProcessor->deleteBlock($blockName);
            } catch (\Exception $e) {
                // Block doesn't exist, continue to the next one
                continue;
            }
        }
    }

    /**
     * Check if a file is a valid DOCX document
     *
     * @param string $filePath Path to the file to check
     * @return bool Whether the file is a valid DOCX
     */
    private function isValidDocx(string $filePath): bool
    {
        try {
            // Check if file exists and is readable
            if (!file_exists($filePath) || !is_readable($filePath)) {
                Log::warning("File does not exist or is not readable: {$filePath}");
                return false;
            }
            
            // Check file size - a valid DOCX should be at least a few KB
            $fileSize = filesize($filePath);
            if ($fileSize < 1000) { // Less than 1KB
                Log::warning("File is suspiciously small ({$fileSize} bytes): {$filePath}");
                return false;
            }
            
            // A DOCX file is a ZIP archive. Try to open it as a ZIP.
            $zip = new \ZipArchive();
            $result = $zip->open($filePath);
            
            if ($result !== true) {
                Log::warning("File is not a valid ZIP archive: {$filePath}, Error code: {$result}");
                return false;
            }
            
            // Check for essential DOCX files inside the ZIP
            $hasContentTypes = false;
            $hasDocumentXml = false;
            
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $fileName = $zip->getNameIndex($i);
                if ($fileName === '[Content_Types].xml') {
                    $hasContentTypes = true;
                }
                if ($fileName === 'word/document.xml') {
                    $hasDocumentXml = true;
                }
            }
            
            $zip->close();
            
            if (!$hasContentTypes || !$hasDocumentXml) {
                Log::warning("File is a ZIP but missing essential DOCX components: {$filePath}");
                return false;
            }
            
            return true;
        } catch (\Exception $e) {
            Log::warning("Error checking DOCX validity: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate a simplified report when the template has issues
     *
     * @param Report $report The report to generate
     * @param string $templatePath Path to the problematic template
     * @return string|null The path to the generated file, or null on failure
     */
    private function generateSimpleReport(Report $report, string $templatePath): ?string
    {
        try {
            Log::info("Generating simplified report due to template issues");
            
            // We'll take a different approach - create a very simple document instead
            // using the PhpWord object model directly instead of template processing
            $phpWord = new \PhpOffice\PhpWord\PhpWord();
            
            // Add basic styling
            $phpWord->addTitleStyle(1, ['size' => 20, 'bold' => true], ['spaceAfter' => 240]);
            $phpWord->addTitleStyle(2, ['size' => 16, 'bold' => true], ['spaceAfter' => 120]);
            $phpWord->addTitleStyle(3, ['size' => 14, 'bold' => true], ['spaceAfter' => 120]);
            
            // Create the document
            $section = $phpWord->addSection();
            
            // Add title
            $section->addTitle($report->name, 1);
            
            // Add client and project info
            $section->addText("Client: " . $report->client->name);
            $section->addText("Project: " . $report->project->name);
            $section->addText("Date: " . now()->format('F j, Y'));
            $section->addTextBreak(2);
            
            // Add executive summary
            $section->addTitle("Executive Summary", 2);
            $section->addText($report->executive_summary ?? 'No executive summary provided.');
            $section->addTextBreak(2);
            
            // Add methodologies section
            $methodologies = $report->methodologies;
            if ($methodologies->count() > 0) {
                $section->addTitle("Methodologies", 2);
                
                foreach ($methodologies as $methodology) {
                    $section->addTitle($methodology->title ?? 'Untitled Methodology', 3);
                    $section->addText($methodology->content ?? 'No content provided.');
                    $section->addTextBreak(1);
                }
                $section->addTextBreak(1);
            }
            
            // Add findings section
            $findings = $report->findings;
            if ($findings->count() > 0) {
                $section->addTitle("Findings", 2);
                
                foreach ($findings as $vulnerability) {
                    $section->addTitle($vulnerability->name ?? 'Untitled Finding', 3);
                    
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
                }
            }
            
            // Generate a unique filename for the report
            $fileName = 'report_' . Str::slug($report->name) . '_' . time() . '.docx';
            
            // Store the file in the public disk's reports directory
            $disk = 'public';
            $saveDirectory = 'reports';
            $savePath = $saveDirectory . '/' . $fileName;
            
            // Ensure the reports directory exists in the public disk
            if (!Storage::disk($disk)->exists($saveDirectory)) {
                Storage::disk($disk)->makeDirectory($saveDirectory);
            }
            
            // Full path to save the document
            $fullSavePath = storage_path('app/public/' . $savePath);
            
            // Create writer and save
            $objWriter = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'Word2007');
            $objWriter->save($fullSavePath);
            
            // Update the report with the file path
            $report->generated_file_path = 'public/' . $savePath;
            $report->status = 'generated';
            $report->updated_by = Auth::id();
            $report->save();
            
            Log::info("Simplified report generated at: public/{$savePath}");
            
            return 'public/' . $savePath;
        } catch (\Exception $e) {
            Log::error('Error generating simplified report: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate an emergency report when all other methods fail
     * This creates an absolute basic document with just the essential content
     *
     * @param Report $report The report to generate
     * @return string|null The path to the generated file, or null on failure
     */
    private function generateEmergencyReport(Report $report): ?string
    {
        try {
            // Create the simplest possible document with minimal dependencies
            $content = "<html><head><title>{$report->name}</title></head><body>";
            $content .= "<h1>" . htmlspecialchars($report->name) . "</h1>";
            $content .= "<p><strong>Client:</strong> " . htmlspecialchars($report->client->name) . "</p>";
            $content .= "<p><strong>Project:</strong> " . htmlspecialchars($report->project->name) . "</p>";
            $content .= "<p><strong>Date:</strong> " . now()->format('F j, Y') . "</p>";
            $content .= "<hr>";
            
            // Executive Summary
            $content .= "<h2>Executive Summary</h2>";
            $content .= "<p>" . nl2br(htmlspecialchars($report->executive_summary ?? 'No executive summary provided.')) . "</p>";
            $content .= "<hr>";
            
            // Methodologies
            $methodologies = $report->methodologies;
            if ($methodologies->count() > 0) {
                $content .= "<h2>Methodologies</h2>";
                foreach ($methodologies as $methodology) {
                    $content .= "<h3>" . htmlspecialchars($methodology->title ?? 'Untitled Methodology') . "</h3>";
                    $content .= "<p>" . nl2br(htmlspecialchars($methodology->content ?? 'No content provided.')) . "</p>";
                }
            }
            
            // Findings
            $findings = $report->findings;
            if ($findings->count() > 0) {
                $content .= "<h2>Findings</h2>";
                foreach ($findings as $vulnerability) {
                    $content .= "<h3>" . htmlspecialchars($vulnerability->name ?? 'Untitled Finding') . "</h3>";
                    $content .= "<p><strong>Severity:</strong> " . htmlspecialchars($vulnerability->severity ?? 'Unspecified') . "</p>";
                    $content .= "<p><strong>Description:</strong><br>" . nl2br(htmlspecialchars($vulnerability->description ?? 'No description provided.')) . "</p>";
                    $content .= "<p><strong>Impact:</strong><br>" . nl2br(htmlspecialchars($vulnerability->impact ?? 'Impact not specified.')) . "</p>";
                    $content .= "<p><strong>Recommendations:</strong><br>" . nl2br(htmlspecialchars($vulnerability->recommendations ?? 'No recommendations provided.')) . "</p>";
                }
            }
            
            $content .= "</body></html>";
            
            // Generate a unique filename for the emergency report
            $fileName = 'emergency_report_' . Str::slug($report->name) . '_' . time() . '.html';
            
            // Store the file in the public disk's reports directory
            $disk = 'public';
            $saveDirectory = 'reports';
            $savePath = $saveDirectory . '/' . $fileName;
            
            // Save the HTML file
            Storage::disk($disk)->put($savePath, $content);
            
            // Update the report with the file path
            $report->generated_file_path = 'public/' . $savePath;
            $report->status = 'generated';
            $report->updated_by = Auth::id();
            $report->save();
            
            Log::info("Emergency HTML report generated at: public/{$savePath}");
            
            return 'public/' . $savePath;
        } catch (\Exception $e) {
            Log::error('Error generating emergency report: ' . $e->getMessage());
            return null;
        }
    }
} 