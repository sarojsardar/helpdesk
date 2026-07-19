<?php

namespace App\Services;

class SlaService
{
    // SLA policy: priority => [response_minutes, resolution_minutes]
    private const POLICY = [
        'critical' => [15,  60],
        'high'     => [30,  240],
        'medium'   => [120, 480],
        'low'      => [240, 1440],
    ];

    public function applyToTicket(\App\Models\Ticket $ticket): void
    {
        [$response, $resolution] = self::POLICY[$ticket->priority] ?? [120, 480];

        $ticket->update([
            'response_due_at'   => now()->addMinutes($response),
            'resolution_due_at' => now()->addMinutes($resolution),
        ]);
    }

    public function getPolicy(string $priority): array
    {
        return self::POLICY[$priority] ?? self::POLICY['medium'];
    }
}
