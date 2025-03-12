<?php

namespace Tests\Feature\Traits;

use Illuminate\Support\Facades\Route;
use Illuminate\Testing\TestResponse;
use Inertia\Inertia;
use Inertia\Testing\AssertableInertia;
use Mockery;

trait MocksInertia
{
    /**
     * Setup the test and mock Inertia response to avoid Vite manifest issues
     */
    protected function setUpInertia()
    {
        // Disable Inertia middleware for all tests
        $this->withoutMiddleware(\Inertia\Middleware::class);
        
        // Mock the Inertia facade to prevent it from trying to render components
        Inertia::macro('render', function ($component, $props = []) {
            // Just return a JSON response with the component and props
            // This avoids the need for any frontend components to exist
            return response()->json([
                'component' => $component,
                'props' => $props
            ]);
        });
        
        // Add macro to TestResponse for asserting Inertia responses
        TestResponse::macro('assertInertia', function ($callback = null) {
            $this->assertJson([
                'component' => $this->json('component'),
                'props' => $this->json('props')
            ]);

            if ($callback) {
                $callback(new AssertableInertia($this));
            }

            return $this;
        });
    }
} 