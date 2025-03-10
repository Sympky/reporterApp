<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Testing factories...\n";

// Test each factory
$factories = [
    \App\Models\User::class,
    \App\Models\Client::class,
    \App\Models\Project::class,
    \App\Models\Vulnerability::class,
    \App\Models\Report::class,
    \App\Models\ReportTemplate::class,
    \App\Models\Methodology::class,
    \App\Models\File::class,
    \App\Models\Note::class
];

foreach ($factories as $modelClass) {
    try {
        $shortName = (new \ReflectionClass($modelClass))->getShortName();
        echo "Testing $shortName factory... ";
        
        $instance = $modelClass::factory()->make();
        
        echo "Success!\n";
        echo "  Sample attributes: " . json_encode($instance->getAttributes()) . "\n\n";
    } catch (\Exception $e) {
        echo "Failed: " . $e->getMessage() . "\n\n";
    }
}

echo "Factory testing complete!\n"; 