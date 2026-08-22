<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_access_dashboard(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $response = $this->actingAs($staff)->getJson('/api/staff/dashboard');

        $response->assertOk()->assertJsonPath('success', true);
        $this->assertArrayHasKey('counts', $response->json('data'));
        $this->assertArrayHasKey('my_queue', $response->json('data'));
        $this->assertArrayHasKey('unassigned_pool', $response->json('data'));
    }

    public function test_admin_can_access_staff_dashboard(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->getJson('/api/staff/dashboard');

        $response->assertOk()->assertJsonPath('success', true);
    }

    public function test_regular_user_cannot_access_staff_dashboard(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user)->getJson('/api/staff/dashboard');

        $response->assertStatus(403);
    }

    public function test_dashboard_returns_today_stats(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $response = $this->actingAs($staff)->getJson('/api/staff/dashboard');

        $response->assertOk();
        $this->assertArrayHasKey('today', $response->json('data'));
        $this->assertArrayHasKey('resolved', $response->json('data.today'));
        $this->assertArrayHasKey('replies', $response->json('data.today'));
    }
}
