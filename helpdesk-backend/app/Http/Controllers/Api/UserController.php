<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('manage', User::class);

        $paginated = User::when($request->role,   fn($q, $v) => $q->where('role', $v))
                    ->when($request->search, fn($q, $v) => $q->where(fn($q) =>
                        $q->where('name', 'like', "%{$v}%")->orWhere('email', 'like', "%{$v}%")
                    ))
                    ->latest()
                    ->paginate(min((int) $request->per_page ?: 20, 100));

        return response()->json([
            'success' => true,
            'data'    => [
                'data'         => UserResource::collection($paginated)->toArray($request),
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'from'         => $paginated->firstItem(),
                'to'           => $paginated->lastItem(),
            ],
        ]);
    }

    public function agents()
    {
        return response()->json([
            'success' => true,
            'data'    => User::where('role', 'staff')
                ->where('is_active', true)
                ->withCount(['assignedTickets as open_tickets' => fn($q) => $q->whereNotIn('status', ['resolved', 'closed'])])
                ->orderBy('open_tickets')
                ->get(['id', 'name', 'email', 'department']),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $this->authorize('manage', User::class);
        $user->update($request->validated());

        return response()->json(['success' => true, 'data' => new UserResource($user->fresh()), 'message' => 'User updated']);
    }
}
