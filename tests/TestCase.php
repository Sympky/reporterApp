<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Set up mock Vite for testing
        $this->mockVite();
    }
    
    /**
     * Mock the Vite facade to prevent "Vite manifest not found" errors during testing
     */
    protected function mockVite()
    {
        // Create a mock Vite manifest file if it doesn't exist
        $manifestPath = public_path('build/manifest.json');
        $manifestDir = dirname($manifestPath);
        
        if (!File::exists($manifestDir)) {
            File::makeDirectory($manifestDir, 0755, true);
        }
        
        if (!File::exists($manifestPath)) {
            // Create a minimal mock manifest
            $manifest = [
                'resources/js/app.tsx' => [
                    'file' => 'assets/app-mock.js',
                    'src' => 'resources/js/app.tsx',
                    'isEntry' => true,
                    'css' => ['assets/app-mock.css']
                ],
                'resources/js/pages/Dashboard.tsx' => [
                    'file' => 'assets/dashboard-mock.js',
                    'src' => 'resources/js/pages/Dashboard.tsx',
                    'isEntry' => true,
                ],
            ];
            
            File::put($manifestPath, json_encode($manifest));
            
            // Create empty asset files to prevent 404 errors
            if (!File::exists(public_path('build/assets'))) {
                File::makeDirectory(public_path('build/assets'), 0755, true);
            }
            
            // Create the mock JS and CSS files
            File::put(public_path('build/assets/app-mock.js'), '// Mock JS file for testing');
            File::put(public_path('build/assets/app-mock.css'), '/* Mock CSS file for testing */');
            File::put(public_path('build/assets/dashboard-mock.js'), '// Mock JS file for testing');
        }
    }
}
