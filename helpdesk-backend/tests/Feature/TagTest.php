<?php

namespace Tests\Feature;

use App\Models\Tag;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TagTest extends TestCase
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

    public function test_admin_can_create_tag(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/tags', [
            'name'  => 'urgent',
            'color' => '#FF0000',
        ]);

        $response->assertStatus(201)->assertJsonPath('success', true);
        $this->assertDatabaseHas('tags', ['name' => 'urgent']);
    }

    public function test_user_cannot_create_tag(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tags', [
            'name' => 'spam-tag',
        ]);

        $response->assertStatus(403);
    }

    public function test_anyone_can_list_tags(): void
    {
        Tag::create(['name' => 'billing', 'color' => '#0000FF']);

        $response = $this->actingAs($this->user)->getJson('/api/tags');

        $response->assertOk()->assertJsonPath('success', true);
    }

    public function test_admin_can_update_tag(): void
    {
        $tag = Tag::create(['name' => 'old-tag', 'color' => '#AAAAAA']);

        $response = $this->actingAs($this->admin)->putJson("/api/tags/{$tag->id}", [
            'name'  => 'new-tag',
            'color' => '#BBBBBB',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('tags', ['name' => 'new-tag']);
    }

    public function test_admin_can_delete_tag(): void
    {
        $tag = Tag::create(['name' => 'to-delete', 'color' => '#CCCCCC']);

        $response = $this->actingAs($this->admin)->deleteJson("/api/tags/{$tag->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('tags', ['id' => $tag->id]);
    }

    public function test_admin_can_sync_tags_on_ticket(): void
    {
        $tag1   = Tag::create(['name' => 'bug',     'color' => '#FF0000']);
        $tag2   = Tag::create(['name' => 'network', 'color' => '#00FF00']);
        $ticket = Ticket::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->admin)->putJson("/api/tickets/{$ticket->id}/tags", [
            'tag_ids' => [$tag1->id, $tag2->id],
        ]);

        $response->assertOk();
        $this->assertCount(2, $ticket->fresh()->tags);
    }

    public function test_tag_color_must_be_valid_hex(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/tags', [
            'name'  => 'bad-color',
            'color' => 'not-a-color',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['color']);
    }
}
