#!/usr/bin/env bash
# Monthly restore drill (guide 13.7): restore the newest backup into a scratch DB and sanity-check it.
# Cron on STAGING:  0 4 1 * *  /var/www/taskflow/deploy/scripts/verify-restore.sh
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
source "${RESTORE_ENV:-/etc/taskflow/restore.env}"
source "${BACKUP_ENV:-/etc/taskflow/backup.env}"

scratch=taskflow_restore_test
latest=$(ls -1t "$BACKUP_DIR"/daily/*.enc | head -n1)
[ -n "$latest" ] || { echo "no backups found"; exit 1; }

"$here/restore.sh" "$latest" "$scratch"

cnf=$(mktemp); trap 'rm -f "$cnf"' EXIT
printf '[client]\nuser=%s\npassword=%s\nhost=127.0.0.1\n' "$RESTORE_USER" "$RESTORE_PASSWORD" > "$cnf"
q() { mysql --defaults-extra-file="$cnf" -N -B "$scratch" -e "$1"; }

for t in users tasks migrations sessions; do
  q "SELECT 1 FROM \`$t\` LIMIT 1" >/dev/null 2>&1 || [ "$(q "SHOW TABLES LIKE '$t'")" = "$t" ] \
    || { echo "FAIL: table $t missing"; exit 1; }
done
orphans=$(q "SELECT COUNT(*) FROM tasks t LEFT JOIN users u ON u.id=t.user_id WHERE u.id IS NULL")
[ "$orphans" = "0" ] || { echo "FAIL: $orphans orphaned tasks"; exit 1; }

echo "OK: $latest restored; users=$(q 'SELECT COUNT(*) FROM users') tasks=$(q 'SELECT COUNT(*) FROM tasks')"
mysql --defaults-extra-file="$cnf" -e "DROP DATABASE \`$scratch\`"
