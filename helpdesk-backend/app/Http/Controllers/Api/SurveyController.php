<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketRating;
use Illuminate\Http\Request;

class SurveyController extends Controller
{
    /**
     * Get survey data for a ticket (ticket info + whether already rated).
     */
    public function show(Request $request, Ticket $ticket)
    {
        if ($ticket->user_id !== $request->user()->id) {
            abort(403);
        }

        if (!in_array($ticket->status, ['resolved', 'closed'])) {
            return response()->json(['success' => false, 'message' => 'Survey only available for resolved tickets.'], 422);
        }

        $existing = $ticket->rating;

        return response()->json([
            'success' => true,
            'data'    => [
                'ticket'          => [
                    'id'       => $ticket->id,
                    'title'    => $ticket->title,
                    'assignee' => $ticket->assignee?->name,
                    'category' => $ticket->category?->name,
                    'resolved_at' => $ticket->resolved_at,
                ],
                'already_rated'   => (bool) $existing,
                'existing_rating' => $existing,
            ],
        ]);
    }

    /**
     * Submit detailed satisfaction survey.
     */
    public function submit(Request $request, Ticket $ticket)
    {
        if ($ticket->user_id !== $request->user()->id) {
            abort(403);
        }

        if (!in_array($ticket->status, ['resolved', 'closed'])) {
            return response()->json(['success' => false, 'message' => 'Survey only available for resolved tickets.'], 422);
        }

        if ($ticket->rating) {
            return response()->json(['success' => false, 'message' => 'You have already submitted feedback for this ticket.'], 422);
        }

        $data = $request->validate([
            'score'                => 'required|integer|min:1|max:5',
            'comment'              => 'nullable|string|max:2000',
            'resolution_helpful'   => 'nullable|boolean',   // Was the resolution helpful?
            'response_speed'       => 'nullable|integer|min:1|max:5', // Speed rating
            'communication_rating' => 'nullable|integer|min:1|max:5', // Communication quality
            'would_recommend'      => 'nullable|boolean',   // Would you recommend?
        ]);

        $rating = TicketRating::create([
            'ticket_id'            => $ticket->id,
            'user_id'              => $request->user()->id,
            'score'                => $data['score'],
            'comment'              => $data['comment'] ?? null,
            'resolution_helpful'   => $data['resolution_helpful'] ?? null,
            'response_speed'       => $data['response_speed'] ?? null,
            'communication_rating' => $data['communication_rating'] ?? null,
            'would_recommend'      => $data['would_recommend'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $rating,
            'message' => 'Thank you for your feedback!',
        ]);
    }
}
