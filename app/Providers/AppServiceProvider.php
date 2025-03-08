<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Client;
use App\Models\Project;
use App\Models\Vulnerability;
use App\Observers\ClientObserver;
use App\Observers\ProjectObserver;
use App\Observers\VulnerabilityObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register model observers
        Client::observe(ClientObserver::class);
        Project::observe(ProjectObserver::class);
        Vulnerability::observe(VulnerabilityObserver::class);
    }
}
