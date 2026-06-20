# VoltChess — Architecture & File Reference

This document explains how the VoltChess codebase is organized, how the
backend and frontend work, and what every meaningful source file does. It is
meant to be the single onboarding reference for new contributors and agents.

> Scope note: this file describes the **current** state of `main` after the
> authentication rework and the dead-code cleanup. Generated artifacts
> (`node_modules`, `backend/.venv`, `dist`, migrations) are not documented
> file-by-file.

---

## 1. What VoltChess is

VoltChess is two products sharing one repository:

1. **A free, client-side chess analysis app** (the "core product"). Anyone can
   load a PGN or import games from Chess.com/Lichess and get Stockfish analysis
   — move classifications, accuracy, estimated Elo, evaluation graphs — all
   computed **in the browser** via Stockfish compiled to WebAssembly. No account
   is required for this.
2. **VoltChess Academy** — a coaching platform layered on top. Coaches create a
   classroom, students join with a code, and the backend stores the
   relationships, synced games, assignments, messages, training plans, and
   analytics. This requires authentication against the Django REST backend.

### Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 7, MUI 6, Jotai (state), TanStack Query (server cache), React Router 7 |
| Chess engine | Stockfish (11/16/16.1/17, full + lite) compiled to WASM, run in Web Workers |
| Backend | Django 5 + Django REST Framework, SimpleJWT auth |
| Database | PostgreSQL (prod) / SQLite (local dev) |
| Game import | Chess.com & Lichess public APIs (server-side fetch + browser import) |
| Hosting | Frontend on Vercel (single-file build); backend typically on a Raspberry Pi exposed via Cloudflare tunnel |

---

## 2. Repository layout

```
/                     repo root (frontend lives here)
├── src/              React/TypeScript frontend
│   ├── pages/        route-level page components
│   ├── sections/     feature UI grouped by domain (analysis, coach, play, …)
│   ├── components/   shared, generic UI components
│   ├── hooks/        reusable React hooks
│   ├── lib/          framework-agnostic logic (engine, chess, API clients, auth)
│   ├── contexts/     React context providers (AuthContext)
│   ├── theme/        color palettes + MUI theme construction
│   ├── types/        shared TypeScript types
│   ├── data/         static datasets (openings, blog posts, SEO)
│   ├── config/       runtime configuration (API base URL resolution)
│   └── constants/    engine defaults + app constants
├── backend/          Django REST API (the "Academy" backend)
│   ├── voltchess_api/ project settings, root URLconf, WSGI, health check
│   ├── accounts/     custom User model + JWT auth + registration
│   ├── academies/    academies, memberships, coach↔student links, classrooms
│   ├── games/        stored games + evaluations + per-student stats
│   ├── assignments/  coach→student assignments
│   ├── annotations/  per-move comments on games
│   ├── coaching/     dashboards, analytics, lesson templates, messages, plans
│   └── sync/         Chess.com/Lichess import + hybrid (browser/server) analysis
├── public/           static assets incl. Stockfish WASM engines (public/engines)
├── scripts/          build + Raspberry Pi deploy helpers
└── *.md, config      docs and build/deploy configuration
```

The naming convention worth internalizing: **`pages/`** are routed screens,
**`sections/`** are larger feature-specific building blocks used by pages, and
**`components/`** are small generic widgets reusable anywhere. Pure logic with
no JSX lives in **`lib/`** and **`hooks/`**.

---

## 3. Running it (quick reference)

Standard commands live in `README.md`, `package.json`, and `AGENTS.md`; this is
the short version.

- **Frontend:** `npm install` then `npm run dev` → http://localhost:3000. The
  dev server proxies `/api` to `http://127.0.0.1:8000` (see `vite.config.ts`).
- **Backend:** create `backend/.venv`, `pip install -r backend/requirements.txt`,
  ensure `backend/.env` has `USE_SQLITE=true` + `DJANGO_DEBUG=true`, then
  `backend/.venv/bin/python manage.py migrate` and
  `... runserver 0.0.0.0:8000`. `... seed_demo` creates demo accounts.
- **Lint/typecheck:** `npm run lint` (eslint + `tsc --noEmit`).
- **Backend tests:** `backend/.venv/bin/python manage.py test`.
- **Auth off (frontend only):** set `VITE_ENABLE_AUTHENTICATION=false` in a root
  `.env` to use the analysis product without the backend.

---

## 4. Backend architecture

### 4.1 How authentication works

Authentication uses **DRF + `djangorestframework-simplejwt`**. The default DRF
permission is `IsAuthenticated`, so every endpoint requires a valid JWT unless a
view explicitly sets `AllowAny`. The token lifetimes are deliberately long
(access 12h, refresh 90d, with refresh-token rotation) so students and coaches
are not asked to re-authenticate during normal use; the frontend rotates the
access token proactively and on 401.

Auth endpoints (mounted under `/api/` by `accounts/urls.py`):

| Endpoint | Purpose | Access |
|----------|---------|--------|
| `POST /api/token/` | Obtain access + refresh JWT (login) | public |
| `POST /api/token/refresh/` | Rotate/refresh the access token | public |
| `POST /api/register/` | Create a coach or student account | public |
| `GET /api/me/` | Return the current user's profile | authenticated |

