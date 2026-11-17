<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Task\IndexTaskRequest;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Support\Facades\Gate;

class TaskController extends Controller
{
    public function index(IndexTaskRequest $request)
    {
        $user = $request->user();
        $sort = $request->input('sort', 'created_at');
        $dir = $request->input('direction', 'desc');

        $tasks = $user->tasks() // ownership by design: only this user's rows can be reached
            ->when($request->filled('search'), function ($q) use ($request) {
                // Escape LIKE wildcards so "%" and "_" match literally (works on MySQL and SQLite).
                $term = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $request->input('search'));
                $q->whereRaw("title LIKE ? ESCAPE '!'", ["%{$term}%"]);
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('priority'), fn ($q) => $q->where('priority', $request->input('priority')))
            ->when($request->boolean('overdue'), fn ($q) => $q->overdue($user->today()))
            ->when($sort === 'due_date', fn ($q) => $q->orderByRaw('due_date IS NULL')) // tasks without a date last
            ->orderBy($sort, $dir) // $sort is whitelisted by IndexTaskRequest
            ->orderBy('id', 'desc')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return TaskResource::collection($tasks);
    }

    public function store(StoreTaskRequest $request)
    {
        // user_id comes from the relationship, never from the request body.
        $task = $request->user()->tasks()->create($request->taskData());

        return (new TaskResource($task->refresh()))->response()->setStatusCode(201);
    }

    public function show(Task $task)
    {
        Gate::authorize('view', $task);

        return new TaskResource($task);
    }

    public function update(UpdateTaskRequest $request, Task $task)
    {
        $task->update($request->validated());

        return new TaskResource($task->refresh());
    }

    public function destroy(Task $task)
    {
        Gate::authorize('delete', $task);
        $task->delete();

        return response()->noContent();
    }
}
