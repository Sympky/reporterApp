<?php

namespace App\Console\Commands;

use App\Models\ReportTemplate;
use App\Models\Report;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpWord\TemplateProcessor;

class GenerateReport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'report:generate 
                            {template_id : The ID of the template to use}
                            {--title=Security Assessment Report : Report title}
                            {--client=Client Name : Client name}
                            {--author=Security Team : Report author}
                            {--output=report.docx : Output filename}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a report from a template with sample data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $templateId = $this->argument('template_id');
        $title = $this->option('title');
        $client = $this->option('client');
        $author = $this->option('author');
        $outputFilename = $this->option('output');
        
        // Get the template
        $template = ReportTemplate::find($templateId);
        if (!$template) {
            $this->error("Template with ID {$templateId} not found");
            return 1;
        }
        
        $this->info("Using template: {$template->name}");
        
        // Extract template path
        $path = $template->file_path;
        $disk = 'local';
        
        if (preg_match('#^(public)/(.+)$#', $path, $matches)) {
            $disk = $matches[1];
            $path = $matches[2];
        }
        
        $templatePath = Storage::disk($disk)->path($path);
        
        // Prepare output path
        $outputPath = storage_path('app/reports/' . $outputFilename);
        
        // Create output directory if it doesn't exist
        $outputDir = dirname($outputPath);
        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }
        
        // Sample data for the report
        $reportData = [
            'metadata' => [
                'report_title' => $title,
                'report_date' => date('F j, Y'),
                'report_author' => $author,
                'client_name' => $client,
                'assessment_period' => date('F Y'),
            ],
            'methodologies' => [
                [
                    'title' => 'Network Infrastructure Assessment',
                    'description' => 'A comprehensive scan and analysis of network infrastructure.',
                    'findings' => [
                        [
                            'title' => 'Outdated Firewall Firmware',
                            'severity' => 'High',
                            'description' => 'The main perimeter firewall has outdated firmware.',
                            'recommendation' => 'Update to the latest firmware version.'
                        ],
                        [
                            'title' => 'Default SNMP Community Strings',
                            'severity' => 'Medium',
                            'description' => 'Default SNMP strings were found on network devices.',
                            'recommendation' => 'Change SNMP community strings to unique values.'
                        ]
                    ]
                ],
                [
                    'title' => 'Web Application Testing',
                    'description' => 'Static and dynamic testing of web applications.',
                    'findings' => [
                        [
                            'title' => 'SQL Injection Vulnerability',
                            'severity' => 'Critical',
                            'description' => 'Multiple endpoints vulnerable to SQL injection.',
                            'recommendation' => 'Implement parameterized queries.'
                        ]
                    ]
                ]
            ]
        ];
        
        try {
            $this->info("Generating report...");
            
            // Generate the report
            $templateProcessor = new TemplateProcessor($templatePath);
            
            // Set metadata values
            foreach ($reportData['metadata'] as $key => $value) {
                $templateProcessor->setValue($key, $value);
            }
            
            // PHASE 1: Clone the methodology blocks with indexed placeholders
            $blockReplacements = [];
            $i = 0;
            
            foreach($reportData['methodologies'] as $methodology) {
                $blockReplacements[] = [
                    'methodology_title' => $methodology['title'],
                    'methodology_description' => $methodology['description'],
                    'finding_title' => '${finding_title_'.$i.'}',
                    'finding_severity' => '${finding_severity_'.$i.'}',
                    'finding_description' => '${finding_description_'.$i.'}',
                    'finding_recommendation' => '${finding_recommendation_'.$i.'}'
                ];
                $i++;
            }
            
            // Clone the methodology block
            $templateProcessor->cloneBlock(
                'block_methodologies', 
                count($blockReplacements), 
                true, 
                false, 
                $blockReplacements
            );
            
            // PHASE 2: Clone the table rows for findings within each methodology
            $i = 0;
            foreach($reportData['methodologies'] as $methodology) {
                if (isset($methodology['findings']) && !empty($methodology['findings'])) {
                    $values = [];
                    
                    foreach($methodology['findings'] as $finding) {
                        $values[] = [
                            "finding_title_{$i}" => $finding['title'],
                            "finding_severity_{$i}" => $finding['severity'],
                            "finding_description_{$i}" => $finding['description'],
                            "finding_recommendation_{$i}" => $finding['recommendation']
                        ];
                    }
                    
                    // Clone the rows for this methodology
                    if (!empty($values)) {
                        $templateProcessor->cloneRowAndSetValues("finding_title_{$i}", $values);
                    }
                }
                
                $i++;
            }
            
            // Save the document
            $templateProcessor->saveAs($outputPath);
            
            // Create a database record if we have users
            $admin = User::first();
            if ($admin) {
                Report::create([
                    'title' => $title,
                    'client_name' => $client,
                    'template_id' => $template->id,
                    'file_path' => 'reports/' . $outputFilename,
                    'created_by' => $admin->id,
                ]);
            }
            
            $this->info("Report successfully generated at: {$outputPath}");
            return 0;
            
        } catch (\Exception $e) {
            $this->error("Error generating report: " . $e->getMessage());
            return 1;
        }
    }
} 