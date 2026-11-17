#!/usr/bin/env bash
# Daily encrypted MySQL backup with 14 daily + 8 weekly retention (guide 13.7).
# Cron (as the deploy user):  15 2 * * *  /var/www/taskflow/deploy/scripts/backup.sh >> /var/log/taskflow-backup.log 2>&1
#
# Config comes from /etc/taskflow/backup.env (chmod 600, root/deploy only), e.g.:
#   DB_NAME=taskflow
#   DB_USER=taskflow_backup
#   DB_PASSWORD=...                        # the read-only backup user from deploy/mysql/create-users.sql
#   BACKUP_PASSPHRASE_FILE=/etc/taskflow/backup.key   # chmod 600; keep a copy OFF the server (password manager)
#   BACKUP_DIR=/var/backups/taskflow
#   OFFSITE_RSYNC=backup@storage.example.com:/taskflow   # optional off-server copy (rclone also works)
set -euo pipefail
umask 077

source "${BACKUP_ENV:-/etc/taskflow/backup.env}"
: "${DB_NAME:?}" "${DB_USER:?}" "${DB_PASSWORD:?}" "${BACKUP_PASSPHRASE_FILE:?}" "${BACKUP_DIR:?}"

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly"
stamp=$(date +%Y%m%d-%H%M%S)
out="$BACKUP_DIR/daily/${DB_NAME}-${stamp}.sql.gz.enc"

# Password via a temp option file, never on the command line (visible in `ps`).
cnf=$(mktemp); trap 'rm -f "$cnf"' EXIT
printf '[client]\nuser=%s\npassword=%s\nhost=127.0.0.1\n' "$DB_USER" "$DB_PASSWORD" > "$cnf"

mysqldump --defaults-extra-file="$cnf" --single-transaction --routines --triggers \
          --no-tablespaces "$DB_NAME" \
  | gzip -9 \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass "file:$BACKUP_PASSPHRASE_FILE" -out "$out"

# A backup that can't be read back is not a backup: check the container is non-trivial and decrypts.
[ "$(stat -c %s "$out")" -gt 200 ] || { echo "backup suspiciously small"; rm -f "$out"; exit 1; }
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass "file:$BACKUP_PASSPHRASE_FILE" -in "$out" | gzip -t

# Sunday copy becomes the weekly backup
if [ "$(date +%u)" = "7" ]; then cp "$out" "$BACKUP_DIR/weekly/"; fi

# Retention: 14 daily, 8 weekly
find "$BACKUP_DIR/daily"  -name '*.enc' -mtime +14 -delete
find "$BACKUP_DIR/weekly" -name '*.enc' -mtime +56 -delete

# Off-server copy
if [ -n "${OFFSITE_RSYNC:-}" ]; then rsync -a --delete "$BACKUP_DIR/" "$OFFSITE_RSYNC/"; fi

echo "$(date -Is) backup ok: $out"