The **role model** is a single `role` field on the custom `User`
(`admin` / `coach` / `student`). Self-service registration only permits **coach**
or **student** (`SELF_SIGNUP_ROLES` in `accounts/serializers.py`); `admin`
accounts are provisioned server-side and are rejected by the public endpoint.
Authorization throughout the API is enforced by filtering querysets per role and
by object-level permission helpers (e.g. `IsGameOwnerOrCoach`, `_coach_has_student`,
`user_is_academy_admin`).

### 4.2 Data model

The central identity is `accounts.User` (UUID primary key, unique email). The
Academy domain hangs off of it:

- **`Academy`** — a top-level organization container.
- **`Membership`** — bridges a `User` to an `Academy` with a per-academy role;
  unique on `(academy, user)`.
- **`CoachStudentLink`** — the coaching relationship between a coach `User` and a
  student `User` (optional `academy`). Besides coaching metadata (notes, tags,
  priority, goals) it carries each student's **platform sync config**
  (`platform`, `platform_username`, `sync_enabled`, `sync_status`, …). Unique on
  `(coach, student)` — this is the "joined once" guarantee.
- **`Classroom`** — one-to-one with a coach, holding the human-friendly
  `join_code` (e.g. `VC-AB12CD`) students use to enroll.
- **`Game`** (games app) — owned by a `User`; stores PGN, headers, players JSON,
  `source`/`external_id` for sync dedup, and analysis-tracking fields. Unique on
  `(owner, source, external_id)` when an external id exists.
- **`GameEval`** — one-to-one with `Game`; the JSON analysis payload (positions,
  accuracy, estimated Elo, settings).
- **`Assignment`** — coach→student task, optionally tied to a `Game`.
- **`Annotation`** — a per-move comment on a `Game` authored by a `User`.
- **coaching models** — `LessonTemplate`, `CoachMessage`, `TrainingPlan`.
- **`StudentSyncPresence`** (sync app) — one-to-one with a `User`, tracking
  `last_seen_at`/`browser_busy` so the backend can decide whether the student's
  browser is available to run analysis.

### 4.3 Classroom join flow ("stored once")

Join codes are generated and normalized in `academies/classroom_codes.py`
(`generate_join_code`, `normalize_join_code`, `get_or_create_classroom_for_coach`).
The student flow is two-step and idempotent:

1. `POST /api/classroom/preview/` (`PreviewClassroomJoinView`) — looks up the
   classroom by code and returns the coach/classroom names **without** creating
   anything, so the student can confirm they're joining the right coach.
2. `POST /api/classroom/join/` (`JoinClassroomView`) — does
   `CoachStudentLink.objects.get_or_create(coach=…, student=…)`. Because of the
   unique `(coach, student)` constraint and `get_or_create`, joining twice is a
   no-op that returns `created: false` — the relationship is stored exactly once.

Coaches manage their classroom via `GET/PATCH /api/classroom/mine/` and
`POST /api/classroom/regenerate/`. Coaches cannot create coach-student links
directly (blocked in `CoachStudentLinkViewSet.perform_create`); enrollment only
happens through join codes.

### 4.4 Platform sync + hybrid analysis pipeline

The `sync` app imports a student's online games and gets them analyzed, routing
analysis to whichever resource is available:

- **Import:** `sync_coach_student_link()` calls `fetch_platform_games()`
  (`platform_fetch.py`) against Chess.com archives or the Lichess NDJSON API,
  then `upsert_fetched_game()` de-duplicates into `Game` rows (new ones marked
  `PENDING`).
- **Browser analysis (preferred):** when the student's browser is online (it
  heartbeats `POST /api/sync/presence/`), it claims pending games
  (`/api/sync/pending-analysis/` → `claim/` → `complete/`) and runs Stockfish
  WASM locally, posting the eval back. This is driven by
  `PlatformSyncOrchestrator` on the frontend.
- **Server analysis (fallback):** if the browser is offline/busy or doesn't
  claim a game within a grace window, `server_analysis.py` runs a Stockfish
  subprocess on the Pi (lower depth) so analysis still completes. The
  `run_platform_sync` management command drives this on a cron.

### 4.5 Full URL map

`voltchess_api/urls.py` mounts a health check, the Django admin, and seven app
URLconfs all under `/api/`. The notable route groups:

- **Auth:** `/api/token/`, `/api/token/refresh/`, `/api/register/`, `/api/me/`
- **Academies:** `/api/academies/…`, `/api/coach-links/…`,
  `/api/classroom/{mine,regenerate,preview,join}/`,
  `/api/students/{id}/{stats,report,games}/`
- **Games:** `/api/games/…`, `/api/games/bulk/`, `/api/games/{id}/eval/`
- **Assignments:** `/api/assignments/…`
- **Annotations:** `/api/annotations/…` (list requires `?game_id=`)
- **Coaching:** `/api/coach/{dashboard,analytics}/`,
  `/api/students/{id}/timeline/`, `/api/assignments/bulk/`,
  `/api/{lesson-templates,coach-messages,training-plans}/…`
