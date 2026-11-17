<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdatePasswordRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request)
    {
        $request->user()->update($request->validated());

        return new UserResource($request->user()->refresh());
    }

    public function password(UpdatePasswordRequest $request)
    {
        $user = $request->user();
        $user->update(['password' => $request->validated('password')]);

        // Sign out every other session of this user (sessions are stored in the database).
        DB::table('sessions')->where('user_id', $user->id)
            ->where('id', '!=', $request->session()->getId())->delete();
        $request->session()->regenerate();

        return response()->noContent();
    }

    public function destroy(Request $request)
    {
        $request->validate(['password' => ['required', 'current_password']]);

        $user = $request->user();
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $user->delete(); // tasks are removed by the ON DELETE CASCADE foreign key

        return response()->noContent();
    }
}
