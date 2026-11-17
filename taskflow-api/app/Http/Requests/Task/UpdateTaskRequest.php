<?php

namespace App\Http\Requests\Task;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Ownership first: another user's task is a 404 before any validation runs.
        Gate::authorize('update', $this->route('task'));

        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('title')) {
            $this->merge(['title' => trim((string) $this->input('title'))]);
        }
    }

    /** PUT = full update (title, priority, status required); PATCH = partial. */
    public function rules(): array
    {
        $required = $this->isMethod('put') ? 'required' : 'sometimes';

        return [
            'title' => [$required, 'string', 'min:1', 'max:150'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'priority' => [$required, Rule::enum(TaskPriority::class)],
            'status' => [$required, Rule::enum(TaskStatus::class)],
            'due_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
        ];
    }
}
