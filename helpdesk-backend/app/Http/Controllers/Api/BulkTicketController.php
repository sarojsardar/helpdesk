<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketEvent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BulkTicketController extends Controller
{
    public function update(Request $request)
    {
        $this->authorize('manage', User::class);

        $data = $request->validate([
            'ticket_ids'  => 'required|array|min:1|max:100',
            'ticket_ids.*'=> 'integer|exists:tickets,id',
            'action'      => 'required|in:status,assign,priority,close',
            'value'       => 'nullable',
        ]);

        $tickets = Ticket::whereIn('id', $data['ticket_ids'])->get();
        $userId  = $request->user()->id;

        DB::transaction(function () use ($tickets, $data, $userId) {
            foreach ($tickets as $ticket) {
                match ($data['action']) {
                    'status'   => $this->applyStatus($ticket, $data['value'], $userId),
                    'assign'   => $this->applyAssign($ticket, $data['value'], $userId),
                    'priority' => $this->applyPriority($ticket, $data['value'], $userId),
                    'close'    => $this->applyStatus($ticket, 'closed', $userId),
                };
            }
        });

        return response()->json(['success' => true, 'updated' => $tickets->count()]);
    }

    private function applyStatus(Ticket $ticket, string $status, int $userId): void
    {
        $old = $ticket->status;
        $updates = ['status' => $status];
        if ($status === 'resolved') $updates['resolved_at'] = now();
        $ticket->update($updates);
        TicketEvent::create(['ticket_id' => $ticket->id, 'user_id' => $userId, 'type' => 'status_changed', 'payload' => ['from' => $old, 'to' => $status]]);
    }

    private function applyAssign(Ticket $ticket, ?int $agentId, int $userId): void
    {
        $ticket->update(['assigned_to' => $agentId, 'status' => $agentId ? 'in_progress' : $ticket->status]);
        TicketEvent::create(['ticket_id' => $ticket->id, 'user_id' => $userId, 'type' => 'assigned', 'payload' => ['agent_id' => $agentId]]);
    }

    private function applyPriority(Ticket $ticket, string $priority, int $userId): void
    {
        $old = $ticket->priority;
        $ticket->update(['priority' => $priority]);
        TicketEvent::create(['ticket_id' => $ticket->id, 'user_id' => $userId, 'type' => 'priority_changed', 'payload' => ['from' => $old, 'to' => $priority]]);
    }
}
