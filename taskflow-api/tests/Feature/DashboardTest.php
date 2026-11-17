<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_login(): void
    {
        $this->getJson('/api/dashboard')->assertUnauthorized();
    }

    public function test_empty_dashboard_has_zero_counts(): void
    {
        $this->actingAs(User::factory()->create())->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.counts', ['total' => 0, 'pending' => 0, 'in_progress' => 0, 'completed' => 0, 'overdue' => 0])
            ->assertJsonCount(0, 'data.recent')->assertJsonCount(0, 'data.upcoming');
    }

    public function test_counts_match_only_my_tasks(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $today = $me->today();
        $past = now($me->timezone)->subDays(3)->toDateString();
        $soon = now($me->timezone)->addDays(2)->toDateString();
        $far = now($me->timezone)->addDays(30)->toDateString();

        Task::factory()->for($me)->create(['status' => 'pending', 'due_date' => $past]);      // overdue
        Task::factory()->for($me)->create(['status' => 'in_progress', 'due_date' => $soon]);  // upcoming
        Task::factory()->for($me)->create(['status' => 'pending', 'due_date' => $today]);     // upcoming
        Task::factory()->for($me)->create(['status' => 'pending', 'due_date' => $far]);
        Task::factory()->for($me)->create(['status' => 'completed', 'due_date' => $past]);    // done, not overdue
        Task::factory()->count(5)->for($other)->create(['status' => 'pending', 'due_date' => $past]);

        $this->actingAs($me)->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.counts.total', 5)
            ->assertJsonPath('data.counts.pending', 3)
            ->assertJsonPath('data.counts.in_progress', 1)
            ->assertJsonPath('data.counts.completed', 1)
            ->assertJsonPath('data.counts.overdue', 1)
            ->assertJsonCount(5, 'data.recent')
            ->assertJsonCount(2, 'data.upcoming');
    }
}
