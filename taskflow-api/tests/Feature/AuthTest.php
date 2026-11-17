<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function validRegistration(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Secret123',
            'password_confirmation' => 'Secret123',
        ], $overrides);
    }

    public function test_register_logs_the_user_in(): void
    {
        $this->postJson('/api/register', $this->validRegistration())
            ->assertCreated()
            ->assertJsonPath('data.email', 'test@example.com')
            ->assertJsonMissingPath('data.password');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
    }

    public function test_password_is_stored_hashed(): void
    {
        $this->postJson('/api/register', $this->validRegistration())->assertCreated();

        $this->assertNotSame('Secret123', User::first()->password);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'test@example.com']);

        $this->postJson('/api/register', $this->validRegistration())
            ->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_register_rejects_weak_password(): void
    {
        $this->postJson('/api/register', $this->validRegistration(['password' => 'password', 'password_confirmation' => 'password']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_register_requires_matching_confirmation(): void
    {
        $this->postJson('/api/register', $this->validRegistration(['password_confirmation' => 'Different123']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_login_with_valid_credentials(): void
    {
        User::factory()->create(['email' => 'alice@example.com']);

        $this->postJson('/api/login', ['email' => 'ALICE@example.com', 'password' => 'Password123'])
            ->assertOk()->assertJsonPath('data.email', 'alice@example.com');
        $this->assertAuthenticated();
    }

    public function test_wrong_password_and_unknown_email_give_the_same_message(): void
    {
        User::factory()->create(['email' => 'alice@example.com']);

        $wrongPassword = $this->postJson('/api/login', ['email' => 'alice@example.com', 'password' => 'Nope12345'])
            ->assertUnprocessable()->json('errors.email.0');
        $unknownEmail = $this->postJson('/api/login', ['email' => 'ghost@example.com', 'password' => 'Nope12345'])
            ->assertUnprocessable()->json('errors.email.0');

        $this->assertSame($wrongPassword, $unknownEmail);
    }

    public function test_login_is_rate_limited_after_five_attempts(): void
    {
        $payload = ['email' => 'alice@example.com', 'password' => 'Wrong12345'];

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', $payload)->assertUnprocessable();
        }
        $this->postJson('/api/login', $payload)->assertTooManyRequests()->assertHeader('Retry-After');
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_me_returns_the_current_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/user')
            ->assertOk()->assertJsonPath('data.id', $user->id);
    }

    public function test_logout(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/api/logout')->assertNoContent();
        $this->assertGuest('web');
    }

    public function test_update_profile_and_unique_email(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);
        $user = User::factory()->create();

        $this->actingAs($user)->patchJson('/api/user', ['name' => 'New Name', 'timezone' => 'Europe/London'])
            ->assertOk()->assertJsonPath('data.name', 'New Name')->assertJsonPath('data.timezone', 'Europe/London');

        $this->actingAs($user)->patchJson('/api/user', ['email' => 'taken@example.com'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->actingAs($user)->patchJson('/api/user', ['timezone' => 'Mars/Base'])
            ->assertUnprocessable()->assertJsonValidationErrors('timezone');
    }

    public function test_change_password_requires_current_password(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->putJson('/api/user/password', [
            'current_password' => 'WrongOne123', 'password' => 'Brand1New99', 'password_confirmation' => 'Brand1New99',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $this->actingAs($user)->putJson('/api/user/password', [
            'current_password' => 'Password123', 'password' => 'Brand1New99', 'password_confirmation' => 'Brand1New99',
        ])->assertNoContent();

        $this->assertTrue(\Hash::check('Brand1New99', $user->fresh()->password));
    }

    public function test_delete_account_removes_the_user_and_tasks(): void
    {
        $user = User::factory()->hasTasks(3)->create();

        $this->actingAs($user)->deleteJson('/api/user', ['password' => 'bad'])->assertUnprocessable();
        $this->actingAs($user)->deleteJson('/api/user', ['password' => 'Password123'])->assertNoContent();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseCount('tasks', 0);
    }
}
