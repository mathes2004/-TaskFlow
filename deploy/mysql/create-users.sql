-- Least-privilege MySQL accounts (guide 13.2 step 4 and security map "DB least privilege").
-- Run once as a MySQL admin:  mysql -u root -p < deploy/mysql/create-users.sql
-- Replace both passwords first (openssl rand -base64 32). Never commit real passwords.
-- MySQL must listen on 127.0.0.1 only (bind-address = 127.0.0.1) and the firewall must not expose 3306.

CREATE DATABASE IF NOT EXISTS taskflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1) Runtime user used by the running app (.env DB_USERNAME): data access only, no schema changes.
CREATE USER IF NOT EXISTS 'taskflow_app'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME_APP_PASSWORD';
CREATE USER IF NOT EXISTS 'taskflow_app'@'localhost' IDENTIFIED BY 'CHANGE_ME_APP_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON taskflow.* TO 'taskflow_app'@'127.0.0.1';
GRANT SELECT, INSERT, UPDATE, DELETE ON taskflow.* TO 'taskflow_app'@'localhost';

-- 2) Migration user used only during deploys (`php artisan migrate --force`): can change schema, nothing global.
CREATE USER IF NOT EXISTS 'taskflow_migrate'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME_MIGRATE_PASSWORD';
CREATE USER IF NOT EXISTS 'taskflow_migrate'@'localhost' IDENTIFIED BY 'CHANGE_ME_MIGRATE_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES ON taskflow.* TO 'taskflow_migrate'@'127.0.0.1';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES ON taskflow.* TO 'taskflow_migrate'@'localhost';

-- 3) Backup user: read-only, plus what mysqldump --single-transaction needs.
CREATE USER IF NOT EXISTS 'taskflow_backup'@'localhost' IDENTIFIED BY 'CHANGE_ME_BACKUP_PASSWORD';
GRANT SELECT, SHOW VIEW, TRIGGER, LOCK TABLES ON taskflow.* TO 'taskflow_backup'@'localhost';

FLUSH PRIVILEGES;

-- Verify (should show no GRANT ALL, no *.* grants):
--   SHOW GRANTS FOR 'taskflow_app'@'127.0.0.1';
-- Deploy tip: run migrations with the migrate user, then the app keeps running as taskflow_app:
--   DB_USERNAME=taskflow_migrate DB_PASSWORD=... php artisan migrate --force
