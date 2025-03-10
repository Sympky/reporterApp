<?php

// Script to update all test files to use PHP 8 attributes instead of doc comments
// and to fix Inertia mocking

$controllerTestsDir = __DIR__ . '/tests/Unit/Http/Controllers';
$files = glob($controllerTestsDir . '/*Test.php');

foreach ($files as $file) {
    echo "Processing {$file}...\n";
    
    $content = file_get_contents($file);
    
    // 1. Add PHPUnit\Framework\Attributes\Test import
    if (!str_contains($content, 'PHPUnit\Framework\Attributes\Test')) {
        $content = preg_replace(
            '/(use Mockery;)/',
            '$1' . PHP_EOL . 'use PHPUnit\Framework\Attributes\Test;',
            $content
        );
    }
    
    // 2. Add Inertia\Response as InertiaResponse import
    if (!str_contains($content, 'Inertia\Response as InertiaResponse')) {
        $content = preg_replace(
            '/(use Inertia\\\\Inertia;)/',
            '$1' . PHP_EOL . 'use Inertia\Response as InertiaResponse;',
            $content
        );
    }
    
    // 3. Replace /** @test */ with #[Test]
    $content = preg_replace('/\/\*\*\s+\*\s*@test\s+\*\//', '#[Test]', $content);
    
    // 4. Update Inertia mock in setUp
    $content = preg_replace(
        '/Inertia::shouldReceive\(\'render\'\)->andReturn\(response\(\'Inertia Response\'\)\);/',
        '// Create a better Inertia mock that returns an InertiaResponse
        $inertiaMock = Mockery::mock(\'overload:Inertia\\\Inertia\');
        $inertiaMock->shouldReceive(\'render\')->andReturnUsing(function ($component, $props = []) {
            $responseMock = Mockery::mock(InertiaResponse::class);
            $responseMock->shouldReceive(\'getStatusCode\')->andReturn(200);
            return $responseMock;
        });',
        $content
    );
    
    // 5. Update assertion style from expect() to $this->assertEquals()
    $content = preg_replace(
        '/expect\(\$response->getStatusCode\(\)\)->toBe\((\d+)\);/',
        '$this->assertEquals($1, $response->getStatusCode());',
        $content
    );
    
    // Save the updated content
    file_put_contents($file, $content);
    
    echo "Updated {$file}\n";
}

echo "All test files have been updated!\n"; 