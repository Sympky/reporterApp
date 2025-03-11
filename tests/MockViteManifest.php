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
                 * @param  string|null  $buildDirectory
                 * @return array
                 */
                public function manifest($buildDirectory = null)
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
                        // Auth pages
                        'resources/js/pages/auth/login.tsx' => [
                            'file' => 'assets/auth-login-mock.js',
                            'src' => 'resources/js/pages/auth/login.tsx',
                            'isEntry' => true,
                        ],
                        'resources/js/pages/auth/register.tsx' => [
                            'file' => 'assets/auth-register-mock.js',
                            'src' => 'resources/js/pages/auth/register.tsx',
                            'isEntry' => true,
                        ],
                        'resources/js/pages/auth/forgot-password.tsx' => [
                            'file' => 'assets/auth-forgot-password-mock.js',
                            'src' => 'resources/js/pages/auth/forgot-password.tsx',
                            'isEntry' => true,
                        ],
                        'resources/js/pages/auth/reset-password.tsx' => [
                            'file' => 'assets/auth-reset-password-mock.js',
                            'src' => 'resources/js/pages/auth/reset-password.tsx',
                            'isEntry' => true,
                        ],
                        'resources/js/pages/auth/verify-email.tsx' => [
                            'file' => 'assets/auth-verify-email-mock.js',
                            'src' => 'resources/js/pages/auth/verify-email.tsx',
                            'isEntry' => true,
                        ],
                        'resources/js/pages/auth/confirm-password.tsx' => [
                            'file' => 'assets/auth-confirm-password-mock.js',
                            'src' => 'resources/js/pages/auth/confirm-password.tsx',
                            'isEntry' => true,
                        ],
                        // Settings pages
                        'resources/js/pages/settings/profile.tsx' => [
                            'file' => 'assets/settings-profile-mock.js',
                            'src' => 'resources/js/pages/settings/profile.tsx',
                            'isEntry' => true,
                        ],
                        'resources/js/pages/dashboard.tsx' => [
                            'file' => 'assets/dashboard-mock.js',
                            'src' => 'resources/js/pages/dashboard.tsx',
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