- **Sync:** `/api/sync/{overview,trigger,presence,pending-analysis,process-server}/`,
  `/api/sync/games/{id}/{claim,complete,release}/`

### 4.6 Backend file reference

#### `voltchess_api/` (project package)

**`settings.py`** — The Django project configuration. It reads `backend/.env`
via `python-dotenv`, selects PostgreSQL or SQLite (via `USE_SQLITE`), sets
`AUTH_USER_MODEL = "accounts.User"`, configures CORS, and defines the DRF
defaults (JWT authentication, `IsAuthenticated` default permission). It also
holds the `SIMPLE_JWT` block with the long access/refresh lifetimes and refresh
rotation, plus production guards around the secret key and debug flag.

**`urls.py`** — The root URLconf. Mounts `/api/health/`, the Django admin, and
`include()`s the seven app URL modules (accounts, academies, games, assignments,
annotations, coaching, sync) — all under the `/api/` prefix. This is the single
place to see what is wired up.

**`health.py`** — A tiny public `GET` view returning
`{"status": "ok", "service": "voltchess-api"}`, used by uptime checks and the
deploy tooling to confirm the API is reachable. **`wsgi.py`** is the standard
WSGI entrypoint that sets `DJANGO_SETTINGS_MODULE`. **`__init__.py`** is empty.

#### `accounts/` (identity & auth)

**`models.py`** — Defines the `UserRole` text-choices enum and the custom
`User(AbstractUser)` with a UUID primary key, a unique email, and a `role` field
defaulting to `student`. It also attaches `User.UserRole` as an alias so other
apps can write `User.UserRole.COACH`. This custom user model is why
`AUTH_USER_MODEL` is overridden in settings.

**`serializers.py`** — Houses `RegisterSerializer` and `UserSerializer`.
`RegisterSerializer` accepts `username`, `email`, `password`, and `role`,
restricts the role to coach/student (`SELF_SIGNUP_ROLES`), runs Django's
password validators, checks username/email uniqueness case-insensitively, and
creates the user via `create_user`. `UserSerializer` is the read-only profile
shape returned by `/api/me/` and embedded in other serializers.

**`views.py`** — `RegisterView` is an `AllowAny` `CreateAPIView` that creates the
account and returns `{detail, username, role}` so the client can route the new
user. `MeView` returns the authenticated user's serialized profile. **`urls.py`**
wires the SimpleJWT token views plus register/me. **`admin.py`** extends the
Django user admin to surface and edit `role`. **`apps.py`** is the standard app
config. **`tests.py`** (`RegisterRoleTests`) covers student/coach signup, admin
rejection, duplicate username/email, and weak-password rejection.

**`management/commands/seed_demo.py`** — Creates the demo `coach`/`student`
accounts (password `demo1234`), an academy with memberships, a
`CoachStudentLink`, a classroom (printing its join code), and a sample
assignment. This is the fastest way to get a working Academy locally.

#### `academies/` (org, links, classrooms)

**`models.py`** — The Academy domain core: `Academy`, `Membership`,
`CoachStudentLink`, and `Classroom`, plus the enums `MembershipRole`,
`LinkPriority`, `PlatformChoice`, and `SyncStatus`. `CoachStudentLink` is the
richest model — it is both the coaching relationship and the per-student platform
sync configuration, which is why the sync app reads from it.

**`serializers.py` / `classroom_serializers.py`** — `serializers.py` defines
`AcademySerializer`, `MembershipSerializer` (nested user), and
`CoachStudentLinkSerializer` (with write-only `student_id`/`student_username` and
platform/username cross-validation). `classroom_serializers.py` defines
`ClassroomSerializer` (with `coach_username` and computed `student_count`) and
the preview/join serializer shapes.

**`classroom_codes.py`** — Join-code utilities: `generate_join_code()` (a
`VC-XXXXXX` code from an unambiguous alphabet, retried for uniqueness),
`normalize_join_code()` (trim/upper/prefix), and
`get_or_create_classroom_for_coach()` (lazily creates the one-per-coach
classroom). This is the heart of the enrollment UX.

**`permissions.py`** — Reusable authorization helpers: `user_is_academy_admin`,
`user_is_coach_or_admin`, and the `IsAcademyAdmin` object permission. **`views.py`**
contains `AcademyViewSet` (membership-scoped, auto-admin on create, `members`
action), `CoachStudentLinkViewSet` (role-based queryset; coaches can't create
links, students may only edit their own platform fields), the student
stats/report/games views, and the four classroom views
(`MyClassroomView`, `RegenerateClassroomCodeView`, `PreviewClassroomJoinView`,
`JoinClassroomView`). **`urls.py`** registers the routers and classroom/stat
paths. **`admin.py`** registers the models. **`tests.py`**
(`CoachLinkUpdatePermissionTests`) verifies students can edit only their own
platform/sync fields while coaches edit coaching fields.

#### `games/` (stored games + evals + stats)

**`models.py`** — `Game` (owner FK, PGN/metadata/players JSON, sync dedup fields,
and analysis-tracking fields like `analysis_status`/`analysis_source`/
`analysis_claimed_at`) and `GameEval` (one-to-one JSON eval payload), plus the
`AnalysisStatus` and `AnalysisSource` enums. The unique `(owner, source,
external_id)` constraint prevents importing the same Chess.com/Lichess game
twice.

