<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EscalationRule;
use Illuminate\Http\Request;

class EscalationRuleController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('manage', \App\Models\User::class);

        $rules = EscalationRule::with(['targetUser:id,name', 'category:id,name'])
            ->when($request->active_only, fn($q) => $q->where('is_active', true))
            ->orderBy('trigger_type')
            ->orderBy('threshold_minutes')
            ->get();

        return response()->json(['success' => true, 'data' => $rules]);
    }

    public function store(Request $request)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'name'                 => 'required|string|max:100',
            'description'          => 'nullable|string|max:500',
            'trigger_type'         => 'required|in:sla_response_breach,sla_resolution_breach,time_no_update,priority_age',
            'threshold_minutes'    => 'required|integer|min:1',
            'action'               => 'required|in:reassign_to_manager,notify_manager,increase_priority,notify_admins,reassign_to_agent',
            'target_user_id'       => 'nullable|exists:users,id',
            'applies_to_priority'  => 'nullable|in:low,medium,high,critical',
            'category_id'          => 'nullable|exists:categories,id',
            'is_active'            => 'boolean',
            'max_escalations'      => 'integer|min:1|max:10',
        ]);

        $rule = EscalationRule::create($data);

        return response()->json([
            'success' => true,
            'data'    => $rule->load(['targetUser:id,name', 'category:id,name']),
            'message' => 'Escalation rule created',
        ], 201);
    }

    public function update(Request $request, EscalationRule $escalationRule)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'name'                 => 'required|string|max:100',
            'description'          => 'nullable|string|max:500',
            'trigger_type'         => 'required|in:sla_response_breach,sla_resolution_breach,time_no_update,priority_age',
            'threshold_minutes'    => 'required|integer|min:1',
            'action'               => 'required|in:reassign_to_manager,notify_manager,increase_priority,notify_admins,reassign_to_agent',
            'target_user_id'       => 'nullable|exists:users,id',
            'applies_to_priority'  => 'nullable|in:low,medium,high,critical',
            'category_id'          => 'nullable|exists:categories,id',
            'is_active'            => 'boolean',
            'max_escalations'      => 'integer|min:1|max:10',
        ]);

        $escalationRule->update($data);

        return response()->json([
            'success' => true,
            'data'    => $escalationRule->fresh()->load(['targetUser:id,name', 'category:id,name']),
            'message' => 'Escalation rule updated',
        ]);
    }

    public function destroy(EscalationRule $escalationRule)
    {
        $this->authorize('manage', \App\Models\User::class);

        $escalationRule->delete();

        return response()->json(['success' => true, 'message' => 'Escalation rule deleted']);
    }
}
