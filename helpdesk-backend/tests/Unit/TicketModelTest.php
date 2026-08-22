<?php

namespace Tests\Unit;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketModelTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_is_overdue_returns_true_when_past_resolution_due(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id'            => $this->user->id,
            'status'             => 'open',
            'resolution_due_at'  => now()->subHour(),
        ]);

        $this->assertTrue($ticket->isOverdue());
    }

    public function test_is_overdue_returns_false_for_resolved_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id'            => $this->user->id,
            'status'             => 'resolved',
            'resolution_due_at'  => now()->subHour(),
        ]);

        $this->assertFalse($ticket->isOverdue());
    }

    public function test_is_overdue_returns_false_when_not_yet_due(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id'            => $this->user->id,
            'status'             => 'open',
            'resolution_due_at'  => now()->addHour(),
        ]);

        $this->assertFalse($ticket->isOverdue());
    }

    public function test_is_due_soon_returns_true_within_30_minutes(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id'            => $this->user->id,
            'resolution_due_at'  => now()->addMinutes(15),
        ]);

        $this->assertTrue($ticket->isDueSoon());
    }

    public function test_is_due_soon_returns_false_when_more_than_30_minutes_away(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id'            => $this->user->id,
            'resolution_due_at'  => now()->addHours(2),
        ]);

        $this->assertFalse($ticket->isDueSoon());
    }

    public function test_is_response_breached_when_no_first_response_and_past_due(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id'           => $this->user->id,
            'response_due_at'   => now()->subMinutes(30),
            'first_response_at' => null,
        ]);

        $this->assertTrue($ticket->isResponseBreached());
    }

    public function test_is_response_breached_false_when_already_responded(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id'           => $this->user->id,
            'response_due_at'   => now()->subMinutes(30),
            'first_response_at' => now()->subMinutes(45),
        ]);

        $this->assertFalse($ticket->isResponseBreached());
    }

    public function test_user_role_helpers(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $staff = User::factory()->create(['role' => 'staff']);
        $user  = User::factory()->create(['role' => 'user']);

        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($admin->isStaff());

        $this->assertTrue($staff->isStaff());
        $this->assertFalse($staff->isAdmin());

        $this->assertTrue($user->isUser());
        $this->assertFalse($user->isAdmin());
    }
}
