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
        Schema::table('vulnerabilities', function (Blueprint $table) {
            $table->longText('notes')->nullable()->after('evidence')->comment('Additional notes and observations about the vulnerability');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vulnerabilities', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
};
