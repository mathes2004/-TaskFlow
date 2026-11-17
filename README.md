# TaskFlow

Personal task manager: React (Vite) SPA + Laravel 11+ REST API (Sanctum cookie auth) + MySQL 8.
Full specification: [TaskFlow_Complete_Build_Guide.md](TaskFlow_Complete_Build_Guide.md).

| Folder | Contents |
| --- | --- |
| `taskflow-api/` | Laravel API |
| `taskflow-web/` | React frontend |
| `database/taskflow_schema.sql` | Reference SQL schema |

## Live demo
https://mathes2004.github.io/-TaskFlow/ is a **demo build**: GitHub Pages only hosts static files, so it runs the frontend against a built-in demo API and keeps data in each visitor's own browser. Log in with `alice@example.com` / `Password123` or register. The real Laravel + MySQL stack is deployed separately (see `deploy/README.md`).
One-time repo setting: **Settings > Pages > Source = GitHub Actions**.

## Requirements
PHP 8.4+ (mbstring, xml, curl, mysql, zip, intl, bcmath), Composer, MySQL 8, Node 22.22+ (24 LTS recommended).

## Local setup

### Backend
```bash
cd taskflow-api
composer install
cp .env.example .env        # then edit the values below
php artisan key:generate
# create an empty MySQL database named "taskflow"
php artisan migrate --seed  # seeds alice@example.com and bob@example.com (local only!)
php artisan serve           # http://localhost:8000
```

Key `.env` values (use `localhost`, never `127.0.0.1`, for the browser-facing URLs):

| Variable | Local value |
| --- | --- |
| `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | your MySQL credentials |
| `FRONTEND_URL` | `http://localhost:5173` (CORS origin) |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost:5173` |
| `SESSION_DRIVER` | `database` |
| `SESSION_DOMAIN` | `localhost` |

### Frontend
```bash
cd taskflow-web
npm install
npm run dev                 # http://localhost:5173
```
`.env.development`: `VITE_API_URL=http://localhost:8000`. Set `VITE_USE_MOCK=true` to run with the in-browser demo API (no backend).

## Tests
```bash
cd taskflow-api && php artisan test   # SQLite in-memory, no MySQL needed
cd taskflow-web && npm run build      # build check
```

## Deployment (summary)
Serve the API and the built frontend (`npm run build` -> `dist/`) from sibling subdomains of one parent domain (e.g. `api.example.com` and `app.example.com`) behind HTTPS.
Production backend `.env`: `APP_ENV=production`, `APP_DEBUG=false`, a unique `APP_KEY`, `SESSION_SECURE_COOKIE=true`, `SESSION_DOMAIN=.example.com`, `SANCTUM_STATEFUL_DOMAINS=app.example.com`, `FRONTEND_URL=https://app.example.com`.
Then: `composer install --no-dev -o && php artisan migrate --force && php artisan config:cache route:cache`.
**Never run the seeder in production.** Details: guide Section 13.

## Security notes
- Never commit `.env` files containing secrets (`taskflow-api/.env` is git-ignored).
- Every task read/update/delete is ownership-checked on the server (`TaskPolicy`, relationship queries).
