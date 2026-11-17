<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    /** Always the same reply, so the endpoint cannot be used to discover which emails have accounts. */
    public function forgot(ForgotPasswordRequest $request)
    {
        Password::sendResetLink(['email' => Str::lower($request->validated('email'))]);

        return response()->json(['message' => 'If that email exists, a link has been sent.']);
    }

    /** Tokens are single-use and expire after config('auth.passwords.users.expire') minutes (60). */
    public function reset(ResetPasswordRequest $request)
    {
        $status = Password::reset(
            [...$request->safe()->only(['email', 'password', 'token']), 'password_confirmation' => $request->input('password_confirmation'),
                'email' => Str::lower($request->validated('email'))],
            function ($user, string $password) {
                $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
                // A reset means the old password may be compromised: end every existing session.
                DB::table('sessions')->where('user_id', $user->id)->delete();
                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }

        return response()->json(['message' => 'Your password has been reset.']);
    }
}
