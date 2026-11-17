<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/** Guide sections 9 and 12.3: headers, CORS, rate limits, password reset, logging, error output. */
class SecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_responses_carry_security_headers(): void
    {
        $r = $this->getJson('/api/user');
        $r->assertUnauthorized()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('Content-Security-Policy');
        $this->assertStringContainsString("default-src 'none'", $r->headers->get('Content-Security-Policy'));
        $r->assertHeaderMissing('Strict-Transport-Security'); // only sent over HTTPS

        $this->getJson('https://localhost/api/user')
            ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    public function test_cors_allows_only_the_frontend_origin_with_credentials(): void
    {
        $this->withHeaders(['Origin' => 'http://localhost:5173', 'Access-Control-Request-Method' => 'POST'])
            ->options('/api/login')
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');

        $bad = $this->withHeaders(['Origin' => 'https://evil.example', 'Access-Control-Request-Method' => 'POST'])
            ->options('/api/login');
        $this->assertNotSame('https://evil.example', $bad->headers->get('Access-Control-Allow-Origin'));
        $this->assertNotSame('*', $bad->headers->get('Access-Control-Allow-Origin'));
    }

    public function test_sanctum_stateful_api_is_enabled(): void
    {
        $this->assertTrue(config('cors.supports_credentials'));
        $this->assertContains('localhost:5173', config('sanctum.stateful'));
    }

    public function test_unauthenticated_requests_are_rejected_everywhere(): void
    {
        foreach (['/api/user', '/api/dashboard', '/api/tasks'] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }
        $this->postJson('/api/logout')->assertUnauthorized();
    }

    public function test_password_over_72_chars_is_rejected(): void
    {
        $long = str_repeat('a1', 37); // 74 chars
        $this->postJson('/api/register', [
            'name' => 'Long', 'email' => 'long@example.com', 'password' => $long, 'password_confirmation' => $long,
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_login_has_a_per_ip_limit_across_different_emails(): void
    {
        for ($i = 0; $i < 30; $i++) {
            $this->postJson('/api/login', ['email' => "user{$i}@example.com", 'password' => 'Wrong12345'])->assertUnprocessable();
        }
        $this->postJson('/api/login', ['email' => 'another@example.com', 'password' => 'Wrong12345'])->assertTooManyRequests();
    }

    public function test_failed_login_is_logged_without_the_password(): void
    {
        Log::spy();
        $this->postJson('/api/login', ['email' => 'Nobody@Example.com', 'password' => 'SuperSecret123'])->assertUnprocessable();

        Log::shouldHaveReceived('warning')->withArgs(function ($message, $context = []) {
            return $message === 'auth.login_failed'
                && ($context['email'] ?? null) === 'nobody@example.com'
                && ! str_contains(json_encode($context), 'SuperSecret123');
        })->once();
    }

    public function test_throttled_requests_are_logged(): void
    {
        Log::spy();
        for ($i = 0; $i < 11; $i++) {
            $this->postJson('/api/register', ['name' => 'x']);
        }
        Log::shouldHaveReceived('warning')->withArgs(fn ($m) => $m === 'security.throttled')->atLeast()->once();
    }

    public function test_forgot_password_reply_is_identical_for_known_and_unknown_emails(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $known = $this->postJson('/api/forgot-password', ['email' => $user->email]);
        $unknown = $this->postJson('/api/forgot-password', ['email' => 'ghost@example.com']);

        $known->assertOk();
        $unknown->assertOk();
        $this->assertSame($known->json(), $unknown->json());
        Notification::assertSentTo($user, ResetPassword::class);
        Notification::assertCount(1);
    }

    public function test_reset_link_points_at_the_spa_and_token_is_single_use_and_ends_sessions(): void
    {
        Notification::fake();
        $user = User::factory()->create();
        $this->postJson('/api/forgot-password', ['email' => $user->email]);

        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function ($n) use ($user, &$token) {
            $token = $n->token;
            $this->assertStringStartsWith('http://localhost:5173/reset-password?token=', $n->toMail($user)->actionUrl);

            return true;
        });

        DB::table('sessions')->insert(['id' => 'old-session', 'user_id' => $user->id, 'ip_address' => '1.1.1.1',
            'user_agent' => 'x', 'payload' => '', 'last_activity' => time()]);

        $payload = ['token' => $token, 'email' => $user->email, 'password' => 'Brand1New99', 'password_confirmation' => 'Brand1New99'];
        $this->postJson('/api/reset-password', $payload)->assertOk();
        $this->assertTrue(Hash::check('Brand1New99', $user->fresh()->password));
        $this->assertDatabaseMissing('sessions', ['id' => 'old-session']);

        // single use
        $this->postJson('/api/reset-password', $payload)->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_reset_with_bad_token_or_weak_password_fails(): void
    {
        $user = User::factory()->create();
        $this->postJson('/api/reset-password', ['token' => 'nope', 'email' => $user->email,
            'password' => 'Brand1New99', 'password_confirmation' => 'Brand1New99'])->assertUnprocessable();
        $this->postJson('/api/reset-password', ['token' => 'nope', 'email' => $user->email,
            'password' => 'short', 'password_confirmation' => 'short'])
            ->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_password_change_logs_out_other_sessions(): void
    {
        $user = User::factory()->create();
        DB::table('sessions')->insert(['id' => 'other-device', 'user_id' => $user->id, 'ip_address' => '2.2.2.2',
            'user_agent' => 'x', 'payload' => '', 'last_activity' => time()]);

        $this->actingAs($user)->putJson('/api/user/password', [
            'current_password' => 'Password123', 'password' => 'Brand1New99', 'password_confirmation' => 'Brand1New99',
        ])->assertNoContent();

        $this->assertDatabaseMissing('sessions', ['id' => 'other-device']);
    }

    public function test_server_errors_do_not_leak_details(): void
    {
        config(['app.debug' => false]);
        Route::get('/api/boom', fn () => throw new \RuntimeException('SQLSTATE secret'));

        $r = $this->getJson('/api/boom')->assertStatus(500);
        $this->assertSame('Server Error', $r->json('message'));
        $this->assertStringNotContainsString('SQLSTATE', $r->getContent());
        $this->assertArrayNotHasKey('trace', $r->json());
    }

    public function test_task_resource_never_exposes_user_id(): void
    {
        $user = User::factory()->create();
        Task::factory()->for($user)->create();
        $row = $this->actingAs($user)->getJson('/api/tasks')->json('data.0');
        $this->assertArrayNotHasKey('user_id', $row);
    }

    public function test_seeder_refuses_to_run_in_production(): void
    {
        $this->app['env'] = 'production';
        $this->artisan('db:seed', ['--force' => true]);
        $this->assertSame(0, User::count());
    }
}
