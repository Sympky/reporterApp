<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    /** @use HasFactory<\Database\Factories\ClientFactory> */
    use HasFactory;
    
        /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'emails',
        'phone_numbers',
        'addresses',
        'website_urls',
        'other_contact_info',
        'created_by',
        'updated_by',
    ];

    /**
     * Get the user who created the client.
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the client.
     */
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the projects for the client.
     */
    public function projects()
    {
        return $this->hasMany(Project::class, 'client_id');
    }
}
