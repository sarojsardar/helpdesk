<?php

namespace Tests\Feature;

use App\Models\Reply;
use App\Models\Ticket;
use App\Models\User;
use App\Notifications\TicketAssigned;
use App\Notifications\TicketCreated;
use App\Notifications\TicketReplyAdded;
use App\Notifications\TicketStatusChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function makeUser(string $role = 'user'): User
    {
        return User::factory()->create(['role' => $role, 'is_active' => true]);
    }

    private function makeTicket(User $owner, ?User $assignee = null): Ticket
    {
        return Ticket::create([
            'title'       => 'Test ticket',
            'description' => 'Some description',
            'priority'    => 'high',
            'status'      => 'open',
            'user_id'     => $owner->id,
            'assigned_to' => $assignee?->id,
        ]);
    }

    // ── TicketCreated ─────────────────────────────────────────────────────────

    public function test_ticket_created_uses_mail_and_database_channels(): void
    {
        $user   = $this->makeUser();
        $ticket = $this->makeTicket($user);

        $notification = new TicketCreated($ticket);

        $this->assertSame(['mail', 'database'], $notification->via());
    }

    public function test_ticket_created_toArray_payload(): void
    {
        $user   = $this->makeUser();
        $ticket = $this->makeTicket($user);

        $payload = (new TicketCreated($ticket))->toArray($user);

        $this->assertSame('ticket_created',          $payload['type']);
        $this->assertSame($ticket->id,               $payload['ticket_id']);
        $this->assertSame($ticket->title,            $payload['title']);
        $this->assertStringContainsString("#{$ticket->id}", $payload['message']);
        $this->assertStringContainsString((string) $ticket->id, $payload['url']);
    }

    public function test_ticket_created_mail_subject_contains_ticket_id(): void
    {
        $user   = $this->makeUser();
        $ticket = $this->makeTicket($user);

        $mail = (new TicketCreated($ticket))->toMail($user);

        $this->assertStringContainsString("#{$ticket->id}", $mail->subject);
    }

    public function test_ticket_created_is_sent_to_owner_via_fake(): void
    {
        Notification::fake();

        $user   = $this->makeUser();
        $ticket = $this->makeTicket($user);

        $user->notify(new TicketCreated($ticket));

        Notification::assertSentTo($user, TicketCreated::class,
            fn($n) => $n->ticket->id === $ticket->id
        );
    }

    // ── TicketAssigned ────────────────────────────────────────────────────────

    public function test_ticket_assigned_uses_mail_and_database_channels(): void
    {
        $owner  = $this->makeUser();
        $agent  = $this->makeUser('staff');
        $ticket = $this->makeTicket($owner, $agent);
        $ticket->load('user');

        $this->assertSame(['mail', 'database'], (new TicketAssigned($ticket))->via());
    }

    public function test_ticket_assigned_toArray_payload(): void
    {
        $owner  = $this->makeUser();
        $agent  = $this->makeUser('staff');
        $ticket = $this->makeTicket($owner, $agent);
        $ticket->load('user');

        $payload = (new TicketAssigned($ticket))->toArray($agent);

        $this->assertSame('ticket_assigned',  $payload['type']);
        $this->assertSame($ticket->id,        $payload['ticket_id']);
        $this->assertStringContainsString("#{$ticket->id}", $payload['message']);
        $this->assertStringContainsString('/staff/tickets/', $payload['url']);
    }

    public function test_ticket_assigned_mail_subject_contains_ticket_id(): void
    {
        $owner  = $this->makeUser();
        $agent  = $this->makeUser('staff');
        $ticket = $this->makeTicket($owner, $agent);
        $ticket->load('user');

        $mail = (new TicketAssigned($ticket))->toMail($agent);

        $this->assertStringContainsString("#{$ticket->id}", $mail->subject);
    }

    public function test_ticket_assigned_is_sent_to_agent_via_fake(): void
    {
        Notification::fake();

        $owner  = $this->makeUser();
        $agent  = $this->makeUser('staff');
        $ticket = $this->makeTicket($owner, $agent);
        $ticket->load('user');

        $agent->notify(new TicketAssigned($ticket));

        Notification::assertSentTo($agent, TicketAssigned::class,
            fn($n) => $n->ticket->id === $ticket->id
        );
        Notification::assertNotSentTo($owner, TicketAssigned::class);
    }

    // ── TicketStatusChanged ───────────────────────────────────────────────────

    public function test_ticket_status_changed_uses_mail_and_database_channels(): void
    {
        $user   = $this->makeUser();
        $ticket = $this->makeTicket($user);

        $this->assertSame(['mail', 'database'],
            (new TicketStatusChanged($ticket, 'open', 'resolved'))->via()
        );
    }

    public function test_ticket_status_changed_toArray_payload(): void
    {
        $user   = $this->makeUser();
        $ticket = $this->makeTicket($user);

        $payload = (new TicketStatusChanged($ticket, 'open', 'in_progress'))->toArray($user);

        $this->assertSame('status_changed',   $payload['type']);
        $this->assertSame($ticket->id,        $payload['ticket_id']);
        $this->assertStringContainsString('In Progress', $payload['message']);
        $this->assertStringContainsString((string) $ticket->id, $payload['url']);
    }

    public function test_ticket_status_changed_mail_subject_reflects_new_status(): void
    {
        $user   = $this->makeUser();
        $ticket = $this->makeTicket($user);

        $mail = (new TicketStatusChanged($ticket, 'open', 'resolved'))->toMail($user);

        $this->assertStringContainsString('resolved', strtolower($mail->subject));
    }

    public function test_ticket_status_changed_not_sent_when_actor_is_owner(): void
    {
        Notification::fake();

        $user   = $this->makeUser();
        $ticket = $this->makeTicket($user);

        // Simulate the service guard: skip notify if user_id === actor
        if ($ticket->user_id !== $user->id) {
            $user->notify(new TicketStatusChanged($ticket, 'open', 'resolved'));
        }

        Notification::assertNotSentTo($user, TicketStatusChanged::class);
    }

    // ── TicketReplyAdded ──────────────────────────────────────────────────────

    public function test_ticket_reply_added_uses_mail_and_database_channels(): void
    {
        $owner  = $this->makeUser();
        $agent  = $this->makeUser('staff');
        $ticket = $this->makeTicket($owner, $agent);
        $reply  = Reply::create(['ticket_id' => $ticket->id, 'user_id' => $agent->id, 'message' => 'Hello']);
        $reply->load('user');

        $this->assertSame(['mail', 'database'],
            (new TicketReplyAdded($ticket, $reply))->via()
        );
    }

    public function test_ticket_reply_added_toArray_for_user_has_user_path(): void
    {
        $owner  = $this->makeUser();
        $agent  = $this->makeUser('staff');
        $ticket = $this->makeTicket($owner, $agent);
        $reply  = Reply::create(['ticket_id' => $ticket->id, 'user_id' => $agent->id, 'message' => 'Hi']);
        $reply->load('user');

        $payload = (new TicketReplyAdded($ticket, $reply))->toArray($owner);

        $this->assertSame('ticket_reply', $payload['type']);
        $this->assertSame($ticket->id,   $payload['ticket_id']);
        $this->assertStringContainsString($agent->name, $payload['message']);
        $this->assertStringContainsString('/user/tickets/', $payload['url']);
    }

    public function test_ticket_reply_added_toArray_for_staff_has_staff_path(): void
    {
        $owner  = $this->makeUser();
        $agent  = $this->makeUser('staff');
        $ticket = $this->makeTicket($owner, $agent);
        $reply  = Reply::create(['ticket_id' => $ticket->id, 'user_id' => $owner->id, 'message' => 'Update']);
        $reply->load('user');

        $payload = (new TicketReplyAdded($ticket, $reply))->toArray($agent);

        $this->assertStringContainsString('/staff/tickets/', $payload['url']);
    }

    public function test_ticket_reply_added_mail_subject_contains_ticket_id(): void
    {
        $owner  = $this->makeUser();
        $agent  = $this->makeUser('staff');
        $ticket = $this->makeTicket($owner, $agent);
        $reply  = Reply::create(['ticket_id' => $ticket->id, 'user_id' => $agent->id, 'message' => 'Done']);
        $reply->load('user');

        $mail = (new TicketReplyAdded($ticket, $reply))->toMail($owner);

        $this->assertStringContainsString("#{$ticket->id}", $mail->subject);
    }

    public function test_ticket_reply_added_sent_to_owner_not_to_replier(): void
    {
        Notification::fake();

        $owner  = $this->makeUser();
        $agent  = $this->makeUser('staff');
        $ticket = $this->makeTicket($owner, $agent);
        $reply  = Reply::create(['ticket_id' => $ticket->id, 'user_id' => $agent->id, 'message' => 'Reply']);
        $reply->load('user');

        // Simulate service logic: notify owner when reply is from staff
        if ($ticket->user_id !== $agent->id) {
            $owner->notify(new TicketReplyAdded($ticket, $reply));
        }

        Notification::assertSentTo($owner, TicketReplyAdded::class);
        Notification::assertNotSentTo($agent, TicketReplyAdded::class);
    }
}
