<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_requires_login(): void
    {
        $this->getJson('/api/tasks')->assertUnauthorized();
        $this->postJson('/api/tasks', ['title' => 'x'])->assertUnauthorized();
    }

    public function test_create_with_defaults(): void
    {
        $this->actingAs($this->user)->postJson('/api/tasks', ['title' => '  Practice React  '])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Practice React')
            ->assertJsonPath('data.priority', 'medium')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.due_date', null)
            ->assertJsonPath('data.is_overdue', false);
    }

    public function test_create_with_all_fields(): void
    {
        $due = $this->user->today();

        $this->actingAs($this->user)->postJson('/api/tasks', [
            'title' => 'Ship it', 'description' => "Line 1\nLine 2", 'priority' => 'high', 'status' => 'in_progress', 'due_date' => $due,
        ])->assertCreated()->assertJsonPath('data.priority', 'high')->assertJsonPath('data.due_date', $due);
    }

    public function test_create_validation(): void
    {
        $this->actingAs($this->user);

        $this->postJson('/api/tasks', ['title' => ''])->assertUnprocessable()->assertJsonValidationErrors('title');
        $this->postJson('/api/tasks', ['title' => str_repeat('a', 151)])->assertUnprocessable()->assertJsonValidationErrors('title');
        $this->postJson('/api/tasks', ['title' => 'X', 'priority' => 'urgent'])->assertUnprocessable()->assertJsonValidationErrors('priority');
        $this->postJson('/api/tasks', ['title' => 'X', 'status' => 'done'])->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->postJson('/api/tasks', ['title' => 'X', 'due_date' => now()->subDays(3)->toDateString()])->assertUnprocessable()->assertJsonValidationErrors('due_date');
        $this->postJson('/api/tasks', ['title' => 'X', 'due_date' => '25/11/2026'])->assertUnprocessable()->assertJsonValidationErrors('due_date');
        $this->postJson('/api/tasks', ['title' => 'X', 'description' => str_repeat('a', 5001)])->assertUnprocessable()->assertJsonValidationErrors('description');
    }

    public function test_show_update_and_delete(): void
    {
        $task = Task::factory()->for($this->user)->create(['title' => 'Old', 'status' => 'pending']);
        $this->actingAs($this->user);

        $this->getJson("/api/tasks/{$task->id}")->assertOk()->assertJsonPath('data.title', 'Old');

        $this->putJson("/api/tasks/{$task->id}", ['title' => 'New', 'priority' => 'low', 'status' => 'in_progress', 'description' => null, 'due_date' => null])
            ->assertOk()->assertJsonPath('data.title', 'New')->assertJsonPath('data.priority', 'low');

        $this->putJson("/api/tasks/{$task->id}", ['title' => 'Only title'])
            ->assertUnprocessable()->assertJsonValidationErrors(['priority', 'status']);

        $this->deleteJson("/api/tasks/{$task->id}")->assertNoContent();
        $this->getJson("/api/tasks/{$task->id}")->assertNotFound();
    }

    public function test_patch_status_only_sets_and_clears_completed_at(): void
    {
        $task = Task::factory()->for($this->user)->create(['status' => 'pending']);
        $this->actingAs($this->user);

        $this->patchJson("/api/tasks/{$task->id}", ['status' => 'completed'])
            ->assertOk()->assertJsonPath('data.status', 'completed');
        $this->assertNotNull($task->fresh()->completed_at);

        $this->patchJson("/api/tasks/{$task->id}", ['status' => 'pending'])->assertOk();
        $this->assertNull($task->fresh()->completed_at);
    }

    public function test_overdue_flag(): void
    {
        $yesterday = now($this->user->timezone)->subDay()->toDateString();
        $overdue = Task::factory()->for($this->user)->create(['status' => 'pending', 'due_date' => $yesterday]);
        $done = Task::factory()->for($this->user)->create(['status' => 'completed', 'due_date' => $yesterday]);
        $this->actingAs($this->user);

        $this->getJson("/api/tasks/{$overdue->id}")->assertJsonPath('data.is_overdue', true);
        $this->getJson("/api/tasks/{$done->id}")->assertJsonPath('data.is_overdue', false);
    }

    public function test_list_pagination_filters_search_and_sort(): void
    {
        Task::factory()->for($this->user)->count(20)->create(['status' => 'pending', 'priority' => 'low', 'title' => 'Filler task']);
        Task::factory()->for($this->user)->create(['title' => 'Quarterly report', 'status' => 'completed', 'priority' => 'high']);
        Task::factory()->for($this->user)->create(['title' => '100% done', 'status' => 'pending', 'priority' => 'low']);
        $this->actingAs($this->user);

        $this->getJson('/api/tasks')->assertOk()
            ->assertJsonCount(15, 'data')->assertJsonPath('meta.total', 22)->assertJsonPath('meta.per_page', 15);
        $this->getJson('/api/tasks?page=2')->assertJsonCount(7, 'data');
        $this->getJson('/api/tasks?status=completed')->assertJsonCount(1, 'data');
        $this->getJson('/api/tasks?priority=high')->assertJsonCount(1, 'data');
        $this->getJson('/api/tasks?search=quarterly')->assertJsonCount(1, 'data');
        $this->getJson('/api/tasks?search='.urlencode('%'))->assertJsonCount(1, 'data'); // literal %, not a wildcard
        $this->getJson('/api/tasks?sort=title&direction=asc&per_page=2')->assertJsonPath('data.0.title', '100% done');
    }

    public function test_list_rejects_unsafe_query_values(): void
    {
        $this->actingAs($this->user);

        $this->getJson('/api/tasks?sort=password')->assertUnprocessable()->assertJsonValidationErrors('sort');
        $this->getJson('/api/tasks?per_page=1000')->assertUnprocessable()->assertJsonValidationErrors('per_page');
        $this->getJson('/api/tasks?status=bogus')->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    public function test_html_in_title_is_stored_verbatim_and_returned_as_json_text(): void
    {
        $this->actingAs($this->user)->postJson('/api/tasks', ['title' => '<script>alert(1)</script>'])
            ->assertCreated()->assertJsonPath('data.title', '<script>alert(1)</script>');
    }
}
