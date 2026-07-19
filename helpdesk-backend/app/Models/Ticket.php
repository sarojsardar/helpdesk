<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'description', 'priority', 'status',
        'user_id', 'category_id', 'assigned_to', 'merged_into',
        'response_due_at', 'resolution_due_at',
        'first_response_at', 'resolved_at',
        'notified_due_soon', 'notified_overdue',
    ];

    protected function casts(): array
    {
        return [
            'response_due_at'   => 'datetime',
            'resolution_due_at' => 'datetime',
            'first_response_at' => 'datetime',
            'resolved_at'       => 'datetime',
            'notified_due_soon' => 'boolean',
            'notified_overdue'  => 'boolean',
        ];
    }

    // SLA helpers
    public function isDueSoon(): bool
    {
        return $this->resolution_due_at
            && now()->diffInMinutes($this->resolution_due_at, false) <= 30
            && now()->lt($this->resolution_due_at);
    }

    public function isOverdue(): bool
    {
        return $this->resolution_due_at
            && now()->gt($this->resolution_due_at)
            && !in_array($this->status, ['resolved', 'closed']);
    }

    public function isResponseBreached(): bool
    {
        return $this->response_due_at
            && now()->gt($this->response_due_at)
            && is_null($this->first_response_at);
    }

    // Relationships
    public function user()        { return $this->belongsTo(User::class); }
    public function assignee()    { return $this->belongsTo(User::class, 'assigned_to'); }
    public function category()    { return $this->belongsTo(Category::class); }
    public function replies()     { return $this->hasMany(Reply::class); }
    public function events()      { return $this->hasMany(TicketEvent::class); }
    public function rating()      { return $this->hasOne(TicketRating::class); }
    public function attachments() { return $this->hasMany(Attachment::class); }
    public function tags()        { return $this->belongsToMany(Tag::class); }
    public function mergedInto()  { return $this->belongsTo(Ticket::class, 'merged_into'); }
    public function mergedTickets() { return $this->hasMany(Ticket::class, 'merged_into'); }

}
