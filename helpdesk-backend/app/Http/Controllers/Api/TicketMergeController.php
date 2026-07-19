<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TicketDetailResource;
use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketService;
use Illuminate\Http\Request;

class TicketMergeController extends Controller
{
    public function __construct(private TicketService $service) {}

    public function merge(Request $request, Ticket $ticket)
    {
        $this->authorize('manage', User::class);

        $data = $request->validate([
            'source_ticket_id' => 'required|integer|exists:tickets,id|different:ticket',
        ]);

        $source = Ticket::findOrFail($data['source_ticket_id']);

        abort_if($source->merged_into, 422, 'Source ticket is already merged.');
        abort_if($ticket->merged_into, 422, 'Target ticket is already merged into another ticket.');

        $target = $this->service->merge($ticket, $source, $request->user()->id);

        return response()->json([
            'success' => true,
            'data'    => new TicketDetailResource($target->load(['user', 'assignee', 'category', 'replies.user', 'events.user', 'rating', 'attachments', 'tags'])),
            'message' => "Ticket #{$source->id} merged into #{$ticket->id}",
        ]);
    }
}
