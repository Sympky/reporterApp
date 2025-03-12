<?php

require_once 'generateReport.php';
require_once 'generateReportWithTables.php';
require_once 'generateReportExactMethod.php';

// Set up paths
$templatesDir = 'templates/';
$outputDir = 'reports/';

// Make sure output directory exists
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

// Example data (you would typically get this from your database or user input)
$reportData = [
    'metadata' => [
        'report_title' => 'Security Assessment Report',
        'report_date' => date('F j, Y'),
        'report_author' => 'Security Analysis Team',
        'client_name' => 'Example Client Inc.',
        'assessment_period' => 'June 1-15, 2023'
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
            'title' => 'Application Security Testing',
            'description' => 'Static and dynamic security testing of web applications and APIs.',
            'findings' => [
                [
                    'title' => 'Insufficient Session Timeout',
                    'severity' => 'Low',
                    'description' => 'User sessions don\'t expire after periods of inactivity, increasing the risk of session hijacking.',
                    'recommendation' => 'Implement a session timeout of 15-30 minutes for inactive sessions.'
                ],
                [
                    'title' => 'Missing HTTP Security Headers',
                    'severity' => 'Medium',
                    'description' => 'The application does not implement recommended security headers such as Content-Security-Policy and X-XSS-Protection.',
                    'recommendation' => 'Implement all recommended security headers as detailed in the OWASP Secure Headers Project.'
                ],
                [
                    'title' => 'API Authentication Bypass',
                    'severity' => 'Critical',
                    'description' => 'A logic flaw in the API authentication allows bypassing access controls by manipulating request parameters.',
                    'recommendation' => 'Restructure the authentication flow and implement proper validation at every step of the process.'
                ]
            ]
        ]
    ]
];

// Option 1: Generate a report using the basic method
// This approach works well if methodology and findings are in separate sections
$template1 = $templatesDir . 'basic_template.docx';
$output1 = $outputDir . 'basic_report_' . date('Ymd') . '.docx';

if (file_exists($template1)) {
    echo "Generating basic report...\n";
    generateReport($template1, $reportData, $output1);
    echo "Report generated: $output1\n";
} else {
    echo "Template file not found: $template1\n";
}

// Option 2: Generate a report with table-based findings
// This approach works well if findings are in tables within methodology sections
$template2 = $templatesDir . 'table_template.docx';
$output2 = $outputDir . 'table_report_' . date('Ymd') . '.docx';

if (file_exists($template2)) {
    echo "Generating table-based report...\n";
    generateReportWithTables($template2, $reportData, $output2);
    echo "Report generated: $output2\n";
} else {
    echo "Template file not found: $template2\n";
}

// Option 3: Generate a report using the exact method from the example
// This is the most flexible approach, directly following the original technique
$template3 = $templatesDir . 'exact_method_template.docx';
$output3 = $outputDir . 'exact_method_report_' . date('Ymd') . '.docx';

if (file_exists($template3)) {
    echo "Generating report using exact method...\n";
    generateReportExactMethod($template3, $reportData, $output3);
    echo "Report generated: $output3\n";
} else {
    echo "Template file not found: $template3\n";
}

echo "\nDone!\n"; 