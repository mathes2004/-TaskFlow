<?php

namespace App\Http\Requests\Task;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // ownership is guaranteed by $request->user()->tasks()
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['title' => trim((string) $this->input('title'))]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:1', 'max:150'],
            'description' => ['nullable', 'string', 'max:5000'],
            'priority' => ['sometimes', 'nullable', Rule::enum(TaskPriority::class)],
            'status' => ['sometimes', 'nullable', Rule::enum(TaskStatus::class)],
            'due_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:'.$this->user()->today()],
        ];
    }

    /** Null priority/status fall back to the database defaults. */
    public function taskData(): array
    {
        return array_filter($this->validated(), fn ($v, $k) => ! in_array($k, ['priority', 'status'], true) || $v !== null, ARRAY_FILTER_USE_BOTH);
    }
}
