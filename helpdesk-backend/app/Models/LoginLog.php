<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginLog extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'ip_address', 'user_agent', 'success', 'logged_at'];

    protected function casts(): array
    {
        return [
            'success'   => 'boolean',
            'logged_at' => 'datetime',
        ];
    }

    public function user() { return $this->belongsTo(User::class); }
}
