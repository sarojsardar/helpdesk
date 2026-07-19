<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AssignTicketRequest;
use App\Http\Requests\Api\StoreTicketRequest;
use App\Http\Requests\Api\UpdateStatusRequest;
use App\Http\Requests\Api\UpdateTicketRequest;
use App\Http\Resources\TicketDetailResource;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function __construct(private TicketService $service) {}

    public function index(Request $request)
    {
        $user    = $request->user();
        $sortBy  = in_array($request->sort_by, ['id', 'priority', 'status', 'created_at']) ? $request->sort_by : 'created_at';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';

        $query = Ticket::with(['user:id,name,email', 'assignee:id,name', 'category:id,name', 'tags'])
            ->when($user->isUser(), fn($q) => $q->where('user_id', $user->id))
            ->when($user->isStaff(), fn($q) => $q->where(fn($q) => $q->where('assigned_to', $user->id)->orWhereNull('assigned_to')))
            ->when($request->status,      fn($q, $v) => $q->where('status', $v))
            ->when($request->priority,    fn($q, $v) => $q->where('priority', $v))
            ->when($request->category_id, fn($q, $v) => $q->where('category_id', $v))
            ->when($request->assigned_to && $user->isAdmin(), fn($q, $v) => $q->where('assigned_to', $request->assigned_to))
            ->when($request->search,      fn($q, $v) => $q->where('title', 'like', "%{$v}%"))
            ->when($request->tag_id,       fn($q, $v) => $q->whereHas('tags', fn($tq) => $tq->where('tags.id', $v)))
            ->orderBy($sortBy, $sortDir);

        $paginated = $query->paginate(min((int) $request->per_page ?: 15, 100));
        $resource  = TicketResource::collection($paginated);

        return response()->json([
            'success' => true,
            'data'    => [
                'data'         => $resource->toArray($request),
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'from'         => $paginated->firstItem(),
                'to'           => $paginated->lastItem(),
            ],
        ]);
    }

    public function store(StoreTicketRequest $request)
    {
        $ticket = $this->service->create($request->validated(), $request->user()->id);

        return response()->json([
            'success' => true,
            'data'    => new TicketDetailResource($ticket->load(['user:id,name', 'category:id,name'])),
            'message' => 'Ticket created',
        ], 201);
    }

    public function show(Request $request, Ticket $ticket)
    {
        $this->authorize('view', $ticket);

        return response()->json([
            'success' => true,
            'data'    => new TicketDetailResource($ticket->load(['user:id,name,email', 'assignee:id,name', 'category', 'replies.user:id,name,role', 'events.user:id,name,role', 'rating', 'attachments', 'tags'])),
        ]);
    }

    public function update(UpdateTicketRequest $request, Ticket $ticket)
    {
        $this->authorize('update', $ticket);
        $ticket->update($request->validated());

        return response()->json(['success' => true, 'data' => new TicketDetailResource($ticket->fresh()), 'message' => 'Ticket updated']);
    }

    public function destroy(Request $request, Ticket $ticket)
    {
        $this->authorize('delete', Ticket::class);
        $ticket->delete();

        return response()->json(['success' => true, 'message' => 'Ticket deleted']);
    }

    public function updateStatus(UpdateStatusRequest $request, Ticket $ticket)
    {
        $this->authorize('updateStatus', $ticket);
        $ticket = $this->service->updateStatus($ticket, $request->validated()['status'], $request->user()->id);

        return response()->json(['success' => true, 'data' => new TicketDetailResource($ticket), 'message' => 'Status updated']);
    }

    public function assign(AssignTicketRequest $request, Ticket $ticket)
    {
        $this->authorize('assign', Ticket::class);
        $ticket = $this->service->assign($ticket, $request->validated()['agent_id'] ?? null, $request->user()->id);

        return response()->json(['success' => true, 'data' => new TicketDetailResource($ticket), 'message' => 'Ticket assigned']);
    }

}
