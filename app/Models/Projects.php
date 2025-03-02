<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Projects extends Model
{
    /** @use HasFactory<\Database\Factories\ProjectsFactory> */
    use HasFactory;
    protected $fillable = ['name', 'description', 'client_id'];

    public function client()
    {
        return $this->belongsTo(Clients::class, 'client_id');
    }
}
