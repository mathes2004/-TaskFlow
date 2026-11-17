<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $intruder;

    private Task $task;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->create();
        $this->intruder = User::factory()->create();
        $this->task = Task::factory()->for($this->owner)->create(['status' => 'pending']);
    }

    public function test_hides_another_users_task(): void
    {
        $this->actingAs($this->intruder)->getJson("/api/tasks/{$this->task->id}")->assertNotFound();
    }

    public function test_blocks_updating_another_users_task(): void
    {
        $this->actingAs($this->intruder)->patchJson("/api/tasks/{$this->task->id}", ['status' => 'completed'])->assertNotFound();
        $this->actingAs($this->intruder)->putJson("/api/tasks/{$this->task->id}", ['title' => 'x', 'priority' => 'low', 'status' => 'completed'])->assertNotFound();

        $this->assertSame('pending', $this->task->fresh()->status->value);
    }

    public function test_blocks_deleting_another_users_task(): void
    {
        $this->actingAs($this->intruder)->deleteJson("/api/tasks/{$this->task->id}")->assertNotFound();

        $this->assertModelExists($this->task);
    }

    public function test_lists_only_my_own_tasks(): void
    {
        Task::factory()->count(3)->for($this->intruder)->create();

        $this->actingAs($this->owner)->getJson('/api/tasks')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_ignores_user_id_sent_by_the_client(): void
    {
        $this->actingAs($this->intruder)
            ->postJson('/api/tasks', ['title' => 'Hack', 'user_id' => $this->owner->id])->assertCreated();

        $this->assertSame($this->intruder->id, Task::where('title', 'Hack')->first()->user_id);
    }

    public function test_ignores_user_id_on_update(): void
    {
        $this->actingAs($this->owner)
            ->patchJson("/api/tasks/{$this->task->id}", ['title' => 'Mine', 'user_id' => $this->intruder->id])->assertOk();

        $this->assertSame($this->owner->id, $this->task->fresh()->user_id);
    }
}
