<?php

namespace App\Services;

use App\Models\User;

class AutoAssignService
{
    /**
     * Return the least-loaded active staff agent for round-robin assignment.
     */
    public function nextAgent(): ?User
    {
        return User::where('role', 'staff')
            ->where('is_active', true)
            ->withCount(['assignedTickets as open_tickets' => fn($q) => $q->whereNotIn('status', ['resolved', 'closed'])])
            ->orderBy('open_tickets')
            ->orderBy('id')
            ->first();
    }
}
