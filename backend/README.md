# MetraLab Backend

FastAPI service for MetraLab report capture, review, and traceability workflows.

## Run Locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

Use `docker compose -f ../infra/docker-compose.yml up -d` to start PostgreSQL on port `55432`.

## Current API

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET|POST /api/users` and `PATCH /api/users/{user_id}` for administrators
- `GET|POST /api/instruments` and `POST /api/instruments/{id}/retire`
- `GET|POST /api/procedures`
- `GET|POST /api/reports`
- `POST /api/reports/{id}/measurements`
- `GET /api/reports/{id}/measurements`
- `GET /api/reports/{id}/calculation-preview`
- `POST /api/reports/{id}/submit|return|reject|finalize`
- `GET /api/reports/{id}/audit`

Interactive API documentation is available at `/docs` in development.

## Calculation Safety

Repeatability range is evaluated only when an active procedure configuration supplies a matching-unit `repeatability_range_limit`. Indication error always returns `Not evaluated` until an approved formula, digital rounding correction, and MPE configuration are implemented. Consequently, finalization is intentionally blocked for such reports.

## Quality Checks

```bash
.venv/bin/pytest
.venv/bin/ruff check app tests migrations
.venv/bin/ruff format --check app tests migrations
```
