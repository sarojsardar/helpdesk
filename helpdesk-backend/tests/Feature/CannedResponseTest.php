<?php

namespace Tests\Feature;

use App\Models\CannedResponse;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CannedResponseTest extends TestCase
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

    public function test_admin_can_create_canned_response(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/canned-responses', [
            'title' => 'Thank you for contacting us',
            'body'  => 'We will respond within 4 hours.',
        ]);

        $response->assertStatus(201)->assertJsonPath('success', true);
        $this->assertDatabaseHas('canned_responses', ['title' => 'Thank you for contacting us']);
    }

    public function test_user_cannot_create_canned_response(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/canned-responses', [
            'title' => 'Spam',
            'body'  => 'Spam body',
        ]);

        $response->assertStatus(403);
    }

    public function test_staff_can_list_canned_responses(): void
    {
        CannedResponse::create(['title' => 'Quick Reply', 'body' => 'We are on it.', 'created_by' => $this->admin->id]);

        $response = $this->actingAs($this->staff)->getJson('/api/canned-responses');

        $response->assertOk()->assertJsonPath('success', true);
        $this->assertGreaterThanOrEqual(1, count($response->json('data')));
    }

    public function test_admin_can_update_canned_response(): void
    {
        $canned = CannedResponse::create(['title' => 'Old Title', 'body' => 'Old body.', 'created_by' => $this->admin->id]);

        $response = $this->actingAs($this->admin)->putJson("/api/canned-responses/{$canned->id}", [
            'title' => 'New Title',
            'body'  => 'New body.',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('canned_responses', ['title' => 'New Title']);
    }

    public function test_admin_can_delete_canned_response(): void
    {
        $canned = CannedResponse::create(['title' => 'To Delete', 'body' => 'Body.', 'created_by' => $this->admin->id]);

        $response = $this->actingAs($this->admin)->deleteJson("/api/canned-responses/{$canned->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('canned_responses', ['id' => $canned->id]);
    }

    public function test_canned_response_requires_title_and_body(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/canned-responses', []);

        $response->assertStatus(422)->assertJsonValidationErrors(['title', 'body']);
    }
}
