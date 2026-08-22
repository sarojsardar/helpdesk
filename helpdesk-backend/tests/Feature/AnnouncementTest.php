<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnnouncementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $staff;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->staff = User::factory()->create(['role' => 'staff']);
        $this->user  = User::factory()->create(['role' => 'user']);
    }

    public function test_admin_can_create_announcement(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/announcements', [
            'title' => 'Maintenance Notice',
            'body'  => 'System will be down Saturday 10pm.',
            'type'  => 'warning',
        ]);

        $response->assertStatus(201)->assertJsonPath('success', true);
        $this->assertDatabaseHas('announcements', ['title' => 'Maintenance Notice']);
    }

    public function test_user_cannot_create_announcement(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/announcements', [
            'title' => 'Spam',
            'body'  => 'Spam body',
        ]);

        $response->assertStatus(403);
    }

    public function test_active_announcements_returned_for_all_roles(): void
    {
        Announcement::create([
            'title'      => 'Global Notice',
            'body'       => 'For everyone.',
            'type'       => 'info',
            'is_active'  => true,
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/announcements/active');

        $response->assertOk();
        $titles = collect($response->json('data'))->pluck('title');
        $this->assertContains('Global Notice', $titles);
    }

    public function test_expired_announcement_not_returned(): void
    {
        Announcement::create([
            'title'      => 'Old Notice',
            'body'       => 'Expired.',
            'type'       => 'info',
            'is_active'  => true,
            'expires_at' => now()->subDay(),
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/announcements/active');

        $titles = collect($response->json('data'))->pluck('title');
        $this->assertNotContains('Old Notice', $titles);
    }

    public function test_announcement_targeted_to_staff_not_shown_to_user(): void
    {
        Announcement::create([
            'title'        => 'Staff Only',
            'body'         => 'Internal message.',
            'type'         => 'info',
            'is_active'    => true,
            'target_roles' => ['staff', 'admin'],
            'created_by'   => $this->admin->id,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/announcements/active');

        $titles = collect($response->json('data'))->pluck('title');
        $this->assertNotContains('Staff Only', $titles);
    }

    public function test_announcement_targeted_to_staff_shown_to_staff(): void
    {
        Announcement::create([
            'title'        => 'Staff Only',
            'body'         => 'Internal message.',
            'type'         => 'info',
            'is_active'    => true,
            'target_roles' => ['staff', 'admin'],
            'created_by'   => $this->admin->id,
        ]);

        $response = $this->actingAs($this->staff)->getJson('/api/announcements/active');

        $titles = collect($response->json('data'))->pluck('title');
        $this->assertContains('Staff Only', $titles);
    }

    public function test_admin_can_delete_announcement(): void
    {
        $announcement = Announcement::create([
            'title'      => 'To Delete',
            'body'       => 'Body.',
            'type'       => 'info',
            'is_active'  => true,
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->deleteJson("/api/announcements/{$announcement->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('announcements', ['id' => $announcement->id]);
    }

    public function test_admin_can_list_all_announcements(): void
    {
        Announcement::create(['title' => 'A1', 'body' => 'B1', 'type' => 'info', 'is_active' => true, 'created_by' => $this->admin->id]);
        Announcement::create(['title' => 'A2', 'body' => 'B2', 'type' => 'info', 'is_active' => false, 'created_by' => $this->admin->id]);

        $response = $this->actingAs($this->admin)->getJson('/api/announcements');

        $response->assertOk();
        $this->assertGreaterThanOrEqual(2, count($response->json('data')));
    }
}
