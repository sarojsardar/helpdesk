<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreReplyRequest;
use App\Http\Resources\ReplyResource;
use App\Models\Ticket;
use App\Services\TicketService;

class ReplyController extends Controller
{
    public function __construct(private TicketService $service) {}

    public function store(StoreReplyRequest $request, Ticket $ticket)
    {
        $data = $request->validated();

        if (!empty($data['is_internal'])) {
            $this->authorize('replyInternal', Ticket::class);
        }

        $reply = $this->service->addReply($ticket, $data, $request->user()->id);

        return response()->json([
            'success' => true,
            'data'    => new ReplyResource($reply->load('user:id,name,role')),
            'message' => 'Reply added',
        ], 201);
    }
}
