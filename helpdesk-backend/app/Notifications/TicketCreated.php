<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketCreated extends Notification implements ShouldQueue
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
            ->subject("Ticket #{$this->ticket->id} Created — {$this->ticket->title}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your support ticket has been received and is being reviewed.")
            ->line("**Title:** {$this->ticket->title}")
            ->line("**Priority:** " . ucfirst($this->ticket->priority))
            ->line("**Status:** Open")
            ->action('View Ticket', config('app.frontend_url') . "/user/tickets/{$this->ticket->id}")
            ->line("We'll notify you when there are updates.");
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'      => 'ticket_created',
            'ticket_id' => $this->ticket->id,
            'title'     => $this->ticket->title,
            'message'   => "Your ticket #{$this->ticket->id} \"{$this->ticket->title}\" has been created.",
            'url'       => "/user/tickets/{$this->ticket->id}",
        ];
    }
}
