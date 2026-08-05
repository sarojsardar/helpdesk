<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'title', 'body', 'type', 'target_roles',
        'is_active', 'starts_at', 'expires_at', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'target_roles' => 'array',
            'is_active'    => 'boolean',
            'starts_at'    => 'datetime',
            'expires_at'   => 'datetime',
        ];
    }

    public function creator() { return $this->belongsTo(User::class, 'created_by'); }

    /**
     * Get currently active announcements for a given role.
     */
    public static function activeFor(string $role)
    {
        return static::where('is_active', true)
            ->where(fn($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>=', now()))
            ->where(fn($q) => $q->whereNull('target_roles')->orWhereJsonContains('target_roles', $role))
            ->orderByDesc('created_at')
            ->get();
    }
}
