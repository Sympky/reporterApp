<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class File extends Model
{
    use HasFactory;
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'original_name',
        'mime_type',
        'size',
        'path',
        'fileable_type',
        'fileable_id',
        'uploaded_by',
        'description',
    ];
    
    /**
     * Get the parent fileable model (client, project, or vulnerability).
     */
    public function fileable(): MorphTo
    {
        return $this->morphTo();
    }
    
    /**
     * Get the user who uploaded the file.
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
    
    /**
     * Determine if the file is an image.
     */
    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }
    
    /**
     * Determine if the file is a PDF.
     */
    public function isPdf(): bool
    {
        return $this->mime_type === 'application/pdf';
    }
    
    /**
     * Get the URL to download the file.
     */
    public function getDownloadUrl(): string
    {
        return route('files.download', $this->id);
    }
}
