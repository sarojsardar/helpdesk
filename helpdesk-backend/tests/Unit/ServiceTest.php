<?php

namespace Tests\Unit;

use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use App\Services\AutoAssignService;
use App\Services\BusinessCalendarService;
use App\Services\SlaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SlaServiceTest extends TestCase
{
    use RefreshDatabase;

    private SlaService $sla;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sla = new SlaService(new BusinessCalendarService());
    }

    public function test_fallback_policy_returns_correct_minutes_for_critical(): void
    {
        [$response, $resolution] = $this->sla->getPolicy('critical');

        $this->assertEquals(15, $response);
        $this->assertEquals(60, $resolution);
    }

    public function test_fallback_policy_returns_correct_minutes_for_high(): void
    {
        [$response, $resolution] = $this->sla->getPolicy('high');

        $this->assertEquals(30, $response);
        $this->assertEquals(240, $resolution);
    }

    public function test_fallback_policy_returns_correct_minutes_for_medium(): void
    {
        [$response, $resolution] = $this->sla->getPolicy('medium');

        $this->assertEquals(120, $response);
        $this->assertEquals(480, $resolution);
    }

    public function test_fallback_policy_returns_correct_minutes_for_low(): void
    {
        [$response, $resolution] = $this->sla->getPolicy('low');

        $this->assertEquals(240, $response);
        $this->assertEquals(1440, $resolution);
    }

    public function test_apply_to_ticket_sets_due_dates(): void
    {
        $user   = User::factory()->create();
        $ticket = Ticket::factory()->create([
            'user_id'  => $user->id,
            'priority' => 'medium',
        ]);

        $this->sla->applyToTicket($ticket);
        $ticket->refresh();

        $this->assertNotNull($ticket->response_due_at);
        $this->assertNotNull($ticket->resolution_due_at);
        $this->assertTrue($ticket->resolution_due_at->gt($ticket->response_due_at));
    }

    public function test_critical_ticket_gets_tighter_sla_than_low(): void
    {
        $user = User::factory()->create();

        $critical = Ticket::factory()->create(['user_id' => $user->id, 'priority' => 'critical']);
        $low      = Ticket::factory()->create(['user_id' => $user->id, 'priority' => 'low']);

        $this->sla->applyToTicket($critical);
        $this->sla->applyToTicket($low);

        $critical->refresh();
        $low->refresh();

        $this->assertTrue($critical->resolution_due_at->lt($low->resolution_due_at));
    }
}

class AutoAssignServiceTest extends TestCase
{
    use RefreshDatabase;

    private AutoAssignService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AutoAssignService();
    }

    public function test_returns_null_when_no_online_staff(): void
    {
        User::factory()->create(['role' => 'staff', 'availability_status' => 'offline']);

        $this->assertNull($this->service->nextAgent());
    }

    public function test_returns_online_staff_agent(): void
    {
        $agent = User::factory()->create([
            'role'                => 'staff',
            'availability_status' => 'online',
            'is_active'           => true,
        ]);

        $result = $this->service->nextAgent();

        $this->assertNotNull($result);
        $this->assertEquals($agent->id, $result->id);
    }

    public function test_assigns_to_agent_with_fewest_open_tickets(): void
    {
        $busy = User::factory()->create([
            'role'                => 'staff',
            'availability_status' => 'online',
            'is_active'           => true,
        ]);
        $free = User::factory()->create([
            'role'                => 'staff',
            'availability_status' => 'online',
            'is_active'           => true,
        ]);

        // Give busy agent 3 open tickets
        Ticket::factory()->count(3)->create([
            'user_id'     => $busy->id,
            'assigned_to' => $busy->id,
            'status'      => 'open',
        ]);

        $result = $this->service->nextAgent();

        $this->assertEquals($free->id, $result->id);
    }

    public function test_skips_busy_and_offline_agents(): void
    {
        User::factory()->create(['role' => 'staff', 'availability_status' => 'busy',    'is_active' => true]);
        User::factory()->create(['role' => 'staff', 'availability_status' => 'offline',  'is_active' => true]);

        $this->assertNull($this->service->nextAgent());
    }
}
