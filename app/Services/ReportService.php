<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Project;
use App\Models\Report;
use App\Models\ReportTemplate;
use App\Models\Methodology;
use App\Models\Vulnerability;
use App\Services\ReportGeneration\FromScratchReportGenerator;
use App\Services\ReportGeneration\ReportGeneratorInterface;
use App\Services\ReportGeneration\TemplateReportGenerator;
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
        // Ensure consistency between template_id and generation settings
        $generationMethod = $data['generation_method'] ?? ($data['generate_from_scratch'] ? 'from_scratch' : 'from_template');
        $generateFromScratch = $generationMethod === 'from_scratch';
        
        // Double-check consistency: if template_id is set, we should use from_template method
        if (!empty($data['report_template_id'])) {
            $generationMethod = 'from_template';
            $generateFromScratch = false;
            Log::info('Report creation: Using template-based generation due to template_id presence');
        }
        
        $report = new Report();
        $report->name = $data['name'];
        
        // Only set report_template_id if not generating from scratch
        if (!$generateFromScratch) {
            $report->report_template_id = $data['report_template_id'] ?? null;
            if (empty($report->report_template_id)) {
                Log::warning('Template-based report requested but no template_id provided. Falling back to from_scratch.');
                $generateFromScratch = true;
                $generationMethod = 'from_scratch';
            }
        } else {
            $report->report_template_id = null;
        }
        
        $report->client_id = $data['client_id'];
        $report->project_id = $data['project_id'];
        $report->executive_summary = $data['executive_summary'] ?? null;
        $report->status = 'draft';
        $report->created_by = Auth::id();
        $report->generate_from_scratch = $generateFromScratch;
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
     * Generate a report file based on the report settings.
     *
     * @param Report $report The report to generate
     * @return string|null The path to the generated file, or null on failure
     */
    public function generateReportFile(Report $report): ?string
    {
        $sessionId = Str::uuid();
        
        try {
            Log::info("[ReportGen-{$sessionId}] Starting report generation for report ID: {$report->id}");
            
            // Get the appropriate generator based on report settings
            $generator = $this->getReportGenerator($report);
            
            if (!$generator) {
                Log::error("[ReportGen-{$sessionId}] Failed to get a suitable report generator for report ID: {$report->id}");
                return null;
            }
            
            // Generate the report using the selected generator
            Log::info("[ReportGen-{$sessionId}] Using generator: " . get_class($generator));
            $result = $generator->generateReport($report);
            
            if (!$result) {
                Log::error("[ReportGen-{$sessionId}] Failed to generate report for report ID: {$report->id}");
                return null;
            }
            
            Log::info("[ReportGen-{$sessionId}] Report generated successfully, file path: {$result}");
            return $result;
            
        } catch (\Exception $e) {
            Log::error("[ReportGen-{$sessionId}] Error in report generation: " . $e->getMessage());
            Log::error($e->getTraceAsString());
            return null;
        }
    }

    /**
     * Get the appropriate report generator based on report settings.
     *
     * @param Report $report The report
     * @return ReportGeneratorInterface|null The appropriate generator, or null if none suitable
     */
    private function getReportGenerator(Report $report): ?ReportGeneratorInterface
    {
        // First, check for template presence regardless of generate_from_scratch flag
        if ($report->report_template_id && $report->reportTemplate) {
            Log::info("Using template-based generator because template ID {$report->report_template_id} is assigned");
            return new TemplateReportGenerator();
        }

        // If generate_from_scratch is true or no template is available, use from scratch generator
        if ($report->generate_from_scratch || !$report->report_template_id) {
            Log::info("Using from-scratch generator. Generate from scratch flag: " . 
                     ($report->generate_from_scratch ? 'true' : 'false') . 
                     ", Template ID: " . ($report->report_template_id ?: 'none'));
            return new FromScratchReportGenerator();
        }
            
        // For template-based reports, ensure a template is assigned
        if (!$report->reportTemplate) {
            Log::error("Cannot get template-based generator: No template found for template ID: {$report->report_template_id}");
            Log::info("Falling back to from-scratch generator");
            return new FromScratchReportGenerator();
        }
        
        // Use the TemplateReportGenerator for template-based reports
        return new TemplateReportGenerator();
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