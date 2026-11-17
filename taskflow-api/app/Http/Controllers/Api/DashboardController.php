<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();
        $today = $user->today();
        $weekAhead = now($user->timezone)->addDays(7)->toDateString();

        $row = $user->tasks()->toBase()
            ->selectRaw('COUNT(*) AS total')
            ->selectRaw("COALESCE(SUM(status = 'pending'), 0) AS pending")
            ->selectRaw("COALESCE(SUM(status = 'in_progress'), 0) AS in_progress")
            ->selectRaw("COALESCE(SUM(status = 'completed'), 0) AS completed")
            ->selectRaw("COALESCE(SUM(status <> 'completed' AND due_date < ?), 0) AS overdue", [$today])
            ->first();

        return response()->json(['data' => [
            'counts' => array_map('intval', (array) $row),
            'recent' => TaskResource::collection($user->tasks()->latest('updated_at')->limit(5)->get()),
            'upcoming' => TaskResource::collection(
                $user->tasks()->where('status', '!=', 'completed')
                    ->whereBetween('due_date', [$today, $weekAhead])
                    ->orderBy('due_date')->limit(5)->get()
            ),
        ]]);
    }
}
