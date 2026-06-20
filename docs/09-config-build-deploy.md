# Configuration, Build & Deployment Files

This document explains every configuration, build, and deployment file in the
repository root, the `scripts/` folder, and the project's documentation files —
the "plumbing" that turns the source code into a running website. As with the
other guides, it is written so a non-coder can follow along; jargon is defined
the first time it appears.

**Quick primer:** *Building* means taking the human-written source code and
turning it into a small set of files a browser can actually run (this is what
`npm run build` does, producing the `dist/` folder). *Configuration files* tell
the various tools (the bundler Vite, the type-checker TypeScript, the linter
ESLint, the host Vercel) how to do their jobs. *Deployment* means copying the
built site to a server so the public can reach it.

## Table of contents

- [`index.html`](#indexhtml)
- [`package.json`](#packagejson)
- [`package-lock.json`](#package-lockjson)
- [`tsconfig.json`](#tsconfigjson)
- [`vite.config.ts`](#viteconfigts)
- [`vite.config.github.ts`](#viteconfiggithubts)
- [`vercel.json`](#verceljson)
- [`.eslintrc.json`](#eslintrcjson)
- [`.eslintignore`](#eslintignore)
- [`.prettierrc`](#prettierrc)
- [`.gitignore` / `.gitattributes`](#gitignore--gitattributes)
- [`cdk.json`](#cdkjson)
- [`deploy.bat`](#deploybat)
- [`scripts/deploy.py`](#scriptsdeploypy)
- [`scripts/_fix_pi_tunnel.py`](#scripts_fix_pi_tunnelpy)
- [`scripts/postbuild-spa.mjs`](#scriptspostbuild-spamjs)
- [`backend/requirements.txt`](#backendrequirementstxt)
- [`backend/.env.example`](#backendenvexample)
- [`public/`](#public)
- [Documentation files](#documentation-files)

---

## `index.html`

**In one sentence:** The single HTML page that the entire React app is injected
into — the literal front door of the website.

**What it is & why it exists (plain English):** A website always starts with an
HTML file. VoltChess is a "single-page application" (SPA), meaning there is just
*one* HTML file (`index.html`) and JavaScript swaps the visible content in and
out as you navigate, instead of loading a fresh page from the server each time.
This file is mostly a `<head>` full of **meta tags** — invisible labels that tell
Google and social networks the page's title, description, keywords, and preview
image (this is "SEO", search-engine optimization). The visible app is mounted
into an empty `<div id="root">` near the bottom.

**How it works, step by step:** The browser loads `index.html`; the `<head>`
sets the title, favicon, web-app manifest, and SEO/social meta tags; then a
`<script type="module" src="/src/main.tsx">` tag tells the browser to run the
app's entry point, which renders React into `#root`. During `npm run build`, Vite
rewrites that script tag to point at the final bundled JavaScript and inlines
everything into one file.

**Connections:** Loads `/src/main.tsx` (the app entry). References static assets
in `public/` (favicon, logo, manifest). Vite transforms it at build time.

---

## `package.json`

**In one sentence:** The project's "ID card and recipe book" for the frontend —
it lists the project's dependencies and the commands you can run.

**What it is & why it exists (plain English):** Every JavaScript/TypeScript
project has a `package.json`. It names the project, lists every third-party
library the app needs (`dependencies`, e.g. React, MUI, chess.js) and every tool
needed only while developing (`devDependencies`, e.g. Vite, ESLint, TypeScript),
and defines named shortcuts called **scripts** that you run with `npm run <name>`.

**Functions, classes & important values (the scripts):**
- `dev` → `vite`: starts the local development server (hot-reloading) at
  http://localhost:3000.
- `build` → `tsc && vite build && node scripts/postbuild-spa.mjs`: type-checks,
  produces the optimized `dist/` site, then copies `index.html` to `404.html`
  for deep-link support.
- `build:github` / `build:static`: alternate builds using the other Vite configs.
- `start` → `vite preview`: serves the already-built `dist/` locally to preview
  the production build.
- `lint` → `eslint … && tsc --noEmit`: checks code style/quality and that the
  types are valid. Must be green before merging.
- `deploy` → lint + build + `cdk deploy`: a legacy AWS deploy path (see
  `cdk.json`).

**Connections:** Read by `npm`. The `dependencies` are installed into
`node_modules/`. Scripts invoke Vite, TypeScript, ESLint, and the `scripts/`
helpers.

---

## `package-lock.json`

**In one sentence:** An auto-generated, exact record of every installed package
version (and their sub-packages) so installs are perfectly reproducible.

**What it is & why it exists (plain English):** `package.json` says *roughly*
which versions are acceptable (e.g. "MUI 6 or newer"). The lock file pins the
*exact* version that was actually installed, plus every nested dependency, so that
everyone — and every server — installs byte-for-byte the same code. You never
edit this by hand; `npm install` maintains it.

**Connections:** Generated/used by `npm install`. Should be committed to git.

---

## `tsconfig.json`

**In one sentence:** The settings file for TypeScript, the tool that adds type
safety to JavaScript.

**What it is & why it exists (plain English):** TypeScript is JavaScript with
"types" — labels that describe the shape of data so mistakes are caught before
the app runs. This file tells the type-checker which files to check and how
strict to be. Notably it enables `strict` mode and `noUnusedLocals`/
`noUnusedParameters` (so dead variables are flagged), and it defines the `@/`
path alias so imports can be written `@/components/...` instead of long relative
paths.

**Key settings:** `target`/`module` (which JavaScript version to emit),
`jsx: react-jsx` (understands React syntax), `noEmit: true` (only checks, doesn't
output files — Vite does the actual compiling), `paths: { "@/*": ["./src/*"] }`
(the alias), and `include` limited to `src/**` plus `vite.config.ts`.

**Connections:** Used by `tsc` (in `npm run lint`/`build`), by the editor, and by
ESLint (which references this file). The `@/` alias is mirrored in the Vite
configs.

---

## `vite.config.ts`

**In one sentence:** The main configuration for Vite, the tool that runs the dev
server and builds the production site.

**What it is & why it exists (plain English):** Vite is the "build tool" — in
development it serves the app instantly with hot-reload; for production it bundles
everything into `dist/`. This file configures both. It enables the React plugin,
the **single-file** plugin (which inlines all JS/CSS into one `index.html` so the
site can be hosted anywhere), the `@/` path alias, and special HTTP headers
(`Cross-Origin-Embedder-Policy`/`Opener-Policy`) that the browser requires to run
Stockfish's multi-threaded WebAssembly.

**Key settings:** `server.port: 3000`; `server.proxy` forwards any request to
`/api` to the backend at `http://127.0.0.1:8000` (overridable via
`API_PROXY_TARGET`) so the frontend and backend feel like one origin during
development; `base` switches between root and relative asset paths depending on
the host; `build.outDir: "dist"` with code-splitting disabled for the single-file
output.

**Connections:** Used by `npm run dev` and `npm run build`. The proxy points at
the Django backend. The COOP/COEP headers are also set in `vercel.json` for
production.

---

## `vite.config.github.ts`

**In one sentence:** An alternate Vite build config specifically for hosting on
GitHub Pages.

**What it is & why it exists (plain English):** GitHub Pages serves a site from a
sub-path like `username.github.io/VoltChess/`, so asset links must be prefixed
with `/VoltChess/`. This config is identical to the main one except it sets
`base: "/VoltChess/"` in production. It is used by the `build:github` script.

**Connections:** Used only by `npm run build:github`. Otherwise mirrors
`vite.config.ts`.

---

## `vercel.json`

**In one sentence:** Tells Vercel (the primary frontend host) how to build and
serve the site.

**What it is & why it exists (plain English):** Vercel is the cloud platform that
hosts the public frontend. This file sets the build command (`npm run build`) and
output folder (`dist`), repeats the COOP/COEP headers Stockfish needs, adds
long-cache headers for the large engine files under `/engines/`, and — crucially
— **rewrites every URL to `/index.html`**. That last rule is what lets a
single-page app handle deep links like `/coach/students` without a 404: the
server always returns the one HTML file and React figures out which screen to
show.

**Connections:** Read by Vercel at deploy time. Mirrors headers from
`vite.config.ts`; the rewrite is the production equivalent of the dev proxy's
SPA behavior (and of the `404.html` produced by `postbuild-spa.mjs`).

---

## `.eslintrc.json`

**In one sentence:** Configuration for ESLint, the tool that enforces code style
and catches likely bugs.

**What it is & why it exists (plain English):** A "linter" reads your code and
flags problems — unused variables, inconsistent quotes, risky React patterns,
formatting that doesn't match the agreed style. This file lists the rule sets
(presets for TypeScript, React hooks, imports, Prettier, etc.) and a few custom
rules (force double quotes, treat unused variables as errors unless prefixed with
`_`). Note `import/no-unresolved` is turned **off** here because TypeScript
already validates the `@/` alias and modules.

**Connections:** Used by `npm run lint`. References `tsconfig.json`. Works with
`.prettierrc` (formatting) and `.eslintignore` (files to skip).

---

## `.eslintignore`

**In one sentence:** Lists files/folders ESLint should not check.

**What it is & why it exists (plain English):** Some files shouldn't be linted —
the two Vite config files (path-resolution quirks), the huge generated Stockfish
engine files under `public/engines/`, and build output (`dist/`, `build/`). This
file lists them so the linter skips them and stays fast and noise-free.

**Connections:** Read by ESLint during `npm run lint`.

---

## `.prettierrc`

**In one sentence:** Configuration for Prettier, the automatic code formatter.

**What it is & why it exists (plain English):** Prettier reformats code into one
consistent style (indentation, line breaks, commas) so nobody argues about
formatting. This tiny file sets the preferences: trailing commas in the ES5
style, two-space indentation, and semicolons on. ESLint runs Prettier as part of
linting, so badly formatted code fails `npm run lint`.

**Connections:** Used by ESLint (via the Prettier plugin) and editor format-on-save.

---

## `.gitignore` / `.gitattributes`

**In one sentence:** Tell git which files to ignore and how to handle certain
file types.

**What it is & why it exists (plain English):** `.gitignore` lists things that
should never be committed to version control — installed packages
(`node_modules/`), build output (`dist/`), secrets (`.env`), the local database
(`db.sqlite3`), and the Python virtual environment (`backend/.venv`).
`.gitattributes` configures how git treats files (e.g. line endings / binary
handling). The backend also has its own `backend/.gitignore` for Python-specific
artifacts.

**Connections:** Used by git. Keeps generated and secret files out of the repo.

---

## `cdk.json`

**In one sentence:** Configuration for the AWS CDK (Cloud Development Kit) — a
legacy/optional infrastructure-as-code deploy path.

**What it is & why it exists (plain English):** AWS CDK lets you describe cloud
infrastructure in code. This file points the CDK at an app entry (`cdk/app.ts`)
and sets feature flags. **Note:** the referenced `cdk/` source does not exist in
the current repository, so this is effectively vestigial — VoltChess now deploys
the frontend via Vercel and the backend via the Raspberry Pi scripts. Treat
`cdk.json` (and the `deploy` npm script that calls `cdk deploy`) as legacy unless
the CDK app is reintroduced.

**Connections:** Referenced by the `deploy` script in `package.json`. Inherited
from the upstream Chesskit project.

---

## `deploy.bat`

**In one sentence:** A Windows double-click script that runs the whole
deployment pipeline.

**What it is & why it exists (plain English):** This is a Windows batch file
(a list of commands the Command Prompt runs). It is a friendly wrapper around
`scripts/deploy.py`: it checks that Python, the `paramiko` SSH library, and npm
are installed, parses simple arguments (`backend`, `sync`, `no-push`, or an SSH
password), and then calls the Python deploy script. It exists so a non-technical
maintainer can deploy by double-clicking instead of memorizing commands.

**How it works, step by step:** verify Python/npm exist → install `paramiko` if
missing → translate the friendly argument (e.g. `backend` → `--backend-only`)
into the Python script's flags → run `scripts/deploy.py` with those flags →
report success/failure and pause so the window stays open.

**Connections:** Calls `scripts/deploy.py`. Mirrors that script's options.

---

## `scripts/deploy.py`

**In one sentence:** The real deployment program — it ships the backend to the
Raspberry Pi and builds/publishes the frontend.

**What it is & why it exists (plain English):** This Python script automates the
full release. The production setup is: a Django backend running on a Raspberry Pi
(reachable at `https://api.voltchess.me` via a Cloudflare tunnel) plus the
frontend hosted on Vercel. The script can deploy both or either half.

**How it works, step by step:** It checks the Node toolchain and `paramiko`
(an SSH library for connecting to the Pi). For the **backend**, it packages the
`backend/` folder into a tar archive (skipping secrets, the virtual environment,
the database, and caches), copies it to the Pi over SSH, installs/migrates, and
restarts the service — then verifies the Pi's `/api/health/` endpoint responds.
For the **frontend**, it builds the site with the production API URL baked in and
copies/pushes it so Vercel publishes it. Command-line flags control scope
(`--backend-only`, `--frontend-only`, `--no-push`).

**Connections:** Invoked by `deploy.bat`. SSHes to the Pi defined by the `HOST`/
`USER`/`REMOTE` constants. Builds the frontend via `npm run build`.

---

## `scripts/_fix_pi_tunnel.py`

**In one sentence:** A small troubleshooting script that restarts the Pi's API
and tunnel services and checks they're healthy.

**What it is & why it exists (plain English):** Sometimes the Pi's backend
service or its Cloudflare tunnel needs a kick. This script SSHes into the Pi
(using an SSH password passed as an argument) and runs a fixed list of
maintenance commands: restart the `voltchess-api` and `voltchess-tunnel` systemd
services, wait, then curl the health and coach-dashboard endpoints and print the
public API URL and recent tunnel logs. It is a manual operations helper, not part
of normal deployment.

**Connections:** Uses `paramiko` to SSH to the same Pi as `deploy.py`.

---

## `scripts/postbuild-spa.mjs`

**In one sentence:** A tiny post-build step that copies `dist/index.html` to
`dist/404.html` so deep links work on static hosts.

**What it is & why it exists (plain English):** On some static hosts, visiting a
deep link like `/coach/students` directly would return a "404 Not Found" because
no such file exists — only `index.html` does. By copying `index.html` to
`404.html`, the host serves the app for unknown paths, and React Router then
shows the correct screen. This runs automatically at the end of `npm run build`.

**How it works, step by step:** confirm `dist/index.html` exists (error out if
not) → copy it to `dist/404.html` → print a confirmation line.

**Connections:** Invoked by the `build` script in `package.json`. Complements the
`rewrites` rule in `vercel.json`.

---

## `backend/requirements.txt`

**In one sentence:** The list of Python libraries the Django backend needs.

**What it is & why it exists (plain English):** The Python equivalent of the
frontend's `package.json` dependency list. Running
`pip install -r backend/requirements.txt` installs everything the backend uses:
Django (the web framework), Django REST Framework (for building the API),
SimpleJWT (login tokens), CORS headers, the PostgreSQL driver, Gunicorn (the
production server), `python-dotenv` (reads the `.env` file), `requests` (HTTP
calls to Chess.com/Lichess), and `python-chess` (server-side chess logic for
fallback analysis).

**Connections:** Used when setting up `backend/.venv`. Each entry pins a safe
version range.

---

## `backend/.env.example`

**In one sentence:** A template showing which environment variables the backend
expects, with safe placeholder values.

**What it is & why it exists (plain English):** Secrets and machine-specific
settings (database passwords, the Django secret key, allowed hosts) must not live
in code. They go in a `backend/.env` file, which is git-ignored. This `.example`
file documents every variable you can set so a new developer can copy it to
`.env` and fill in real values. For local development the important ones are
`USE_SQLITE=true` and `DJANGO_DEBUG=true`.

**Key variables:** `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`,
`USE_SQLITE` (and the Postgres settings used when it's `false`),
`CORS_ALLOWED_ORIGINS`, `GUNICORN_*`, and `STOCKFISH_PATH` (for server-side
analysis).

**Connections:** Copied to `backend/.env`, which `settings.py` reads via
`python-dotenv`.

---

## `public/`

**In one sentence:** Static files served as-is, most importantly the Stockfish
WebAssembly chess engines.

**What it is & why it exists (plain English):** Anything in `public/` is copied
verbatim into the built site without processing. This includes the favicon, logo,
web-app manifest, chess piece images (`public/piece/`), move sounds, and — by far
the largest — the Stockfish engines under `public/engines/` (multiple versions
and "lite" variants, each a `.js` loader plus a `.wasm` binary). The browser
downloads these on demand to analyze games locally.

**Connections:** Loaded at runtime by `src/lib/engine/*` (the engine workers
fetch `/engines/...`). Cached aggressively via `vercel.json` headers.

---

## Documentation files

The repository also contains human documentation (Markdown). These are
reference/prose, not code:

- **`README.md`** — the project's front page: what VoltChess is and the basic
  dev commands.
- **`ARCHITECTURE.md`** — the high-level architecture map (a companion to this
  detailed `docs/` set): how the backend/frontend fit together, the data model,
  the URL map, and a condensed per-file reference.
- **`AGENTS.md`** — operating notes for AI/cloud agents and developers: how to
  run the services, non-obvious caveats, and lint/test commands. Points here for
  detail.
- **`CONTRIBUTING.md`** — how to contribute (links to setup, Discord, the
  backlog).
- **`SECURITY.md`** — how to report security issues.
- **`COPYING.md`** / **`LICENCE`** — license terms (the project is AGPL-3.0) and
  third-party asset attributions (piece sets, sounds).
- **`backend/DEPLOY_PI.md`** — step-by-step guide to deploying the backend on a
  Raspberry Pi.
- **`backend/PI_CONTINUOUS_ANALYSIS.md`** — explains the continuous/server-side
  analysis setup on the Pi.

**Connections:** These are entry points for humans. The `docs/` folder
(`01`–`09`) is the exhaustive per-file companion; `README.md` and `ARCHITECTURE.md`
link readers to it.
