<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    // Admin sees all, staff sees assigned + own, user sees own only
    public function view(User $user, Ticket $ticket): bool
    {
        return match ($user->role) {
            'admin' => true,
            'staff' => $ticket->assigned_to === $user->id || $ticket->user_id === $user->id,
            default => $ticket->user_id === $user->id,
        };
    }

    // Only users and admins can create tickets
    public function create(User $user): bool
    {
        return $user->isUser() || $user->isAdmin() || $user->isStaff();
    }

    // Owner can update their own; staff can update assigned; admin can update all
    public function update(User $user, Ticket $ticket): bool
    {
        return $this->view($user, $ticket);
    }

    // Only admin can delete
    public function delete(User $user): bool
    {
        return $user->isAdmin();
    }

    // Staff and admin can change status
    public function updateStatus(User $user, Ticket $ticket): bool
    {
        return $this->view($user, $ticket);
    }

    // Only admin and staff can assign
    public function assign(User $user): bool
    {
        return $user->isAdmin() || $user->isStaff();
    }

    // User cannot post internal notes
    public function replyInternal(User $user): bool
    {
        return $user->isAdmin() || $user->isStaff();
    }
}
