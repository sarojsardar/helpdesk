<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReplyTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_reply_to_own_ticket(): void
    {
        $user   = User::factory()->create(['role' => 'user']);
        $ticket = Ticket::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/api/tickets/{$ticket->id}/replies", [
            'message' => 'Please help me with this issue.',
        ]);

        $response->assertStatus(201)->assertJsonPath('success', true);
        $this->assertDatabaseHas('replies', [
            'ticket_id' => $ticket->id,
            'message'   => 'Please help me with this issue.',
        ]);
    }

    public function test_staff_can_post_internal_note(): void
    {
        $staff  = User::factory()->create(['role' => 'staff']);
        $user   = User::factory()->create(['role' => 'user']);
        $ticket = Ticket::factory()->create(['user_id' => $user->id, 'assigned_to' => $staff->id]);

        $response = $this->actingAs($staff)->postJson("/api/tickets/{$ticket->id}/replies", [
            'message'     => 'Waiting on vendor callback.',
            'is_internal' => true,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('replies', ['ticket_id' => $ticket->id, 'is_internal' => 1]);
    }

    public function test_user_cannot_post_internal_note(): void
    {
        $user   = User::factory()->create(['role' => 'user']);
        $ticket = Ticket::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/api/tickets/{$ticket->id}/replies", [
            'message'     => 'Sneaky internal note.',
            'is_internal' => true,
        ]);

        $response->assertStatus(403);
    }

    public function test_reply_sets_first_response_at(): void
    {
        $staff  = User::factory()->create(['role' => 'staff']);
        $user   = User::factory()->create(['role' => 'user']);
        $ticket = Ticket::factory()->create([
            'user_id'           => $user->id,
            'assigned_to'       => $staff->id,
            'first_response_at' => null,
        ]);

        $this->actingAs($staff)->postJson("/api/tickets/{$ticket->id}/replies", [
            'message' => 'We are looking into this.',
        ]);

        $this->assertNotNull($ticket->fresh()->first_response_at);
    }
}
