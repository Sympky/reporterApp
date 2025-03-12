<?php

require_once __DIR__ . '/vendor/autoload.php';
use PhpOffice\PhpWord\TemplateProcessor;

/**
 * More flexible report generator that adapts to different template structures
 */

// Template and output paths
$templatePath = '/home/sympky/projects/reporterApp/storage/app/public/templates/orfV5wG9pmncsvx6VSslKLvSR4scUozhgdkrXisg.docx';
$outputPath = __DIR__ . '/storage/app/reports/generated_report_' . date('Y-m-d_H-i-s') . '.docx';

// Prepare sample data for the report
$reportData = [
    'metadata' => [
        'report_title' => 'Security Assessment Report',
        'report_date' => date('F j, Y'),
        'report_author' => 'Security Team',
        'client_name' => 'Example Client Inc.',
        'assessment_period' => 'May 1-15, 2023'
    ],
    'methodologies' => [
        [
            'title' => 'Network Infrastructure Assessment',
            'description' => 'A comprehensive scan and analysis of network infrastructure including firewalls, routers, and switches.',
            'findings' => [
                [
                    'title' => 'Outdated Firewall Firmware',
                    'severity' => 'High',
                    'description' => 'The main perimeter firewall is running firmware version 3.2.1 which has known vulnerabilities.',
                    'recommendation' => 'Update to the latest firmware version (minimum 4.1.2) as soon as possible.'
                ],
                [
                    'title' => 'Default SNMP Community Strings',
                    'severity' => 'Medium',
                    'description' => 'Network devices were found using default SNMP community strings, making them vulnerable to unauthorized monitoring.',
                    'recommendation' => 'Change all SNMP community strings to strong, unique values and consider implementing SNMPv3.'
                ]
            ]
        ],
        [
            'title' => 'Web Application Testing',
            'description' => 'Static and dynamic security testing of web applications and APIs.',
            'findings' => [
                [
                    'title' => 'SQL Injection Vulnerability',
                    'severity' => 'Critical',
                    'description' => 'Multiple endpoints in the booking system were found vulnerable to SQL injection attacks, potentially allowing unauthorized access to the backend database.',
                    'recommendation' => 'Implement parameterized queries for all database operations and perform input validation.'
                ],
                [
                    'title' => 'Cross-Site Scripting (XSS)',
                    'severity' => 'High',
                    'description' => 'The user profile page is vulnerable to stored XSS attacks, allowing attackers to inject malicious scripts that execute in users\' browsers.',
                    'recommendation' => 'Implement proper output encoding and content security policies.'
                ]
            ]
        ]
    ]
];

// Create the output directory if it doesn't exist
$outputDir = dirname($outputPath);
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

