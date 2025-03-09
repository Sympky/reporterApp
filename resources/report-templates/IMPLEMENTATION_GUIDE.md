# Report Template Implementation Guide

This document provides technical guidance on implementing the standard report structure in the DocxGenerationService. It explains how to create templates that follow the standardized structure and how the service processes them.

## Template Implementation

### Required Document Structure

When creating a DOCX template for the report generation system, ensure the document includes the following section headers, in order:

1. Executive Summary
2. Introduction
3. Methodology
4. Findings Matrix
5. Detailed Findings
6. Remediation Recommendations
7. Appendices

### Block Tags for Template Processing

The DocxGenerationService uses specific tags to identify blocks in the template. When creating a template, use these tags:

- `${executive_summary}`
- `${introduction}`
- `${methodology}`
- `${findings_matrix}`
- `${findings_detailed}`
- `${remediation}`
- `${appendices}`

Additionally, each finding should use these tags:

- `${finding.title}`
- `${finding.severity}`
- `${finding.components}`
- `${finding.description}`
- `${finding.proof}`
- `${finding.impact}`
- `${finding.remediation}`
- `${finding.verification}`

### Generate From Scratch Mode

When the `generate_from_scratch` option is enabled in the Report model, the DocxGenerationService will bypass template processing and generate a report following the standard structure. This is useful when:

- No appropriate template exists
- A template is corrupted
- You want to ensure a completely standardized report

## Visual Styling Implementation

### Color Scheme

When generating reports from scratch, the service will use:

- Navy blue (#003366) for headings
- Dark gray (#333333) for body text
- White (#FFFFFF) for background
- Severity-specific colors for finding indicators

### Severity Color Implementation

The service implements severity colors as follows:

```php
$severityColors = [
    'Critical' => 'FF0000',  // Red
    'High'     => 'FF7F00',  // Orange
    'Medium'   => 'FFFF00',  // Yellow
    'Low'      => '0000FF',  // Blue
    'Info'     => '00FF00'   // Green
];
```

### Font Implementation

When generating reports from scratch, the service uses:

- Georgia for headings
- Calibri for body text

## Chart Generation

### Required Charts

The DocxGenerationService will automatically generate these charts:

1. Findings Severity Distribution (Pie chart)
2. Findings by Category (Bar chart)
3. Affected Systems (Bar chart)
4. Risk Heat Map (Scatter plot)
5. Remediation Timeline (Gantt chart)

### Chart Generation Code

Charts are generated using the PHPWord library. Here's an example of how to implement a pie chart:

```php
// Create pie chart for severity distribution
$chart = $section->addChart('pie', $severityCounts, ['width' => 500, 'height' => 300]);
$chart->setTitle('Findings by Severity');
$chart->setLegend(['position' => 'r']);
```

## Finding Template Implementation

### Finding Block Structure

Each finding in the "Detailed Findings" section should follow this HTML structure:

```html
<div class="finding">
    <h4>${finding.title}</h4>
    <div class="severity ${finding.severity.toLowerCase()}">${finding.severity}</div>
    <div class="components">
        <h5>Affected Components:</h5>
        <ul>${finding.components}</ul>
    </div>
    <div class="description">
        <h5>Description:</h5>
        <p>${finding.description}</p>
    </div>
    <div class="proof">
        <h5>Proof of Concept:</h5>
        <p>${finding.proof}</p>
    </div>
    <div class="impact">
        <h5>Impact:</h5>
        <p>${finding.impact}</p>
    </div>
    <div class="remediation">
        <h5>Remediation Steps:</h5>
        <p>${finding.remediation}</p>
    </div>
    <div class="verification">
        <h5>Verification Steps:</h5>
        <p>${finding.verification}</p>
    </div>
</div>
```

### Processing Multiple Findings

The DocxGenerationService processes multiple findings using the `cloneBlock` method of the TemplateProcessor. For each finding, it:

1. Clones the finding template block
2. Replaces all variables with the finding data
3. Applies appropriate styling based on severity

Example implementation:

```php
// Clone the finding block for each finding
$templateProcessor->cloneBlock('finding', count($findings));

// Replace variables in each cloned block
foreach ($findings as $index => $finding) {
    $templateProcessor->setValue('finding.title#' . ($index + 1), $finding->title);
    $templateProcessor->setValue('finding.severity#' . ($index + 1), $finding->severity);
    // ... other replacements
}
```

## Matrix Generation

### Findings Matrix Structure

The findings matrix should be implemented as an HTML table with these columns:

1. ID
2. Title
3. Severity
4. Affected Systems
5. Remediation Difficulty

Example implementation:

```php
// Create findings matrix table
$table = $section->addTable();
$table->addRow();
$table->addCell(1000)->addText('ID');
$table->addCell(3000)->addText('Title');
$table->addCell(1500)->addText('Severity');
$table->addCell(2000)->addText('Affected Systems');
$table->addCell(1500)->addText('Remediation Difficulty');

// Add rows for each finding
foreach ($findings as $index => $finding) {
    $table->addRow();
    $table->addCell(1000)->addText('F' . ($index + 1));
    $table->addCell(3000)->addText($finding->title);
    $cell = $table->addCell(1500);
    $cell->addText($finding->severity);
    $cell->getStyle()->setBgColor($severityColors[$finding->severity]);
    $table->addCell(2000)->addText(implode(', ', $finding->components));
    $table->addCell(1500)->addText($finding->remediation_difficulty);
}
```

## Testing the Implementation

### Validation Checklist

After generating a report, verify:

1. All sections are present and in the correct order
2. The executive summary is limited to 1-2 pages
3. Charts and visualizations are correctly rendered
4. Severity colors are applied consistently
5. Findings follow the standardized template
6. Fonts and styling are consistent throughout the document

### Troubleshooting Common Issues

- **Missing sections**: Check that all required section tags are in the template
- **Chart rendering issues**: Verify PHP GD library is installed and working
- **Formatting inconsistencies**: Check template styles and ensure they're not overridden
- **Memory errors**: Increase PHP memory_limit for large reports with many findings
- **Image/screenshot issues**: Verify images are in correct format (JPG or PNG) and properly sized

## Extending the Implementation

### Adding Custom Section Types

To add a new section type:

1. Define a new tag (e.g., `${custom_section}`)
2. Add processing logic in the DocxGenerationService
3. Update the template guide and standard template

### Custom Chart Types

To implement a custom chart type:

1. Add chart generation code to the DocxGenerationService
2. Configure the template to include the chart
3. Document the new chart type in this guide 