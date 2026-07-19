<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketEvent;
use App\Models\User;
use App\Notifications\TicketAssigned;
use App\Notifications\TicketCreated;
use App\Notifications\TicketReplyAdded;
use App\Notifications\TicketStatusChanged;
use Illuminate\Support\Facades\DB;

class TicketService
{
    public function __construct(private SlaService $sla, private AutoAssignService $autoAssign) {}

    public function create(array $data, int $userId): Ticket
    {
        return DB::transaction(function () use ($data, $userId) {
            $ticket = Ticket::create(array_merge($data, ['user_id' => $userId]));

            $this->sla->applyToTicket($ticket);

            TicketEvent::create([
                'ticket_id' => $ticket->id,
                'user_id'   => $userId,
                'type'      => 'created',
                'payload'   => ['priority' => $ticket->priority],
            ]);

            // Auto-assign to least-loaded agent
            $agent = $this->autoAssign->nextAgent();
            if ($agent) {
                $ticket->update(['assigned_to' => $agent->id, 'status' => 'in_progress']);
                TicketEvent::create([
                    'ticket_id' => $ticket->id,
                    'user_id'   => null,
                    'type'      => 'assigned',
                    'payload'   => ['agent_id' => $agent->id, 'auto' => true],
                ]);
                $agent->notify(new TicketAssigned($ticket->load('user')));
            }

            // Notify ticket owner
            $ticket->user->notify(new TicketCreated($ticket));

            return $ticket->fresh();
        });
    }

    public function updateStatus(Ticket $ticket, string $status, int $userId): Ticket
    {
        return DB::transaction(function () use ($ticket, $status, $userId) {
            $old = $ticket->status;

            $updates = ['status' => $status];
            if ($status === 'resolved') {
                $updates['resolved_at'] = now();
            }

            $ticket->update($updates);

            TicketEvent::create([
                'ticket_id' => $ticket->id,
                'user_id'   => $userId,
                'type'      => 'status_changed',
                'payload'   => ['from' => $old, 'to' => $status],
            ]);

            if ($ticket->user_id !== $userId) {
                $ticket->user->notify(new TicketStatusChanged($ticket, $old, $status));
            }

            return $ticket->fresh();
        });
    }

    public function assign(Ticket $ticket, ?int $agentId, int $actorId): Ticket
    {
        return DB::transaction(function () use ($ticket, $agentId, $actorId) {
            $updates = ['assigned_to' => $agentId];
            if ($agentId) {
                $updates['status'] = 'in_progress';
            }
            $ticket->update($updates);

            TicketEvent::create([
                'ticket_id' => $ticket->id,
                'user_id'   => $actorId,
                'type'      => 'assigned',
                'payload'   => ['agent_id' => $agentId],
            ]);

            if ($agentId) {
                $agent = User::find($agentId);
                $agent?->notify(new TicketAssigned($ticket->load('user')));
            }

            return $ticket->fresh();
        });
    }

    public function addReply(Ticket $ticket, array $data, int $userId): \App\Models\Reply
    {
        return DB::transaction(function () use ($ticket, $data, $userId) {
            $reply = $ticket->replies()->create(array_merge($data, ['user_id' => $userId]));

            if (is_null($ticket->first_response_at)) {
                $ticket->update(['first_response_at' => now()]);
            }

            TicketEvent::create([
                'ticket_id' => $ticket->id,
                'user_id'   => $userId,
                'type'      => 'replied',
            ]);

            if (empty($data['is_internal'])) {
                $reply->load('user');
                $notifyTargets = collect();

                if ($ticket->user_id !== $userId) {
                    $notifyTargets->push($ticket->user);
                }

                if ($ticket->assigned_to && $ticket->assigned_to !== $userId) {
                    $notifyTargets->push($ticket->assignee);
                }

                foreach ($notifyTargets->filter() as $target) {
                    $target->notify(new TicketReplyAdded($ticket, $reply));
                }
            }

            return $reply;
        });
    }

    public function merge(Ticket $target, Ticket $source, int $userId): Ticket
    {
        return DB::transaction(function () use ($target, $source, $userId) {
            // Move replies and attachments to target
            $source->replies()->update(['ticket_id' => $target->id]);
            $source->attachments()->update(['ticket_id' => $target->id]);

            // Close source and mark merged
            $source->update(['status' => 'closed', 'merged_into' => $target->id]);

            TicketEvent::create([
                'ticket_id' => $target->id,
                'user_id'   => $userId,
                'type'      => 'status_changed',
                'payload'   => ['merged_from' => $source->id],
            ]);

            return $target->fresh();
        });
    }
}
