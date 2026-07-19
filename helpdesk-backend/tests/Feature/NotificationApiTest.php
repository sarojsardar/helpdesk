<?php

namespace Tests\Feature;

use App\Models\Reply;
use App\Models\Ticket;
use App\Models\User;
use App\Notifications\TicketAssigned;
use App\Notifications\TicketCreated;
use App\Notifications\TicketReplyAdded;
use App\Notifications\TicketStatusChanged;
use App\Services\TicketService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeUser(string $role = 'user'): User
    {
        return User::factory()->create(['role' => $role, 'is_active' => true]);
    }

    private function makeTicket(User $owner, ?User $assignee = null, array $extra = []): Ticket
    {
        return Ticket::create(array_merge([
            'title'       => 'Test ticket',
            'description' => 'Description',
            'priority'    => 'medium',
            'status'      => 'open',
            'user_id'     => $owner->id,
            'assigned_to' => $assignee?->id,
        ], $extra));
    }

    // ── GET /api/notifications ────────────────────────────────────────────────

    public function test_unauthenticated_user_cannot_list_notifications(): void
    {
        $this->getJson('/api/notifications')->assertUnauthorized();
    }

    public function test_authenticated_user_gets_empty_notifications(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonFragment(['success' => true, 'unread' => 0])
            ->assertJsonPath('data', []);
    }

    public function test_notifications_list_returns_stored_notification(): void
    {
        $user   = $this->makeUser();
        $ticket = $this->makeTicket($user);
        $user->notify(new TicketCreated($ticket));

        $response = $this->actingAs($user)
            ->getJson('/api/notifications')
            ->assertOk();

        $response->assertJsonPath('unread', 1);
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('ticket_created', $response->json('data.0.data.type'));
    }

    public function test_notifications_list_is_limited_to_30(): void
    {
        $user   = $this->makeUser();
        $ticket = $this->makeTicket($user);

        for ($i = 0; $i < 35; $i++) {
            $user->notify(new TicketCreated($ticket));
        }

        $response = $this->actingAs($user)->getJson('/api/notifications')->assertOk();

        $this->assertCount(30, $response->json('data'));
        $this->assertSame(35, $response->json('unread'));
    }

    public function test_notification_has_expected_shape(): void
    {
        $user   = $this->makeUser();
        $ticket = $this->makeTicket($user);
        $user->notify(new TicketCreated($ticket));

        $item = $this->actingAs($user)
            ->getJson('/api/notifications')
            ->assertOk()
            ->json('data.0');

        $this->assertArrayHasKey('id',         $item);
        $this->assertArrayHasKey('data',       $item);
        $this->assertArrayHasKey('read_at',    $item);
        $this->assertArrayHasKey('created_at', $item);
        $this->assertNull($item['read_at']);
    }

    // ── PATCH /api/notifications/{id}/read ────────────────────────────────────

    public function test_mark_single_notification_as_read(): void
    {
        $user   = $this->makeUser();
        $ticket = $this->makeTicket($user);
        $user->notify(new TicketCreated($ticket));

        $notifId = $user->notifications()->first()->id;

        $this->actingAs($user)
            ->patchJson("/api/notifications/{$notifId}/read")
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->assertNotNull($user->notifications()->find($notifId)->read_at);
    }

    public function test_mark_read_decrements_unread_count(): void
    {
        $user   = $this->makeUser();
        $ticket = $this->makeTicket($user);
        $user->notify(new TicketCreated($ticket));
        $user->notify(new TicketCreated($ticket));

        $notifId = $user->notifications()->first()->id;

        $this->actingAs($user)->patchJson("/api/notifications/{$notifId}/read");

        $unread = $this->actingAs($user)
            ->getJson('/api/notifications')
            ->json('unread');

        $this->assertSame(1, $unread);
    }

    public function test_mark_read_does_not_affect_other_users_notifications(): void
    {
        $user1  = $this->makeUser();
        $user2  = $this->makeUser();
        $ticket = $this->makeTicket($user1);
        $user1->notify(new TicketCreated($ticket));

        $notifId = $user1->notifications()->first()->id;

        // user2 tries to mark user1's notification — silently does nothing
        $this->actingAs($user2)
            ->patchJson("/api/notifications/{$notifId}/read")
            ->assertOk();

        // user1's notification is still unread
        $this->assertNull($user1->notifications()->find($notifId)->read_at);
    }

    // ── POST /api/notifications/read-all ─────────────────────────────────────

    public function test_mark_all_read_clears_unread_count(): void
    {
        $user   = $this->makeUser();
        $ticket = $this->makeTicket($user);
        $user->notify(new TicketCreated($ticket));
        $user->notify(new TicketCreated($ticket));
        $user->notify(new TicketCreated($ticket));

        $this->actingAs($user)
            ->postJson('/api/notifications/read-all')
            ->assertOk()
            ->assertJson(['success' => true]);

        $unread = $this->actingAs($user)->getJson('/api/notifications')->json('unread');
        $this->assertSame(0, $unread);
    }

    public function test_mark_all_read_only_affects_current_user(): void
    {
        $user1  = $this->makeUser();
        $user2  = $this->makeUser();
        $ticket = $this->makeTicket($user1);
        $user1->notify(new TicketCreated($ticket));
        $user2->notify(new TicketCreated($ticket));

        $this->actingAs($user1)->postJson('/api/notifications/read-all');

        $unread2 = $this->actingAs($user2)->getJson('/api/notifications')->json('unread');
        $this->assertSame(1, $unread2);
    }

    // ── TicketService dispatch integration ───────────────────────────────────

    public function test_creating_ticket_notifies_owner(): void
    {
        Notification::fake();

        $user    = $this->makeUser();
        $service = app(TicketService::class);

        $service->create([
            'title'       => 'My issue',
            'description' => 'Details',
            'priority'    => 'low',
        ], $user->id);

        Notification::assertSentTo($user, TicketCreated::class);
    }

    public function test_assigning_ticket_notifies_agent(): void
    {
        Notification::fake();

        $owner   = $this->makeUser();
        $agent   = $this->makeUser('staff');
        $ticket  = $this->makeTicket($owner);
        $service = app(TicketService::class);

        $service->assign($ticket, $agent->id, $owner->id);

        Notification::assertSentTo($agent, TicketAssigned::class);
        Notification::assertNotSentTo($owner, TicketAssigned::class);
    }

    public function test_unassigning_ticket_sends_no_notification(): void
    {
        Notification::fake();

        $owner   = $this->makeUser();
        $agent   = $this->makeUser('staff');
        $ticket  = $this->makeTicket($owner, $agent);
        $service = app(TicketService::class);

        $service->assign($ticket, null, $owner->id);

        Notification::assertNothingSent();
    }

    public function test_status_change_notifies_owner_when_actor_is_staff(): void
    {
        Notification::fake();

        $owner   = $this->makeUser();
        $agent   = $this->makeUser('staff');
        $ticket  = $this->makeTicket($owner, $agent);
        $service = app(TicketService::class);

        $service->updateStatus($ticket, 'resolved', $agent->id);

        Notification::assertSentTo($owner, TicketStatusChanged::class,
            fn($n) => $n->newStatus === 'resolved' && $n->oldStatus === 'open'
        );
    }

    public function test_status_change_does_not_notify_owner_when_owner_changes_it(): void
    {
        Notification::fake();

        $owner   = $this->makeUser();
        $ticket  = $this->makeTicket($owner);
        $service = app(TicketService::class);

        $service->updateStatus($ticket, 'closed', $owner->id);

        Notification::assertNotSentTo($owner, TicketStatusChanged::class);
    }

    public function test_reply_notifies_owner_when_staff_replies(): void
    {
        Notification::fake();

        $owner   = $this->makeUser();
        $agent   = $this->makeUser('staff');
        $ticket  = $this->makeTicket($owner, $agent);
        $service = app(TicketService::class);

        $service->addReply($ticket, ['message' => 'We are looking into it.'], $agent->id);

        Notification::assertSentTo($owner, TicketReplyAdded::class);
        Notification::assertNotSentTo($agent, TicketReplyAdded::class);
    }

    public function test_reply_notifies_agent_when_owner_replies(): void
    {
        Notification::fake();

        $owner   = $this->makeUser();
        $agent   = $this->makeUser('staff');
        $ticket  = $this->makeTicket($owner, $agent);
        $service = app(TicketService::class);

        $service->addReply($ticket, ['message' => 'Any update?'], $owner->id);

        Notification::assertSentTo($agent, TicketReplyAdded::class);
        Notification::assertNotSentTo($owner, TicketReplyAdded::class);
    }

    public function test_internal_reply_sends_no_notification(): void
    {
        Notification::fake();

        $owner   = $this->makeUser();
        $agent   = $this->makeUser('staff');
        $ticket  = $this->makeTicket($owner, $agent);
        $service = app(TicketService::class);

        $service->addReply($ticket, ['message' => 'Internal note.', 'is_internal' => true], $agent->id);

        Notification::assertNothingSent();
    }

    public function test_reply_on_unassigned_ticket_only_notifies_owner(): void
    {
        Notification::fake();

        $owner   = $this->makeUser();
        $agent   = $this->makeUser('staff');
        $ticket  = $this->makeTicket($owner); // no assignee
        $service = app(TicketService::class);

        $service->addReply($ticket, ['message' => 'Hello'], $agent->id);

        Notification::assertSentTo($owner, TicketReplyAdded::class);
        Notification::assertNotSentTo($agent, TicketReplyAdded::class);
    }

    public function test_first_reply_records_first_response_at(): void
    {
        $owner   = $this->makeUser();
        $agent   = $this->makeUser('staff');
        $ticket  = $this->makeTicket($owner, $agent);
        $service = app(TicketService::class);

        $this->assertNull($ticket->first_response_at);

        $service->addReply($ticket, ['message' => 'First reply'], $agent->id);

        $this->assertNotNull($ticket->fresh()->first_response_at);
    }

    public function test_subsequent_reply_does_not_overwrite_first_response_at(): void
    {
        $owner   = $this->makeUser();
        $agent   = $this->makeUser('staff');
        $ticket  = $this->makeTicket($owner, $agent);
        $service = app(TicketService::class);

        $service->addReply($ticket, ['message' => 'First'], $agent->id);
        $first = $ticket->fresh()->first_response_at;

        $service->addReply($ticket, ['message' => 'Second'], $agent->id);

        $this->assertEquals($first, $ticket->fresh()->first_response_at);
    }
}
