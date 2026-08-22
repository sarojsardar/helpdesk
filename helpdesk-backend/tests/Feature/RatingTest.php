<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RatingTest extends TestCase
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

    public function test_owner_can_rate_resolved_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id' => $this->user->id,
            'status'  => 'resolved',
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/tickets/{$ticket->id}/rating", [
            'score'   => 5,
            'comment' => 'Great support!',
        ]);

        $response->assertStatus(201)->assertJsonPath('success', true);
        $this->assertDatabaseHas('ticket_ratings', ['ticket_id' => $ticket->id, 'score' => 5]);
    }

    public function test_owner_can_rate_closed_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id' => $this->user->id,
            'status'  => 'closed',
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/tickets/{$ticket->id}/rating", [
            'score' => 4,
        ]);

        $response->assertStatus(201);
    }

    public function test_cannot_rate_open_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id' => $this->user->id,
            'status'  => 'open',
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/tickets/{$ticket->id}/rating", [
            'score' => 5,
        ]);

        $response->assertStatus(422);
    }

    public function test_non_owner_cannot_rate_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id' => $this->user->id,
            'status'  => 'resolved',
        ]);

        $response = $this->actingAs($this->other)->postJson("/api/tickets/{$ticket->id}/rating", [
            'score' => 5,
        ]);

        $response->assertStatus(403);
    }

    public function test_score_must_be_between_1_and_5(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id' => $this->user->id,
            'status'  => 'resolved',
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/tickets/{$ticket->id}/rating", [
            'score' => 10,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['score']);
    }

    public function test_rating_can_be_updated(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id' => $this->user->id,
            'status'  => 'resolved',
        ]);

        $this->actingAs($this->user)->postJson("/api/tickets/{$ticket->id}/rating", ['score' => 3]);
        $this->actingAs($this->user)->postJson("/api/tickets/{$ticket->id}/rating", ['score' => 5]);

        $this->assertDatabaseHas('ticket_ratings', ['ticket_id' => $ticket->id, 'score' => 5]);
        $this->assertEquals(1, $ticket->fresh()->rating()->count());
    }
}