**`serializers.py`** — A family of serializers for different needs:
`GameListSerializer` (summary + `has_eval`/accuracy), `GameDetailSerializer`
(nested eval), `GameCreateSerializer`, `GameEvalSerializer`, and
`GameEvalUploadSerializer` (which `update_or_create`s the eval and flips the game
to `COMPLETE`). **`views.py`** has `GameViewSet` (owner/coach/admin-scoped, with
optional `?student_id=`), `GameEvalView` (GET/PUT eval), and `BulkGameUploadView`
(batch create used by the local→server migration).

**`permissions.py`** — `IsGameOwnerOrCoach` grants access to the game owner, an
admin, or a coach linked to the owner. **`stats.py`** holds the analytics math:
`compute_student_stats` (accuracy, blunder counts, pending assignments) and
`compute_student_report` (date-filtered games + assignments), reused by the
academies and coaching apps. **`urls.py`**, **`admin.py`** (with a `GameEval`
inline), and **`apps.py`** are conventional.

#### `assignments/`

**`models.py`** defines `Assignment` (coach, student, optional game, plus title,
PGN, instructions, category, priority, due date, status) and the
`AssignmentStatus`/`AssignmentCategory`/`AssignmentPriority` enums.
**`serializers.py`** (`AssignmentSerializer`) nests the users and resolves
write-only `student_id`/`game_id` on create. **`views.py`**
(`AssignmentViewSet`) filters by role (coaches see assignments they created,
students see those received, admins see all) and verifies the coach-student link
on create. **`urls.py`/`admin.py`/`apps.py`** are conventional.

#### `annotations/`

**`models.py`** defines `Annotation` (FK to game and author, `move_index`,
optional `fen`, text `body`). **`serializers.py`** nests a read-only author and
sets the author on create. **`views.py`** (`AnnotationViewSet`) requires a
`?game_id=` filter for listing and reuses `IsGameOwnerOrCoach` for access
control. **`urls.py`/`admin.py`/`apps.py`** are conventional.

#### `coaching/` (dashboards & tooling)

**`models.py`** defines `LessonTemplate` (reusable coach content),
`CoachMessage` (coach→student inbox), and `TrainingPlan` (coach→student with JSON
goals), plus `TemplateCategory`/`TrainingPlanStatus`. **`serializers.py`** maps
these to API shapes. **`services.py`** is the analytics engine:
`compute_coach_dashboard` (roster, at-risk students, activity feed),
`compute_coach_analytics` (cohort accuracy and mistake totals), and
`compute_student_timeline` (a merged feed of games, assignments, messages, and
annotations). **`views.py`** exposes these via `CoachDashboardView`,
`CoachAnalyticsView`, `StudentTimelineView`, `BulkAssignmentView`, and the
template/message/plan viewsets (the message viewset adds a `mark_read` action).
**`urls.py`/`admin.py`/`apps.py`** are conventional.

#### `sync/` (import + hybrid analysis)

**`models.py`** defines `StudentSyncPresence` (one-to-one with the user;
`last_seen_at`, `browser_busy`). **`platform_fetch.py`** contains the HTTP
clients: `fetch_chesscom_games` (walks monthly archives), `fetch_lichess_games`
(NDJSON), the `FetchedGame` dataclass, and the `fetch_platform_games` dispatcher.
**`services.py`** is the orchestration layer: the `StudentPresence` helper,
`upsert_fetched_game`, `sync_coach_student_link`, the browser/server queue
selectors, the claim/release/complete helpers, `student_sync_overview`, and
`release_stale_analysis_claims`.

**`server_analysis.py`** runs Stockfish as a subprocess (`analyze_game_on_server`,
`process_server_queue`) as the offline fallback. **`views.py`** exposes the REST
surface (`SyncOverviewView`, `SyncTriggerView`, `PresenceView`,
`PendingAnalysisView`, `ClaimAnalysisView`, `ReleaseAnalysisView`,
`CompleteAnalysisView`, `ProcessServerQueueView`). **`management/commands/
run_platform_sync.py`** is the cron entrypoint that syncs all enabled links,
releases stale claims, and (opt-in) runs the server analysis queue.
**`tests.py`** covers presence, overview, the claim/complete/release flow, and
the sync services with the network mocked. **`urls.py`/`admin.py`/`apps.py`** are
conventional.

#### `manage.py`

The standard Django CLI entrypoint; sets `DJANGO_SETTINGS_MODULE` to
`voltchess_api.settings` and dispatches commands like `runserver`, `migrate`,
`test`, `seed_demo`, and `run_platform_sync`.

---

## 5. Frontend architecture

### 5.1 Bootstrap & providers

`src/main.tsx` is the entry point. It loads fonts, runs a one-time engine-setting
defaults migration, **awaits `loadApiConfig()`** (which can fetch a runtime
`/api-config.json` to override the API base URL), creates the TanStack Query
client, and mounts the provider tree: `QueryClientProvider` → `BrowserRouter` →
`AuthProvider` → global side-effect components (`LocalGameMigrationPrompt`,
`PlatformSyncOrchestrator`) → `App`. `src/App.tsx` defines the route table.

