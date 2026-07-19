<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketStatusChanged extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Ticket $ticket,
        public string $oldStatus,
        public string $newStatus
    ) {}

    public function via(): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $label = implode(' ', array_map('ucfirst', explode('_', $this->newStatus)));
        $oldLabel = implode(' ', array_map('ucfirst', explode('_', $this->oldStatus)));

        return (new MailMessage)
            ->subject("Ticket #{$this->ticket->id} Status Updated — " . ucfirst($label))
            ->greeting("Hello {$notifiable->name},")
            ->line("The status of your ticket has been updated.")
            ->line("**Ticket:** {$this->ticket->title}")
            ->line("**Previous Status:** {$oldLabel}")
            ->line("**New Status:** {$label}")
            ->action('View Ticket', config('app.frontend_url') . "/user/tickets/{$this->ticket->id}");
    }

    public function toArray(object $notifiable): array
    {
        $label = implode(' ', array_map('ucfirst', explode('_', $this->newStatus)));

        return [
            'type'      => 'status_changed',
            'ticket_id' => $this->ticket->id,
            'title'     => $this->ticket->title,
            'message'   => "Ticket #{$this->ticket->id} status changed to {$label}.",
            'url'       => "/user/tickets/{$this->ticket->id}",
        ];
    }
}
