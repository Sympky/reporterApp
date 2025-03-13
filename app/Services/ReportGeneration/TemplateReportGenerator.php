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
            } else if (preg_match('#^storage/(.+)$#', $templatePath, $matches)) {
                $templatePath = $matches[1];
                Log::info("Adjusted template path by removing 'storage/' prefix: {$templatePath}");
            }
            
            // Check if file exists
            $fileExists = Storage::disk($disk)->exists($templatePath);
            Log::info("File exists in {$disk} disk with path '{$templatePath}': " . ($fileExists ? 'Yes' : 'No'));
            
            if (!$fileExists) {
                // Try some alternative paths for backward compatibility
                    $possiblePaths = [
                    $templatePath,
                    'templates/' . basename($templatePath),
                    'storage/templates/' . basename($templatePath),
                    'storage/app/public/templates/' . basename($templatePath),
                    'public/templates/' . basename($templatePath),
                    'public/storage/templates/' . basename($templatePath)
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
            $templateProcessor->setValue('report_title', $report->name ?? '');
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
            
            // Analyze template structure to determine how to process content
            $variables = $templateProcessor->getVariables();
            Log::info("Template variables found: " . implode(', ', $variables));
            
            // Process methodologies and findings using adaptive approach
            $this->processMethodologies($templateProcessor, $methodologies, $variables);
            $this->processFindings($templateProcessor, $findings, $variables);
            
            // Generate a unique filename
            $fileName = ReportGenerationUtils::generateUniqueFilename($report, 'template_');
            $saveDirectory = 'reports';
            $savePath = $saveDirectory . '/' . $fileName;
            
            // Use the public disk for storing reports, consistent with our approach
            $disk = 'public';
            
            // Ensure the reports directory exists
            if (!ReportGenerationUtils::prepareDirectory($saveDirectory, $disk)) {
                return ReportGenerationUtils::generateEmergencyReport($report);
            }
            
            // Get the full path to save the document
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
     * Process methodologies dynamically for the report using an adaptive approach.
     *
     * @param TemplateProcessor $templateProcessor The template processor instance
     * @param \Illuminate\Database\Eloquent\Collection $methodologies The methodologies collection
     * @param array $variables All variables found in the template
     * @return void
     */
    private function processMethodologies(TemplateProcessor $templateProcessor, $methodologies, array $variables): void
    {
        try {
            // Set basic count
            $templateProcessor->setValue('methodology_count', $methodologies->count());
            
            // No methodologies to process
            if ($methodologies->count() === 0) {
                Log::info("No methodologies to process");
                foreach (['methodology_list', 'methodology_descriptions'] as $field) {
                    if (in_array($field, $variables)) {
                        $templateProcessor->setValue($field, 'No methodologies provided.');
                    }
                }
                return;
            }
            
            // Check for block markers in the template
            $hasBlockMethodologies = in_array('block_methodologies', $variables);
            
            // APPROACH 1: HANDLE TEMPLATE WITH METHODOLOGY BLOCK
            if ($hasBlockMethodologies) {
                Log::info("Using block cloning approach for methodologies");
                
                $blockReplacements = [];
                foreach ($methodologies as $index => $methodology) {
                    // Prepare replacement for this methodology
                    $replacement = [
                        'methodology_title' => $methodology->title ?? 'Untitled Methodology',
                        'methodology_description' => $methodology->content ?? 'No description provided'
                    ];

                    // Add finding placeholders with index if needed
                    if (in_array('finding_title', $variables) || in_array('finding_name', $variables)) {
                        $findingField = in_array('finding_title', $variables) ? 'finding_title' : 'finding_name';
                        $replacement[$findingField] = '${' . $findingField . '_' . $index . '}';
                        $replacement['finding_severity'] = '${finding_severity_' . $index . '}';
                        $replacement['finding_description'] = '${finding_description_' . $index . '}';
                        
                        if (in_array('finding_recommendation', $variables)) {
                            $replacement['finding_recommendation'] = '${finding_recommendation_' . $index . '}';
                        } elseif (in_array('finding_recommendations', $variables)) {
                            $replacement['finding_recommendations'] = '${finding_recommendations_' . $index . '}';
                        }
                        
                        if (in_array('finding_impact', $variables)) {
                            $replacement['finding_impact'] = '${finding_impact_' . $index . '}';
                        }
                        
                        if (in_array('finding_evidence', $variables)) {
                            $replacement['finding_evidence'] = '${finding_evidence_' . $index . '}';
                        }
                    }
                    
                    $blockReplacements[] = $replacement;
                }
                
                try {
                    // Clone the block for each methodology
                    $templateProcessor->cloneBlock(
                        'block_methodologies', 
                        count($blockReplacements), 
                        true, 
                        false, 
                        $blockReplacements
                    );
                    Log::info("Successfully cloned methodology blocks: " . count($blockReplacements));
                } catch (\Exception $e) {
                    Log::warning("Block cloning for methodologies failed: " . $e->getMessage());
                    Log::info("Falling back to direct value replacement");
                    
                    // Fallback: Concatenate all methodologies as formatted text
                    $methodologiesText = '';
                    foreach ($methodologies as $methodology) {
                        $methodologiesText .= "## " . ($methodology->title ?? 'Untitled Methodology') . "\n\n";
                        $methodologiesText .= ($methodology->content ?? 'No description provided.') . "\n\n";
                    }
                    
                    // Replace the entire block with formatted text
                    $templateProcessor->setValue('block_methodologies', $methodologiesText);
                }
            }
            // APPROACH 2: HANDLE TEMPLATES WITH METHODOLOGY_TITLE/METHODOLOGY_NAME PLACEHOLDERS
            elseif (in_array('methodology_title', $variables) || in_array('methodology_name', $variables)) {
                $field = in_array('methodology_title', $variables) ? 'methodology_title' : 'methodology_name';
                Log::info("Using direct replacement approach for methodologies with field: {$field}");
                
                // Check if we have multiple methodology placeholders (e.g., methodology_title_1, methodology_title_2)
                $methodologyPlaceholders = array_filter($variables, function($var) use ($field) {
                    return preg_match('/^' . preg_quote($field) . '(_\d+)?$/', $var);
                });
                
                // Handle indexed placeholders (methodology_title_1, methodology_title_2, etc.)
                if (count($methodologyPlaceholders) > 1) {
                    Log::info("Found " . count($methodologyPlaceholders) . " methodology placeholders");
                    
                    // Sort the placeholders to ensure they're in order
                    sort($methodologyPlaceholders);
                    
                    // Fill in each methodology with corresponding index
                    foreach ($methodologyPlaceholders as $index => $placeholder) {
                        $methodologyIndex = $index;
                        $indexSuffix = '';
                        
                        // Extract index from placeholder if it exists
                        if (preg_match('/_(\d+)$/', $placeholder, $matches)) {
                            $indexSuffix = '_' . $matches[1];
                            $methodologyIndex = (int)$matches[1] - 1; // Adjust to zero-based index
                        }
                        
                        // Only set if we have data for this index
                        if (isset($methodologies[$methodologyIndex])) {
                            $methodology = $methodologies[$methodologyIndex];
                            
                            $templateProcessor->setValue($field . $indexSuffix, $methodology->title ?? 'Untitled Methodology');
                            
                            $descField = str_replace('title', 'description', $field);
                            $descField = str_replace('name', 'description', $descField);
                            
                            if (in_array($descField . $indexSuffix, $variables)) {
                                $templateProcessor->setValue($descField . $indexSuffix, $methodology->content ?? 'No description provided');
                            }
                            
                            Log::info("Set methodology #{$methodologyIndex} values");
                        }
                    }
                } 
                // Handle single placeholder - concatenate all methodologies 
                else {
                    Log::info("Using single methodology placeholder approach");
                    
                    // Create a combined list of all methodologies
                    $allMethodologies = '';
                    foreach ($methodologies as $methodology) {
                        $allMethodologies .= "## " . ($methodology->title ?? 'Untitled Methodology') . "\n\n";
                        $allMethodologies .= ($methodology->content ?? 'No description provided.') . "\n\n";
                    }
                    
                    // Replace with combined text
                    $templateProcessor->setValue($field, 'Methodologies');
                    
                    $descField = str_replace('title', 'description', $field);
                    $descField = str_replace('name', 'description', $descField);
                    
                    if (in_array($descField, $variables)) {
                        $templateProcessor->setValue($descField, $allMethodologies);
                    }
                    
                    Log::info("Set combined methodologies text");
                }
            }
            // APPROACH 3: METHODOLOGY_LIST FALLBACK
            elseif (in_array('methodology_list', $variables)) {
                Log::info("Using methodology_list fallback approach");
                
                $methodologyNames = [];
                $methodologyDescriptions = [];
                
                foreach ($methodologies as $methodology) {
                    $methodologyNames[] = $methodology->title ?? 'Untitled Methodology';
                    $methodologyDescriptions[] = $methodology->content ?? 'No description provided.';
                }
                
                $templateProcessor->setValue('methodology_list', implode("\n", $methodologyNames));
                
                if (in_array('methodology_descriptions', $variables)) {
                    $templateProcessor->setValue('methodology_descriptions', implode("\n\n", $methodologyDescriptions));
                }
                
                Log::info("Set methodology list with " . count($methodologyNames) . " entries");
            }
            else {
                Log::info("No appropriate methodology placeholders found in template");
            }
        } catch (\Exception $e) {
            Log::error("Error processing methodologies: " . $e->getMessage());
            Log::error($e->getTraceAsString());
        }
    }
    
    /**
     * Process findings dynamically for the report using an adaptive approach.
     *
     * @param TemplateProcessor $templateProcessor The template processor instance
     * @param \Illuminate\Database\Eloquent\Collection $findings The findings collection
     * @param array $variables All variables found in the template
     * @return void
     */
    private function processFindings(TemplateProcessor $templateProcessor, $findings, array $variables): void
    {
        try {
            // Set basic count
            $templateProcessor->setValue('finding_count', $findings->count());
            
            // No findings to process
            if ($findings->count() === 0) {
                Log::info("No findings to process");
                if (in_array('finding_list', $variables)) {
                    $templateProcessor->setValue('finding_list', 'No findings identified.');
                }
                return;
            }
            
            // Check for block markers in the template
            $hasBlockFindings = in_array('block_findings', $variables);
            
            // APPROACH 1: HANDLE TEMPLATE WITH FINDINGS BLOCK
            if ($hasBlockFindings) {
                Log::info("Using block cloning approach for findings");
                
                // Prepare replacements for the findings block
                $findingReplacements = [];
                foreach ($findings as $finding) {
                    $replacement = [
                        'finding_title' => $finding->name ?? 'Untitled Finding',
                        'finding_severity' => $finding->severity ?? 'Unspecified',
                        'finding_description' => $finding->description ?? 'No description provided'
                    ];
                    
                    // Add optional fields if they exist in the template
                    if (in_array('finding_impact', $variables)) {
                        $replacement['finding_impact'] = $finding->impact ?? 'Impact not specified';
                    }
                    
                    if (in_array('finding_recommendation', $variables)) {
                        $replacement['finding_recommendation'] = $finding->recommendations ?? 'No recommendations provided';
                    } elseif (in_array('finding_recommendations', $variables)) {
                        $replacement['finding_recommendations'] = $finding->recommendations ?? 'No recommendations provided';
                    }
                    
                    if (in_array('finding_evidence', $variables)) {
                        // Handle evidence if available
                        $pivotData = $finding->pivot;
                        if ($pivotData && $pivotData->include_evidence && !empty($finding->evidence)) {
                            $replacement['finding_evidence'] = $finding->evidence;
                        } else {
                            $replacement['finding_evidence'] = 'No evidence provided.';
                        }
                    }
                    
                    $findingReplacements[] = $replacement;
                }
                
                try {
                    // Clone the findings block for each finding
                    $templateProcessor->cloneBlock(
                        'block_findings',
                        count($findingReplacements),
                        true,
                        false,
                        $findingReplacements
                    );
                    Log::info("Successfully cloned findings blocks: " . count($findingReplacements));
                } catch (\Exception $e) {
                    Log::warning("Block cloning for findings failed: " . $e->getMessage());
                    Log::info("Falling back to direct value replacement");
                    
                    // Fallback: Concatenate all findings as formatted text
                    $findingsText = "Findings:\n\n";
                    foreach ($findings as $finding) {
                        $findingsText .= "**" . ($finding->name ?? 'Untitled Finding') . "** (" . 
                            ($finding->severity ?? 'Unspecified') . ")\n\n";
                        $findingsText .= ($finding->description ?? 'No description provided.') . "\n\n";
                        $findingsText .= "Recommendations: " . ($finding->recommendations ?? 'No recommendations provided.') . "\n\n";
                    }
                    
                    // Replace the entire block with formatted text
                    $templateProcessor->setValue('block_findings', $findingsText);
                }
            }
            // APPROACH 2: CHECK FOR TABLE ROW STRUCTURE
            elseif (in_array('finding_title', $variables) || in_array('finding_name', $variables)) {
                $field = in_array('finding_title', $variables) ? 'finding_title' : 'finding_name';
                Log::info("Checking for table row structure with field: {$field}");
                
                // Try to detect if we need indexed findings by methodology
                $methodologiesWithFindings = [];
                
                // Check if there are indexed findings (finding_title_0, finding_title_1, etc.)
                $indexedFindings = false;
                foreach ($variables as $variable) {
                    if (preg_match('/^' . preg_quote($field) . '_(\d+)$/', $variable, $matches)) {
                        $indexedFindings = true;
                        $methodologiesWithFindings[$matches[1]] = true;
                    }
                }
                
                if ($indexedFindings) {
                    Log::info("Found indexed findings structure for methodologies: " . implode(', ', array_keys($methodologiesWithFindings)));
                    
                    // Group findings by methodology
                    $findingsByMethodology = [];
                    foreach ($findings as $finding) {
                        $pivotData = $finding->pivot;
                        $methodologyId = $pivotData->methodology_id ?? null;
                        
                        if ($methodologyId) {
                            if (!isset($findingsByMethodology[$methodologyId])) {
                                $findingsByMethodology[$methodologyId] = [];
                            }
                            $findingsByMethodology[$methodologyId][] = $finding;
                        }
                    }
                    
                    // Process findings for each methodology index
                    foreach ($methodologiesWithFindings as $methodologyIndex => $true) {
                        $methodologyFindings = [];
                        
                        // If we have findings grouped by methodology id, use those
                        // Otherwise, just assign all findings to each methodology
                        if (!empty($findingsByMethodology)) {
                            $methodologyIds = array_keys($findingsByMethodology);
                            if (isset($methodologyIds[$methodologyIndex])) {
                                $methodologyFindings = $findingsByMethodology[$methodologyIds[$methodologyIndex]];
                            }
                        } else {
                            $methodologyFindings = $findings;
                        }
                        
                        if (!empty($methodologyFindings)) {
                            try {
                                $values = [];
                                foreach ($methodologyFindings as $finding) {
                                    $row = [
                                        "{$field}_{$methodologyIndex}" => $finding->name ?? 'Untitled Finding',
                                        "finding_severity_{$methodologyIndex}" => $finding->severity ?? 'Unspecified',
                                        "finding_description_{$methodologyIndex}" => $finding->description ?? 'No description provided'
                                    ];
                                    
                                    // Add optional fields if needed
                                    if (in_array("finding_impact_{$methodologyIndex}", $variables)) {
                                        $row["finding_impact_{$methodologyIndex}"] = $finding->impact ?? 'Impact not specified';
                                    }
                                    
                                    if (in_array("finding_recommendation_{$methodologyIndex}", $variables)) {
                                        $row["finding_recommendation_{$methodologyIndex}"] = $finding->recommendations ?? 'No recommendations provided';
                                    } elseif (in_array("finding_recommendations_{$methodologyIndex}", $variables)) {
                                        $row["finding_recommendations_{$methodologyIndex}"] = $finding->recommendations ?? 'No recommendations provided';
                                    }
                                    
                                    if (in_array("finding_evidence_{$methodologyIndex}", $variables)) {
                                        $pivotData = $finding->pivot;
                                        if ($pivotData && $pivotData->include_evidence && !empty($finding->evidence)) {
                                            $row["finding_evidence_{$methodologyIndex}"] = $finding->evidence;
                                        } else {
                                            $row["finding_evidence_{$methodologyIndex}"] = 'No evidence provided.';
                                        }
                                    }
                                    
                                    $values[] = $row;
                                }
                                
                                // Clone rows for this methodology's findings
                                $templateProcessor->cloneRowAndSetValues("{$field}_{$methodologyIndex}", $values);
                                Log::info("Cloned rows for methodology #{$methodologyIndex} findings: " . count($values));
                            } catch (\Exception $e) {
                                Log::warning("Row cloning for methodology #{$methodologyIndex} findings failed: " . $e->getMessage());
                                
                                // Alternative: concatenate findings as text
                                $findingsText = '';
                                foreach ($methodologyFindings as $finding) {
                                    $findingsText .= "**" . ($finding->name ?? 'Untitled Finding') . "** (" . 
                                        ($finding->severity ?? 'Unspecified') . ")\n\n";
                                    $findingsText .= ($finding->description ?? 'No description provided.') . "\n\n";
                                }
                                
                                $templateProcessor->setValue("{$field}_{$methodologyIndex}", $findingsText);
                            }
                        } else {
                            // No findings for this methodology
                            $templateProcessor->setValue("{$field}_{$methodologyIndex}", "No findings for this methodology.");
                        }
                    }
                } else {
                    Log::info("Using direct row cloning for all findings");
                    
                    try {
                        $values = [];
                        foreach ($findings as $finding) {
                            $row = [
                                $field => $finding->name ?? 'Untitled Finding',
                                'finding_severity' => $finding->severity ?? 'Unspecified',
                                'finding_description' => $finding->description ?? 'No description provided'
                            ];
                            
                            // Add optional fields if needed
                            if (in_array('finding_impact', $variables)) {
                                $row['finding_impact'] = $finding->impact ?? 'Impact not specified';
                            }
                            
                            if (in_array('finding_recommendation', $variables)) {
                                $row['finding_recommendation'] = $finding->recommendations ?? 'No recommendations provided';
                            } elseif (in_array('finding_recommendations', $variables)) {
                                $row['finding_recommendations'] = $finding->recommendations ?? 'No recommendations provided';
                            }
                            
                            if (in_array('finding_evidence', $variables)) {
                                $pivotData = $finding->pivot;
                                if ($pivotData && $pivotData->include_evidence && !empty($finding->evidence)) {
                                    $row['finding_evidence'] = $finding->evidence;
                                } else {
                                    $row['finding_evidence'] = 'No evidence provided.';
                                }
                            }
                            
                            $values[] = $row;
                        }
                        
                        // Clone rows for all findings
                        $templateProcessor->cloneRowAndSetValues($field, $values);
                        Log::info("Cloned rows for all findings: " . count($values));
                    } catch (\Exception $e) {
                        Log::warning("Row cloning for findings failed: " . $e->getMessage());
                        
                        // Alternative: concatenate findings as text
                        $findingsText = '';
                        foreach ($findings as $finding) {
                            $findingsText .= "**" . ($finding->name ?? 'Untitled Finding') . "** (" . 
                                ($finding->severity ?? 'Unspecified') . ")\n\n";
                            $findingsText .= ($finding->description ?? 'No description provided.') . "\n\n";
                        }
                        
                        $templateProcessor->setValue($field, $findingsText);
                    }
                }
            }
            // APPROACH 3: FINDING_LIST FALLBACK
            elseif (in_array('finding_list', $variables)) {
                Log::info("Using finding_list fallback approach");
                
                // Create a formatted list of findings
                $findingItems = [];
                foreach ($findings as $finding) {
                    $findingItems[] = ($finding->name ?? 'Untitled Finding') . ' (' . ($finding->severity ?? 'Unspecified') . ')';
                }
                
                $templateProcessor->setValue('finding_list', implode("\n", $findingItems));
                Log::info("Set finding_list with " . count($findingItems) . " entries");
            }
            else {
                Log::info("No appropriate finding placeholders found in template");
            }
        } catch (\Exception $e) {
            Log::error("Error processing findings: " . $e->getMessage());
            Log::error($e->getTraceAsString());
        }
    }
} 