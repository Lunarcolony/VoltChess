# AGENTS.md

## Cursor Cloud specific instructions

VoltChess is a Vite + React/TypeScript chess analysis SPA (repo root) with an optional Django REST backend (`backend/`) that powers the "Academy" coaching product (login, classrooms, games DB, assignments, sync). Stockfish runs client-side via WASM (`public/engines/`), so analysis works without the backend.

### Services

| Service | Dir | Start command | Port | Notes |
|---|---|---|---|---|
| Frontend (Vite dev) | repo root | `npm run dev` | 3000 | Core product. Proxies `/api` → `http://127.0.0.1:8000` (see `vite.config.ts`). |
| Backend (Django API) | `backend/` | `.venv/bin/python manage.py runserver 0.0.0.0:8000` | 8000 | Required only for the Academy/login features. Uses the venv at `backend/.venv`. |

### Non-obvious caveats

- The backend runs in a virtualenv at `backend/.venv` (system `python3-venv` is required to create it). Always invoke it via `backend/.venv/bin/python`, not the system `python3`.
- The backend reads `backend/.env`. For local dev it must contain `USE_SQLITE=true` and `DJANGO_DEBUG=true` (Postgres is the default otherwise). This file is git-ignored. If it is missing, recreate it before running the server (see `backend/.env.example`).
- After installing/refreshing backend deps, you may need to apply migrations: `backend/.venv/bin/python backend/manage.py migrate`. Migrations and seeding are intentionally NOT in the startup update script.
- Seed demo accounts with `backend/.venv/bin/python backend/manage.py seed_demo` → logins `coach` / `demo1234` and `student` / `demo1234`.
- To run the frontend without the backend, set `VITE_ENABLE_AUTHENTICATION=false` in a root `.env`.
- `npm run lint` currently fails on the committed codebase (the eslint `import` plugin has no `@/` path-alias resolver configured, and several source files have prettier violations). This is a pre-existing repo condition, not an environment problem. `npx tsc --noEmit` passes cleanly and is the reliable type check.
