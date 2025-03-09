<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Report extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'report_template_id',
        'client_id',
        'project_id',
        'executive_summary',
        'status',
        'generated_file_path',
        'created_by',
        'updated_by',
    ];

    /**
     * Get the template used for this report.
     */
    public function reportTemplate(): BelongsTo
    {
        return $this->belongsTo(ReportTemplate::class);
    }

    /**
     * Get the client associated with this report.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the project associated with this report.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the methodologies included in this report.
     */
    public function methodologies()
    {
        return $this->belongsToMany(Methodology::class, 'report_methodologies')
            ->withPivot('order')
            ->orderBy('report_methodologies.order')
            ->withTimestamps();
    }

    /**
     * Get the findings (vulnerabilities) included in this report.
     */
    public function findings()
    {
        return $this->belongsToMany(Vulnerability::class, 'report_findings')
            ->withPivot('order', 'include_evidence')
            ->orderBy('report_findings.order')
            ->withTimestamps();
    }

    /**
     * Get the report methodologies pivot records directly.
     */
    public function reportMethodologies(): HasMany
    {
        return $this->hasMany(ReportMethodology::class);
    }

    /**
     * Get the report findings pivot records directly.
     */
    public function reportFindings(): HasMany
    {
        return $this->hasMany(ReportFinding::class);
    }

    /**
     * Get the user who created the report.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the report.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
