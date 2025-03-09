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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('report_template_id')->constrained('report_templates');
            $table->foreignId('client_id')->constrained('clients');
            $table->foreignId('project_id')->constrained('projects');
            $table->text('executive_summary')->nullable();
            $table->string('status')->default('draft'); // draft, published, etc.
            $table->string('generated_file_path')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
