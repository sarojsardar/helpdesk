<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketRating;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StaffDashboardController extends Controller
{
    /**
     * Personal dashboard stats for the logged-in staff member.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'staff'])) {
            abort(403);
        }

        $agentId = $user->id;

        // My ticket counts
        $myCounts = Ticket::where('assigned_to', $agentId)
            ->select([
                DB::raw("COUNT(*) as total_assigned"),
                DB::raw("SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open"),
                DB::raw("SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress"),
                DB::raw("SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved"),
                DB::raw("SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed"),
                DB::raw("SUM(CASE WHEN priority = 'critical' AND status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) as critical_active"),
            ])
            ->first();

        // SLA compliance: tickets resolved within SLA / total resolved
        $resolvedTickets = Ticket::where('assigned_to', $agentId)
            ->whereNotNull('resolved_at')
            ->whereNotNull('resolution_due_at')
            ->get(['resolved_at', 'resolution_due_at']);

        $slaCompliance = null;
        if ($resolvedTickets->isNotEmpty()) {
            $withinSla = $resolvedTickets->filter(fn($t) => $t->resolved_at->lte($t->resolution_due_at))->count();
            $slaCompliance = round(($withinSla / $resolvedTickets->count()) * 100, 1);
        }

        // Avg resolution time (hours) for my tickets
        $avgResolutionHours = null;
        $myResolved = Ticket::where('assigned_to', $agentId)
            ->whereNotNull('resolved_at')
            ->get(['created_at', 'resolved_at']);
        if ($myResolved->isNotEmpty()) {
            $avgSec = $myResolved->avg(fn($t) => $t->resolved_at->diffInSeconds($t->created_at));
            $avgResolutionHours = round($avgSec / 3600, 1);
        }

        // My CSAT score
        $myCsat = TicketRating::whereHas('ticket', fn($q) => $q->where('assigned_to', $agentId))
            ->avg('score');

        // Overdue count (my tickets)
        $myOverdue = Ticket::where('assigned_to', $agentId)
            ->whereNotNull('resolution_due_at')
            ->where('resolution_due_at', '<', now())
            ->whereNotIn('status', ['resolved', 'closed'])
            ->count();

        // My queue: open + in_progress tickets, sorted by priority then due date
        $myQueue = Ticket::with(['user:id,name', 'category:id,name', 'tags'])
            ->where('assigned_to', $agentId)
            ->whereIn('status', ['open', 'in_progress'])
            ->orderByRaw("FIELD(priority, 'critical','high','medium','low')")
            ->orderBy('resolution_due_at')
            ->limit(20)
            ->get();

        // Unassigned pool (tickets the staff member can pick up)
        $unassignedPool = Ticket::with(['user:id,name', 'category:id,name'])
            ->whereNull('assigned_to')
            ->where('status', 'open')
            ->orderByRaw("FIELD(priority, 'critical','high','medium','low')")
            ->orderBy('created_at')
            ->limit(10)
            ->get();

        // Today's activity
        $todayResolved = Ticket::where('assigned_to', $agentId)
            ->whereDate('resolved_at', today())
            ->count();

        $todayReplies = $user->replies()
            ->whereDate('created_at', today())
            ->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'counts'              => $myCounts,
                'sla_compliance'      => $slaCompliance,
                'avg_resolution_hours' => $avgResolutionHours,
                'csat_score'          => $myCsat ? round($myCsat, 2) : null,
                'overdue'             => $myOverdue,
                'my_queue'            => $myQueue,
                'unassigned_pool'     => $unassignedPool,
                'today'               => [
                    'resolved' => $todayResolved,
                    'replies'  => $todayReplies,
                ],
            ],
        ]);
    }
}
