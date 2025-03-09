<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Project;
use App\Models\Report;
use App\Models\ReportTemplate;
use App\Models\Methodology;
use App\Models\Vulnerability;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ReportService
{
    /**
     * Create a new report.
     *
     * @param array $data The report data
     * @return Report The created report
     */
    public function createReport(array $data): Report
    {
        $report = new Report();
        $report->name = $data['name'];
        
        // Only set report_template_id if not generating from scratch
        if (empty($data['generate_from_scratch'])) {
            $report->report_template_id = $data['report_template_id'] ?? null;
        } else {
            $report->report_template_id = null;
        }
        
        $report->client_id = $data['client_id'];
        $report->project_id = $data['project_id'];
        $report->executive_summary = $data['executive_summary'] ?? null;
        $report->status = 'draft';
        $report->created_by = Auth::id();
        $report->generate_from_scratch = !empty($data['generate_from_scratch']);
        $report->save();

        // Attach methodologies if provided
        if (isset($data['methodologies']) && is_array($data['methodologies'])) {
            $methodologyData = [];
            foreach ($data['methodologies'] as $index => $methodologyId) {
                $methodologyData[$methodologyId] = ['order' => $index];
            }
            $report->methodologies()->attach($methodologyData);
        }

        // Attach findings (vulnerabilities) if provided
        if (isset($data['findings']) && is_array($data['findings'])) {
            $findingData = [];
            foreach ($data['findings'] as $index => $finding) {
                $findingData[$finding['vulnerability_id']] = [
                    'order' => $index,
                    'include_evidence' => $finding['include_evidence'] ?? true,
                ];
            }
            $report->findings()->attach($findingData);
        }

        return $report;
    }

    /**
     * Update an existing report.
     *
     * @param Report $report The report to update
     * @param array $data The updated data
     * @return Report The updated report
     */
    public function updateReport(Report $report, array $data): Report
    {
        $report->name = $data['name'] ?? $report->name;
        $report->executive_summary = $data['executive_summary'] ?? $report->executive_summary;
        $report->updated_by = Auth::id();
        $report->save();

        // Update methodologies if provided
        if (isset($data['methodologies']) && is_array($data['methodologies'])) {
            $report->methodologies()->detach();
            $methodologyData = [];
            foreach ($data['methodologies'] as $index => $methodologyId) {
                $methodologyData[$methodologyId] = ['order' => $index];
            }
            $report->methodologies()->attach($methodologyData);
        }

        // Update findings if provided
        if (isset($data['findings']) && is_array($data['findings'])) {
            $report->findings()->detach();
            $findingData = [];
            foreach ($data['findings'] as $index => $finding) {
                $findingData[$finding['vulnerability_id']] = [
                    'order' => $index,
                    'include_evidence' => $finding['include_evidence'] ?? true,
                ];
            }
            $report->findings()->attach($findingData);
        }

        return $report;
    }

    /**
     * Delete a report and its related data.
     *
     * @param Report $report The report to delete
     * @return bool Success status
     */
    public function deleteReport(Report $report): bool
    {
        // Delete the generated file if it exists
        if ($report->generated_file_path && Storage::exists($report->generated_file_path)) {
            Storage::delete($report->generated_file_path);
        }

        // The relationships will be automatically detached due to onDelete('cascade') in the migration
        return $report->delete();
    }

    /**
     * Generate a DOCX report file.
     *
     * @param Report $report The report to generate
     * @return string|null The path to the generated file, or null on failure
     */
    public function generateReportFile(Report $report): ?string
    {
        $sessionId = Str::uuid();
        
        try {
            Log::info("[ReportGen-{$sessionId}] Starting report generation for report ID: {$report->id}");
            
            // Report templates are not needed when generate_from_scratch is true
            if (!$report->generate_from_scratch && !$report->reportTemplate) {
                Log::error("[ReportGen-{$sessionId}] Report template not found for report ID: {$report->id}");
                return null;
            }
            
            if (!$report->generate_from_scratch) {
                Log::info("[ReportGen-{$sessionId}] Using template ID: {$report->reportTemplate->id}, Path: {$report->reportTemplate->file_path}");
            } else {
                Log::info("[ReportGen-{$sessionId}] Generating from scratch (without template)");
            }
            
            $docxService = new DocxGenerationService();
            $result = $docxService->generateReport($report);
            
            if (!$result) {
                Log::error("[ReportGen-{$sessionId}] Failed to generate report for report ID: {$report->id}");
                return null;
            }
            
            Log::info("[ReportGen-{$sessionId}] Report generated successfully, file path: {$result}");
            
            // Verify the file exists after generation
            if (strpos($result, 'public/') === 0) {
                // Extract the path relative to the public disk
                $relativePath = substr($result, 7); // Remove 'public/'
                $fileExists = Storage::disk('public')->exists($relativePath);
                
                if (!$fileExists) {
                    Log::error("[ReportGen-{$sessionId}] Generated file does not exist at path: {$result}");
                    Log::info("[ReportGen-{$sessionId}] Checking with full path: " . storage_path('app/' . $result));
                    
                    if (file_exists(storage_path('app/' . $result))) {
                        Log::info("[ReportGen-{$sessionId}] File exists with full path check");
                        $fileSize = filesize(storage_path('app/' . $result));
                        Log::info("[ReportGen-{$sessionId}] Generated file size: {$fileSize} bytes");
                    }
                }
            }
            
            return $result;
        } catch (\Exception $e) {
            Log::error("[ReportGen-{$sessionId}] Exception during report generation: " . $e->getMessage(), [
                'exception' => $e,
                'report_id' => $report->id,
            ]);
            return null;
        }
    }

    /**
     * Get all available templates for reports.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getTemplates()
    {
        return ReportTemplate::all();
    }
} 