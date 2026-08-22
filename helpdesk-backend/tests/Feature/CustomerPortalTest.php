<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerPortalTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private User $other;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user  = User::factory()->create(['role' => 'user']);
        $this->other = User::factory()->create(['role' => 'user']);
    }

    public function test_customer_summary_returns_ticket_counts(): void
    {
        Ticket::factory()->create(['user_id' => $this->user->id, 'status' => 'open']);
        Ticket::factory()->create(['user_id' => $this->user->id, 'status' => 'resolved']);

        $response = $this->actingAs($this->user)->getJson('/api/customer/summary');

        $response->assertOk()->assertJsonPath('success', true);
        $this->assertNotNull($response->json('data.counts'));
    }

    public function test_customer_can_reopen_resolved_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id'     => $this->user->id,
            'status'      => 'resolved',
            'resolved_at' => now()->subHours(2),
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/customer/tickets/{$ticket->id}/reopen", [
            'reason' => 'The issue is still happening.',
        ]);

        $response->assertOk()->assertJsonPath('success', true);
        $this->assertEquals('open', $ticket->fresh()->status);
    }

    public function test_cannot_reopen_ticket_older_than_7_days(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id'     => $this->user->id,
            'status'      => 'resolved',
            'resolved_at' => now()->subDays(8),
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/customer/tickets/{$ticket->id}/reopen", [
            'reason' => 'Still broken.',
        ]);

        $response->assertStatus(422);
    }

    public function test_cannot_reopen_open_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id' => $this->user->id,
            'status'  => 'open',
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/customer/tickets/{$ticket->id}/reopen", [
            'reason' => 'Trying to reopen open ticket.',
        ]);

        $response->assertStatus(422);
    }

    public function test_other_user_cannot_reopen_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id'     => $this->user->id,
            'status'      => 'resolved',
            'resolved_at' => now()->subHour(),
        ]);

        $response = $this->actingAs($this->other)->postJson("/api/customer/tickets/{$ticket->id}/reopen", [
            'reason' => 'Not my ticket.',
        ]);

        $response->assertStatus(403);
    }

    public function test_customer_can_send_follow_up_on_resolved_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id' => $this->user->id,
            'status'  => 'resolved',
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/customer/tickets/{$ticket->id}/follow-up", [
            'message' => 'Just checking in on this.',
        ]);

        $response->assertOk()->assertJsonPath('success', true);
        $this->assertDatabaseHas('replies', [
            'ticket_id' => $ticket->id,
            'message'   => 'Just checking in on this.',
        ]);
    }

    public function test_follow_up_not_allowed_on_open_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id' => $this->user->id,
            'status'  => 'open',
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/customer/tickets/{$ticket->id}/follow-up", [
            'message' => 'Follow up on open ticket.',
        ]);

        $response->assertStatus(422);
    }
}
