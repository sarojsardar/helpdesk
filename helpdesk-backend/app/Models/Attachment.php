<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attachment extends Model
{
    protected $fillable = ['ticket_id', 'user_id', 'filename', 'original_name', 'mime_type', 'size'];

    public function ticket() { return $this->belongsTo(Ticket::class); }
    public function user()   { return $this->belongsTo(User::class); }
}
