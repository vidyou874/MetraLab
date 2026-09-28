# Infrastructure

`docker-compose.yml` starts a local PostgreSQL instance and the backend API. It uses values from the untracked `infra/.env` file. PostgreSQL defaults to host port `55432` and the API to `8000`.

Initialize and run the local stack:

```bash
./scripts/init-local.sh
./scripts/up.sh
```

Useful operations:

```bash
./scripts/status.sh
./scripts/logs.sh backend
./scripts/backup.sh
./scripts/restore.sh --confirm .local/backups/metralab-YYYYMMDDTHHMMSSZ.dump
./scripts/down.sh
```

`restore.sh` stops the backend and replaces the current database. It is designed only for a local development environment and requires an explicit `--confirm` argument.

## Production Requirements

- HTTPS termination and secure cookies.
- Managed secret storage.
- Encrypted backups, a documented retention period, and restore testing.
- A migration execution policy that runs `alembic upgrade head` exactly once per deployment.
- Operational logs and health checks.
- A deployment-specific `ENVIRONMENT=production`, non-default `SESSION_SECRET`, and explicit CORS origins.
