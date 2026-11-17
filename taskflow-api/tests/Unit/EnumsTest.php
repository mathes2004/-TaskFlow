<?php

namespace Tests\Unit;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use PHPUnit\Framework\TestCase;

class EnumsTest extends TestCase
{
    public function test_status_values_match_the_database_enum(): void
    {
        $this->assertSame(['pending', 'in_progress', 'completed'], array_map(fn ($c) => $c->value, TaskStatus::cases()));
    }

    public function test_priority_values_match_the_database_enum(): void
    {
        $this->assertSame(['low', 'medium', 'high'], array_map(fn ($c) => $c->value, TaskPriority::cases()));
    }
}
