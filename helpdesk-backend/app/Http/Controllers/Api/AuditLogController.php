<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TicketEvent;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('manage', User::class);

        $query = TicketEvent::with(['ticket:id,title', 'user:id,name,role'])
            ->when($request->type,      fn($q, $v) => $q->where('type', $v))
            ->when($request->ticket_id, fn($q, $v) => $q->where('ticket_id', $v))
            ->when($request->user_id,   fn($q, $v) => $q->where('user_id', $v))
            ->latest();

        $paginated = $query->paginate(min((int) $request->per_page ?: 30, 100));

        return response()->json([
            'success' => true,
            'data'    => [
                'data'         => $paginated->map(fn($e) => [
                    'id'         => $e->id,
                    'type'       => $e->type,
                    'payload'    => $e->payload,
                    'ticket'     => $e->ticket ? ['id' => $e->ticket->id, 'title' => $e->ticket->title] : null,
                    'user'       => $e->user  ? ['id' => $e->user->id,   'name'  => $e->user->name, 'role' => $e->user->role] : null,
                    'created_at' => $e->created_at?->toISOString(),
                ]),
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }
}
