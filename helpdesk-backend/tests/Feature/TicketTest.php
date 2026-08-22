<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $staff;
    private User $user;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin    = User::factory()->create(['role' => 'admin']);
        $this->staff    = User::factory()->create(['role' => 'staff', 'availability_status' => 'online']);
        $this->user     = User::factory()->create(['role' => 'user']);
        $this->category = Category::create(['name' => 'Network', 'description' => 'Network issues']);
    }

    // ── Create ──────────────────────────────────────────────────────────────

    public function test_user_can_create_ticket(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tickets', [
            'title'       => 'Cannot connect to WiFi',
            'description' => 'My laptop cannot connect to the office WiFi.',
            'priority'    => 'medium',
            'category_id' => $this->category->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Cannot connect to WiFi');

        $this->assertDatabaseHas('tickets', ['title' => 'Cannot connect to WiFi']);
    }

    public function test_ticket_creation_requires_title_and_description(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tickets', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'description']);
    }

    // ── Read ─────────────────────────────────────────────────────────────────

    public function test_user_can_only_see_own_tickets(): void
    {
        Ticket::factory()->create(['user_id' => $this->user->id, 'title' => 'My Ticket']);
        Ticket::factory()->create(['user_id' => $this->admin->id, 'title' => 'Admin Ticket']);

        $response = $this->actingAs($this->user)->getJson('/api/tickets');

        $response->assertOk();
        $titles = collect($response->json('data.data'))->pluck('title');
        $this->assertContains('My Ticket', $titles);
        $this->assertNotContains('Admin Ticket', $titles);
    }

    public function test_admin_can_see_all_tickets(): void
    {
        Ticket::factory()->create(['user_id' => $this->user->id]);
        Ticket::factory()->create(['user_id' => $this->admin->id]);

        $response = $this->actingAs($this->admin)->getJson('/api/tickets');

        $response->assertOk();
        $this->assertCount(2, $response->json('data.data'));
    }

    public function test_user_can_view_own_ticket_detail(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->getJson("/api/tickets/{$ticket->id}");

        $response->assertOk()->assertJsonPath('data.id', $ticket->id);
    }

    public function test_user_cannot_view_another_users_ticket(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->admin->id]);

        $response = $this->actingAs($this->user)->getJson("/api/tickets/{$ticket->id}");

        $response->assertStatus(403);
    }

    // ── Update ───────────────────────────────────────────────────────────────

    public function test_admin_can_update_ticket(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->admin)->putJson("/api/tickets/{$ticket->id}", [
            'title'       => 'Updated Title',
            'description' => 'Updated description.',
            'priority'    => 'high',
        ]);

        $response->assertOk()->assertJsonPath('data.title', 'Updated Title');
    }

    public function test_user_cannot_update_another_users_ticket(): void
    {
        $other  = User::factory()->create(['role' => 'user']);
        $ticket = Ticket::factory()->create(['user_id' => $other->id]);

        $response = $this->actingAs($this->user)->putJson("/api/tickets/{$ticket->id}", [
            'title'       => 'Hacked Title',
            'description' => 'x',
            'priority'    => 'low',
        ]);

        $response->assertStatus(403);
    }

    // ── Status ───────────────────────────────────────────────────────────────

    public function test_staff_can_change_ticket_status(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id'     => $this->user->id,
            'assigned_to' => $this->staff->id,
            'status'      => 'open',
        ]);

        $response = $this->actingAs($this->staff)->patchJson("/api/tickets/{$ticket->id}/status", [
            'status' => 'resolved',
        ]);

        $response->assertOk()->assertJsonPath('data.status', 'resolved');
    }

    public function test_user_cannot_change_another_users_ticket_status(): void
    {
        $other  = User::factory()->create(['role' => 'user']);
        $ticket = Ticket::factory()->create(['user_id' => $other->id, 'status' => 'open']);

        $response = $this->actingAs($this->user)->patchJson("/api/tickets/{$ticket->id}/status", [
            'status' => 'closed',
        ]);

        $response->assertStatus(403);
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    public function test_admin_can_delete_ticket(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->admin)->deleteJson("/api/tickets/{$ticket->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('tickets', ['id' => $ticket->id]);
    }

    public function test_non_admin_cannot_delete_ticket(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->deleteJson("/api/tickets/{$ticket->id}");

        $response->assertStatus(403);
    }

    // ── Assign ───────────────────────────────────────────────────────────────

    public function test_admin_can_assign_ticket_to_agent(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->admin)->patchJson("/api/tickets/{$ticket->id}/assign", [
            'agent_id' => $this->staff->id,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('tickets', ['id' => $ticket->id, 'assigned_to' => $this->staff->id]);
    }
}
