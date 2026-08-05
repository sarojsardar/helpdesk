<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketEscalation extends Model
{
    protected $fillable = ['ticket_id', 'escalation_rule_id', 'action_taken', 'details'];

    protected function casts(): array
    {
        return ['details' => 'array'];
    }

    public function ticket() { return $this->belongsTo(Ticket::class); }
    public function rule()   { return $this->belongsTo(EscalationRule::class, 'escalation_rule_id'); }
}
