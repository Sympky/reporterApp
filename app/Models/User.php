<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Vulnerability;
use App\Models\Project;


class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function createdVulnerability()
    {
        return $this->hasMany(Vulnerability::class, 'created_by');
    }

    /**
     * Get the vulnerabilities updated by the user.
     */
    public function updatedVulnerability()
    {
        return $this->hasMany(Vulnerability::class, 'updated_by');
    }

    /**
     * Get the projects created by the user.
     */
    public function createdProject()
    {
        return $this->hasMany(Project::class, 'created_by');
    }

    /**
     * Get the projects updated by the user.
     */
    public function updatedProject()
    {
        return $this->hasMany(Project::class, 'updated_by');
    }

    /**
     * Get the clients created by the user.
     */
    public function createdClient()
    {
        return $this->hasMany(Client::class, 'created_by');
    }

    /**
     * Get the clients updated by the user.
     */
    public function updatedClient()
    {
        return $this->hasMany(Client::class, 'updated_by');
    }
}
