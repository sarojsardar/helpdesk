<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_category(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->postJson('/api/categories', [
            'name'        => 'Hardware',
            'description' => 'Hardware related issues',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('categories', ['name' => 'Hardware']);
    }

    public function test_user_cannot_create_category(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user)->postJson('/api/categories', [
            'name' => 'Hacked Category',
        ]);

        $response->assertStatus(403);
    }

    public function test_authenticated_user_can_list_categories(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        Category::create(['name' => 'Software', 'description' => 'Software issues']);

        $response = $this->actingAs($user)->getJson('/api/categories');

        $response->assertOk()->assertJsonPath('success', true);
    }

    public function test_admin_can_delete_category(): void
    {
        $admin    = User::factory()->create(['role' => 'admin']);
        $category = Category::create(['name' => 'ToDelete', 'description' => 'temp']);

        $response = $this->actingAs($admin)->deleteJson("/api/categories/{$category->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }
}
