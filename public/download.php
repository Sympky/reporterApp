<?php
// Direct file download script that bypasses Laravel's response handling
// but still uses Laravel's authentication and storage systems

// Bootstrap Laravel
require_once __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

// Get the kernel and handle the request to initialize sessions
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$request = \Illuminate\Http\Request::capture();
$response = $kernel->handle($request);

// Now check if the user is authenticated
$authenticated = app('auth')->check();

if (!$authenticated) {
    echo "Unauthorized. Please log in.";
    exit;
}

// Get the report ID from the query string
$reportId = $_GET['id'] ?? null;
if (!$reportId) {
    echo "Error: No report ID provided.";
    exit;
}

try {
    // Get the report from the database
    $report = \App\Models\Report::findOrFail($reportId);
    
    // Check if file path exists
    if (!$report->generated_file_path) {
        echo "Error: No file path found for this report.";
        exit;
    }
    
    // Parse the file path
    $path = $report->generated_file_path;
    $disk = 'local';
    
    if (preg_match('#^(public)/(.+)$#', $path, $matches)) {
        $disk = $matches[1];
        $path = $matches[2];
    }
    
    // Determine the absolute file path
    $storage = app('filesystem')->disk($disk);
    $fullPath = $storage->path($path);
    
    // Make sure the file exists
    if (!file_exists($fullPath)) {
        echo "Error: File not found at {$fullPath}";
        exit;
    }
    
    // Log the download attempt
    \Illuminate\Support\Facades\Log::info("Direct PHP download: User " . app('auth')->id() . " is downloading report {$reportId}, file: {$fullPath}");
    
    // Get file details
    $fileSize = filesize($fullPath);
    $fileName = $report->name . '.docx';
    
    // Clear any output buffers
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    // Set headers to force download
    header('Content-Description: File Transfer');
    header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    header('Content-Disposition: attachment; filename="' . $fileName . '"');
    header('Content-Transfer-Encoding: binary');
    header('Expires: 0');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    header('Pragma: public');
    header('Content-Length: ' . $fileSize);
    
    // Output the file
    readfile($fullPath);
    exit;
} catch (Exception $e) {
    \Illuminate\Support\Facades\Log::error("Direct PHP download error: " . $e->getMessage());
    echo "Error: " . $e->getMessage();
    exit;
} 