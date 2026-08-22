<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketMergeTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->user  = User::factory()->create(['role' => 'user']);
    }

    public function test_admin_can_merge_two_tickets(): void
    {
        $target = Ticket::factory()->create(['user_id' => $this->user->id]);
        $source = Ticket::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->admin)->postJson("/api/tickets/{$target->id}/merge", [
            'source_ticket_id' => $source->id,
        ]);

        $response->assertOk()->assertJsonPath('success', true);
    }

    public function test_source_ticket_is_closed_after_merge(): void
    {
        $target = Ticket::factory()->create(['user_id' => $this->user->id]);
        $source = Ticket::factory()->create(['user_id' => $this->user->id]);

        $this->actingAs($this->admin)->postJson("/api/tickets/{$target->id}/merge", [
            'source_ticket_id' => $source->id,
        ]);

        $this->assertEquals('closed', $source->fresh()->status);
    }

    public function test_source_ticket_merged_into_points_to_target(): void
    {
        $target = Ticket::factory()->create(['user_id' => $this->user->id]);
        $source = Ticket::factory()->create(['user_id' => $this->user->id]);

        $this->actingAs($this->admin)->postJson("/api/tickets/{$target->id}/merge", [
            'source_ticket_id' => $source->id,
        ]);

        $this->assertEquals($target->id, $source->fresh()->merged_into);
    }

    public function test_replies_move_to_target_after_merge(): void
    {
        $target = Ticket::factory()->create(['user_id' => $this->user->id]);
        $source = Ticket::factory()->create(['user_id' => $this->user->id]);

        $source->replies()->create([
            'user_id' => $this->user->id,
            'message' => 'Reply on source ticket.',
        ]);

        $this->actingAs($this->admin)->postJson("/api/tickets/{$target->id}/merge", [
            'source_ticket_id' => $source->id,
        ]);

        $this->assertDatabaseHas('replies', [
            'ticket_id' => $target->id,
            'message'   => 'Reply on source ticket.',
        ]);
    }

    public function test_non_admin_cannot_merge_tickets(): void
    {
        $target = Ticket::factory()->create(['user_id' => $this->user->id]);
        $source = Ticket::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->postJson("/api/tickets/{$target->id}/merge", [
            'source_ticket_id' => $source->id,
        ]);

        $response->assertStatus(403);
    }

    public function test_cannot_merge_already_merged_source(): void
    {
        $target  = Ticket::factory()->create(['user_id' => $this->user->id]);
        $source  = Ticket::factory()->create(['user_id' => $this->user->id]);
        $another = Ticket::factory()->create(['user_id' => $this->user->id]);

        // First merge
        $this->actingAs($this->admin)->postJson("/api/tickets/{$target->id}/merge", [
            'source_ticket_id' => $source->id,
        ]);

        // Try to merge already-merged source again
        $response = $this->actingAs($this->admin)->postJson("/api/tickets/{$another->id}/merge", [
            'source_ticket_id' => $source->id,
        ]);

        $response->assertStatus(422);
    }
}
