# MetraLab

MetraLab is an internal laboratory web application for preparing, reviewing, and retaining OIML R76 test records for non-automatic weighing instruments.

## Project Structure

- `docs/` - product requirements, domain decisions, and implementation notes.
- `backend/` - FastAPI service, database access, workflow logic, and deterministic calculation domain module.
- `frontend/` - Next.js application for technicians, reviewers, administrators, and auditors.
- `infra/` - local development and deployment support files.
- `scripts/` - developer automation.

## Local Development

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Local services:

```bash
docker compose -f infra/docker-compose.yml up -d
```

## Current Status

This repository currently contains the project skeleton and domain documentation. Calculation rules are placeholders until approved procedure configurations, OIML edition choices, uncertainty policy, and report templates are signed off by the laboratory's technical owner.
