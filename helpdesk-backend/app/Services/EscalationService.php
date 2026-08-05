<?php

namespace App\Services;

use App\Models\EscalationRule;
use App\Models\Ticket;
use App\Models\TicketEscalation;
use App\Models\TicketEvent;
use App\Models\User;
use App\Notifications\TicketEscalated;
use Illuminate\Support\Facades\Log;

class EscalationService
{
    /**
     * Run all active escalation rules against open tickets.
     * Intended to be called by a scheduled artisan command (e.g. every 5 minutes).
     */
    public function processAll(): int
    {
        $rules     = EscalationRule::where('is_active', true)->get();
        $escalated = 0;

        foreach ($rules as $rule) {
            $tickets = $this->findMatchingTickets($rule);

            foreach ($tickets as $ticket) {
                if ($this->shouldEscalate($ticket, $rule)) {
                    $this->escalate($ticket, $rule);
                    $escalated++;
                }
            }
        }

        return $escalated;
    }

    /**
     * Find tickets matching a rule's trigger condition.
     */
    private function findMatchingTickets(EscalationRule $rule)
    {
        $query = Ticket::whereNotIn('status', ['resolved', 'closed']);

        // Filter by priority if rule is priority-specific
        if ($rule->applies_to_priority) {
            $query->where('priority', $rule->applies_to_priority);
        }

        // Filter by category if rule is category-specific
        if ($rule->category_id) {
            $query->where('category_id', $rule->category_id);
        }

        switch ($rule->trigger_type) {
            case 'sla_response_breach':
                $query->whereNotNull('response_due_at')
                    ->where('response_due_at', '<', now()->subMinutes($rule->threshold_minutes))
                    ->whereNull('first_response_at');
                break;

            case 'sla_resolution_breach':
                $query->whereNotNull('resolution_due_at')
                    ->where('resolution_due_at', '<', now()->subMinutes($rule->threshold_minutes));
                break;

            case 'time_no_update':
                $query->where('updated_at', '<', now()->subMinutes($rule->threshold_minutes));
                break;

            case 'priority_age':
                $query->where('created_at', '<', now()->subMinutes($rule->threshold_minutes));
                break;
        }

        return $query->get();
    }

    /**
     * Check if a ticket hasn't exceeded the max escalation count for this rule.
     */
    private function shouldEscalate(Ticket $ticket, EscalationRule $rule): bool
    {
        $count = TicketEscalation::where('ticket_id', $ticket->id)
            ->where('escalation_rule_id', $rule->id)
            ->count();

        return $count < $rule->max_escalations;
    }

    /**
     * Execute the escalation action on a ticket.
     */
    private function escalate(Ticket $ticket, EscalationRule $rule): void
    {
        $details = ['rule' => $rule->name, 'trigger' => $rule->trigger_type];

        switch ($rule->action) {
            case 'increase_priority':
                $newPriority = $this->bumpPriority($ticket->priority);
                if ($newPriority !== $ticket->priority) {
                    $details['old_priority'] = $ticket->priority;
                    $details['new_priority'] = $newPriority;
                    $ticket->update(['priority' => $newPriority]);
                }
                break;

            case 'reassign_to_manager':
                $manager = $this->findDepartmentManager($ticket);
                if ($manager) {
                    $details['reassigned_to'] = $manager->id;
                    $ticket->update(['assigned_to' => $manager->id]);
                    $manager->notify(new TicketEscalated($ticket, $rule));
                }
                break;

            case 'reassign_to_agent':
                if ($rule->target_user_id) {
                    $details['reassigned_to'] = $rule->target_user_id;
                    $ticket->update(['assigned_to' => $rule->target_user_id]);
                    $rule->targetUser?->notify(new TicketEscalated($ticket, $rule));
                }
                break;

            case 'notify_manager':
                $manager = $this->findDepartmentManager($ticket);
                if ($manager) {
                    $details['notified'] = $manager->id;
                    $manager->notify(new TicketEscalated($ticket, $rule));
                }
                break;

            case 'notify_admins':
                $admins = User::where('role', 'admin')->where('is_active', true)->get();
                foreach ($admins as $admin) {
                    $admin->notify(new TicketEscalated($ticket, $rule));
                }
                $details['notified_admins'] = $admins->pluck('id')->toArray();
                break;
        }

        // Record the escalation
        TicketEscalation::create([
            'ticket_id'          => $ticket->id,
            'escalation_rule_id' => $rule->id,
            'action_taken'       => $rule->action,
            'details'            => $details,
        ]);

        // Log as ticket event
        TicketEvent::create([
            'ticket_id' => $ticket->id,
            'user_id'   => null,
            'type'      => 'escalated',
            'payload'   => $details,
        ]);

        Log::info("Ticket #{$ticket->id} escalated: {$rule->name} ({$rule->action})");
    }

    private function bumpPriority(string $current): string
    {
        return match ($current) {
            'low'    => 'medium',
            'medium' => 'high',
            'high'   => 'critical',
            default  => $current,
        };
    }

    private function findDepartmentManager(Ticket $ticket): ?User
    {
        // Try to find department manager for ticket's assigned agent or ticket creator
        $departmentId = $ticket->assignee?->department_id ?? $ticket->user?->department_id;

        if ($departmentId) {
            $dept = \App\Models\Department::find($departmentId);
            if ($dept?->manager_id) {
                return User::find($dept->manager_id);
            }
        }

        // Fallback: first admin
        return User::where('role', 'admin')->where('is_active', true)->first();
    }
}
