<?php

namespace Tests\Feature;

use App\Models\KbArticle;
use App\Models\KbCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KnowledgeBaseTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $user;
    private KbCategory $kbCategory;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin      = User::factory()->create(['role' => 'admin']);
        $this->user       = User::factory()->create(['role' => 'user']);
        $this->kbCategory = KbCategory::create(['name' => 'General', 'description' => 'General articles']);
    }

    public function test_user_can_list_published_public_articles(): void
    {
        KbArticle::create([
            'title'        => 'How to reset password',
            'body'         => 'Go to login page and click forgot password.',
            'is_published' => true,
            'is_internal'  => false,
            'category_id'  => $this->kbCategory->id,
            'author_id'    => $this->admin->id,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/kb/articles');

        $response->assertOk();
        $this->assertGreaterThanOrEqual(1, $response->json('data.total'));
    }

    public function test_admin_can_create_kb_article(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/kb/articles', [
            'title'        => 'VPN Setup Guide',
            'body'         => 'Download the VPN client and follow the wizard.',
            'is_published' => true,
            'is_internal'  => false,
            'category_id'  => $this->kbCategory->id,
        ]);

        $response->assertStatus(201)->assertJsonPath('success', true);
        $this->assertDatabaseHas('kb_articles', ['title' => 'VPN Setup Guide']);
    }

    public function test_user_cannot_create_kb_article(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/kb/articles', [
            'title'        => 'Spam Article',
            'body'         => 'Some content.',
            'is_published' => true,
            'is_internal'  => false,
            'category_id'  => $this->kbCategory->id,
        ]);

        $response->assertStatus(403);
    }

    public function test_user_cannot_see_internal_articles(): void
    {
        KbArticle::create([
            'title'        => 'Internal Runbook',
            'body'         => 'Secret staff procedures.',
            'is_published' => true,
            'is_internal'  => true,
            'category_id'  => $this->kbCategory->id,
            'author_id'    => $this->admin->id,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/kb/articles');

        $titles = collect($response->json('data.data'))->pluck('title');
        $this->assertNotContains('Internal Runbook', $titles);
    }

    public function test_article_view_count_increments_on_show(): void
    {
        $article = KbArticle::create([
            'title'        => 'Trackable Article',
            'body'         => 'Content here.',
            'is_published' => true,
            'is_internal'  => false,
            'category_id'  => $this->kbCategory->id,
            'author_id'    => $this->admin->id,
        ]);

        $this->actingAs($this->user)->getJson("/api/kb/articles/{$article->id}");

        $this->assertEquals(1, $article->fresh()->view_count);
    }
}
