<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketRating extends Model
{
    protected $fillable = [
        'ticket_id', 'user_id', 'score', 'comment',
        'resolution_helpful', 'response_speed', 'communication_rating', 'would_recommend',
    ];

    protected function casts(): array
    {
        return [
            'resolution_helpful' => 'boolean',
            'would_recommend'    => 'boolean',
        ];
    }

    public function ticket() { return $this->belongsTo(Ticket::class); }
    public function user()   { return $this->belongsTo(User::class); }
}
