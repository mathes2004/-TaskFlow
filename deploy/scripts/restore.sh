#!/usr/bin/env bash
# Restore an encrypted backup into a database.   Guide 13.7: test this monthly on STAGING.
#
#   restore.sh <backup-file.sql.gz.enc> <target-database>
#
# Refuses to touch a database named exactly like production unless FORCE_PRODUCTION=yes.
# Config from /etc/taskflow/restore.env: RESTORE_USER, RESTORE_PASSWORD (a user allowed to create/drop the
# target DB, e.g. taskflow_migrate or root), BACKUP_PASSPHRASE_FILE, optional PRODUCTION_DB (default: taskflow).
set -euo pipefail
umask 077

file=${1:?usage: restore.sh <backup.sql.gz.enc> <target-database>}
target=${2:?usage: restore.sh <backup.sql.gz.enc> <target-database>}
source "${RESTORE_ENV:-/etc/taskflow/restore.env}"
: "${RESTORE_USER:?}" "${RESTORE_PASSWORD:?}" "${BACKUP_PASSPHRASE_FILE:?}"

[[ "$target" =~ ^[A-Za-z0-9_]+$ ]] || { echo "invalid database name"; exit 1; }
if [ "$target" = "${PRODUCTION_DB:-taskflow}" ] && [ "${FORCE_PRODUCTION:-no}" != "yes" ]; then
  echo "Refusing to overwrite production DB '$target'. Restore into a scratch DB (e.g. taskflow_restore_test)."
  exit 1
fi

cnf=$(mktemp); trap 'rm -f "$cnf"' EXIT
printf '[client]\nuser=%s\npassword=%s\nhost=127.0.0.1\n' "$RESTORE_USER" "$RESTORE_PASSWORD" > "$cnf"

mysql --defaults-extra-file="$cnf" -e "DROP DATABASE IF EXISTS \`$target\`; CREATE DATABASE \`$target\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass "file:$BACKUP_PASSPHRASE_FILE" -in "$file" \
  | gunzip \
  | mysql --defaults-extra-file="$cnf" "$target"

echo "Restored $file into $target"
