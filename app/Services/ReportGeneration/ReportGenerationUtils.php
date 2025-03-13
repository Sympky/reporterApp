<?php

namespace App\Services\ReportGeneration;

use App\Models\Report;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ReportGenerationUtils
{
    /**
     * Prepare directory for saving the report.
     *
     * @param string $saveDirectory Directory path relative to storage/app/disk
     * @param string $disk Storage disk to use
     * @return bool Whether the directory was successfully prepared
     */
    public static function prepareDirectory(string $saveDirectory, string $disk = 'public'): bool
    {
        try {
            if (!Storage::disk($disk)->exists($saveDirectory)) {
                Storage::disk($disk)->makeDirectory($saveDirectory);
                Log::info("Created directory: {$saveDirectory} on disk: {$disk}");
            }
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to create directory: {$saveDirectory} on disk: {$disk}. Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Update report record with the generated file path.
     *
     * @param Report $report The report to update
     * @param string $filePath The path to the generated file (relative to storage/app/disk)
     * @param string $disk The storage disk name ('public', 'local', etc.)
     * @return bool Whether the update was successful
     */
    public static function updateReportWithFilePath(Report $report, string $filePath, string $disk = 'public'): bool
    {
        try {
            // Store the path with the disk prefix for consistency
            $storedPath = $disk . '/' . ltrim($filePath, '/');
            $report->generated_file_path = $storedPath;
            $report->status = 'generated';
            $report->updated_by = Auth::id();
            $report->save();
            
            Log::info("Updated report file path to: {$storedPath}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to update report with file path. Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate a unique filename for a report.
     *
     * @param Report $report The report
     * @param string $prefix Optional prefix for the filename
     * @param string $extension File extension (without the dot)
     * @return string The generated filename
     */
    public static function generateUniqueFilename(Report $report, string $prefix = '', string $extension = 'docx'): string
    {
        $baseName = Str::slug($report->name);
        $timestamp = time();
        
        if (!empty($prefix)) {
            $prefix = rtrim($prefix, '_') . '_';
        }
        
        return "{$prefix}{$baseName}_{$timestamp}.{$extension}";
    }

    /**
     * Generate HTML emergency report when docx generation fails.
     *
     * @param Report $report The report
     * @return string|null The path to the generated HTML file, or null on failure
     */
    public static function generateEmergencyReport(Report $report): ?string
    {
        try {
            $client = $report->client;
            $project = $report->project;
            $findings = $report->findings->sortBy('pivot.order');
            $methodologies = $report->methodologies->sortBy('pivot.order');
            
            // Start building HTML content
            $content = "<!DOCTYPE html><html><head><meta charset='UTF-8'>";
            $content .= "<title>Emergency Report: " . htmlspecialchars($report->name) . "</title>";
            $content .= "<style>body{font-family:Arial,sans-serif;line-height:1.6;margin:20px;}</style>";
            $content .= "</head><body>";
            
            // Report title
            $content .= "<h1>" . htmlspecialchars($report->name) . "</h1>";
            
            // Client and project info
            $content .= "<h2>Project Information</h2>";
            $content .= "<p><strong>Client:</strong> " . htmlspecialchars($client->name ?? 'N/A') . "</p>";
            $content .= "<p><strong>Project:</strong> " . htmlspecialchars($project->name ?? 'N/A') . "</p>";
            
            // Executive summary
            if (!empty($report->executive_summary)) {
                $content .= "<h2>Executive Summary</h2>";
                $content .= "<p>" . nl2br(htmlspecialchars($report->executive_summary)) . "</p>";
            }
            
            // Methodologies
            if ($methodologies->count() > 0) {
                $content .= "<h2>Methodology</h2>";
                foreach ($methodologies as $methodology) {
                    $content .= "<h3>" . htmlspecialchars($methodology->title ?? 'Untitled Methodology') . "</h3>";
                    $content .= "<p>" . nl2br(htmlspecialchars($methodology->content ?? 'No description provided.')) . "</p>";
                }
            }
            
            // Findings
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
            
            // Generate filename and save
            $fileName = self::generateUniqueFilename($report, 'emergency_', 'html');
            $saveDirectory = 'reports';
            $savePath = $saveDirectory . '/' . $fileName;
            $disk = 'public';
            
            // Prepare directory and save file
            if (self::prepareDirectory($saveDirectory, $disk)) {
                Storage::disk($disk)->put($savePath, $content);
                
                // Update report with file path using disk prefix
                if (self::updateReportWithFilePath($report, $savePath, $disk)) {
                    Log::info("Emergency HTML report generated at: {$disk}/{$savePath}");
                    return $disk . '/' . $savePath;
                }
            }
            
            return null;
        } catch (\Exception $e) {
            Log::error("Error generating emergency report: " . $e->getMessage());
            Log::error($e->getTraceAsString());
            return null;
        }
    }
} 