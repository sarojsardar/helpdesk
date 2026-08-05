<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SlaPolicy;
use Illuminate\Http\Request;

class SlaPolicyController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('manage', \App\Models\User::class);

        $policies = SlaPolicy::with(['category:id,name', 'department:id,name'])
            ->when($request->priority, fn($q, $v) => $q->where('priority', $v))
            ->when($request->active_only, fn($q) => $q->where('is_active', true))
            ->orderBy('priority')
            ->orderByDesc('category_id')
            ->orderByDesc('department_id')
            ->get();

        return response()->json(['success' => true, 'data' => $policies]);
    }

    public function store(Request $request)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'name'                => 'required|string|max:100',
            'description'         => 'nullable|string|max:500',
            'priority'            => 'required|in:low,medium,high,critical',
            'response_minutes'    => 'required|integer|min:1',
            'resolution_minutes'  => 'required|integer|min:1',
            'business_hours_only' => 'boolean',
            'is_active'           => 'boolean',
            'category_id'         => 'nullable|exists:categories,id',
            'department_id'       => 'nullable|exists:departments,id',
        ]);

        $policy = SlaPolicy::create($data);

        return response()->json([
            'success' => true,
            'data'    => $policy->load(['category:id,name', 'department:id,name']),
            'message' => 'SLA policy created',
        ], 201);
    }

    public function update(Request $request, SlaPolicy $slaPolicy)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'name'                => 'required|string|max:100',
            'description'         => 'nullable|string|max:500',
            'priority'            => 'required|in:low,medium,high,critical',
            'response_minutes'    => 'required|integer|min:1',
            'resolution_minutes'  => 'required|integer|min:1',
            'business_hours_only' => 'boolean',
            'is_active'           => 'boolean',
            'category_id'         => 'nullable|exists:categories,id',
            'department_id'       => 'nullable|exists:departments,id',
        ]);

        $slaPolicy->update($data);

        return response()->json([
            'success' => true,
            'data'    => $slaPolicy->fresh()->load(['category:id,name', 'department:id,name']),
            'message' => 'SLA policy updated',
        ]);
    }

    public function destroy(SlaPolicy $slaPolicy)
    {
        $this->authorize('manage', \App\Models\User::class);

        $slaPolicy->delete();

        return response()->json(['success' => true, 'message' => 'SLA policy deleted']);
    }
}
