# AGENTS.md

## Cursor Cloud specific instructions

VoltChess is a Vite + React/TypeScript chess analysis SPA (repo root) with an optional Django REST backend (`backend/`) that powers the "Academy" coaching product (login, classrooms, games DB, assignments, sync). Stockfish runs client-side via WASM (`public/engines/`), so analysis works without the backend.

For a detailed structural map (how auth/data model/sync work and a per-file reference for `src/` and `backend/`), see `ARCHITECTURE.md` at the repo root.

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

### Lint, typecheck & tests

- Frontend lint/typecheck: `npm run lint` (runs `eslint . --max-warnings 0` then `tsc --noEmit`). It is green; keep it that way. Note `import/no-unresolved` is intentionally disabled in `.eslintrc.json` because `tsc` already validates the `@/` path alias and module resolution (the eslint `import` plugin has no TS resolver wired up, and adding `eslint-import-resolver-typescript` conflicts with this repo's pinned `@typescript-eslint` version).
- Backend tests: `backend/.venv/bin/python backend/manage.py test` (or `... test sync`). Tests use an in-memory SQLite DB and mock the Chess.com/Lichess fetch, so they need no network. The `sync` app has coverage for the platform-import → browser/server analysis flow.