### 5.2 Routing & route guards

Routes live in `App.tsx` inside `ErrorBoundary` → `Layout` → `Suspense`
(pages are lazy-loaded). There are three tiers:

- **Public:** `/login`, `/register`, `/blog`, `/blog/:slug`,
  `/terms-and-conditions`, `/thanks`.
- **Authenticated** (wrapped by the `RequireAuth` layout route): `/`,
  `/analysis`, `/database`, `/openings`, `/play`, `/puzzles`, `/review`.
- **Role-scoped** (inside `RequireAuth`, additionally wrapped by `RoleRoute`):
  `/coach/*` (Coach/Admin) and `/student` (Student).

`RequireAuth` renders the protected `<Outlet />` only when authenticated (or when
auth is disabled), showing a spinner while the session resolves and redirecting
to `/login` otherwise (preserving `state.from`). `RoleRoute` redirects users
whose role isn't allowed. `GuestRoute` wraps the login/register pages and bounces
already-authenticated users to their role home via `landingForRole()`.

### 5.3 Authentication & session (frontend)

`src/contexts/AuthContext.tsx` owns auth state. It hydrates the user from a
localStorage cache, then validates/refreshes against the backend
(`/api/token/refresh/` + `/api/me/`). Crucially it only signs the user out when
the **refresh token itself** is rejected — transient network/CORS failures keep
the cached session so a reload doesn't bounce a valid user to login. It also
proactively rotates the access token on an interval. Tokens and the cached user
live in localStorage (`src/lib/authStorage.ts`), and `src/api.tsx` is the shared
axios instance whose interceptors attach the bearer token and transparently
refresh-and-retry on a 401. This is the mechanism that keeps sessions persistent
across reloads.

### 5.4 Theming

Theming is Jotai-driven. `theme/colorThemeAtom.ts` persists the selected palette
id; `theme/themes.ts` defines the palettes and `getPalette()`;
`theme/voltchessTheme.ts` (`createAppTheme`) maps a palette to a full MUI theme;
and `sections/layout/AppThemeProvider.tsx` reads the atom, builds the theme, and
wraps the app with MUI's `ThemeProvider` + `CssBaseline`. For inline styling
outside MUI tokens, `hooks/usePalette.ts` exposes the active palette (with a
contrast-safe `onAccent`).

### 5.5 Engine, storage & sync (frontend)

