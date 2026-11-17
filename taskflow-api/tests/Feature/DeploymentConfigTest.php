<?php

namespace Tests\Feature;

use Tests\TestCase;

/** Guards the deployment templates (guide 9.3, 9.9, 13.4, 15.1) so a careless edit fails CI. */
class DeploymentConfigTest extends TestCase
{
    private function env(string $file): array
    {
        $out = [];
        foreach (file(base_path($file), FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            if (str_starts_with(trim($line), '#') || ! str_contains($line, '=')) {
                continue;
            }
            [$k, $v] = explode('=', $line, 2);
            $out[trim($k)] = trim($v);
        }

        return $out;
    }

    public function test_production_template_is_locked_down(): void
    {
        $e = $this->env('.env.production.example');

        $this->assertSame('production', $e['APP_ENV']);
        $this->assertSame('false', $e['APP_DEBUG']);
        $this->assertSame('', $e['APP_KEY'], 'APP_KEY must be generated on the server, never committed');
        $this->assertStringStartsWith('https://', $e['APP_URL']);
        $this->assertStringStartsWith('https://', $e['FRONTEND_URL']);
        $this->assertSame('true', $e['SESSION_SECURE_COOKIE']);
        $this->assertSame('true', $e['SESSION_ENCRYPT']);
        $this->assertSame('lax', $e['SESSION_SAME_SITE']);
        $this->assertSame('database', $e['SESSION_DRIVER']);
        $this->assertStringStartsWith('.', $e['SESSION_DOMAIN']);
        $this->assertSame('daily', $e['LOG_CHANNEL']);
        $this->assertSame('warning', $e['LOG_LEVEL']);
        $this->assertNotSame('root', $e['DB_USERNAME']);
        $this->assertSame('taskflow_app', $e['DB_USERNAME']);
        $this->assertNotSame('*', $e['TRUSTED_PROXIES']);
        $this->assertStringNotContainsString('localhost', $e['FRONTEND_URL']);
    }

    public function test_staging_template_is_isolated_from_production(): void
    {
        $prod = $this->env('.env.production.example');
        $stage = $this->env('.env.staging.example');

        $this->assertSame('false', $stage['APP_DEBUG']);
        $this->assertSame('', $stage['APP_KEY']);
        $this->assertNotSame($prod['DB_DATABASE'], $stage['DB_DATABASE']);
        $this->assertNotSame($prod['SESSION_COOKIE'], $stage['SESSION_COOKIE']);
        $this->assertNotSame($prod['SESSION_DOMAIN'], $stage['SESSION_DOMAIN']);
        $this->assertSame('log', $stage['MAIL_MAILER'], 'staging must not email real users');
    }

    public function test_example_env_has_no_secrets(): void
    {
        $e = $this->env('.env.example');
        $this->assertSame('', $e['APP_KEY']);
        $this->assertSame('', $e['DB_PASSWORD']);
    }

    public function test_least_privilege_sql_never_grants_all_or_global_privileges(): void
    {
        $sql = file_get_contents(base_path('../deploy/mysql/create-users.sql'));
        $statements = array_filter(explode("\n", $sql), fn ($l) => str_starts_with(trim($l), 'GRANT'));

        $this->assertNotEmpty($statements);
        foreach ($statements as $grant) {
            $this->assertStringNotContainsString('ALL PRIVILEGES', $grant);
            $this->assertStringNotContainsString('*.*', $grant);
            $this->assertStringNotContainsString('GRANT OPTION', $grant);
            $this->assertStringContainsString('taskflow.*', $grant);
        }
        $app = collect($statements)->first(fn ($g) => str_contains($g, "'taskflow_app'"));
        $this->assertSame(
            "GRANT SELECT, INSERT, UPDATE, DELETE ON taskflow.* TO 'taskflow_app'@'127.0.0.1';",
            trim($app),
        );
    }

    public function test_nginx_config_has_https_hsts_and_csp(): void
    {
        $conf = file_get_contents(base_path('../deploy/nginx/taskflow.conf'));

        $this->assertStringContainsString('return 301 https://$host$request_uri', $conf);
        $this->assertStringContainsString('Strict-Transport-Security', $conf);
        $this->assertStringContainsString("script-src 'self'", $conf);
        $this->assertStringNotContainsString("'unsafe-inline'", $conf);
        $this->assertStringNotContainsString("'unsafe-eval'", $conf);
        $this->assertStringContainsString('server_tokens off', $conf);
        $this->assertStringContainsString('TLSv1.2 TLSv1.3', $conf);
        $this->assertStringContainsString('location ~ /\.(?!well-known) { deny all; }', $conf);
        $this->assertStringContainsString('root /var/www/taskflow/taskflow-api/public', $conf);
    }

    public function test_ci_runs_tests_and_dependency_audits(): void
    {
        $ci = file_get_contents(base_path('../.github/workflows/ci.yml'));
        foreach (['php artisan test', 'composer audit', 'npm audit', 'npm run lint', 'npm run build'] as $step) {
            $this->assertStringContainsString($step, $ci);
        }
        $this->assertFileExists(base_path('../.github/dependabot.yml'));
    }
}
