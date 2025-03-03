<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vulnerabilities', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            // Shared fields for templates and findings
            $table->string('name');
            $table->longText('description')->nullable();
            $table->longText('recommendations')->nullable();
            $table->longText('impact')->nullable();
            $table->longText('references')->nullable();
            $table->longText('affected_resources')->nullable();
            $table->json('tags')->nullable();
            $table->string('cve')->nullable();
            $table->string('cvss')->nullable();

            // Scoring
            $scoringLevels = ['info', 'low', 'medium', 'high', 'critical'];
            $table->enum('severity', $scoringLevels)->nullable();
            $table->enum('likelihood_score', $scoringLevels)->nullable();
            $table->enum('remediation_score', $scoringLevels)->nullable(); 
            $table->enum('impact_score', $scoringLevels)->nullable();

            // Differentiation
            $table->boolean('is_template')->default(false)->index(); // For faster lookups

            // Specific to findings
            $table->foreignId('project_id')->nullable()->constrained()->cascadeOnDelete();
            $table->date('discovered_at')->nullable();
            $table->json('evidence')->nullable(); // Proof, screenshots, logs

            // Metadata
            $table->foreignId('created_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vulnerabilities');
    }
};
