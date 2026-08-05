<?php

namespace App\Notifications;

use App\Models\EscalationRule;
use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketEscalated extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Ticket $ticket, public EscalationRule $rule) {}

    public function via(): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("⚠️ Escalation: Ticket #{$this->ticket->id} — {$this->rule->name}")
            ->greeting("Hello {$notifiable->name},")
            ->line("A ticket has been escalated and requires your attention.")
            ->line("**Ticket:** #{$this->ticket->id} — {$this->ticket->title}")
            ->line("**Priority:** " . ucfirst($this->ticket->priority))
            ->line("**Escalation Rule:** {$this->rule->name}")
            ->line("**Reason:** {$this->rule->trigger_type} (threshold: {$this->rule->threshold_minutes} min)")
            ->action('View Ticket', config('app.frontend_url') . "/admin/tickets/{$this->ticket->id}")
            ->line("Please review and take appropriate action.");
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'      => 'ticket_escalated',
            'ticket_id' => $this->ticket->id,
            'title'     => $this->ticket->title,
            'rule_name' => $this->rule->name,
            'message'   => "Ticket #{$this->ticket->id} has been escalated: {$this->rule->name}",
            'url'       => "/admin/tickets/{$this->ticket->id}",
        ];
    }
}
