<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TicketExportController extends Controller
{
    /**
     * Export tickets as CSV with the same filters used in TicketController@index.
     * Admin/staff only.
     */
    public function export(Request $request): StreamedResponse
    {
        if (!in_array($request->user()->role, ['admin', 'staff'])) {
            abort(403);
        }

        $request->validate([
            'date_from'   => 'nullable|date',
            'date_to'     => 'nullable|date|after_or_equal:date_from',
            'status'      => 'nullable|in:open,in_progress,resolved,closed',
            'priority'    => 'nullable|in:low,medium,high,critical',
            'category_id' => 'nullable|exists:categories,id',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $query = Ticket::with(['user:id,name,email', 'assignee:id,name', 'category:id,name', 'tags'])
            ->when($request->date_from, fn($q, $v) => $q->where('created_at', '>=', $v))
            ->when($request->date_to, fn($q, $v) => $q->where('created_at', '<=', $v . ' 23:59:59'))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->priority, fn($q, $v) => $q->where('priority', $v))
            ->when($request->category_id, fn($q, $v) => $q->where('category_id', $v))
            ->when($request->assigned_to, fn($q, $v) => $q->where('assigned_to', $v))
            ->orderByDesc('created_at');

        $filename = 'tickets_export_' . now()->format('Y-m-d_His') . '.csv';

        return new StreamedResponse(function () use ($query) {
            $handle = fopen('php://output', 'w');

            // CSV header
            fputcsv($handle, [
                'ID', 'Title', 'Status', 'Priority', 'Category',
                'Submitted By', 'Email', 'Assigned To', 'Tags',
                'Created At', 'Response Due', 'Resolution Due',
                'First Response At', 'Resolved At',
                'SLA Response Breached', 'SLA Resolution Breached',
            ]);

            // Stream in chunks to handle large exports
            $query->chunk(500, function ($tickets) use ($handle) {
                foreach ($tickets as $ticket) {
                    $responseBreach = $ticket->response_due_at
                        && is_null($ticket->first_response_at)
                        && now()->gt($ticket->response_due_at);

                    $resolutionBreach = $ticket->resolution_due_at
                        && now()->gt($ticket->resolution_due_at)
                        && !in_array($ticket->status, ['resolved', 'closed']);

                    fputcsv($handle, [
                        $ticket->id,
                        $ticket->title,
                        $ticket->status,
                        $ticket->priority,
                        $ticket->category?->name ?? '',
                        $ticket->user?->name ?? '',
                        $ticket->user?->email ?? '',
                        $ticket->assignee?->name ?? 'Unassigned',
                        $ticket->tags->pluck('name')->implode(', '),
                        $ticket->created_at?->toDateTimeString(),
                        $ticket->response_due_at?->toDateTimeString() ?? '',
                        $ticket->resolution_due_at?->toDateTimeString() ?? '',
                        $ticket->first_response_at?->toDateTimeString() ?? '',
                        $ticket->resolved_at?->toDateTimeString() ?? '',
                        $responseBreach ? 'Yes' : 'No',
                        $resolutionBreach ? 'Yes' : 'No',
                    ]);
                }
            });

            fclose($handle);
        }, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control'       => 'no-store',
        ]);
    }
}
