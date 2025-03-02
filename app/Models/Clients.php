<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Clients extends Model
{
    /** @use HasFactory<\Database\Factories\ClientsFactory> */
    use HasFactory;
    protected $fillable = ['name', 'email', 'address'];

    public function projects()
    {
        return $this->hasMany(Projects::class);
    }
}
