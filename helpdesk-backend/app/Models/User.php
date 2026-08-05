<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'role', 'department', 'department_id', 'is_active',
        'availability_status',
        'two_factor_secret', 'two_factor_enabled', 'two_factor_pending_code', 'two_factor_code_expires_at',
    ];

    protected $hidden = ['password', 'remember_token', 'two_factor_secret', 'two_factor_pending_code'];

    protected function casts(): array
    {
        return [
            'email_verified_at'          => 'datetime',
            'password'                   => 'hashed',
            'is_active'                  => 'boolean',
            'two_factor_enabled'         => 'boolean',
            'two_factor_code_expires_at' => 'datetime',
        ];
    }

    // Role helpers
    public function isAdmin(): bool  { return $this->role === 'admin'; }
    public function isStaff(): bool  { return $this->role === 'staff'; }
    public function isUser(): bool   { return $this->role === 'user'; }

    // Relationships
    public function tickets()         { return $this->hasMany(Ticket::class); }
    public function assignedTickets() { return $this->hasMany(Ticket::class, 'assigned_to'); }
    public function replies()         { return $this->hasMany(Reply::class); }
    public function savedFilters()    { return $this->hasMany(SavedFilter::class); }
    public function loginLogs()       { return $this->hasMany(LoginLog::class); }
    public function departmentRelation() { return $this->belongsTo(Department::class, 'department_id'); }
}
