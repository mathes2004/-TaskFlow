<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Two demo users with 30 tasks each, so you can prove User A never sees User B's tasks.
     * Demo password: Password123. NEVER run this in production.
     */
    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command?->error('Refusing to seed demo users in production.');

            return;
        }

        User::factory()->has(Task::factory()->count(30))
            ->create(['name' => 'Alice Johnson', 'email' => 'alice@example.com']);
        User::factory()->has(Task::factory()->count(30))
            ->create(['name' => 'Bob Smith', 'email' => 'bob@example.com']);
    }
}
