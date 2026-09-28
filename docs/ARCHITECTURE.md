# Architecture Notes

## Backend

The backend is a FastAPI application with four intended layers:

- `api/` exposes HTTP routes and translates request/response models.
- `services/` owns workflow orchestration, authorization checks, audit events, and status transitions.
- `models/` owns persistence models and database constraints.
- `domain/calculations/` contains deterministic calculation functions with no HTTP or database dependency.

The calculation package should remain separately testable. It must return `Not evaluated` instead of guessing when an approved rule, rounding correction, MPE table, unit, or uncertainty decision rule is missing.

## Frontend

The frontend is a Next.js application with route areas matching the core product workflows:

- `/instruments`
- `/reports`
- `/review`
- `/admin`

Server authorization remains authoritative. UI visibility is only a convenience and must not be treated as permission enforcement.

## Data

PostgreSQL is the production target. Alembic migrations live under `backend/migrations`. Historical records must retain raw values, units, entered precision, procedure configuration version, and calculation engine version.

## Local Development

Use `infra/docker-compose.yml` for PostgreSQL. Copy `.env.example` files before running services locally.
