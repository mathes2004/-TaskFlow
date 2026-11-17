<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TaskPolicy
{
    private function owns(User $user, Task $task): Response
    {
        return $user->id === $task->user_id
            ? Response::allow()
            : Response::denyAsNotFound(); // 404, not 403: do not reveal that the task exists
    }

    public function view(User $user, Task $task): Response
    {
        return $this->owns($user, $task);
    }

    public function update(User $user, Task $task): Response
    {
        return $this->owns($user, $task);
    }

    public function delete(User $user, Task $task): Response
    {
        return $this->owns($user, $task);
    }
}
