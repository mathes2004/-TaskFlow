<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
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
        // Development: fail loudly on mass-assignment, lazy-loading and missing-attribute mistakes.
        Model::shouldBeStrict(! $this->app->isProduction());

        // Password rules: min 8, letters + numbers, and a breach check in production.
        Password::defaults(fn () => $this->app->isProduction()
            ? Password::min(8)->letters()->numbers()->uncompromised()
            : Password::min(8)->letters()->numbers());

        // 5 attempts per minute per email + IP (6th attempt returns 429 with Retry-After).
        RateLimiter::for('login', fn (Request $r) => Limit::perMinute(5)
            ->by(Str::lower((string) $r->input('email')).'|'.$r->ip()));

        // 3 sign-ups per minute per IP.
        RateLimiter::for('register', fn (Request $r) => Limit::perMinute(3)->by($r->ip()));

        // Password change / account deletion: 5 per minute per user.
        RateLimiter::for('sensitive', fn (Request $r) => Limit::perMinute(5)->by($r->user()?->id ?: $r->ip()));

        // Everything else: 60 per minute per user.
        RateLimiter::for('api', fn (Request $r) => Limit::perMinute(60)->by($r->user()?->id ?: $r->ip()));
    }
}
