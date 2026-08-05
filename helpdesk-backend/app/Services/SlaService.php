<?php

namespace App\Services;

use App\Models\SlaPolicy;
use App\Models\Ticket;

class SlaService
{
    // Fallback SLA policy when no DB entry exists: priority => [response_minutes, resolution_minutes]
    private const FALLBACK = [
        'critical' => [15,  60],
        'high'     => [30,  240],
        'medium'   => [120, 480],
        'low'      => [240, 1440],
    ];

    public function __construct(private BusinessCalendarService $calendar) {}

    /**
     * Resolve and apply SLA deadlines to a ticket.
     * Uses business hours if the SLA policy specifies it.
     */
    public function applyToTicket(Ticket $ticket): void
    {
        $policy = SlaPolicy::resolveForTicket(
            $ticket->priority,
            $ticket->category_id,
            $ticket->user?->department_id
        );

        if ($policy) {
            $responseMins       = $policy->response_minutes;
            $resolutionMins     = $policy->resolution_minutes;
            $businessHoursOnly  = $policy->business_hours_only;
        } else {
            [$responseMins, $resolutionMins] = self::FALLBACK[$ticket->priority] ?? self::FALLBACK['medium'];
            $businessHoursOnly = false;
        }

        if ($businessHoursOnly) {
            $ticket->update([
                'response_due_at'   => $this->calendar->addBusinessMinutes(now(), $responseMins),
                'resolution_due_at' => $this->calendar->addBusinessMinutes(now(), $resolutionMins),
            ]);
        } else {
            $ticket->update([
                'response_due_at'   => now()->addMinutes($responseMins),
                'resolution_due_at' => now()->addMinutes($resolutionMins),
            ]);
        }
    }

    /**
     * Get the resolved policy timings for a given priority.
     */
    public function getPolicy(string $priority, ?int $categoryId = null, ?int $departmentId = null): array
    {
        $policy = SlaPolicy::resolveForTicket($priority, $categoryId, $departmentId);

        if ($policy) {
            return [$policy->response_minutes, $policy->resolution_minutes];
        }

        return self::FALLBACK[$priority] ?? self::FALLBACK['medium'];
    }
}
