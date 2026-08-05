<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketEvent;
use App\Notifications\TicketReplyAdded;
use Illuminate\Http\Request;

class StaffActionsController extends Controller
{
    /**
     * Batch reply: send the same reply to multiple tickets at once.
     */
    public function batchReply(Request $request)
    {
        if (!in_array($request->user()->role, ['admin', 'staff'])) {
            abort(403);
        }

        $data = $request->validate([
            'ticket_ids'  => 'required|array|min:1|max:20',
            'ticket_ids.*' => 'exists:tickets,id',
            'message'     => 'required|string|max:5000',
            'is_internal' => 'boolean',
        ]);

        $userId  = $request->user()->id;
        $count   = 0;

        foreach ($data['ticket_ids'] as $ticketId) {
            $ticket = Ticket::find($ticketId);
            if (!$ticket || in_array($ticket->status, ['closed'])) continue;

            $reply = $ticket->replies()->create([
                'user_id'     => $userId,
                'message'     => $data['message'],
                'is_internal' => $data['is_internal'] ?? false,
            ]);

            if (is_null($ticket->first_response_at)) {
                $ticket->update(['first_response_at' => now()]);
            }

            TicketEvent::create([
                'ticket_id' => $ticket->id,
                'user_id'   => $userId,
                'type'      => 'replied',
            ]);

            // Notify ticket owner (if not internal)
            if (empty($data['is_internal']) && $ticket->user_id !== $userId) {
                $ticket->user->notify(new TicketReplyAdded($ticket, $reply));
            }

            $count++;
        }

        return response()->json([
            'success' => true,
            'message' => "Reply sent to {$count} ticket(s).",
        ]);
    }

    /**
     * Snooze a ticket until a specified date/time.
     */
    public function snooze(Request $request, Ticket $ticket)
    {
        if (!in_array($request->user()->role, ['admin', 'staff'])) {
            abort(403);
        }

        $data = $request->validate([
            'snooze_until' => 'required|date|after:now',
        ]);

        $ticket->update([
            'snooze_until' => $data['snooze_until'],
        ]);

        TicketEvent::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $request->user()->id,
            'type'      => 'snoozed',
            'payload'   => ['until' => $data['snooze_until']],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ticket snoozed until ' . $data['snooze_until'],
        ]);
    }

    /**
     * Unsnooze a ticket (clear snooze).
     */
    public function unsnooze(Request $request, Ticket $ticket)
    {
        if (!in_array($request->user()->role, ['admin', 'staff'])) {
            abort(403);
        }

        $ticket->update(['snooze_until' => null]);

        return response()->json(['success' => true, 'message' => 'Snooze cleared.']);
    }
}
