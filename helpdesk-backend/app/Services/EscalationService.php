<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketEvent;

class EscalationService
{
    private const ESCALATION_MAP = [
        'low'    => 'medium',
        'medium' => 'high',
        'high'   => 'critical',
    ];

    /**
     * Escalate tickets that are overdue, unassigned, and not yet critical.
     * Returns the number of tickets escalated.
     */
    public function escalateOverdue(): int
    {
        $tickets = Ticket::whereNotNull('resolution_due_at')
            ->where('resolution_due_at', '<', now())
            ->whereNull('assigned_to')
            ->whereNotIn('status', ['resolved', 'closed'])
            ->whereIn('priority', array_keys(self::ESCALATION_MAP))
            ->get();

        foreach ($tickets as $ticket) {
            $oldPriority = $ticket->priority;
            $newPriority = self::ESCALATION_MAP[$oldPriority];

            $ticket->update(['priority' => $newPriority]);

            TicketEvent::create([
                'ticket_id' => $ticket->id,
                'user_id'   => null,
                'type'      => 'escalated',
                'payload'   => ['from' => $oldPriority, 'to' => $newPriority, 'reason' => 'overdue_unassigned'],
            ]);
        }

        return $tickets->count();
    }
}