Stockfish runs as WASM in Web Workers. `lib/engine/worker.ts` spawns workers with
absolute paths (so nested SPA routes don't break WASM loading);
`lib/engine/uciEngine.ts` (`UciEngine`) is the orchestrator with a worker pool
and job queue; the `stockfishNN.ts` factories pick the right WASM build. Analysis
output is parsed (`helpers/parseResults.ts`) and post-processed into move
classifications (`helpers/moveClassification.ts`), accuracy
(`helpers/accuracy.ts`), and estimated Elo (`helpers/estimateElo.ts`). Locally,
games are stored in IndexedDB (`hooks/useGameDatabase.ts`); when authenticated,
`lib/gameSync.ts` mirrors them to the backend, and `PlatformSyncOrchestrator`
analyzes server-queued imported games in the background.

### 5.6 Frontend file reference

#### `src/` root

**`App.tsx`** — The route table (see §5.2): lazy page imports wrapped in the
guard hierarchy, plus Vercel `Analytics` and `RouteAnalytics`. **`main.tsx`** —
the bootstrap/provider tree (see §5.1). **`api.tsx`** — the shared axios instance
and `refreshAccessToken()`; request/response interceptors attach the bearer token
and do single-flight 401 refresh-and-retry. **`sentry.client.config.ts`** —
initializes Sentry in production when `VITE_SENTRY_DSN` is set.
**`vite-env.d.ts`** — ambient typings for `import.meta.env`.

#### `src/config/` and `src/constants/`

**`config/apiUrl.ts`** — Centralizes backend base-URL resolution:
`resolveApiBaseUrl()` (env → dev same-origin proxy), `getApiBaseUrl()`/
`setApiBaseUrl()` (runtime override), and `loadApiConfig()` (fetches
`/api-config.json` at boot). Production blocks private-IP/HTTP URLs for safety.
**`constants.ts`** — token key names, `API_URL`, the `ENABLE_AUTHENTICATION`
flag, classification colors, and engine labels. **`constants/engineDefaults.ts`**
— `ENGINE_DEFAULTS` (UI), `SYNC_ANALYSIS_DEFAULTS` (background queue, depth 4),
and the settings-version key for one-time localStorage migration.

#### `src/contexts/`

**`AuthContext.tsx`** — The `AuthProvider` and `useAuth()` hook described in §5.3:
exposes `user`, `loading`, `isAuthenticated`, `login`, `logout`, and
`refreshUser`. It is the single source of truth for who is signed in and powers
the route guards and the sidebar account UI.

#### `src/types/`

**`user.ts`** — `UserRole` enum, the `User` type, and `USER_ROLE_LABELS`.
**`enums.ts`** — `GameOrigin`, `EngineName`, `MoveClassification`, `Color`.
**`eval.ts`** — the analysis types (`PositionEval`, `LineEval`, `Accuracy`,
`EstimatedElo`, `EngineSettings`, `GameEval`, etc.). **`game.ts`** — the persisted
`Game`/`Player` and lightweight `LoadedGame`. **`engine.ts`** — `EngineWorker`
and `WorkerJob`. **`chessCom.ts`/`lichess.ts`** — typings for the respective
public-API responses.

#### `src/lib/` (framework-agnostic logic)

**`auth.ts`** — `landingForRole(role)`: the canonical post-login destination
(`/student`, `/coach`, or `/`), shared by the login handler and `GuestRoute` so
redirects never disagree. **`authStorage.ts`** — the localStorage session layer
(`getAccessToken`, `getRefreshToken`, `hasStoredSession`, `setTokens`,
`clearAuthStorage` (which dispatches `voltchess:auth-expired`), and the cached-user
helpers). **`apiErrors.ts`** — `getApiErrorMessage()` normalizes axios/DRF errors
(network, HTTPS mismatch, `detail`, field errors, 401) into user-facing strings;
the auth forms rely on it to surface field errors like "username taken".

**`chess.ts`** — the large chess.js utility module (`getEvaluateGameParams`,
`getGameFromPgn`, `formatGameToDatabase`, UCI/SAN helpers, material/sacrifice
helpers used by classification, and board UI helpers). **`chessCom.ts`/
`lichess.ts`** — fetch recent games / cloud evals from the respective platforms
and normalize them to `LoadedGame`. **`gameSync.ts`** — bridges local IndexedDB
games to the server (`ensureGameOnServer`, `syncEvalToServer`,
`syncAnalysisResult`, `migrateLocalGamesToServer`, and the local↔server id map).
**`analysisStatus.ts`** — maps a synced game's status to a label/chip color for
the UI.

**`evalLead.ts`/`positionDominance.ts`** — derived per-player metrics
(eval-lead share/peaks/comebacks; per-phase positional dominance) shown in report
panels. **`math.ts`** — statistics helpers (harmonic/weighted means, std dev)
used by accuracy. **`contrast.ts`** — `getReadableTextOn()` for accessible text
on accent colors. **`sounds.ts`** — Web Audio move/capture/illegal sounds.
**`helpers.ts`** — misc small utilities (padding, capitalize, sleep, base64).
**`firebase.ts`** — optional analytics. **`sentry.ts`** — error-logging wrapper.
**`syncEngineSettingsDefaults.ts`** — one-time write of engine defaults to
localStorage when the settings version bumps.

##### `src/lib/api/` (backend client modules)

Each file wraps the shared axios instance for one backend domain and is the
typed boundary between frontend and API. **`index.ts`** is the barrel that
re-exports all of them so call sites can `import { … } from "@/lib/api"`.
**`academies.ts`** (coach links + student stats/report), **`classrooms.ts`**
(the preview/join flow + classroom management — this is what the join UI calls),
**`assignments.ts`**, **`annotations.ts`**, **`coaching.ts`** (dashboard,
analytics, templates, messages, plans, timeline, bulk assignments),
**`games.ts`** (server game persistence + bulk upload + eval upload), and
**`sync.ts`** (platform sync trigger/overview, presence, and the
pending/claim/complete/release analysis-queue calls).

##### `src/lib/engine/`

**`uciEngine.ts`** — the `UciEngine` class: a pool of UCI Web Workers with a job
queue, `setMultiPv`/`setElo`, `evaluateGame()` (parallel per-position analysis +
post-processing into classifications/accuracy/Elo), `evaluatePositionWithUpdate()`
(live eval with partial callbacks), and `getEngineNextMove()` (bot moves).
**`worker.ts`** — `getEngineWorker`, `sendCommandsToWorker`, and
`getRecommendedWorkersNb()` (hardware heuristic). **`shared.ts`** — capability
detection (`isWasmSupported`, `isMultiThreadSupported`, `isEngineSupported`,
mobile/iOS checks). **`stockfish11/16/16_1/17.ts`** — thin factory classes that
choose the correct WASM path/threading/NNUE options for each engine build and
return a configured `UciEngine`.

**`helpers/parseResults.ts`** — parses UCI `info`/`bestmove` lines into
`PositionEval`/`LineEval` (normalizing perspective for Black).
**`helpers/winPercentage.ts`** — converts cp/mate to a 0–100 win %.
**`helpers/moveClassification.ts`** — `getMovesClassification()` assigns the
Opening/Forced/Best/Splendid/Perfect/…/Blunder tiers using win-% swings and
opening-book matches. **`helpers/accuracy.ts`** — the Lichess-style accuracy
formula. **`helpers/estimateElo.ts`** — average centipawn loss → estimated Elo.

#### `src/hooks/`

**`useAnalysisSession.ts`** — restores/persists analysis state from
sessionStorage + URL params (`gameId`, base64 `pgn`), integrating IndexedDB and
the analysis atoms. **`useAnalyzeGame.ts`** — runs a full-game Stockfish analysis
and writes results to the eval atom, IndexedDB, server sync, and the saved-evals
cache. **`useEngine.ts`** — instantiates the right Stockfish factory and shuts
down the previous engine on change. **`useChessActions.ts`** — chess.js
mutations (`playMove`, `undoMove`, `goToMove`, …) with move sounds.

**`useGameDatabase.ts`** — the IndexedDB layer (CRUD + URL game loading, local
numeric id vs server UUID with eval polling). **`useGameApi.ts`** — TanStack
Query wrappers over the server games API. **`useGameData.ts`** — keeps a derived
"last move" atom in sync with chess.js history. **`usePlayersData.ts`** — resolves
player names/ratings/avatars from headers. **`usePalette.ts`** — the active theme
palette + `useCardSx()`. **`useAtomLocalStorage.ts`/`useLocalStorage.ts`** —
persistence hooks (Jotai-backed and standalone). **`useDebounce.ts`**,
**`useRouter.ts`** (thin React Router wrapper), and **`useScreenSize.ts`**
(responsive board sizing constants) round out the set.

#### `src/components/` (generic UI)

**Route guards & auth UI:** `RequireAuth.tsx`, `RoleRoute.tsx`, `GuestRoute.tsx`
(see §5.2), and `ConfirmLogoutDialog.tsx` (the sign-out confirmation modal).
**App shell helpers:** `ErrorBoundary.tsx` (catches render errors app-wide),
`Loading.tsx` (`LoadingSpinner`/`LoadingOverlay`), `PageContainer.tsx` (page
chrome), `Link.tsx`/`NavLink.tsx` (router links with an `href` prop), and
`LinearProgressBar.tsx`/`slider.tsx` (form/progress widgets).

**SEO & head:** `Head.tsx` (imperative document title/meta), `pageTitle.tsx`
(`PageTitle` with OG/Twitter tags), and `SchemaOrg.tsx` (JSON-LD for marketing
pages). **Brand & shortcuts:** `VoltChessLogo.tsx`, `KeyboardShortcuts.tsx`.
**Background workers (null-render):** `RouteAnalytics.tsx` (pageview events),
`LocalGameMigrationPrompt.tsx` (offers to upload local games once per device),
and `PlatformSyncOrchestrator.tsx` (the student-side sync + background analysis
loop described in §4.4/§5.5). `ThemeProvider.tsx` is a **legacy** dark/light
provider not mounted by the current `Layout` (superseded by `AppThemeProvider`).

**`components/board/`** — `index.tsx` (`Board`) is the interactive
`react-chessboard` wrapper (drag/click moves, promotion, best-move arrows,
optional eval bar and player headers, custom piece sets). `evaluationBar.tsx`,
`playerHeader.tsx`, `capturedPieces.tsx`, and `squareRenderer.tsx`
(highlights/markers/classification icons) are its supporting pieces; `states.ts`
holds the `pieceSetAtom`/`boardHueAtom`. **`components/prettyMoveSan/`** renders
SAN with chess-font glyphs.

#### `src/pages/` (routed screens)

**Auth:** `login.tsx` and `register.tsx` wrap their forms in `GuestRoute`;
`register.tsx` now includes the coach/student `RoleSelector`, password
visibility, inline confirmation, and **auto-login** after signup.
**Core product:** `index.tsx` (authenticated home with onboarding + game
loader), `analysis.tsx` (the full Stockfish analysis workspace), `review.tsx`
(read-only saved-report viewer), `database.tsx` (DataGrid of local + server
games), `play.tsx` (play-vs-engine, work-in-progress), `puzzles.tsx` (tactics
trainer), and `openings.tsx` (an opening study catalog). **Marketing/legal:**
`thanks.tsx`, `terms-and-conditions.tsx`, and `blog/index.tsx` + `blog/post.tsx`.

**`pages/coach/`** — all wrapped in `RoleRoute([Coach, Admin])` and rendered
inside the shared `CoachShell`: `index.tsx` (the dashboard "Command Center"),
`students.tsx` (roster + profile editing), `student-detail.tsx` (per-student
dossier with stats/exports), `assignments.tsx` (create + Kanban + bulk),
`templates.tsx` (lesson templates), `messages.tsx` (compose/history),
`plans.tsx` (training plans), and `analytics.tsx` (cohort charts).
**`pages/student/index.tsx`** is the student hub (synced reports, assignments,
`StudentPlatformCard`, `JoinClassroomCard`, coach messages).

#### `src/sections/` (feature building blocks)

**`auth/`** — `AuthLayout.tsx` (the centered Academy-branded card around the
login/register forms) and `RoleSelector.tsx` (the two-card Student/Coach picker
introduced in the auth rework; reusable by any future role-selection flow).

**`layout/`** — `index.tsx` (`Layout`, the app shell: auth pages get theme only,
everything else gets the sidebar + main content), `Sidebar.tsx` (role-aware
navigation, desktop drawer + mobile bar; exports `SIDEBAR_WIDTH`),
`SidebarAccount.tsx` (the account block / sign-in CTA / sign-out with
confirmation, in desktop and mobile variants), and `AppThemeProvider.tsx` (the
MUI theme provider described in §5.4).

**`analysis/`** — the analysis workspace. Top level: `AnalysisPageLayout.tsx`
(the board + right-panel shell), `AnalysisPanelTabs.tsx` (the Report/Engine/
Settings tab strip), `AnalysisEmptyState.tsx`, `EvaluationGraphSection.tsx`,
`EvaluationProgress.tsx`, `states.ts` (the analysis Jotai atoms: `gameAtom`,
`boardAtom`, `gameEvalAtom`, `currentPositionAtom`, settings, progress, saved
evals), `board/index.tsx` (`BoardContainer` wiring the shared board to those
atoms), `chessigma/classifications.ts`, and `hooks/useCurrentPosition.ts` (keeps
the current-position eval in sync, running live eval for off-mainline moves).

The `analysis/panel/` folder holds the report/engine UI: `ReportTabPanel.tsx`
(the main Report orchestrator) and `ReportViewerPanel.tsx` (its read-only
counterpart on `/review`); the report sections `AccuracyOverview`, `EloOverview`,
`PlayerStatsPanel`, `ClassificationGoodBad`, `CriticalAnalysis`, `EvalLeadPanel`,
`SplitShareBar`, `GameMovesCard`, and `MoveAnnotations` (coach notes);
`AnalysisTabPanel` plus `EngineLinesPanel`, `EngineEvalBar`,
`EnginePositionTracker`, and `FollowBestLineButton` for the Engine tab;
`AnalysisBottomNav` (move navigation); `SettingsTabPanel` (engine/board/theme
settings); and the style/label constants `classificationLabels.ts`,
`reportColors.ts`, plus `ReportSection.tsx`. The `analysis/panelHeader/` folder
now contains just the still-used `analyzeButton.tsx` (auto-runs analysis once per
PGN) and `loadGame.tsx`. The `analysis/panelBody/` folder retains the active
`classificationTab/movesPanel/*` (the move list embedded in `GameMovesCard`) and
`graphTab/*` (the Recharts evaluation graph).

**`coach/`** — `CoachShell.tsx` (the coach nav shell), `CoachUi.tsx` (shared
`CoachStatCard`/`CoachPageHeader`/`CoachEmptyState` primitives),
`ClassroomPanel.tsx` (classroom name/code management + regenerate),
`JoinClassroomCard.tsx` (the student-side verify-then-join flow), and
`constants.ts` (nav + assignment/priority option lists). **`student/`** —
`StudentPlatformCard.tsx` (connect a Chess.com/Lichess username and trigger
sync).

**`play/`** — `board.tsx` (`BoardContainer` for human-vs-engine),
`gameInProgress.tsx`, `gameRecap.tsx`, `undoMoveButton.tsx`, `states.ts` (play
atoms), and `gameSettings/*` (the pre-game configuration dialog).
**`loadGame/`** — `loadGameButton.tsx`/`loadGameDialog.tsx` (the load-game
modal), `loadGameInlinePanel.tsx` (inline variant for the empty Report tab), the
platform inputs (`chessComInput.tsx`, `lichessInput.tsx`, `gamePgnInput.tsx`),
and `gameItem/*` (the result row + chips). **`home/`** — `HomeGameLoader.tsx`
(the home-page tabbed loader) and `FeatureCard.tsx`. **`engineSettings/`** —
`engineSettingsDialog.tsx` (engine/depth/multiPV/threads/board options) and
`arrowOptions.tsx`. **`onboarding/`** — `WelcomeModal.tsx`, `SpotlightTour.tsx`,
`AnalysisTour.tsx`, `loadOnboardingGame.ts`, `onboardingStorage.ts`, and
`constants.ts` (the first-run experience). **`blog/`** — `BlogArticle.tsx`
(renders a post with SEO/schema).

#### `src/theme/` and `src/data/`

**`theme/colorThemeAtom.ts`** (the persisted palette id), **`theme/themes.ts`**
(palette definitions + `getPalette`), **`theme/voltchessTheme.ts`**
(`createAppTheme` MUI builder), and **`theme/buttonStyles.ts`** (reusable accent
button `sx`). **`data/openings.ts`** (the opening-detection dataset used by
analysis), **`data/blogPosts.ts`** (`BLOG_POSTS` + `getBlogPost`), and
**`data/seo.ts`** (`DEFAULT_SEO`/`SITE_URL`).

---

## 6. Cross-cutting reference

- **Auth tokens:** localStorage keys `access` / `refresh`; cached profile under
  `voltchess_user`. Cleared together by `clearAuthStorage()`.
- **Key env vars:** `VITE_API_URL` (backend base URL),
  `VITE_ENABLE_AUTHENTICATION` (`false` to run analysis-only),
  `API_PROXY_TARGET` (dev proxy target), `VITE_SENTRY_DSN`, `VITE_FIREBASE_*`.
  Backend: `USE_SQLITE`, `DJANGO_DEBUG`, `DJANGO_SECRET_KEY`,
  `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`.
- **Adding a backend endpoint:** add to the app's `views.py` + `urls.py`, then a
  typed client in `src/lib/api/<domain>.ts` (re-exported by `src/lib/api/index.ts`).
- **Adding a page:** create it under `src/pages/`, lazy-import it in `App.tsx`,
  and place it in the correct guard tier (`RequireAuth` and/or `RoleRoute`).

