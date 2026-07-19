<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Ticket;
use App\Models\TicketRating;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('manage', User::class);

        // All ticket counts in one query
        $ticketStats = Ticket::query()
            ->select([
                DB::raw("COUNT(*) as total"),
                DB::raw("SUM(CASE WHEN status = 'open'        THEN 1 ELSE 0 END) as open"),
                DB::raw("SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress"),
                DB::raw("SUM(CASE WHEN status = 'resolved'    THEN 1 ELSE 0 END) as resolved"),
                DB::raw("SUM(CASE WHEN status = 'closed'      THEN 1 ELSE 0 END) as closed"),
                DB::raw("SUM(CASE WHEN priority = 'critical'  THEN 1 ELSE 0 END) as critical"),
                DB::raw("SUM(CASE WHEN priority = 'high'      THEN 1 ELSE 0 END) as high"),
                DB::raw("SUM(CASE WHEN priority = 'medium'    THEN 1 ELSE 0 END) as medium"),
                DB::raw("SUM(CASE WHEN priority = 'low'       THEN 1 ELSE 0 END) as low"),
            ])
            ->first();

        // All user counts in one query
        $userStats = User::query()
            ->select([
                DB::raw("COUNT(*) as total"),
                DB::raw("SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin"),
                DB::raw("SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) as staff"),
                DB::raw("SUM(CASE WHEN role = 'user'  THEN 1 ELSE 0 END) as user"),
            ])
            ->first();

        // Overdue tickets
        $overdue = Ticket::whereNotNull('resolution_due_at')
            ->where('resolution_due_at', '<', now())
            ->whereNotIn('status', ['resolved', 'closed'])
            ->count();

        // Average resolution time in hours
        $avgResolutionHours = null;
        $resolved = Ticket::whereNotNull('resolved_at')->get(['created_at', 'resolved_at']);
        if ($resolved->isNotEmpty()) {
            $avgSeconds = $resolved->avg(fn($t) => $t->resolved_at->diffInSeconds($t->created_at));
            $avgResolutionHours = round($avgSeconds / 3600, 1);
        }

        // Recent 8 tickets
        $recent = Ticket::with(['user:id,name', 'category:id,name', 'assignee:id,name'])
            ->latest()
            ->limit(8)
            ->get();

        // CSAT: avg rating per month (last 6 months)
        $csatTrend = TicketRating::select([
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw("ROUND(AVG(score), 2) as avg_score"),
                DB::raw("COUNT(*) as count"),
            ])
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Overall CSAT
        $csatOverall = TicketRating::avg('score');

        // Ticket volume: tickets created per day (last 30 days)
        $volumeTrend = Ticket::select([
                DB::raw("DATE_FORMAT(created_at, '%Y-%m-%d') as date"),
                DB::raw("COUNT(*) as count"),
            ])
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Category heatmap: tickets + SLA breach rate per category
        $categoryStats = Category::withCount([
                'tickets',
                'tickets as open_count'    => fn($q) => $q->whereIn('status', ['open', 'in_progress']),
                'tickets as overdue_count' => fn($q) => $q->whereNotNull('resolution_due_at')
                    ->where('resolution_due_at', '<', now())
                    ->whereNotIn('status', ['resolved', 'closed']),
            ])
            ->orderByDesc('tickets_count')
            ->get(['id', 'name']);

        // Agent performance
        $agentPerformance = User::where('role', 'staff')
            ->withCount([
                'assignedTickets as total_assigned',
                'assignedTickets as resolved_count' => fn($q) => $q->whereIn('status', ['resolved', 'closed']),
                'assignedTickets as overdue_count'  => fn($q) => $q->whereNotNull('resolution_due_at')
                    ->where('resolution_due_at', '<', now())
                    ->whereNotIn('status', ['resolved', 'closed']),
            ])
            ->get(['id', 'name', 'department'])
            ->map(function ($agent) {
                // Avg resolution hours for this agent
                $agentResolved = Ticket::where('assigned_to', $agent->id)
                    ->whereNotNull('resolved_at')
                    ->get(['created_at', 'resolved_at']);

                $avgHours = null;
                if ($agentResolved->isNotEmpty()) {
                    $avgSec   = $agentResolved->avg(fn($t) => $t->resolved_at->diffInSeconds($t->created_at));
                    $avgHours = round($avgSec / 3600, 1);
                }

                $avgRating = TicketRating::whereHas('ticket', fn($q) => $q->where('assigned_to', $agent->id))
                    ->avg('score');

                return [
                    'id'              => $agent->id,
                    'name'            => $agent->name,
                    'department'      => $agent->department,
                    'total_assigned'  => $agent->total_assigned,
                    'resolved_count'  => $agent->resolved_count,
                    'overdue_count'   => $agent->overdue_count,
                    'avg_resolution_hours' => $avgHours,
                    'avg_rating'      => $avgRating ? round($avgRating, 2) : null,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => [
                'tickets'              => $ticketStats,
                'users'                => $userStats,
                'overdue'              => $overdue,
                'avg_resolution_hours' => $avgResolutionHours,
                'recent'               => $recent,
                'csat_trend'           => $csatTrend,
                'csat_overall'         => $csatOverall ? round($csatOverall, 2) : null,
                'volume_trend'         => $volumeTrend,
                'category_stats'       => $categoryStats,
                'agent_performance'    => $agentPerformance,
            ],
        ]);
    }
}
