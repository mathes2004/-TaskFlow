<?php

namespace App\Providers;

use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Dev only: throw on mass-assignment / lazy-loading mistakes.
        Model::shouldBeStrict(! $this->app->isProduction());

        // max(72): bcrypt ignores everything after 72 bytes. uncompromised() = Have I Been Pwned (k-anonymity).
        Password::defaults(function () {
            $rule = Password::min(8)->letters()->numbers()->max(72);

            return $this->app->isProduction() ? $rule->uncompromised() : $rule;
        });

        RateLimiter::for('login', function (Request $r) {
            return [
                Limit::perMinute(5)->by(Str::lower((string) $r->input('email')).'|'.$r->ip()), // per account + IP
                Limit::perMinute(30)->by($r->ip()),                                               // credential stuffing
            ];
        });
        RateLimiter::for('register', fn (Request $r) => Limit::perMinute(3)->by($r->ip()));
        RateLimiter::for('password-reset', fn (Request $r) => [
            Limit::perMinute(3)->by(Str::lower((string) $r->input('email')).'|'.$r->ip()),
            Limit::perMinute(10)->by($r->ip()),
        ]);
        RateLimiter::for('sensitive', fn (Request $r) => Limit::perMinute(5)->by($r->user()?->id ?: $r->ip()));
        RateLimiter::for('api', fn (Request $r) => Limit::perMinute(60)->by($r->user()?->id ?: $r->ip()));

        // Reset links open the SPA, not an API route.
        ResetPassword::createUrlUsing(fn ($user, string $token) => rtrim((string) config('app.frontend_url'), '/')
            .'/reset-password?token='.$token.'&email='.urlencode($user->getEmailForPasswordReset()));

        // Security logging (guide 9.10): failed logins with email + IP. Never the password.
        Event::listen(Failed::class, function (Failed $event) {
            Log::warning('auth.login_failed', [
                'email' => Str::lower((string) ($event->credentials['email'] ?? '')),
                'ip' => request()->ip(),
            ]);
        });
    }
}
