# TaskFlow deployment runbook

Everything here implements guide sections 9, 13 and 15. Replace `taskflow.com` with your domain throughout.

| File | Purpose |
| --- | --- |
| `../.github/workflows/ci.yml` | Tests (SQLite + MySQL 8), `composer audit`, lint, vitest, `npm audit`, build, "no committed secrets" check |
| `../.github/workflows/deploy.yml` | `staging` branch -> staging, `main` -> production (after tests) |
| `../.github/dependabot.yml` | Weekly composer / npm updates, monthly Actions updates |
| `nginx/taskflow.conf`, `nginx/taskflow-headers.conf` | HTTPS, HSTS, frontend CSP, rate limits, dotfile blocking |
| `mysql/create-users.sql` | Least-privilege `taskflow_app`, `taskflow_migrate`, `taskflow_backup` users |
| `../taskflow-api/.env.production.example`, `.env.staging.example` | Server `.env` templates |
| `scripts/deploy.sh` | Server-side deploy (down, pull, composer, migrate, cache, up) |
| `scripts/backup.sh`, `restore.sh`, `verify-restore.sh` | Encrypted daily backup, restore, monthly restore drill |

## One-time server setup (Ubuntu LTS)
1. Non-root `deploy` user, SSH keys only (`PasswordAuthentication no`, `PermitRootLogin no`).
2. `ufw default deny incoming; ufw allow 22,80,443/tcp; ufw enable`. **MySQL: `bind-address = 127.0.0.1`; never open 3306.**
3. Install Nginx, PHP-FPM 8.4+ (mbstring xml curl mysql zip intl bcmath), Composer, MySQL 8, `unattended-upgrades`.
4. `mysql < deploy/mysql/create-users.sql` after replacing the three passwords. Verify with `SHOW GRANTS FOR 'taskflow_app'@'127.0.0.1';`.
5. DNS `app.` and `api.` -> server. `certbot --nginx -d app.taskflow.com -d api.taskflow.com`. Copy `nginx/taskflow.conf` to `sites-available`, `nginx/taskflow-headers.conf` to `/etc/nginx/snippets/`, then `nginx -t && systemctl reload nginx`.
6. Clone the repo to `/var/www/taskflow`; copy `.env.production.example` to `taskflow-api/.env`, fill in values, run `php artisan key:generate`. **Do not run `db:seed`** (the seeder also refuses in production).
7. Only `storage/` and `bootstrap/cache/` writable by the web user; the Nginx root is `taskflow-api/public` only.
8. Backups: create `/etc/taskflow/backup.env` and `restore.env` (chmod 600), a passphrase file (`openssl rand -base64 32 > /etc/taskflow/backup.key`, chmod 600) **and store a copy off the server**. Add the cron lines shown at the top of `backup.sh` and `verify-restore.sh` (staging).

## GitHub setup
Create environments `staging` and `production` (add required reviewers to `production`). For each set
secrets `SSH_KEY` (deploy key, no passphrase, restricted to this server) and `SSH_KNOWN_HOSTS` (output of `ssh-keyscan -H host`), and variables `DEPLOY_HOST`, `DEPLOY_USER`, `API_DIR` (e.g. `/var/www/taskflow/taskflow-api`), `WEB_DIR` (e.g. `/var/www/taskflow-web`), `VITE_API_URL`.
Set the repository variable `DEPLOY_ENABLED=true` only once the server is ready; until then the deploy job is skipped (tests still run).
Enable branch protection on `main` requiring the CI checks. Enable Dependabot alerts and secret scanning.

## Before launch (guide 15.1)
- [ ] `APP_DEBUG=false`, `APP_ENV=production`, unique `APP_KEY`; `curl -I https://api.../api/user` shows HSTS, nosniff, X-Frame-Options, CSP
- [ ] `curl -I https://app...` shows the frontend CSP and HSTS
- [ ] HTTP redirects to HTTPS on both hosts
- [ ] No demo users: `php artisan tinker --execute="echo App\Models\User::where('email','like','%@example.com')->count();"` prints 0
- [ ] `nmap -p 3306 <server>` from outside shows closed
- [ ] `composer audit` and `npm audit` clean; `git log --all -- '*.env'` shows no real secrets (rotate any key that ever was committed)
- [ ] One restore drill completed (`scripts/verify-restore.sh`)
- [ ] Uptime monitor on `https://api.taskflow.com/up`
