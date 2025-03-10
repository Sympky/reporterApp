<?php

/**
 * Script to fix common issues in controller test files
 */

// Function to parse a controller to extract method signatures
function extractControllerMethodSignatures($controllerPath) {
    $signatures = [];
    
    if (!file_exists($controllerPath)) {
        echo "Controller not found: $controllerPath\n";
        return $signatures;
    }
    
    $content = file_get_contents($controllerPath);
    
    // Extract all public methods with their signatures
    preg_match_all('/public\s+function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/', $content, $matches, PREG_SET_ORDER);
    
    foreach ($matches as $match) {
        $methodName = $match[1];
        $params = $match[2];
        $signatures[$methodName] = $params;
    }
    
    return $signatures;
}

// Function to update a test file based on controller method signatures
function updateTestFile($testPath, $signatures) {
    if (!file_exists($testPath)) {
        echo "Test file not found: $testPath\n";
        return;
    }
    
    $content = file_get_contents($testPath);
    
    // Replace @test with #[Test]
    $content = preg_replace('/\/\*\*\s+\*\s*@test\s+\*\//', '#[Test]', $content);
    
    // For each method signature, update the tests
    foreach ($signatures as $methodName => $signature) {
        // Check if this is a test for this method
        $testMethodName = "{$methodName}_method";
        if (strpos($content, "function {$testMethodName}") !== false) {
            echo "Fixing test for $methodName in $testPath\n";
            
            // Extract current parameters used in the test
            preg_match_all("/\\\$this->[a-zA-Z0-9_]+->$methodName\((.*?)\);/", $content, $calls, PREG_SET_ORDER);
            
            foreach ($calls as $call) {
                $currentParams = $call[1];
                
                // Create proper parameter list based on signature
                $signatureParams = explode(',', $signature);
                $newParams = [];
                
                foreach ($signatureParams as $i => $param) {
                    $param = trim($param);
                    if (empty($param)) continue;
                    
                    // Extract parameter type and name
                    if (preg_match('/([a-zA-Z0-9_\\\\]+)(\s+)?\$([a-zA-Z0-9_]+)/', $param, $paramMatch)) {
                        $paramType = $paramMatch[1];
                        $paramName = $paramMatch[3];
                        
                        // Add request parameter if needed
                        if ($paramType == 'Request' || $paramType == 'Illuminate\\Http\\Request') {
                            if (strpos($currentParams, '$request') === false) {
                                $newParams[] = 'new Request()';
                            }
                        }
                    }
                }
                
                // Add the current parameters
                if (!empty($currentParams)) {
                    $currentParamsList = explode(',', $currentParams);
                    foreach ($currentParamsList as $param) {
                        $newParams[] = trim($param);
                    }
                }
                
                // Build new parameter list
                $newParamString = implode(', ', $newParams);
                
                // Update the method call
                $oldCall = "\$this->{$methodName}({$currentParams})";
                $newCall = "\$this->{$methodName}({$newParamString})";
                
                $content = str_replace($oldCall, $newCall, $content);
            }
        }
    }
    
    // Write the updated content back to the file
    file_put_contents($testPath, $content);
}

// Main processing
$controllers = [
    'ClientController', 
    'ProjectController', 
    'VulnerabilityController',
    'MethodologyController',
    'ReportController',
    'ReportTemplateController', 
    'VulnerabilityTemplateController',
    'FileController',
    'NoteController'
];

foreach ($controllers as $controller) {
    echo "Processing $controller\n";
    
    $controllerPath = "app/Http/Controllers/{$controller}.php";
    $testPath = "tests/Unit/Http/Controllers/{$controller}Test.php";
    
    $signatures = extractControllerMethodSignatures($controllerPath);
    updateTestFile($testPath, $signatures);
}

echo "Done!\n"; 