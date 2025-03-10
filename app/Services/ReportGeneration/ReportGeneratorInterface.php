<?php

namespace App\Services\ReportGeneration;

use App\Models\Report;

interface ReportGeneratorInterface
{
    /**
     * Generate a report document.
     *
     * @param Report $report The report to generate
     * @return string|null The path to the generated file, or null on failure
     */
    public function generateReport(Report $report): ?string;
} 