<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;

class RatingController extends Controller
{
    public function store(Request $request, Ticket $ticket)
    {
        $this->authorize('view', $ticket);

        abort_if(
            $request->user()->id !== $ticket->user_id,
            403, 'Only the ticket owner can rate.'
        );

        abort_unless(
            in_array($ticket->status, ['resolved', 'closed']),
            422, 'Ticket must be resolved or closed before rating.'
        );

        $data = $request->validate([
            'score'   => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        $rating = $ticket->rating()->updateOrCreate(
            ['ticket_id' => $ticket->id],
            array_merge($data, ['user_id' => $request->user()->id])
        );

        return response()->json(['success' => true, 'data' => $rating], 201);
    }
}
