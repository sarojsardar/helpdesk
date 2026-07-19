<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketAssigned extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Ticket $ticket) {}

    public function via(): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Ticket #{$this->ticket->id} Assigned to You")
            ->greeting("Hello {$notifiable->name},")
            ->line("A support ticket has been assigned to you.")
            ->line("**Title:** {$this->ticket->title}")
            ->line("**Priority:** " . ucfirst($this->ticket->priority))
            ->line("**Submitted by:** {$this->ticket->user->name}")
            ->action('View Ticket', config('app.frontend_url') . "/staff/tickets/{$this->ticket->id}")
            ->line("Please review and respond as soon as possible.");
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'      => 'ticket_assigned',
            'ticket_id' => $this->ticket->id,
            'title'     => $this->ticket->title,
            'message'   => "Ticket #{$this->ticket->id} has been assigned to you.",
            'url'       => "/staff/tickets/{$this->ticket->id}",
        ];
    }
}
