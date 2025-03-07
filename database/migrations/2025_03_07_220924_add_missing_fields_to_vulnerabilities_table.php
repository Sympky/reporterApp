<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('vulnerabilities', function (Blueprint $table) {
            // Add status column as string instead of enum for SQLite compatibility
            $table->string('status')->nullable()->after('severity');
            
            // Add remediation_steps column
            if (!Schema::hasColumn('vulnerabilities', 'remediation_steps')) {
                $table->longText('remediation_steps')->nullable()->after('status');
            }
            
            // Add proof_of_concept column
            if (!Schema::hasColumn('vulnerabilities', 'proof_of_concept')) {
                $table->longText('proof_of_concept')->nullable()->after('remediation_steps');
            }
            
            // Add affected_components column
            if (!Schema::hasColumn('vulnerabilities', 'affected_components')) {
                $table->longText('affected_components')->nullable()->after('proof_of_concept');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vulnerabilities', function (Blueprint $table) {
            // Drop the columns added in the up method
            $table->dropColumn('status');
            
            if (Schema::hasColumn('vulnerabilities', 'remediation_steps')) {
                $table->dropColumn('remediation_steps');
            }
            
            if (Schema::hasColumn('vulnerabilities', 'proof_of_concept')) {
                $table->dropColumn('proof_of_concept');
            }
            
            if (Schema::hasColumn('vulnerabilities', 'affected_components')) {
                $table->dropColumn('affected_components');
            }
        });
    }
};
