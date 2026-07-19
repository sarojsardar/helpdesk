<?php

namespace App\Notifications;

use App\Models\Reply;
use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketReplyAdded extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Ticket $ticket,
        public Reply  $reply
    ) {}

    public function via(): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $role   = $notifiable->role;
        $path   = $role === 'user' ? 'user' : 'staff';
        $sender = $this->reply->user->name;

        return (new MailMessage)
            ->subject("New Reply on Ticket #{$this->ticket->id} — {$this->ticket->title}")
            ->greeting("Hello {$notifiable->name},")
            ->line("{$sender} has posted a new reply on your ticket.")
            ->line("**Ticket:** {$this->ticket->title}")
            ->line("**Reply:**")
            ->line($this->reply->message)
            ->action('View Ticket', config('app.frontend_url') . "/{$path}/tickets/{$this->ticket->id}");
    }

    public function toArray(object $notifiable): array
    {
        $role = $notifiable->role;
        $path = $role === 'user' ? 'user' : 'staff';

        return [
            'type'      => 'ticket_reply',
            'ticket_id' => $this->ticket->id,
            'title'     => $this->ticket->title,
            'message'   => "{$this->reply->user->name} replied on ticket #{$this->ticket->id}.",
            'url'       => "/{$path}/tickets/{$this->ticket->id}",
        ];
    }
}
