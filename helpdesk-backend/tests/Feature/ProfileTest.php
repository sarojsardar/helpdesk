<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_profile(): void
    {
        $user = User::factory()->create(['name' => 'Old Name', 'email' => 'old@example.com']);

        $response = $this->actingAs($user)->putJson('/api/profile', [
            'name'  => 'New Name',
            'email' => 'new@example.com',
        ]);

        $response->assertOk()->assertJsonPath('success', true);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'New Name', 'email' => 'new@example.com']);
    }

    public function test_profile_update_requires_name_and_email(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->putJson('/api/profile', []);

        $response->assertStatus(422)->assertJsonValidationErrors(['name', 'email']);
    }

    public function test_user_can_change_password_with_correct_current_password(): void
    {
        $user = User::factory()->create(['password' => bcrypt('oldpassword')]);

        $response = $this->actingAs($user)->putJson('/api/profile/password', [
            'current_password'      => 'oldpassword',
            'password'              => 'newpassword',
            'password_confirmation' => 'newpassword',
        ]);

        $response->assertOk()->assertJsonPath('success', true);
    }

    public function test_password_change_fails_with_wrong_current_password(): void
    {
        $user = User::factory()->create(['password' => bcrypt('correctpassword')]);

        $response = $this->actingAs($user)->putJson('/api/profile/password', [
            'current_password'      => 'wrongpassword',
            'password'              => 'newpassword',
            'password_confirmation' => 'newpassword',
        ]);

        $response->assertStatus(422);
    }

    public function test_new_password_must_be_confirmed(): void
    {
        $user = User::factory()->create(['password' => bcrypt('oldpassword')]);

        $response = $this->actingAs($user)->putJson('/api/profile/password', [
            'current_password'      => 'oldpassword',
            'password'              => 'newpassword',
            'password_confirmation' => 'mismatch',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['password']);
    }

    public function test_email_must_be_unique_on_profile_update(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);
        $user2 = User::factory()->create();

        $response = $this->actingAs($user2)->putJson('/api/profile', [
            'name'  => 'User Two',
            'email' => 'taken@example.com',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['email']);
    }
}
