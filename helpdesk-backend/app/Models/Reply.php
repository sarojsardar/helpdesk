<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reply extends Model
{
    use HasFactory;

    protected $fillable = ['ticket_id', 'user_id', 'message', 'is_internal'];

    protected function casts(): array
    {
        return ['is_internal' => 'boolean'];
    }

    public function ticket() { return $this->belongsTo(Ticket::class); }
    public function user()   { return $this->belongsTo(User::class); }
}
