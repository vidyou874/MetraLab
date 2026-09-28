# Local Operations Runbook

## Setup

1. Run `./scripts/init-local.sh` once.
2. Review `infra/.env`. It is intentionally untracked and contains only local-development credentials.
3. Run `./scripts/up.sh`.

`up.sh` builds the backend, waits for container health, applies migrations, and prints the API documentation URL.

## Routine Commands

| Command | Purpose |
|---|---|
| `./scripts/status.sh` | Show service state and verify the API health endpoint. |
| `./scripts/logs.sh backend` | Show the latest backend logs. |
| `./scripts/migrate.sh` | Apply pending Alembic migrations. |
| `./scripts/backup.sh` | Create a PostgreSQL custom-format dump under `.local/backups/`. |
| `./scripts/down.sh` | Stop the local stack while preserving data volume. |
| `./scripts/down.sh --volumes` | Stop the stack and delete local database data. |

## Restore Drill

1. Create a backup with `./scripts/backup.sh`.
2. Restore that file using `./scripts/restore.sh --confirm <backup-file>`.
3. Run `./scripts/status.sh`.
4. Confirm the expected report, audit event, and migration revision exist through the API or database client.

Run a restore drill periodically for any environment that stores laboratory records. Production restores require a separately approved, access-controlled procedure and must not use the local script unmodified.
