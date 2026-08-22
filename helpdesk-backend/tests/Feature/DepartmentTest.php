<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartmentTest extends TestCase
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

    public function test_admin_can_create_department(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/departments', [
            'name'        => 'IT Support',
            'description' => 'Handles all IT issues',
        ]);

        $response->assertStatus(201)->assertJsonPath('success', true);
        $this->assertDatabaseHas('departments', ['name' => 'IT Support']);
    }

    public function test_user_cannot_create_department(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/departments', [
            'name' => 'Hacked Dept',
        ]);

        $response->assertStatus(403);
    }

    public function test_anyone_authenticated_can_list_departments(): void
    {
        Department::create(['name' => 'HR', 'description' => 'Human Resources']);

        $response = $this->actingAs($this->user)->getJson('/api/departments');

        $response->assertOk()->assertJsonPath('success', true);
    }

    public function test_admin_can_update_department(): void
    {
        $dept = Department::create(['name' => 'Old Name', 'description' => 'desc']);

        $response = $this->actingAs($this->admin)->putJson("/api/departments/{$dept->id}", [
            'name'        => 'New Name',
            'description' => 'Updated desc',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('departments', ['name' => 'New Name']);
    }

    public function test_department_cannot_be_its_own_parent(): void
    {
        $dept = Department::create(['name' => 'Finance', 'description' => 'Finance dept']);

        $response = $this->actingAs($this->admin)->putJson("/api/departments/{$dept->id}", [
            'name'      => 'Finance',
            'parent_id' => $dept->id,
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_can_delete_empty_department(): void
    {
        $dept = Department::create(['name' => 'ToDelete', 'description' => 'temp']);

        $response = $this->actingAs($this->admin)->deleteJson("/api/departments/{$dept->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('departments', ['id' => $dept->id]);
    }

    public function test_cannot_delete_department_with_users(): void
    {
        $dept = Department::create(['name' => 'Busy Dept', 'description' => 'has users']);
        User::factory()->create(['department_id' => $dept->id]);

        $response = $this->actingAs($this->admin)->deleteJson("/api/departments/{$dept->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('departments', ['id' => $dept->id]);
    }

    public function test_admin_can_view_department_detail(): void
    {
        $dept = Department::create(['name' => 'Engineering', 'description' => 'Eng dept']);

        $response = $this->actingAs($this->admin)->getJson("/api/departments/{$dept->id}");

        $response->assertOk()->assertJsonPath('data.name', 'Engineering');
    }
}