// Generate the report
echo "Generating report using adaptive approach...\n";
try {
    // Check if template exists
    if (!file_exists($templatePath)) {
        throw new Exception("Template file not found at: $templatePath");
    }
    
    // Initialize the template processor
    $templateProcessor = new TemplateProcessor($templatePath);
    
    // 1. HANDLE SIMPLE VARIABLES FIRST (For all metadata fields)
    echo "Setting basic metadata values...\n";
    foreach ($reportData['metadata'] as $key => $value) {
        try {
            $templateProcessor->setValue($key, $value);
            echo "✓ Set {$key} = {$value}\n";
        } catch (Exception $e) {
            echo "⚠ Warning: Could not set {$key}: " . $e->getMessage() . "\n";
        }
    }
    
    // 2. EXAMINE THE TEMPLATE STRUCTURE
    echo "\nAnalyzing template structure to determine appropriate processing method...\n";

    // Get all variables in the template
    $variables = $templateProcessor->getVariables();
    echo "Variables found in template: " . implode(', ', $variables) . "\n";
    
    // Check for block markers
    $hasBlockMethodologies = in_array('block_methodologies', $variables);
    $hasBlockFindings = in_array('block_findings', $variables);
    echo "Has block_methodologies: " . ($hasBlockMethodologies ? "Yes" : "No") . "\n";
    echo "Has block_findings: " . ($hasBlockFindings ? "Yes" : "No") . "\n";
    
    // 3. ADAPTIVELY PROCESS BASED ON TEMPLATE STRUCTURE
    if ($hasBlockMethodologies) {
        // ===== APPROACH 1: HANDLE TEMPLATE WITH BLOCK METHODOLOGIES =====
        echo "\nUsing block cloning approach for methodologies...\n";
        
        // PHASE 1: Clone the methodology blocks
        $blockReplacements = [];
        $i = 0;
        
        foreach ($reportData['methodologies'] as $methodology) {
            $replacement = [
                'methodology_title' => $methodology['title'],
                'methodology_description' => $methodology['description']
            ];
            
            // Add finding placeholders with index
            if (in_array('finding_title', $variables)) {
                $replacement['finding_title'] = '${finding_title_'.$i.'}';
                $replacement['finding_severity'] = '${finding_severity_'.$i.'}';
                $replacement['finding_description'] = '${finding_description_'.$i.'}';
                $replacement['finding_recommendation'] = '${finding_recommendation_'.$i.'}';
            }
            
            $blockReplacements[] = $replacement;
            $i++;
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
            echo "✓ Successfully cloned methodology blocks\n";
            
            // PHASE 2: If there are tables, try to clone rows for findings
            if (in_array('finding_title_0', $templateProcessor->getVariables())) {
                echo "\nProcessing findings as table rows...\n";
                
                $i = 0;
                foreach ($reportData['methodologies'] as $methodology) {
                    if (isset($methodology['findings']) && !empty($methodology['findings'])) {
                        $values = [];
                        
                        foreach ($methodology['findings'] as $finding) {
                            $values[] = [
                                "finding_title_{$i}" => $finding['title'],
                                "finding_severity_{$i}" => $finding['severity'],
                                "finding_description_{$i}" => $finding['description'],
                                "finding_recommendation_{$i}" => $finding['recommendation']
                            ];
                        }
                        
                        try {
                            if (!empty($values)) {
                                $templateProcessor->cloneRowAndSetValues("finding_title_{$i}", $values);
                                echo "✓ Cloned rows for methodology #{$i}\n";
                            }
                        } catch (Exception $e) {
                            echo "⚠ Warning: Could not clone rows for methodology #{$i}: " . $e->getMessage() . "\n";
                            echo "  Attempting alternative approach...\n";
                            
                            // Alternative approach: just replace values without row cloning
                            foreach ($methodology['findings'] as $index => $finding) {
                                $findingNum = $index + 1;
                                $templateProcessor->setValue("finding_title_{$i}", 
                                    $finding['title'] . ($index > 0 ? "\n\n" . $methodology['findings'][$index-1]['title'] : ""));
                                $templateProcessor->setValue("finding_severity_{$i}", 
                                    $finding['severity'] . ($index > 0 ? "\n\n" . $methodology['findings'][$index-1]['severity'] : ""));
                                $templateProcessor->setValue("finding_description_{$i}", 
                                    $finding['description'] . ($index > 0 ? "\n\n" . $methodology['findings'][$index-1]['description'] : ""));
                                $templateProcessor->setValue("finding_recommendation_{$i}", 
                                    $finding['recommendation'] . ($index > 0 ? "\n\n" . $methodology['findings'][$index-1]['recommendation'] : ""));
                            }
                        }
                    }
                    $i++;
                }
            } else {
                echo "\nNo finding placeholder structure detected for table row cloning.\n";
            }
        } catch (Exception $e) {
            echo "⚠ Error during block cloning: " . $e->getMessage() . "\n";
            echo "  Falling back to direct value replacement...\n";
            
            // Just set the values directly without cloning
            $methodologiesText = '';
            foreach ($reportData['methodologies'] as $index => $methodology) {
                $methodologiesText .= "## " . $methodology['title'] . "\n\n";
                $methodologiesText .= $methodology['description'] . "\n\n";
                
                if (!empty($methodology['findings'])) {
                    $methodologiesText .= "### Findings:\n\n";
                    foreach ($methodology['findings'] as $finding) {
                        $methodologiesText .= "**" . $finding['title'] . "** (" . $finding['severity'] . ")\n\n";
                        $methodologiesText .= $finding['description'] . "\n\n";
                        $methodologiesText .= "Recommendation: " . $finding['recommendation'] . "\n\n";
                    }
                }
                
                $methodologiesText .= "\n\n";
            }
            
            // Replace the entire block with formatted text
            $templateProcessor->setValue('block_methodologies', $methodologiesText);
        }
    } else {
        // ===== APPROACH 2: HANDLE TEMPLATE WITHOUT BLOCKS =====
        echo "\nNo block structure found. Using direct value replacement...\n";
        
        // Set methodology values directly if placeholders exist
        if (in_array('methodology_title', $variables)) {
            echo "Finding methodology placeholders for direct replacement...\n";
            
            // Check if we have multiple methodology placeholders (e.g., methodology_title_1, methodology_title_2)
            $methodologyPlaceholders = array_filter($variables, function($var) {
                return preg_match('/^methodology_title(_\d+)?$/', $var);
            });
            
            if (count($methodologyPlaceholders) > 0) {
                echo "Found " . count($methodologyPlaceholders) . " methodology placeholders\n";
                
                // Sort the placeholders to ensure they're in order
                sort($methodologyPlaceholders);
                
                // Fill in each methodology
                foreach ($methodologyPlaceholders as $index => $placeholder) {
                    $methodologyIndex = $index;
                    $indexSuffix = '';
                    
                    // Extract index from placeholder if it exists (e.g., _1 from methodology_title_1)
                    if (preg_match('/_(\d+)$/', $placeholder, $matches)) {
                        $indexSuffix = '_' . $matches[1];
                        $methodologyIndex = (int)$matches[1];
                    }
                    
                    // Only set if we have data for this index
                    if (isset($reportData['methodologies'][$methodologyIndex])) {
                        $methodology = $reportData['methodologies'][$methodologyIndex];
                        
                        $templateProcessor->setValue('methodology_title' . $indexSuffix, $methodology['title']);
                        $templateProcessor->setValue('methodology_description' . $indexSuffix, $methodology['description']);
                        
                        echo "✓ Set methodology #{$methodologyIndex} values\n";
                        
                        // Check for finding placeholders with same index suffix
                        $findingPlaceholder = 'finding_title' . $indexSuffix;
                        if (in_array($findingPlaceholder, $variables)) {
                            // Findings exist for this methodology, let's try to handle them
                            try {
                                $values = [];
                                foreach ($methodology['findings'] as $finding) {
                                    $values[] = [
                                        'finding_title' . $indexSuffix => $finding['title'],
                                        'finding_severity' . $indexSuffix => $finding['severity'],
                                        'finding_description' . $indexSuffix => $finding['description'],
                                        'finding_recommendation' . $indexSuffix => $finding['recommendation']
                                    ];
                                }
                                
                                if (!empty($values)) {
                                    $templateProcessor->cloneRowAndSetValues($findingPlaceholder, $values);
                                    echo "✓ Cloned rows for findings in methodology #{$methodologyIndex}\n";
                                }
                            } catch (Exception $e) {
                                echo "⚠ Warning: Could not clone rows for findings: " . $e->getMessage() . "\n";
                                echo "  Using alternative approach for findings...\n";
                                
                                // Fallback to concatenating findings as text
                                $findingsText = '';
                                foreach ($methodology['findings'] as $finding) {
                                    $findingsText .= "**" . $finding['title'] . "** (" . $finding['severity'] . ")\n\n";
                                    $findingsText .= $finding['description'] . "\n\n";
                                    $findingsText .= "Recommendation: " . $finding['recommendation'] . "\n\n";
                                }
                                
                                $templateProcessor->setValue('finding_title' . $indexSuffix, $findingsText);
                            }
                        }
                    }
                }
            } else {
                // Just one methodology placeholder, concatenate all methodologies
                echo "Using single methodology placeholder approach...\n";
                
                $allMethodologies = '';
                foreach ($reportData['methodologies'] as $methodology) {
                    $allMethodologies .= "## " . $methodology['title'] . "\n\n";
                    $allMethodologies .= $methodology['description'] . "\n\n";
                    
                    if (!empty($methodology['findings'])) {
                        $allMethodologies .= "### Findings:\n\n";
                        foreach ($methodology['findings'] as $finding) {
                            $allMethodologies .= "**" . $finding['title'] . "** (" . $finding['severity'] . ")\n\n";
                            $allMethodologies .= $finding['description'] . "\n\n";
                            $allMethodologies .= "Recommendation: " . $finding['recommendation'] . "\n\n";
                        }
                    }
                    
                    $allMethodologies .= "\n\n";
                }
                
                $templateProcessor->setValue('methodology_title', 'Methodologies');
                $templateProcessor->setValue('methodology_description', $allMethodologies);
                echo "✓ Set combined methodologies text\n";
            }
        } else {
            echo "No methodology placeholders found in template.\n";
        }
    }
    
    // 4. HANDLE FINDINGS BLOCK IF PRESENT
    if ($hasBlockFindings) {
        echo "\nDetected block_findings structure. Processing findings blocks...\n";
        
        // Collect all findings from all methodologies
        $allFindings = [];
        foreach ($reportData['methodologies'] as $methodology) {
            if (isset($methodology['findings']) && !empty($methodology['findings'])) {
                foreach ($methodology['findings'] as $finding) {
                    // Add the methodology title to each finding for reference
                    $finding['methodology'] = $methodology['title'];
                    $allFindings[] = $finding;
                }
            }
        }
        
        // Prepare replacements for the findings block
        $findingReplacements = [];
        foreach ($allFindings as $finding) {
            $findingReplacements[] = [
                'finding_title' => $finding['title'],
                'finding_severity' => $finding['severity'],
                'finding_description' => $finding['description'],
                'finding_recommendation' => $finding['recommendation']
            ];
        }
        
        try {
            // Clone the findings block for each finding
            if (!empty($findingReplacements)) {
                $templateProcessor->cloneBlock(
                    'block_findings',
                    count($findingReplacements),
                    true,
                    false,
                    $findingReplacements
                );
                echo "✓ Successfully cloned findings blocks for " . count($findingReplacements) . " findings\n";
            } else {
                echo "⚠ No findings data available to clone\n";
                // Replace with empty content if no findings
                $templateProcessor->setValue('block_findings', 'No findings to report.');
            }
        } catch (Exception $e) {
            echo "⚠ Error during findings block cloning: " . $e->getMessage() . "\n";
            echo "  Attempting alternative approach for findings...\n";
            
            // Alternative approach - concatenate all findings into a table-like structure
            $findingsText = "Findings:\n\n";
            $findingsText .= "| Title | Severity | Description | Recommendation |\n";
            $findingsText .= "|-------|----------|-------------|----------------|\n";
            
            foreach ($allFindings as $finding) {
                $findingsText .= "| " . $finding['title'] . " | " . $finding['severity'] . " | " 
                    . $finding['description'] . " | " . $finding['recommendation'] . " |\n";
            }
            
            // Replace the entire block with formatted text
            $templateProcessor->setValue('block_findings', $findingsText);
        }
    }
    
    // 5. SAVE THE DOCUMENT
    echo "\nSaving the document...\n";
    $templateProcessor->saveAs($outputPath);
    
    echo "✅ Report successfully generated at: $outputPath\n";
} catch (Exception $e) {
    echo "❌ Error generating report: " . $e->getMessage() . "\n";
    echo "Stack Trace:\n" . $e->getTraceAsString() . "\n";
} 