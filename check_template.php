<?php

require_once __DIR__ . '/vendor/autoload.php';
use PhpOffice\PhpWord\IOFactory;

// Path to the template file
$templatePath = '/home/sympky/projects/reporterApp/storage/app/public/templates/orfV5wG9pmncsvx6VSslKLvSR4scUozhgdkrXisg.docx';

if (!file_exists($templatePath)) {
    die("Template file not found at: $templatePath\n");
}

echo "Template file exists. Size: " . filesize($templatePath) . " bytes\n";

// Create a temporary directory to extract the template
$tempDir = sys_get_temp_dir() . '/docx_extract_' . time();
if (!is_dir($tempDir)) {
    mkdir($tempDir, 0755, true);
}

// Extract the template to examine its content
try {
    echo "Extracting template to examine its structure...\n";
    
    // Copy the file to temp location for extraction
    $tempFile = $tempDir . '/template.docx';
    copy($templatePath, $tempFile);
    
    // Extract the docx (which is just a zip file)
    $zip = new ZipArchive();
    if ($zip->open($tempFile) === TRUE) {
        $zip->extractTo($tempDir);
        $zip->close();
        echo "Template extracted successfully.\n";
    } else {
        echo "Failed to extract template.\n";
    }
    
    // Check for document.xml which contains the main content
    $documentXml = $tempDir . '/word/document.xml';
    if (file_exists($documentXml)) {
        $content = file_get_contents($documentXml);
        echo "Document content length: " . strlen($content) . " bytes\n";
        
        // Look for placeholders in the content
        echo "\nSearching for placeholders in the template:\n";
        $placeholders = [];
        
        // Find all ${...} patterns
        if (preg_match_all('/\$\{([^}]+)\}/', $content, $matches)) {
            $placeholders = array_unique($matches[1]);
            echo "Found " . count($placeholders) . " unique placeholders:\n";
            foreach ($placeholders as $placeholder) {
                echo "- ${placeholder}\n";
            }
        } else {
            echo "No ${...} style placeholders found.\n";
        }
        
        // Check for block markers specifically
        echo "\nChecking for block markers:\n";
        $blockStart = strpos($content, '${block_methodologies}') !== false;
        $blockEnd = strpos($content, '${/block_methodologies}') !== false;
        
        echo "- block_methodologies start marker: " . ($blockStart ? "FOUND" : "NOT FOUND") . "\n";
        echo "- block_methodologies end marker: " . ($blockEnd ? "FOUND" : "NOT FOUND") . "\n";
        
        // Check for table structure
        echo "\nChecking for table structures:\n";
        $hasTableRows = strpos($content, '<w:tr>') !== false;
        echo "- Table rows: " . ($hasTableRows ? "FOUND" : "NOT FOUND") . "\n";
        
        // Count table rows
        if ($hasTableRows) {
            preg_match_all('/<w:tr>/', $content, $rowMatches);
            echo "- Number of table rows: " . count($rowMatches[0]) . "\n";
        }
        
        // Check if finding placeholders are in table cells
        $findingInTable = preg_match('/<w:tc>.*?\$\{finding_title\}.*?<\/w:tc>/s', $content);
        echo "- Finding placeholders in table cells: " . ($findingInTable ? "FOUND" : "NOT FOUND") . "\n";
    } else {
        echo "Could not find document.xml in the extracted template.\n";
    }
} catch (Exception $e) {
    echo "Error analyzing template: " . $e->getMessage() . "\n";
} finally {
    // Clean up
    if (is_dir($tempDir)) {
        // Remove the temporary directory (comment this out if you want to examine files manually)
        // system('rm -rf ' . escapeshellarg($tempDir));
        echo "\nTemporary files kept at: $tempDir\n";
    }
}

echo "\nTemplate analysis complete.\n"; 