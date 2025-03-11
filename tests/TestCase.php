<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\MockViteManifest;

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
        // Use our MockViteManifest class to replace the Vite instance
        MockViteManifest::setup();
        
        // Create the build directory if it doesn't exist
        $buildDir = public_path('build');
        $assetsDir = public_path('build/assets');
        
        if (!File::exists($buildDir)) {
            File::makeDirectory($buildDir, 0755, true);
        }
        
        if (!File::exists($assetsDir)) {
            File::makeDirectory($assetsDir, 0755, true);
        }
        
        // Create a manifest file with mock entries
        $manifestPath = $buildDir . '/manifest.json';
        
        if (!File::exists($manifestPath)) {
            // Create all the needed mock files
            $mockFiles = [
                'app-mock.js',
                'app-mock.css',
                'dashboard-mock.js',
                'auth-login-mock.js',
                'auth-register-mock.js',
                'auth-forgot-password-mock.js',
                'auth-reset-password-mock.js',
                'auth-verify-email-mock.js',
                'auth-confirm-password-mock.js',
                'settings-profile-mock.js'
            ];
            
            // Create each mock file
            foreach ($mockFiles as $file) {
                $extension = pathinfo($file, PATHINFO_EXTENSION);
                $content = $extension === 'js' 
                    ? '// Mock JS file for testing' 
                    : '/* Mock CSS file for testing */';
                    
                File::put($assetsDir . '/' . $file, $content);
            }
            
            // Create the manifest file that lists all the mock files
            $manifest = app(\Illuminate\Foundation\Vite::class)->manifest();
            File::put($manifestPath, json_encode($manifest));
        }
    }
}
