# VoltChess — Complete Code Guide

This `docs/` folder is an **exhaustive, plain-English reference to every file in
the project** — roughly a page per file, written so that even someone who has
never coded can understand what each piece does and how its functions work.

If you want the short, high-level overview first, read
[`../ARCHITECTURE.md`](../ARCHITECTURE.md). This folder is the deep version.

## How to read this guide

Each file in the codebase gets its own section with the same structure:

- **In one sentence** — the quickest possible summary.
- **What it is & why it exists (plain English)** — the idea, with jargon
  explained the first time it appears.
- **How it works, step by step** — the logic/flow.
- **Functions / classes / components & exports** — every important function:
  what it takes in (inputs), what it gives back (outputs), and how it does its
  job.
- **Connections** — what it depends on and what uses it.

**Suggested reading order for a newcomer:**
1. `../ARCHITECTURE.md` (the big picture)
2. [01 — Backend](#1-the-backend) (how the server, database, and login work)
3. [04 — Hooks, types & state](#4-frontend--hooks-types--state) and
   [02 — Library & API](#2-frontend--library--api-client) (the frontend's logic)
4. [05 — Components & app entry](#5-frontend--components--app-entry) and
   [06 — Pages & theme](#6-frontend--pages--theme) (the screens and shared UI)
5. The feature deep-dives (03, 07, 08) as needed.

## Glossary (the words used most often)

- **Frontend** — the part that runs in your browser (the website you see). Built
  with React + TypeScript.
- **Backend** — the server that stores data and handles logins. Built with
  Django (Python).
- **API** — the set of web addresses the frontend calls to talk to the backend
  (e.g. `POST /api/token/` to log in).
- **Component** — a reusable piece of the user interface (a button, a dialog, a
  whole page).
- **Hook** — a reusable bit of frontend logic, always named `useSomething`.
- **State / atom** — data the app remembers while running; "atoms" are shared
  state any component can read (via the Jotai library).
- **Serializer / view (backend)** — the translator between database rows and JSON
  (serializer), and the code that runs for a given API address (view).
- **Stockfish / WASM / Web Worker** — the chess engine, compiled to run fast in
  the browser (WebAssembly), in a background thread (Web Worker), so analysis
  doesn't freeze the page.

## The documents

### 1. The Backend
[`01-backend.md`](01-backend.md) — Every Python file in `backend/`: the Django
project setup, the custom `User` and login/JWT system (`accounts`), academies /
coach-student links / classrooms (`academies`), stored games and evaluations
(`games`), assignments, annotations, coaching dashboards/analytics
(`coaching`), and the Chess.com/Lichess import + hybrid analysis pipeline
(`sync`). Includes a "how the backend fits together" primer. **(72 files)**

### 2. Frontend — Library & API client
[`02-frontend-lib-and-api.md`](02-frontend-lib-and-api.md) — The framework-free
logic in `src/lib/` (chess helpers, auth/session storage, error formatting,
Chess.com/Lichess clients, game sync, math/stats, sounds) and the typed backend
API client modules in `src/lib/api/`. **(25 files)**

### 3. Frontend — Chess engine
[`03-frontend-engine.md`](03-frontend-engine.md) — `src/lib/engine/`: how
Stockfish runs in the browser (workers, the `UciEngine` orchestrator, the
per-version factories) and the analysis math (parsing engine output, win%,
accuracy, estimated Elo, move classification). Includes a plain-English primer on
chess-engine concepts. **(12 files)**

### 4. Frontend — Hooks, types & state
[`04-frontend-hooks-types-state.md`](04-frontend-hooks-types-state.md) — Every
React hook in `src/hooks/`, the `AuthContext`, runtime config (`src/config`),
constants, all shared TypeScript types (`src/types`), and static datasets
(`src/data`). **(28 files)**

### 5. Frontend — Components & app entry
[`05-frontend-components-and-root.md`](05-frontend-components-and-root.md) — The
shared, generic UI in `src/components/` (route guards, the chessboard, dialogs,
loaders, SEO helpers, background workers) plus the app-entry files (`App.tsx`,
`main.tsx`, `api.tsx`, Sentry config). **(33 files)**

### 6. Frontend — Pages & theme
[`06-frontend-pages-and-theme.md`](06-frontend-pages-and-theme.md) — Every routed
screen in `src/pages/` (home, login/register, analysis, database, play, puzzles,
the coach pages, the student hub, blog, legal) and the color/theme system in
`src/theme/`. **(26 files)**

### 7. Frontend — Analysis feature
[`07-sections-analysis.md`](07-sections-analysis.md) — `src/sections/analysis/`:
the analysis workspace UI — the board container, the report/engine/settings
panels, the move list, the evaluation graph, accuracy/Elo, and the shared
analysis state atoms. **(39 files)**

### 8. Frontend — Other feature sections
[`08-sections-features.md`](08-sections-features.md) — Everything else in
`src/sections/`: auth layout + role selector, app layout/sidebar, coach tools,
the student platform card, the onboarding tour, play-vs-engine, game loading
(Chess.com/Lichess/PGN), the home sections, engine settings, and the blog
article renderer. **(41 files)**

### 9. Configuration, build & deployment
[`09-config-build-deploy.md`](09-config-build-deploy.md) — The "plumbing":
`index.html`, `package.json`, Vite/TypeScript/ESLint/Prettier configs,
`vercel.json`, the Raspberry Pi deploy scripts, `backend/requirements.txt`, the
`public/` engines, and the other documentation files.

## Coverage

Every source file in the project is documented:

| Area | Files |
|------|-------|
| Backend (`backend/`, non-migration) | 72 |
| Frontend `src/lib` + `src/lib/api` | 25 |
| Frontend `src/lib/engine` | 12 |
| Frontend hooks/types/config/constants/contexts/data | 28 |
| Frontend `src/components` + app-entry | 33 |
| Frontend `src/pages` + `src/theme` | 26 |
| Frontend `src/sections/analysis` | 39 |
| Frontend other `src/sections` | 41 |
| Config / build / deploy / docs | (doc 09) |
| **Total source files** | **276** |

> Auto-generated files (Django migrations, `package-lock.json` internals,
> `node_modules`, the build output in `dist/`, and the compiled Stockfish
> binaries) are summarized rather than documented line-by-line, because they are
> not hand-written.
