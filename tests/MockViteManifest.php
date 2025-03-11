<?php

namespace Tests;

use Illuminate\Support\Facades\App;
use Illuminate\Foundation\Vite;

class MockViteManifest
{
    /**
     * Setup Vite mock for testing
     */
    public static function setup()
    {
        // Only mock Vite in testing environment
        if (!App::environment('testing')) {
            return;
        }
        
        // Replace the Vite instance in the container with our mock
        App::singleton(Vite::class, function ($app) {
            return new class($app) extends Vite {
                /**
                 * Get the Vite manifest.
                 *
                 * @return array
                 */
                public function manifest(?string $buildDirectory = null)
                {
                    return [
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
                }
                
                /**
                 * Generate script tag for React
                 */
                public function reactRefresh()
                {
                    return '';
                }
            };
        });
    }
} 