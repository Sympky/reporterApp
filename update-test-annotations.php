<?php

// Script to update PHPUnit doc-comment metadata to attributes
$testDirs = [
    __DIR__ . '/tests/Unit/Http/Controllers'
];

// List of files we need to process
$files = [];
foreach ($testDirs as $dir) {
    $dirFiles = glob($dir . '/*.php');
    $files = array_merge($files, $dirFiles);
}

echo "Found " . count($files) . " test files to process.\n";

// Process each file
foreach ($files as $file) {
    echo "Processing $file... ";
    
    // Read file content
    $content = file_get_contents($file);
    
    // Check if the file has doctrine annotations
    if (strpos($content, '/** @test */') !== false) {
        // Make sure the appropriate import exists
        if (strpos($content, 'use PHPUnit\Framework\Attributes\Test;') === false) {
            // Add the import after the last use statement
            $pattern = '/(use [^;]+;\n)/';
            preg_match_all($pattern, $content, $matches);
            if (!empty($matches[0])) {
                $lastUse = end($matches[0]);
                $content = str_replace($lastUse, $lastUse . "use PHPUnit\Framework\Attributes\Test;\n", $content);
            } else {
                // If no use statements found, add after namespace
                $namespacePattern = '/(namespace [^;]+;\n)/';
                preg_match($namespacePattern, $content, $matches);
                if (!empty($matches[0])) {
                    $content = str_replace($matches[0], $matches[0] . "\nuse PHPUnit\Framework\Attributes\Test;\n", $content);
                }
            }
        }
        
        // Count occurrences before replacement
        $testCount = substr_count($content, '/** @test */');
        
        // Replace doc-comments with attributes - more specific pattern
        $content = str_replace('/** @test */', '#[Test]', $content);
        
        // Count occurrences after replacement to verify
        $replacedCount = $testCount - substr_count($content, '/** @test */');
        
        // Write the modified content back to the file
        file_put_contents($file, $content);
        
        echo "Updated! ($replacedCount test annotations replaced)\n";
    } else {
        echo "Already using attributes or no tests found.\n";
    }
}

echo "Update complete!\n"; 