<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketEvent;
use App\Notifications\TicketStatusChanged;
use Illuminate\Http\Request;

class CustomerPortalController extends Controller
{
    /**
     * Get customer's ticket summary stats.
     */
    public function summary(Request $request)
    {
        $user = $request->user();

        $tickets = $user->tickets()
            ->selectRaw("COUNT(*) as total")
            ->selectRaw("SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open")
            ->selectRaw("SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress")
            ->selectRaw("SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved")
            ->selectRaw("SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed")
            ->first();

        // Average resolution time for user's tickets
        $avgHours = null;
        $resolved = $user->tickets()->whereNotNull('resolved_at')->get(['created_at', 'resolved_at']);
        if ($resolved->isNotEmpty()) {
            $avgSec = $resolved->avg(fn($t) => $t->resolved_at->diffInSeconds($t->created_at));
            $avgHours = round($avgSec / 3600, 1);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'counts'               => $tickets,
                'avg_resolution_hours' => $avgHours,
            ],
        ]);
    }

    /**
     * Reopen a resolved/closed ticket.
     * Only the ticket owner can reopen, and only within 7 days of resolution.
     */
    public function reopen(Request $request, Ticket $ticket)
    {
        $user = $request->user();

        // Only the ticket owner
        if ($ticket->user_id !== $user->id) {
            abort(403, 'You can only reopen your own tickets.');
        }

        // Only resolved/closed tickets
        if (!in_array($ticket->status, ['resolved', 'closed'])) {
            return response()->json(['success' => false, 'message' => 'Ticket is not resolved or closed.'], 422);
        }

        // Only within 7 days of resolution
        if ($ticket->resolved_at && $ticket->resolved_at->diffInDays(now()) > 7) {
            return response()->json(['success' => false, 'message' => 'Tickets can only be reopened within 7 days of resolution.'], 422);
        }

        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $ticket->update(['status' => 'open', 'resolved_at' => null]);

        // Add a reply with the reopen reason
        $ticket->replies()->create([
            'user_id'     => $user->id,
            'message'     => "**Ticket Reopened:** " . $request->reason,
            'is_internal' => false,
        ]);

        TicketEvent::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $user->id,
            'type'      => 'status_changed',
            'payload'   => ['from' => 'resolved', 'to' => 'open', 'reason' => 'customer_reopen'],
        ]);

        // Notify assignee
        if ($ticket->assignee) {
            $ticket->assignee->notify(new TicketStatusChanged($ticket, 'resolved', 'open'));
        }

        return response()->json([
            'success' => true,
            'message' => 'Ticket reopened successfully.',
        ]);
    }

    /**
     * Add a follow-up message to a resolved ticket (without reopening).
     */
    public function followUp(Request $request, Ticket $ticket)
    {
        $user = $request->user();

        if ($ticket->user_id !== $user->id) {
            abort(403);
        }

        if (!in_array($ticket->status, ['resolved', 'closed'])) {
            return response()->json(['success' => false, 'message' => 'Follow-up is only available on resolved/closed tickets.'], 422);
        }

        $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        $reply = $ticket->replies()->create([
            'user_id'     => $user->id,
            'message'     => $request->message,
            'is_internal' => false,
        ]);

        TicketEvent::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $user->id,
            'type'      => 'replied',
            'payload'   => ['follow_up' => true],
        ]);

        // Notify assignee about the follow-up
        if ($ticket->assignee) {
            $ticket->assignee->notify(new \App\Notifications\TicketReplyAdded($ticket, $reply));
        }

        return response()->json([
            'success' => true,
            'message' => 'Follow-up message sent.',
        ]);
    }
}
