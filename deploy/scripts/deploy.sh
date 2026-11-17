#!/usr/bin/env bash
# Run ON THE SERVER (piped over SSH by the deploy workflow). Guide section 13.5.
# API_DIR is the taskflow-api folder inside a git clone of this repo (e.g. /var/www/taskflow/taskflow-api).
# Required env: API_DIR (e.g. /var/www/taskflow-api), BRANCH (main|staging)
set -euo pipefail

: "${API_DIR:?API_DIR is required}"
: "${BRANCH:?BRANCH is required}"

cd "$API_DIR"

# Never deploy with a debug or non-production env on the production branch.
if [ "$BRANCH" = "main" ]; then
  grep -q '^APP_ENV=production' .env || { echo "APP_ENV must be production"; exit 1; }
  grep -q '^APP_DEBUG=false'    .env || { echo "APP_DEBUG must be false";    exit 1; }
fi

php artisan down --retry=60 || true
trap 'php artisan up' EXIT        # always bring the site back, even if a step fails

git fetch --prune origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force           # NEVER db:seed in production
php artisan config:cache
php artisan route:cache
php artisan event:cache

# Only storage/ and bootstrap/cache/ need to be writable by the web server.
chmod -R u+rwX,g+rwX storage bootstrap/cache

echo "Deployed $BRANCH"
