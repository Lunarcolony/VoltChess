# VoltChess Backend — Complete File-by-File Guide

This document is a beginner-friendly, exhaustive tour of the **VoltChess Django backend** — the server-side program that lives under `backend/`. It documents *every* Python source file in that folder (skipping only the virtual environment, Python's `__pycache__` caches, and the auto-generated `migrations/` files, which are summarized per app instead). For each file you'll find: a one-sentence summary, a plain-English explanation of what it is and why it exists, a step-by-step walk through its logic, a breakdown of every class/function/important value, and how it connects to the rest of the system. The goal is that *even a non-coder* can read this and understand exactly how each piece works.

## How the backend fits together (a plain-English primer)

VoltChess is an online chess-coaching platform. Coaches run "academies/classrooms," students join, students' games are imported from Chess.com and Lichess, every game gets analyzed (move-by-move accuracy and mistakes), and coaches assign homework, leave notes, send messages, and track progress. The backend is the "brain on the server" that stores all this data and answers requests from the website.

A few core technologies are used. Understanding these four terms makes the whole codebase readable:

- **Django** is the Python *web framework* — the toolkit that handles incoming web requests, talks to the database, and sends responses. Think of it as the foundation and plumbing of the server.
- **A database** is the permanent filing cabinet where all data lives (users, games, assignments, etc.). Django talks to it through **models** — Python classes where each class is a table and each object is a row. VoltChess uses PostgreSQL in production and can use SQLite (a simple file-based database) for local development.
- **DRF (Django REST Framework)** is an add-on that makes it easy to build an **API** — a set of web addresses (URLs) the website calls to read and write data, exchanging **JSON** (a simple text format for structured data). DRF introduces two key helpers: a **serializer** (the translator between database rows and the JSON the website sends/receives) and a **view** (the code that runs when the app calls a specific web address).
- **JWT (JSON Web Token)** is how logins work without the server having to remember each session. When you log in, the server hands your browser a signed token (like a tamper-proof wristband). Your browser sends that token with every request to prove who you are. VoltChess uses the `djangorestframework-simplejwt` library for this.

The backend is organized into **apps** — self-contained folders that each own one slice of the product:

- `voltchess_api/` — the project itself (global settings, the master URL list, the WSGI entry point).
- `accounts/` — users, roles (admin/coach/student), signup, login.
- `academies/` — academies, memberships, coach↔student links, classrooms with join codes, student stats/reports.
- `games/` — chess games and their analysis ("evals"), uploads.
- `assignments/` — homework coaches give students.
- `annotations/` — coach/student comments on specific moves in a game.
- `coaching/` — the coach dashboard, analytics, lesson templates, messages, training plans.
- `sync/` — importing games from chess platforms and routing analysis work between the student's browser and the server.

Inside each app you'll repeatedly see the same standard Django files: `models.py` (database tables), `serializers.py` (JSON translators), `views.py` (request handlers), `urls.py` (address-to-view mapping), `admin.py` (the built-in admin control panel), `apps.py` (app configuration), and `__init__.py` (marks the folder as a Python package).

## Table of contents

**Project (`voltchess_api/`) and entry point**
- [`backend/manage.py`](#backendmanagepy)
- [`backend/voltchess_api/__init__.py`](#backendvoltchess_api__init__py)
- [`backend/voltchess_api/settings.py`](#backendvoltchess_apisettingspy)
- [`backend/voltchess_api/urls.py`](#backendvoltchess_apiurlspy)
- [`backend/voltchess_api/wsgi.py`](#backendvoltchess_apiwsgipy)
- [`backend/voltchess_api/health.py`](#backendvoltchess_apihealthpy)

**`accounts/`**
- [`backend/accounts/__init__.py`](#backendaccounts__init__py)
- [`backend/accounts/apps.py`](#backendaccountsappspy)
- [`backend/accounts/admin.py`](#backendaccountsadminpy)
- [`backend/accounts/models.py`](#backendaccountsmodelspy)
- [`backend/accounts/serializers.py`](#backendaccountsserializerspy)
- [`backend/accounts/views.py`](#backendaccountsviewspy)
- [`backend/accounts/urls.py`](#backendaccountsurlspy)
- [`backend/accounts/tests.py`](#backendaccountstestspy)
- [`backend/accounts/management/__init__.py`](#backendaccountsmanagement__init__py)
- [`backend/accounts/management/commands/__init__.py`](#backendaccountsmanagementcommands__init__py)
- [`backend/accounts/management/commands/seed_demo.py`](#backendaccountsmanagementcommandsseed_demopy)

**`academies/`**
- [`backend/academies/__init__.py`](#backendacademies__init__py)
- [`backend/academies/apps.py`](#backendacademiesappspy)
- [`backend/academies/admin.py`](#backendacademiesadminpy)
- [`backend/academies/models.py`](#backendacademiesmodelspy)
- [`backend/academies/serializers.py`](#backendacademiesserializerspy)
- [`backend/academies/classroom_serializers.py`](#backendacademiesclassroom_serializerspy)
- [`backend/academies/classroom_codes.py`](#backendacademiesclassroom_codespy)
- [`backend/academies/permissions.py`](#backendacademiespermissionspy)
- [`backend/academies/views.py`](#backendacademiesviewspy)
- [`backend/academies/urls.py`](#backendacademiesurlspy)
- [`backend/academies/tests.py`](#backendacademiestestspy)

**`games/`**
- [`backend/games/__init__.py`](#backendgames__init__py)
- [`backend/games/apps.py`](#backendgamesappspy)
- [`backend/games/admin.py`](#backendgamesadminpy)
- [`backend/games/models.py`](#backendgamesmodelspy)
- [`backend/games/serializers.py`](#backendgamesserializerspy)
- [`backend/games/permissions.py`](#backendgamespermissionspy)
- [`backend/games/stats.py`](#backendgamesstatspy)
- [`backend/games/views.py`](#backendgamesviewspy)
- [`backend/games/urls.py`](#backendgamesurlspy)

**`assignments/`**
- [`backend/assignments/__init__.py`](#backendassignments__init__py)
- [`backend/assignments/apps.py`](#backendassignmentsappspy)
- [`backend/assignments/admin.py`](#backendassignmentsadminpy)
- [`backend/assignments/models.py`](#backendassignmentsmodelspy)
- [`backend/assignments/serializers.py`](#backendassignmentsserializerspy)
- [`backend/assignments/views.py`](#backendassignmentsviewspy)
- [`backend/assignments/urls.py`](#backendassignmentsurlspy)

**`annotations/`**
- [`backend/annotations/__init__.py`](#backendannotations__init__py)
- [`backend/annotations/apps.py`](#backendannotationsappspy)
- [`backend/annotations/admin.py`](#backendannotationsadminpy)
- [`backend/annotations/models.py`](#backendannotationsmodelspy)
- [`backend/annotations/serializers.py`](#backendannotationsserializerspy)
- [`backend/annotations/views.py`](#backendannotationsviewspy)
- [`backend/annotations/urls.py`](#backendannotationsurlspy)

**`coaching/`**
- [`backend/coaching/__init__.py`](#backendcoaching__init__py)
- [`backend/coaching/apps.py`](#backendcoachingappspy)
- [`backend/coaching/admin.py`](#backendcoachingadminpy)
- [`backend/coaching/models.py`](#backendcoachingmodelspy)
- [`backend/coaching/serializers.py`](#backendcoachingserializerspy)
- [`backend/coaching/services.py`](#backendcoachingservicespy)
- [`backend/coaching/views.py`](#backendcoachingviewspy)
- [`backend/coaching/urls.py`](#backendcoachingurlspy)

**`sync/`**
- [`backend/sync/__init__.py`](#backendsync__init__py)
- [`backend/sync/apps.py`](#backendsyncappspy)
- [`backend/sync/admin.py`](#backendsyncadminpy)
- [`backend/sync/models.py`](#backendsyncmodelspy)
- [`backend/sync/services.py`](#backendsyncservicespy)
- [`backend/sync/server_analysis.py`](#backendsyncserver_analysispy)
- [`backend/sync/platform_fetch.py`](#backendsyncplatform_fetchpy)
- [`backend/sync/views.py`](#backendsyncviewspy)
- [`backend/sync/urls.py`](#backendsyncurlspy)
- [`backend/sync/tests.py`](#backendsynctestspy)
- [`backend/sync/management/__init__.py`](#backendsyncmanagement__init__py)
- [`backend/sync/management/commands/__init__.py`](#backendsyncmanagementcommands__init__py)
- [`backend/sync/management/commands/run_platform_sync.py`](#backendsyncmanagementcommandsrun_platform_syncpy)

**Migrations**
- [Database migrations (all apps)](#database-migrations-all-apps)

---

## `backend/manage.py`

**In one sentence:** The command-line entry point you run to start the dev server, apply database changes, run tests, and execute any other Django command.

**What it is & why it exists (plain English):** Every Django project ships with a `manage.py`. It's the "remote control" for the project — a small script you type commands at, like `python manage.py runserver` (start the website) or `python manage.py migrate` (update the database). It exists so that all administrative tasks have one consistent, project-aware launcher.

**How it works, step by step:**
1. It sets an environment variable named `DJANGO_SETTINGS_MODULE` to `"voltchess_api.settings"` *if it isn't already set*. This tells Django which settings file to load (the project's configuration).
2. It tries to import Django's `execute_from_command_line` helper. If Django isn't installed, it raises a clear, friendly error explaining that Django couldn't be found.
3. It hands the command-line arguments (everything you typed after `manage.py`) to `execute_from_command_line`, which figures out and runs the right command.

**Functions, classes & important values:**
- `main()` — takes no parameters and returns nothing. It performs the three steps above: set the settings module, import Django's command runner, and run it with `sys.argv` (the list of words you typed on the command line). If the import fails it re-raises an `ImportError` with a helpful message.
- The `if __name__ == "__main__":` block at the bottom means "only run `main()` when this file is executed directly," which is the normal way `manage.py` is used.

**Connections:** Depends on `os` and `sys` (standard Python) and on Django's `django.core.management`. It points at `voltchess_api.settings` as the configuration. This is the file developers and deployment scripts invoke most often.

---

## `backend/voltchess_api/__init__.py`

**In one sentence:** An empty file that marks the `voltchess_api/` folder as a Python *package* so its modules can be imported.

**What it is & why it exists (plain English):** In Python, a folder only counts as an importable "package" if it contains a file named `__init__.py`. This one is empty on purpose — its mere presence is enough. Without it, statements like `from voltchess_api import settings` wouldn't work.

**How it works, step by step:** There is no logic here; Python simply runs this (empty) file the first time anything inside the package is imported.

**Functions, classes & important values:** None.

**Connections:** Enables every other module under `voltchess_api/` (`settings.py`, `urls.py`, `wsgi.py`, `health.py`) to be imported as `voltchess_api.<name>`.

---

## `backend/voltchess_api/settings.py`

**In one sentence:** The central configuration file that defines every global setting for the backend — database, installed apps, security, login tokens, and cross-site rules.

**What it is & why it exists (plain English):** This is the project's "control panel." Django reads it on startup to learn everything about how the project should behave: where the database is, which apps exist, how passwords are checked, how long a login lasts, and which other websites are allowed to talk to it. Centralizing all of this in one file means there is a single, predictable place to change behavior. Many values are read from *environment variables* (settings stored outside the code, e.g. in a `.env` file) so that secrets and per-machine differences never get hard-coded.

**How it works, step by step:**
1. `load_dotenv()` reads a `.env` file (if present) and loads its key=value pairs into environment variables.
2. `BASE_DIR` is computed as the `backend/` folder — used to build file paths.
3. `SECRET_KEY` and `DEBUG` are read from the environment with safe defaults. A guard raises `ImproperlyConfigured` if the project runs *not* in debug mode while still using the insecure default key — preventing an accidental insecure production launch.
4. `ALLOWED_HOSTS` parses a comma-separated list of permitted hostnames (or `*` for all).
5. `INSTALLED_APPS` lists Django's built-ins, the third-party apps (`corsheaders`, `rest_framework`, `rest_framework_simplejwt`), and all seven VoltChess apps.
6. `MIDDLEWARE` lists the chain of request/response processors (security, CORS, sessions, auth, etc.).
7. `DATABASES` defaults to PostgreSQL using environment variables; if `USE_SQLITE=true`, it switches to a local SQLite file (with a 30-second timeout to survive concurrent writes on a Raspberry Pi).
8. `AUTH_USER_MODEL = "accounts.User"` tells Django to use the custom user instead of the default.
9. CORS settings declare which front-end origins may call the API. JWT settings declare token lifetimes.

**Functions, classes & important values:**
- `BASE_DIR` — the project root path.
- `SECRET_KEY` — a secret string used to sign tokens and cookies; must be strong in production.
- `DEBUG` — `True`/`False`; controls verbose errors and the security guard.
- `ALLOWED_HOSTS` — list of hostnames the server will answer to.
- `INSTALLED_APPS` — the master list of enabled apps.
- `MIDDLEWARE` — ordered list of request/response hooks; note `corsheaders.middleware.CorsMiddleware` sits high so cross-origin headers are added.
- `DATABASES` — database connection config; Postgres by default, SQLite when `USE_SQLITE=true`.
- `AUTH_USER_MODEL` — `"accounts.User"`, the custom user model.
- `AUTH_PASSWORD_VALIDATORS` — the password-strength rules enforced everywhere.
- `CORS_ALLOWED_ORIGINS` / `CORS_ALLOWED_ORIGIN_REGEXES` / `CORS_ALLOW_CREDENTIALS` — which web front-ends may call the API (localhost, `https://voltchess.vercel.app`, and any `*.vercel.app` / `*.trycloudflare.com`).
- `REST_FRAMEWORK` — sets the default authentication to JWT and default permission to "must be logged in."
- `SIMPLE_JWT` — access tokens last 12 hours, refresh tokens 90 days, and refresh tokens rotate on each use (long, low-friction sessions).

**Connections:** Imports `os`, `datetime.timedelta`, `pathlib.Path`, `dotenv.load_dotenv`, and Django's `ImproperlyConfigured`. Referenced by virtually everything: `manage.py`, `wsgi.py`, and Django itself read it at startup. `INSTALLED_APPS` activates all the app folders documented below.

---

## `backend/voltchess_api/urls.py`

**In one sentence:** The master URL map that routes incoming web addresses to the correct app, plus the admin panel and health check.

**What it is & why it exists (plain English):** When a request comes in for a web address (like `/api/games/`), Django needs to know which code should handle it. This file is the top-level "switchboard." It says: addresses starting with `admin/` go to the built-in admin site; `/api/health/` goes to the health view; and everything under `/api/` is delegated to the individual apps' own URL files.

**How it works, step by step:**
1. `urlpatterns` is a list Django reads top to bottom.
2. `/api/health/` maps to the `health` view.
3. `admin/` maps to Django's admin site.
4. Seven `include(...)` lines mount each app's `urls.py` under the `/api/` prefix, so all the API endpoints share a common base path.

**Functions, classes & important values:**
- `urlpatterns` — the list of `path(...)` route definitions. Each `path` pairs a URL fragment with either a view or an `include()` of another URL module.

**Connections:** Imports Django's `admin`, `include`, `path`, and the local `health` view. It includes `accounts.urls`, `academies.urls`, `games.urls`, `assignments.urls`, `annotations.urls`, `coaching.urls`, and `sync.urls`. `settings.ROOT_URLCONF` points here, making it the entry point for all routing.

---

## `backend/voltchess_api/wsgi.py`

**In one sentence:** The standard handoff point that production web servers use to run the Django application.

**What it is & why it exists (plain English):** WSGI is the agreed-upon "doorway" standard between Python web apps and the servers that run them (like Gunicorn). When VoltChess is deployed, the web server imports the `application` object from this file and uses it to serve every request. In development you usually don't touch it.

**How it works, step by step:**
1. It sets `DJANGO_SETTINGS_MODULE` to the project settings (if not already set).
2. It calls `get_wsgi_application()` and stores the result in `application`, the object the production server looks for.

**Functions, classes & important values:**
- `application` — the WSGI callable Django builds; the server entry point.

**Connections:** Imports `os` and Django's `get_wsgi_application`; references `voltchess_api.settings`. Used by Gunicorn (listed in `requirements.txt`) in production.

---

## `backend/voltchess_api/health.py`

**In one sentence:** A tiny public endpoint that returns "ok" so monitoring tools can confirm the API is alive.

**What it is & why it exists (plain English):** A "health check" is a simple address a load balancer or uptime monitor can ping to ask "are you running?" It needs no login and does no real work — it just answers. This is essential for deployment so the platform knows the server is healthy.

**How it works, step by step:**
1. The `health` function is decorated to accept only HTTP `GET` requests and to allow *anyone* (no authentication).
2. When called, it returns a JSON response `{"status": "ok", "service": "voltchess-api"}`.

**Functions, classes & important values:**
- `health(_request)` — receives the incoming request (ignored, hence the underscore name) and returns a DRF `Response` with a small status dictionary. `@api_view(["GET"])` restricts it to GET; `@permission_classes([AllowAny])` removes the login requirement.

**Connections:** Imports DRF's `api_view`, `permission_classes`, `AllowAny`, and `Response`. Wired into the URL map by `voltchess_api/urls.py` at `/api/health/`.

---

## `backend/accounts/__init__.py`

**In one sentence:** Empty package marker for the `accounts` app.

**What it is & why it exists (plain English):** As with every Django app, this empty file makes `accounts/` an importable Python package. No behavior — just presence.

**How it works, step by step:** Nothing executes; it simply allows `accounts.<module>` imports.

**Functions, classes & important values:** None.

**Connections:** Enables imports of `accounts.models`, `accounts.views`, etc. `accounts` is listed in `INSTALLED_APPS`.

---

## `backend/accounts/apps.py`

**In one sentence:** The configuration class that registers the `accounts` app with Django.

**What it is & why it exists (plain English):** Each Django app has a small config class describing it. Django uses it during startup to load the app. It's boilerplate but required.

**How it works, step by step:** Django discovers `AccountsConfig`, reads its `name` ("accounts") to locate the app, and uses `default_auto_field` to decide the default type for automatically created ID columns.

**Functions, classes & important values:**
- `AccountsConfig` — subclass of `AppConfig`. `name = "accounts"` identifies the app; `default_auto_field = "django.db.models.BigAutoField"` sets the default primary-key field type (a large integer) for models that don't define their own.

**Connections:** Imports Django's `AppConfig`. Referenced indirectly via `INSTALLED_APPS`.

---

## `backend/accounts/admin.py`

**In one sentence:** Registers the custom `User` model in Django's admin panel with role-aware columns and forms.

**What it is & why it exists (plain English):** Django includes a ready-made web admin site for staff to view and edit data. Because VoltChess uses a *custom* user (with a `role` field), this file teaches the admin how to display and edit that extra field. The admin is how an operator can manually inspect or fix accounts.

**How it works, step by step:**
1. It imports Django's default `UserAdmin` (the standard user editor) and the project's `User` model.
2. It defines `UserAdmin` (overriding the default) and registers it for `User` with the `@admin.register(User)` decorator.
3. It customizes the list columns and filters, and appends a "VoltChess" section to both the edit form (`fieldsets`) and the add form (`add_fieldsets`) so `role` (and email on creation) appear.

**Functions, classes & important values:**
- `UserAdmin` (extends `BaseUserAdmin`):
  - `list_display = ("username", "email", "role", "is_staff")` — columns shown in the user list.
  - `list_filter = ("role", "is_staff")` — sidebar filters.
  - `fieldsets` / `add_fieldsets` — add a "VoltChess" group exposing `role` (and `email` when adding).

**Connections:** Imports Django's `admin` and `BaseUserAdmin`, plus the local `User` model. Works together with `accounts/models.py`. Visible at `/admin/`.

---

## `backend/accounts/models.py`

**In one sentence:** Defines the custom `User` model and the three account roles (admin, coach, student).

**What it is & why it exists (plain English):** This is the single most important model in the project — the *person* using VoltChess. Instead of Django's default user, VoltChess defines its own so it can add a `role` (admin/coach/student) and use a UUID (a long random unique ID) as the primary key. Roles drive nearly all permissions across the app.

**How it works, step by step:**
1. `UserRole` is a set of allowed role values defined as text choices.
2. `User` extends Django's `AbstractUser` (which already provides username, password, email, names, staff flags, etc.), then overrides the ID to be a random UUID, makes email unique, and adds the `role` field defaulting to "student."
3. After the class, `User.UserRole = UserRole` attaches the choices to the class so code elsewhere can write `User.UserRole.COACH`.

**Functions, classes & important values:**
- `UserRole(models.TextChoices)` — enumerates `ADMIN = "admin"`, `COACH = "coach"`, `STUDENT = "student"`. Each pairs a stored value with a human label.
- `User(AbstractUser)`:
  - `id` — a `UUIDField` primary key, defaulting to a new random UUID, not editable.
  - `email` — an `EmailField` marked unique (no two accounts share an email).
  - `role` — a `CharField` limited to the `UserRole` choices, default "student."
  - `__str__()` — returns the username (how a user prints in admin/logs).
- `User.UserRole = UserRole` — convenience alias used throughout the codebase for role checks.

**Connections:** Imports `uuid`, Django's `AbstractUser` and `models`. Activated as the project user via `AUTH_USER_MODEL` in settings. Referenced everywhere — serializers, permissions, and almost every other model points to this user via `settings.AUTH_USER_MODEL`.

---

## `backend/accounts/serializers.py`

**In one sentence:** Translators that validate signup data and shape user data into JSON for the API.

**What it is & why it exists (plain English):** A *serializer* is the translator between database rows and the JSON the website sends/receives. This file holds two: one for **registration** (taking signup form data, validating it, and creating a user) and one for **reading** a user's public profile. It centralizes all the rules for who can sign up and what a valid account looks like.

**How it works, step by step:**
1. `SELF_SIGNUP_ROLES` restricts public signups to coach or student — never admin (admins are created server-side only).
2. `RegisterSerializer` declares the writable fields, plus per-field validation: email is normalized and checked for uniqueness, username is checked for uniqueness, and the password is run through Django's configured strength validators.
3. Its `create()` builds the user using `create_user`, which correctly hashes the password.
4. `UserSerializer` is a read-only view of safe profile fields used by other apps when embedding user info.

**Functions, classes & important values:**
- `SELF_SIGNUP_ROLES` — tuple `(COACH, STUDENT)`; the only roles allowed at public registration.
- `RegisterSerializer`:
  - Fields: `username`, `email`, `password` (write-only), `role` (limited to the two self-signup roles).
  - `validate_email(value)` — lowercases/trims the email and rejects it if an account already uses it; returns the normalized email.
  - `validate_username(value)` — trims and rejects duplicates (case-insensitive); returns the cleaned username.
  - `validate_password(value)` — runs Django's `validate_password`; converts any failure into a clean field error; returns the password.
  - `create(validated_data)` — calls `User.objects.create_user(...)` with username/email/password/role and returns the new user.
- `UserSerializer` — read-only serializer exposing `id, username, email, role, first_name, last_name`; every field is read-only.

**Connections:** Imports Django's `get_user_model`, `validate_password`, the validation error type, DRF `serializers`, and the local `UserRole`. Used by `accounts/views.py`; `UserSerializer` is reused by `academies`, `assignments`, and `annotations` serializers to embed user details.

---

## `backend/accounts/views.py`

**In one sentence:** The request handlers for registering a new account and fetching the logged-in user's profile.

**What it is & why it exists (plain English):** A *view* is the code that runs when the app calls a specific web address. This file provides two: `RegisterView` (handles signups) and `MeView` (returns "who am I?" for the current user). Together with the JWT login views (provided by the library) these form the authentication surface.

**How it works, step by step:**
1. `RegisterView` is a DRF "create" view open to anyone. Its `create()` validates the incoming data with `RegisterSerializer`, saves the user, and returns a small success payload (username and role) with HTTP 201 ("created").
2. `MeView` requires a logged-in user; its `get()` returns the current user's profile via `UserSerializer`.

**Functions, classes & important values:**
- `RegisterView(generics.CreateAPIView)`:
  - `permission_classes = (AllowAny,)` — signup needs no login.
  - `serializer_class = RegisterSerializer`.
  - `create(request, ...)` — validates and saves the user; returns `{"detail", "username", "role"}` with status 201.
- `MeView(APIView)`:
  - `permission_classes = (IsAuthenticated,)` — must be logged in.
  - `get(request)` — returns the serialized current user (`request.user`).

**Connections:** Imports DRF `generics`, `permissions`, `status`, `Response`, `APIView`, and the two local serializers. Wired up in `accounts/urls.py`. Relies on the JWT auth configured in settings to populate `request.user`.

---

## `backend/accounts/urls.py`

**In one sentence:** Maps the authentication endpoints (token login, token refresh, register, me) to their handlers.

**What it is & why it exists (plain English):** This is the account app's slice of the URL switchboard. It exposes how clients log in (get a token), refresh that token, sign up, and read their own profile.

**How it works, step by step:** `urlpatterns` lists four routes. Two reuse the SimpleJWT library's built-in views to issue and refresh tokens; the other two point at the app's own `RegisterView` and `MeView`.

**Functions, classes & important values:**
- `urlpatterns`:
  - `token/` → `TokenObtainPairView` (log in with username/password, receive access+refresh tokens).
  - `token/refresh/` → `TokenRefreshView` (exchange a refresh token for a fresh access token).
  - `register/` → `RegisterView`.
  - `me/` → `MeView`.

**Connections:** Imports Django's `path`, SimpleJWT's two token views, and the local views. Included under `/api/` by `voltchess_api/urls.py`, producing e.g. `/api/token/` and `/api/me/`.

---

## `backend/accounts/tests.py`

**In one sentence:** Automated tests verifying that registration enforces role rules and validation.

**What it is & why it exists (plain English):** Tests are small programs that automatically check the real code still behaves correctly. This file focuses on the signup endpoint — proving students and coaches can register, admins cannot, and that duplicate/weak inputs are rejected. They protect against future accidental breakage.

**How it works, step by step:** Using DRF's `APITestCase` (which spins up a temporary database and a fake HTTP client), each test posts data to `/api/register/` and asserts on the response status code and the resulting database state. A `_payload()` helper builds a valid default body that individual tests override.

**Functions, classes & important values:**
- `RegisterRoleTests(APITestCase)`:
  - `_payload(**overrides)` — returns a valid registration dict, with optional overrides; used by every test.
  - `test_register_as_student` / `test_register_as_coach` — expect 201 and the correct stored role.
  - `test_admin_role_is_rejected` — posting `role="admin"` must return 400 and create no user.
  - `test_missing_role_is_rejected` — omitting role returns 400.
  - `test_duplicate_username_is_rejected` / `test_duplicate_email_is_rejected` — duplicates return 400 with the offending field named.
  - `test_weak_password_is_rejected` — a trivial password (`"123"`) returns 400 and no user.
- `REGISTER_URL = "/api/register/"` — the endpoint under test.

**Connections:** Imports `get_user_model` and DRF's `APITestCase`. Exercises `accounts/views.py`, `accounts/serializers.py`, and `accounts/urls.py`. Run with `python manage.py test accounts`.

---

## `backend/accounts/management/__init__.py`

**In one sentence:** Empty marker making `accounts/management/` a Python package so custom commands can live here.

**What it is & why it exists (plain English):** Django looks for custom command files inside a `management/commands/` folder. For Python to treat these folders as packages, each needs an `__init__.py`. This one is empty.

**How it works, step by step:** No logic; presence enables the package.

**Functions, classes & important values:** None.

**Connections:** Required for `accounts/management/commands/` to be discovered.

---

## `backend/accounts/management/commands/__init__.py`

**In one sentence:** Empty marker making the `commands` folder a Python package where management commands are auto-discovered.

**What it is & why it exists (plain English):** Django automatically finds any `*.py` file in `management/commands/` and turns it into a `manage.py` subcommand. This empty file is the prerequisite that makes that folder importable.

**How it works, step by step:** No logic; presence enables discovery of `seed_demo.py`.

**Functions, classes & important values:** None.

**Connections:** Enables the `seed_demo` command below.

---

## `backend/accounts/management/commands/seed_demo.py`

**In one sentence:** A `manage.py seed_demo` command that creates ready-to-use demo coach/student accounts, an academy, a classroom, a link, and a sample assignment for local testing.

**What it is & why it exists (plain English):** When developing locally, you need realistic data to click around. This command builds a small, consistent demo world in one step so you don't have to create everything by hand. Running `python manage.py seed_demo` gives you a coach and a student you can log in as immediately.

**How it works, step by step:**
1. `handle()` creates (or fetches) a coach and a student using `get_or_create`, then forces their passwords to `demo1234` and confirms their roles — so re-running is safe and predictable (idempotent).
2. It creates a demo `Academy` and adds both users as `Membership`s (coach + student roles).
3. It creates a `CoachStudentLink` joining coach→student, and if no platform account is set yet, points the student at Lichess username "DrNykterstein" with sync enabled.
4. It gets-or-creates the coach's `Classroom` (via the helper) and renames it.
5. It creates a sample `Assignment` for the student.
6. It prints the demo logins and the classroom join code to the terminal.

**Functions, classes & important values:**
- `DEMO_PASSWORD = "demo1234"` — the shared demo password.
- `Command(BaseCommand)`:
  - `help` — the description shown by `manage.py help`.
  - `handle(*args, **options)` — runs all the seeding steps above; takes no custom arguments; produces console output and database rows.

**Connections:** Imports `get_user_model`, `BaseCommand`, and models/helpers from `academies` (`Academy, Classroom, CoachStudentLink, Membership, MembershipRole`, `get_or_create_classroom_for_coach`), `accounts` (`UserRole`), and `assignments` (`Assignment, AssignmentStatus`). It touches many apps, illustrating how they connect. Run manually during development.

---

## `backend/academies/__init__.py`

**In one sentence:** Empty package marker for the `academies` app.

**What it is & why it exists (plain English):** Makes `academies/` an importable package. No behavior.

**How it works, step by step:** Nothing executes.

**Functions, classes & important values:** None.

**Connections:** Enables `academies.*` imports; `academies` is in `INSTALLED_APPS`.

---

## `backend/academies/apps.py`

**In one sentence:** The configuration class registering the `academies` app.

**What it is & why it exists (plain English):** Standard Django app config so Django can load the academies app and know its default ID field type.

**How it works, step by step:** Django reads `AcademiesConfig.name` to find the app on startup.

**Functions, classes & important values:**
- `AcademiesConfig(AppConfig)` — `name = "academies"`, `default_auto_field = "django.db.models.BigAutoField"`.

**Connections:** Imports Django's `AppConfig`. Referenced via `INSTALLED_APPS`.

---

## `backend/academies/admin.py`

**In one sentence:** Registers the academy-related models (Academy, Membership, CoachStudentLink, Classroom) in the admin panel with useful columns and filters.

**What it is & why it exists (plain English):** So an operator can browse and edit academies, memberships, coach-student links, and classrooms in the built-in admin without writing code.

**How it works, step by step:** Four `ModelAdmin` classes are registered, each declaring which columns to display, plus filters/search where helpful.

**Functions, classes & important values:**
- `AcademyAdmin` — lists `name`, `created_at`.
- `MembershipAdmin` — lists `user`, `academy`, `role`, `joined_at`; filterable by role.
- `CoachStudentLinkAdmin` — lists `coach`, `student`, `academy`, `created_at`.
- `ClassroomAdmin` — lists `name`, `coach`, `join_code`, `is_active`, `updated_at`; filter by active; searchable by join code, coach username, and name.

**Connections:** Imports Django's `admin` and the four local models. Visible at `/admin/`.

---

## `backend/academies/models.py`

**In one sentence:** Defines the data tables for academies, memberships, coach↔student links (with rich coaching/sync metadata), and classrooms with join codes.

**What it is & why it exists (plain English):** This is the heart of the "who coaches whom" structure. An **Academy** is an organization; a **Membership** records that a user belongs to an academy with a role; a **CoachStudentLink** is the direct relationship between one coach and one student (and carries lots of coaching settings plus chess-platform sync info); a **Classroom** lets a coach hand out a friendly join code that students use to attach themselves.

**How it works, step by step:**
1. Several `TextChoices` enums define fixed option sets (membership roles, link priority, platform choice, sync status).
2. `Academy` is a simple named org with a UUID id and creation timestamp.
3. `Membership` links a user to an academy with a role; `unique_together` prevents the same user joining the same academy twice.
4. `CoachStudentLink` connects a coach and a student, optionally under an academy, and stores coaching metadata (notes, tags, priority, goals, pinning, review date) and platform-sync fields (platform, username, enabled flag, last sync time, status, error). `unique_together` prevents duplicate coach→student pairs.
5. `Classroom` is one-per-coach, with a unique indexed `join_code`, an active flag, and timestamps.

**Functions, classes & important values:**
- `Academy` — fields: `id` (UUID), `name`, `created_at`. `Meta.verbose_name_plural = "academies"`. `__str__` → name.
- `MembershipRole` — `ADMIN/COACH/STUDENT`.
- `Membership` — fields: `id`, `academy` (FK), `user` (FK), `role`, `joined_at`; unique per (academy, user). `__str__` shows "user @ academy (role)".
- `LinkPriority` — `LOW/NORMAL/HIGH`.
- `PlatformChoice` — `CHESSCOM/LICHESS`.
- `SyncStatus` — `IDLE/SYNCING/ERROR`.
- `CoachStudentLink` — fields include `coach`/`student` (FKs to users), optional `academy`, `coach_notes`, `tags` (JSON list), `priority`, `target_accuracy`, `weekly_game_goal`, `pinned`, `last_reviewed_at`, `platform`, `platform_username`, `sync_enabled`, `last_sync_at`, `sync_status`, `sync_error`, `created_at`; unique per (coach, student). `__str__` shows "coach → student."
- `Classroom` — fields: `id`, `coach` (one-to-one), `name`, `join_code` (unique, indexed), `is_active`, `created_at`, `updated_at`; ordered newest first. `__str__` shows "name (code)."

**Connections:** Imports `uuid`, `settings`, Django `models`. `settings.AUTH_USER_MODEL` ties many fields to `accounts.User`. These models are used across `academies` views/serializers, plus `games`, `assignments`, `coaching`, and `sync` (which all check `CoachStudentLink` to enforce coach access). `related_name`s like `students_coached`, `coaches`, and `classroom` are read elsewhere.

---

## `backend/academies/serializers.py`

**In one sentence:** JSON translators for academies, memberships, and coach-student links, including cross-field validation for platform settings.

**What it is & why it exists (plain English):** These serializers convert the academy-related database rows to/from JSON and enforce rules — for example, that if you set a chess platform you must also give a username. They make the API both convenient and safe.

**How it works, step by step:**
1. `AcademySerializer` exposes basic academy fields (read-only id/created).
2. `MembershipSerializer` shows the nested user (read-only) but accepts a `user_id` when writing.
3. `CoachStudentLinkSerializer` nests coach/student as read-only user objects, accepts `student_id` or `student_username` when creating, and exposes all the coaching/sync metadata. Its `validate()` ensures a student is identified on creation and that platform and username are set together (not one without the other).

**Functions, classes & important values:**
- `AcademySerializer` — fields `id, name, created_at`; `id`/`created_at` read-only.
- `MembershipSerializer` — nested `user` (read-only), write-only `user_id`, plus `role`; `academy` read-only.
- `CoachStudentLinkSerializer`:
  - Read-only nested `coach`/`student`; write-only `student_id`/`student_username`.
  - Exposes the full coaching + sync field set.
  - `validate(attrs)` — on create, requires `student_id` or `student_username`; requires `platform_username` when `platform` is set, and vice versa; returns the validated attributes.

**Connections:** Imports DRF `serializers`, `get_user_model`, the local models, and `accounts.serializers.UserSerializer` (to embed user info). Used by `academies/views.py`.

---

## `backend/academies/classroom_serializers.py`

**In one sentence:** JSON translators for classrooms and the small payloads used to preview/join a classroom by code.

**What it is & why it exists (plain English):** Separated from the main serializers file to keep classroom-specific shapes together. `ClassroomSerializer` describes a classroom (including a computed student count and the coach's username), while two tiny serializers just carry a `join_code` for the preview/join flows.

**How it works, step by step:**
1. `ClassroomSerializer` exposes classroom fields, adds `coach_username` (pulled from the related coach) and `student_count` (computed).
2. `get_student_count()` counts how many students the classroom's coach has linked.
3. `ClassroomPreviewSerializer` and `JoinClassroomSerializer` each define a single `join_code` field for validating incoming requests.

**Functions, classes & important values:**
- `ClassroomSerializer`:
  - Fields: `id, name, join_code, is_active, coach_username, student_count, created_at, updated_at` (most read-only).
  - `get_student_count(obj)` — returns `obj.coach.students_coached.count()` (the coach's number of linked students).
- `ClassroomPreviewSerializer` — one field `join_code` (used to look up a classroom before joining).
- `JoinClassroomSerializer` — one field `join_code` (used to actually join).

**Connections:** Imports DRF `serializers` and the local `Classroom` model. Used by `academies/views.py` (the classroom endpoints).

---

## `backend/academies/classroom_codes.py`

**In one sentence:** Helper functions that generate, normalize, and ensure unique human-friendly classroom join codes.

**What it is & why it exists (plain English):** Classroom codes (like `VC-ABC123`) need to be easy to read aloud and type, unique, and free of confusing characters (no `O`/`0`, `I`/`L`/`1`). This file centralizes the logic to create such codes, clean up user-typed codes, and make sure every coach has a classroom with a valid code.

**How it works, step by step:**
1. `AMBIGUOUS` lists confusing characters; `ALPHABET` is the safe set (uppercase letters + digits minus the ambiguous ones).
2. `normalize_join_code()` trims, uppercases, removes spaces, and ensures the `VC-` prefix on whatever the user typed.
3. `generate_join_code()` builds a `VC-` + 6 random safe characters code, retrying up to 32 times until it finds one not already in the database; raises if it can't.
4. `get_or_create_classroom_for_coach()` returns the coach's classroom, creating it (with a fresh code and default name) if missing, and backfilling a code if an existing classroom somehow lacks one (retrying once on a uniqueness clash).

**Functions, classes & important values:**
- `AMBIGUOUS` — frozenset of `O 0 I L 1`.
- `ALPHABET` — the allowed code characters.
- `normalize_join_code(raw)` — takes a raw string, returns a cleaned, `VC-`-prefixed uppercase code.
- `generate_join_code()` — takes nothing, returns a guaranteed-unique new code (or raises `RuntimeError`). Imports `Classroom` lazily to avoid circular imports.
- `get_or_create_classroom_for_coach(coach)` — takes a coach user, returns their `Classroom`, creating/repairing as needed.

**Connections:** Imports `secrets`, `string`, and Django's `IntegrityError`; imports `Classroom` from the local models inside the functions. Used by `academies/views.py` and by `accounts/.../seed_demo.py`.

---

## `backend/academies/permissions.py`

**In one sentence:** Reusable permission helpers and a DRF permission class for checking academy-admin and coach/admin status.

**What it is & why it exists (plain English):** "Permissions" decide who is allowed to do what. This file provides small functions (and one DRF permission class) used by views to confirm, for example, that a user is an admin of a given academy before letting them manage its members.

**How it works, step by step:**
1. `user_is_academy_admin()` checks the `Membership` table for an admin-role row tying the user to that academy.
2. `user_is_coach_or_admin()` checks the user's global role.
3. `IsAcademyAdmin` is a DRF permission whose `has_object_permission()` resolves the relevant academy from the object and defers to `user_is_academy_admin`.

**Functions, classes & important values:**
- `user_is_academy_admin(user, academy)` — returns `True` if an admin Membership exists for that user+academy.
- `user_is_coach_or_admin(user)` — returns `True` if the user's role is coach or admin.
- `IsAcademyAdmin(BasePermission)`:
  - `has_object_permission(request, view, obj)` — treats `obj.academy` (or `obj` itself) as the academy and checks admin membership.

**Connections:** Imports `get_user_model`, DRF `permissions`, and the local `Membership`/`MembershipRole`. `user_is_academy_admin` is used directly in `academies/views.py`.

---

## `backend/academies/views.py`

**In one sentence:** The request handlers for academies, coach-student links, classroom create/join flows, and student stats/reports/games.

**What it is & why it exists (plain English):** This is the busiest file in the academies app — it wires up everything a coach or student does around organization and rosters. It includes two **ViewSets** (bundles of list/create/update/delete endpoints) for academies and links, and several single-purpose views for classrooms and viewing a student's performance. It carefully enforces who can see and change what based on role and coach-student relationships.

**How it works, step by step:**
1. `AcademyViewSet` only shows academies the user belongs to; creating one automatically makes the creator an admin member; a `members` action lists members (GET) or adds/updates a member (POST, admin-only).
2. `CoachStudentLinkViewSet` scopes links by role (admins see all, coaches see their own, students see links where they're the student). Creating links is admin-only via this endpoint — coaches are told to use classroom join codes instead. Students may only edit their own platform fields.
3. `StudentStatsView`/`StudentReportView`/`StudentGamesView` return a student's computed stats, a date-filtered report, and their games — each guarded so only the student, their coach, or an admin can see them.
4. The classroom views let coaches fetch/rename/toggle and regenerate their code, and let students preview and join by code.

**Functions, classes & important values:**
- `AcademyViewSet(ModelViewSet)`:
  - `get_queryset()` — academies where the user is a member (deduplicated).
  - `perform_create(serializer)` — saves the academy and makes the creator an admin member.
  - `members(request, pk)` action — GET lists members; POST (admin-only) adds/updates a member by `user_id` and `role`.
- `CoachStudentLinkViewSet(ModelViewSet)`:
  - `get_queryset()` — role-scoped links.
  - `perform_create(serializer)` — admin-only; resolves student by username or id, validates the target is a student, prevents duplicates, and saves; coaches are blocked with guidance to use join codes.
  - `STUDENT_EDITABLE_FIELDS = {"platform", "platform_username", "sync_enabled"}` — the only fields a student may change.
  - `perform_update(serializer)` — students may update only their own link and only the allowed fields; otherwise raises `PermissionDenied`.
- `StudentStatsView.get(request, student_id)` — returns `compute_student_stats(student)` after access checks.
- `StudentReportView.get(request, student_id)` — returns `compute_student_report(...)` honoring `from`/`to` query dates, after access checks.
- `StudentGamesView.get_queryset()` — returns the student's games (with eval) when the requester is the student, their coach, or admin; otherwise an empty set.
- `MyClassroomView` — GET gets/creates the coach's classroom; PATCH updates name/active flag (coach/admin only).
- `RegenerateClassroomCodeView.post()` — issues a brand-new join code (coach/admin only).
- `PreviewClassroomJoinView.post()` — student verifies a code and sees the coach/classroom and whether they're already a member.
- `JoinClassroomView.post()` — student joins by code, creating a `CoachStudentLink` to the classroom's coach (idempotent).

**Connections:** Imports DRF building blocks, Django helpers, the local models/permissions/serializers/classroom helpers, and from `games`: `Game`, `GameListSerializer`, and the stats functions `compute_student_report`/`compute_student_stats`. Wired by `academies/urls.py`. Heavily relies on `CoachStudentLink` for access control.

---

## `backend/academies/urls.py`

**In one sentence:** Maps academy, coach-link, classroom, and student-data endpoints to their views.

**What it is & why it exists (plain English):** The academies app's URL switchboard. It uses a DRF *router* (which auto-creates standard list/detail routes for ViewSets) plus explicit paths for the classroom and student endpoints.

**How it works, step by step:**
1. A `DefaultRouter` registers `academies` and `coach-links` ViewSets, generating their CRUD URLs.
2. `urlpatterns` includes the router URLs and then adds explicit paths for classroom mine/regenerate/preview/join and for student stats/report/games (the latter using a UUID path parameter).

**Functions, classes & important values:**
- `router` — registers `AcademyViewSet` (basename `academy`) and `CoachStudentLinkViewSet` (basename `coach-link`).
- `urlpatterns` — router URLs plus: `classroom/mine/`, `classroom/regenerate/`, `classroom/preview/`, `classroom/join/`, and `students/<uuid:student_id>/{stats,report,games}/`.

**Connections:** Imports Django `include`/`path`, DRF `DefaultRouter`, and the academy views. Mounted under `/api/` by `voltchess_api/urls.py`.

---

## `backend/academies/tests.py`

**In one sentence:** Automated tests confirming students can edit only their own platform fields on a coach-link, while coaches can edit coaching fields.

**What it is & why it exists (plain English):** These tests lock down the sensitive permission rules around `CoachStudentLink` updates — a key place where a bug could let a student tamper with coach-only data. They prove the boundaries hold.

**How it works, step by step:** `setUp()` creates a coach, two students, an academy, and a link. Each test authenticates as a particular user, PATCHes the link, and asserts the status and the database result.

**Functions, classes & important values:**
- `CoachLinkUpdatePermissionTests(APITestCase)`:
  - `setUp()` — builds the coach/students/academy/link fixtures.
  - `test_student_can_set_own_platform_account` — student sets platform+username (expects 200 + saved).
  - `test_student_can_toggle_sync_enabled` — student toggles `sync_enabled` (200).
  - `test_student_cannot_edit_coach_only_fields` — student editing `coach_notes` is forbidden (403, unchanged).
  - `test_student_cannot_edit_another_students_link` — editing someone else's link returns 403/404.
  - `test_coach_can_still_edit_coaching_fields` — coach edits notes + platform fields (200 + saved).

**Connections:** Imports `get_user_model`, DRF `APITestCase`, and academy models. Exercises `academies/views.py` and serializers. Run with `python manage.py test academies`.

---

## `backend/games/__init__.py`

**In one sentence:** Empty package marker for the `games` app.

**What it is & why it exists (plain English):** Makes `games/` an importable package; no behavior.

**How it works, step by step:** Nothing executes.

**Functions, classes & important values:** None.

**Connections:** Enables `games.*` imports; `games` is in `INSTALLED_APPS`.

---

## `backend/games/apps.py`

**In one sentence:** The configuration class registering the `games` app.

**What it is & why it exists (plain English):** Standard Django app config so the games app loads correctly.

**How it works, step by step:** Django reads `GamesConfig.name` on startup.

**Functions, classes & important values:**
- `GamesConfig(AppConfig)` — `name = "games"`, `default_auto_field = "django.db.models.BigAutoField"`.

**Connections:** Imports Django's `AppConfig`. Referenced via `INSTALLED_APPS`.

---

## `backend/games/admin.py`

**In one sentence:** Registers `Game` (with its evaluation shown inline) and `GameEval` in the admin panel.

**What it is & why it exists (plain English):** Lets an operator browse stored chess games and their analysis in the admin, with each game's eval editable on the same page.

**How it works, step by step:** A `GameEvalInline` embeds the one-to-one eval inside the game page; `GameAdmin` lists key game columns and includes the inline; `GameEvalAdmin` registers the eval separately too.

**Functions, classes & important values:**
- `GameEvalInline(StackedInline)` — shows the related `GameEval` inside the game edit page (`extra = 0` adds no blank forms).
- `GameAdmin` — lists `__str__`, `owner`, `date`, `result`, `created_at`; filter by result; includes the eval inline.
- `GameEvalAdmin` — lists `game`, `created_at`.

**Connections:** Imports Django's `admin` and the local `Game`/`GameEval`. Visible at `/admin/`.

---

## `backend/games/models.py`

**In one sentence:** Defines the `Game` table (a chess game with its metadata and analysis state) and the `GameEval` table (the move-by-move analysis results).

**What it is & why it exists (plain English):** Games are the core content of VoltChess. A **Game** stores the moves (in PGN, the standard chess notation text), the players, result, where it came from, and the status of its analysis. A **GameEval** stores the computed analysis — each position's engine evaluation, accuracy percentages, estimated playing strength, and the settings used. They're split into two tables because not every game has been analyzed yet.

**How it works, step by step:**
1. `AnalysisStatus` and `AnalysisSource` enums track whether/where a game has been analyzed.
2. `Game` holds identity (UUID), owner, the PGN, parsed header fields (event, site, date, players as JSON, result, etc.), import provenance (`source`, `external_id`, `external_url`), and analysis bookkeeping (`analysis_status`, `analysis_source`, `analysis_claimed_at`, `platform_played_at`). A unique constraint prevents importing the same external game twice for one owner.
3. `GameEval` is a one-to-one extension of a game holding the analysis JSON.

**Functions, classes & important values:**
- `AnalysisStatus` — `PENDING/IN_PROGRESS/COMPLETE/FAILED`.
- `AnalysisSource` — `BROWSER/SERVER` (who analyzed it).
- `Game`:
  - Identity/ownership: `id` (UUID), `owner` (FK to user, `related_name="games"`).
  - Content: `pgn`, `event`, `site`, `date`, `round`, `white`/`black` (JSON dicts), `result`, `termination`, `time_control`.
  - Provenance: `source` (default "upload"), `external_id` (indexed), `external_url`.
  - Analysis: `analysis_status` (default COMPLETE), `analysis_source`, `analysis_claimed_at`, `platform_played_at`, plus `created_at`/`updated_at`.
  - `Meta` — ordered newest first; unique constraint on (owner, source, external_id) when `external_id` is non-empty.
  - `__str__` — "White vs Black" using the names in the JSON.
- `GameEval`:
  - `id` (UUID), `game` (one-to-one, `related_name="eval"`), `positions` (JSON list), `accuracy` (JSON dict), `estimated_elo` (JSON, optional), `settings` (JSON), timestamps.
  - `__str__` — "Eval for <game id>".

**Connections:** Imports `uuid`, `settings`, Django `models`. `owner` ties to `accounts.User`. Referenced by `games` serializers/views/stats, and by `assignments` and `annotations` (which point at `Game`), and heavily by `sync` (which sets analysis fields and reads `eval`).

---

## `backend/games/serializers.py`

**In one sentence:** JSON translators for listing games, showing full game detail (with eval), creating games, and uploading analysis results.

**What it is & why it exists (plain English):** Different screens need different amounts of game data. This file provides four serializers tuned for each case: a lightweight list, a full detail (including the embedded eval), a create form, and a special uploader that saves analysis and flips the game to "complete."

**How it works, step by step:**
1. `GameEvalSerializer` shapes the eval fields.
2. `GameListSerializer` returns core fields plus two computed flags (`has_eval`, `accuracy`) so lists can show analysis status cheaply.
3. `GameDetailSerializer` embeds the full eval for a single game.
4. `GameCreateSerializer` accepts a new game and stamps the current user as owner.
5. `GameEvalUploadSerializer` validates an analysis payload and, on save, creates/updates the eval and marks the game complete.

**Functions, classes & important values:**
- `GameEvalSerializer` — fields `id, positions, accuracy, estimated_elo, settings, created_at, updated_at` (id/timestamps read-only).
- `GameListSerializer`:
  - Core game fields plus `has_eval` and `accuracy`.
  - `get_has_eval(obj)` — `True` if the game has a saved eval.
  - `get_accuracy(obj)` — the eval's accuracy dict, or `None`.
- `GameDetailSerializer` — full game fields plus nested read-only `eval`.
- `GameCreateSerializer`:
  - Writable game fields; `create(validated_data)` sets `owner` to the requesting user before saving.
- `GameEvalUploadSerializer(Serializer)`:
  - Fields: `positions` (list), `accuracy` (dict), `estimated_elo` (optional dict), `settings` (dict).
  - `save(game)` — creates/updates the `GameEval` for that game and, if needed, sets the game's status to COMPLETE; returns the eval object.

**Connections:** Imports DRF `serializers` and the local `AnalysisStatus`/`Game`/`GameEval`. Used by `games/views.py`, and `GameDetailSerializer`/`GameEvalUploadSerializer` are reused by `sync/views.py`. `GameListSerializer` is also used by `academies/views.py`.

---

## `backend/games/permissions.py`

**In one sentence:** A permission class allowing access to a game only to its owner, the owner's coach, or an admin.

**What it is & why it exists (plain English):** Games are private. This rule decides, for a given game, whether the requesting user is allowed to see/modify it: yes if they own it, if they're an admin, or if they're a coach linked to the owner.

**How it works, step by step:** `has_object_permission()` checks owner match, then admin role, then (for coaches) whether a `CoachStudentLink` ties the coach to the game's owner; otherwise denies.

**Functions, classes & important values:**
- `IsGameOwnerOrCoach(BasePermission)`:
  - `has_object_permission(request, view, obj)` — returns `True` for the owner, for admins, or for coaches linked to the owner; else `False`.

**Connections:** Imports `get_user_model`, DRF `permissions`, and `academies.CoachStudentLink`. Used by `games/views.py`, `annotations/views.py`, and `sync/views.py`.

---

## `backend/games/stats.py`

**In one sentence:** Pure functions that compute a student's aggregate statistics and a detailed performance report from their games and assignments.

**What it is & why it exists (plain English):** This file does the number-crunching behind student dashboards: averaging accuracy, counting blunders/mistakes, summarizing each game, and combining everything (plus assignments) into a report. Keeping this logic in plain functions (separate from views) makes it reusable and testable.

**How it works, step by step:**
1. Helpers: `_parse_date` tries several date formats; `_count_classifications` tallies move-quality labels per side; `_game_summary` builds a compact per-game summary.
2. `compute_student_stats` loops over a student's games-with-eval, collecting accuracy lists and blunder/mistake counts, then returns averages and totals (plus pending-assignment count).
3. `compute_student_report` filters games by an optional date range, reuses `compute_student_stats`, builds per-game breakdowns, attaches the student's assignments, and stamps a generation time.

**Functions, classes & important values:**
- `CLASSIFICATION_KEYS` — the list of move-quality labels (Splendid, Perfect, Best, … Blunder, Opening, Forced).
- `_parse_date(date_str)` — returns a `date` parsed from `YYYY.MM.DD`/`-`/`/` formats, or `None`.
- `_count_classifications(positions)` — returns a dict mapping each classification to white/black counts (even move index = white).
- `_game_summary(game)` — returns a dict summarizing one game (id, date, players, result, and, if analyzed, accuracy + classification counts + move count).
- `compute_student_stats(student)` — returns totals: `total_games`, `analyzed_games`, average accuracies, blunders/mistakes per side, and `pending_assignments`. (`avg()` is a small inner rounding helper.)
- `compute_student_report(student, date_from=None, date_to=None)` — returns a full report: student info, the `summary` stats, per-game `games` breakdown, `assignments`, and a `generated_at` timestamp.

**Connections:** Imports `defaultdict`, `datetime`, `get_user_model`, `assignments.Assignment`/`AssignmentStatus`, and the local `Game`. Used by `academies/views.py` and by `coaching/services.py` (which imports `compute_student_stats`, `_parse_date`, `_count_classifications`).

---

## `backend/games/views.py`

**In one sentence:** Request handlers for game CRUD (role-scoped), uploading/reading a game's eval, and bulk-importing games with evals.

**What it is & why it exists (plain English):** This file powers the main game endpoints: listing/creating/viewing games (with visibility based on role and coach links), saving or fetching the per-game analysis, and a bulk endpoint for uploading many games at once.

**How it works, step by step:**
1. `GameViewSet` picks the right serializer per action, scopes the queryset by role (and an optional `student_id` filter for coaches/admins), and stamps the owner on create.
2. `GameEvalView` loads a game (checking object permissions), then PUT saves an uploaded eval and GET returns the stored eval (or 404).
3. `BulkGameUploadView` accepts a list of games, creating each (and its optional eval) for the current user, returning the created IDs.

**Functions, classes & important values:**
- `GameViewSet(ModelViewSet)`:
  - `permission_classes` — must be authenticated and pass `IsGameOwnerOrCoach`.
  - `get_serializer_class()` — create/update → `GameCreateSerializer`; retrieve → `GameDetailSerializer`; else → `GameListSerializer`.
  - `get_queryset()` — if `student_id` given: coaches see that student's games only if linked, admins always, others none. Without it: admins see all, others see their own.
  - `perform_create(serializer)` — saves with `owner = request.user`.
- `GameEvalView(APIView)`:
  - `get_game(request, game_id)` — fetches the game and runs object permission checks.
  - `put(request, game_id)` — validates with `GameEvalUploadSerializer`, saves, returns `{id, game_id}`.
  - `get(request, game_id)` — returns the eval JSON, or 404 if none.
- `BulkGameUploadView(APIView)`:
  - `post(request)` — expects `games` (a list); creates each valid game (and optional `eval`) for the user; returns `{"created": [ids]}` with 201.

**Connections:** Imports DRF building blocks, `get_user_model`, `academies.CoachStudentLink`, and the local model/permission/serializers. Wired by `games/urls.py`.

---

## `backend/games/urls.py`

**In one sentence:** Maps the game CRUD routes (via router), the bulk upload route, and the per-game eval route.

**What it is & why it exists (plain English):** The games app's URL switchboard. A router builds the standard `games` CRUD URLs; two explicit paths add bulk upload and the eval endpoint.

**How it works, step by step:** A `DefaultRouter` registers `GameViewSet`. `urlpatterns` adds `games/bulk/` and `games/<uuid:game_id>/eval/` before including the router URLs.

**Functions, classes & important values:**
- `router` — registers `GameViewSet` (basename `game`).
- `urlpatterns` — `games/bulk/` → `BulkGameUploadView`; `games/<uuid:game_id>/eval/` → `GameEvalView`; plus router URLs.

**Connections:** Imports Django `include`/`path`, DRF `DefaultRouter`, and the game views. Mounted under `/api/` by `voltchess_api/urls.py`.

---

## `backend/assignments/__init__.py`

**In one sentence:** Empty package marker for the `assignments` app.

**What it is & why it exists (plain English):** Makes `assignments/` an importable package; no behavior.

**How it works, step by step:** Nothing executes.

**Functions, classes & important values:** None.

**Connections:** Enables `assignments.*` imports; in `INSTALLED_APPS`.

---

## `backend/assignments/apps.py`

**In one sentence:** The configuration class registering the `assignments` app.

**What it is & why it exists (plain English):** Standard Django app config.

**How it works, step by step:** Django reads `AssignmentsConfig.name` on startup.

**Functions, classes & important values:**
- `AssignmentsConfig(AppConfig)` — `name = "assignments"`, `default_auto_field = "django.db.models.BigAutoField"`.

**Connections:** Imports Django's `AppConfig`. Referenced via `INSTALLED_APPS`.

---

## `backend/assignments/admin.py`

**In one sentence:** Registers the `Assignment` model in the admin with helpful columns and a status filter.

**What it is & why it exists (plain English):** Lets operators browse homework assignments in the admin panel.

**How it works, step by step:** `AssignmentAdmin` declares list columns and a status filter and is registered for `Assignment`.

**Functions, classes & important values:**
- `AssignmentAdmin` — lists `coach`, `student`, `status`, `due_date`, `created_at`; filterable by status.

**Connections:** Imports Django's `admin` and the local `Assignment`. Visible at `/admin/`.

---

## `backend/assignments/models.py`

**In one sentence:** Defines the `Assignment` table — a piece of homework a coach gives a student, optionally tied to a specific game.

**What it is & why it exists (plain English):** Coaches assign work (analyze a game, study an opening, etc.). An **Assignment** records who assigned it, to whom, optional linked game and PGN, the instructions, a category/priority, an optional due date, and its status. Enums keep categories/priorities/statuses consistent.

**How it works, step by step:**
1. Three `TextChoices` enums define statuses, categories, and priorities.
2. `Assignment` links a coach and a student (both FKs to users), optionally a `game` (FK that becomes null if the game is deleted), and stores the textual content plus scheduling/status fields. Ordered newest first.

**Functions, classes & important values:**
- `AssignmentStatus` — `PENDING/IN_PROGRESS/COMPLETED/CANCELLED`.
- `AssignmentCategory` — `GENERAL/OPENING/TACTICS/ENDGAME/GAME_REVIEW/HOMEWORK`.
- `AssignmentPriority` — `LOW/NORMAL/HIGH`.
- `Assignment`:
  - `id` (UUID), `coach` (FK, `related_name="assignments_created"`), `student` (FK, `related_name="assignments_received"`), `game` (nullable FK, `SET_NULL`, `related_name="assignments"`).
  - Content: `title`, `pgn`, `instructions`, `category`, `priority`, `due_date`, `status`, timestamps.
  - `Meta` ordered newest first; `__str__` → "coach → student: status".

**Connections:** Imports `uuid`, `settings`, Django `models`, and `games.Game`. Used by `assignments` serializer/views, `games/stats.py`, `coaching/services.py`, and the demo seeder.

---

## `backend/assignments/serializers.py`

**In one sentence:** JSON translator for assignments that nests coach/student info and resolves the student and optional game on creation.

**What it is & why it exists (plain English):** Converts assignment rows to/from JSON. It shows the coach and student as nested user objects when reading, and accepts a `student_id` (and optional `game_id`) when creating, attaching the current user as the coach.

**How it works, step by step:**
1. Declares nested read-only `coach`/`student`, a write-only `student_id`, and an optional `game_id`.
2. `create()` pops the ids, looks up the student (and game if provided), and creates the assignment with the requesting user as coach.

**Functions, classes & important values:**
- `AssignmentSerializer`:
  - Read fields include nested `coach`/`student`, `game`, content/scheduling fields.
  - Write fields: `student_id` (required), `game_id` (optional).
  - `create(validated_data)` — resolves `student` (and `game` if given) and creates the assignment with `coach = request.user`; returns it. (Imports `get_user_model`/`Game` locally to avoid import cycles.)

**Connections:** Imports DRF `serializers`, `accounts.serializers.UserSerializer`, and the local `Assignment`. Used by `assignments/views.py` and reused by `coaching/views.py` (bulk assignment).

---

## `backend/assignments/views.py`

**In one sentence:** The ViewSet for assignments, scoping visibility by role and enforcing that coaches only assign to their own students.

**What it is & why it exists (plain English):** Handles listing/creating/updating assignments. Admins see all; coaches see what they created; students see what they received. When a coach creates one, the code checks the target student is actually linked to them.

**How it works, step by step:**
1. `get_queryset()` returns a role-appropriate set (admin → all, coach → theirs, student → received).
2. `perform_create()` verifies (for coaches) a `CoachStudentLink` exists with the target student, then saves with the current user as coach.

**Functions, classes & important values:**
- `AssignmentViewSet(ModelViewSet)`:
  - `serializer_class = AssignmentSerializer`; requires authentication.
  - `get_queryset()` — role-scoped queryset (with related coach/student/game preloaded).
  - `perform_create(serializer)` — for coaches, requires a link to the `student_id` (else `PermissionDenied`); saves with `coach = user`.

**Connections:** Imports `get_user_model`, DRF `permissions`/`viewsets`/`PermissionDenied`, `academies.CoachStudentLink`, and the local model/serializer. Wired by `assignments/urls.py`.

---

## `backend/assignments/urls.py`

**In one sentence:** Maps the assignment CRUD routes via a DRF router.

**What it is & why it exists (plain English):** The assignments app's URL switchboard — it simply exposes the standard CRUD endpoints for assignments.

**How it works, step by step:** A `DefaultRouter` registers `AssignmentViewSet`; `urlpatterns` includes the router URLs.

**Functions, classes & important values:**
- `router` — registers `AssignmentViewSet` (basename `assignment`).
- `urlpatterns` — includes the router URLs.

**Connections:** Imports Django `include`/`path`, DRF `DefaultRouter`, and the assignment view. Mounted under `/api/` by `voltchess_api/urls.py`.

---

## `backend/annotations/__init__.py`

**In one sentence:** Empty package marker for the `annotations` app.

**What it is & why it exists (plain English):** Makes `annotations/` an importable package; no behavior.

**How it works, step by step:** Nothing executes.

**Functions, classes & important values:** None.

**Connections:** Enables `annotations.*` imports; in `INSTALLED_APPS`.

---

## `backend/annotations/apps.py`

**In one sentence:** The configuration class registering the `annotations` app.

**What it is & why it exists (plain English):** Standard Django app config.

**How it works, step by step:** Django reads `AnnotationsConfig.name` on startup.

**Functions, classes & important values:**
- `AnnotationsConfig(AppConfig)` — `name = "annotations"`, `default_auto_field = "django.db.models.BigAutoField"`.

**Connections:** Imports Django's `AppConfig`. Referenced via `INSTALLED_APPS`.

---

## `backend/annotations/admin.py`

**In one sentence:** Registers the `Annotation` model in the admin with key columns.

**What it is & why it exists (plain English):** Lets operators browse move-level comments in the admin.

**How it works, step by step:** `AnnotationAdmin` declares list columns and is registered for `Annotation`.

**Functions, classes & important values:**
- `AnnotationAdmin` — lists `game`, `author`, `move_index`, `created_at`.

**Connections:** Imports Django's `admin` and the local `Annotation`. Visible at `/admin/`.

---

## `backend/annotations/models.py`

**In one sentence:** Defines the `Annotation` table — a text comment attached to a specific move/position within a game.

**What it is & why it exists (plain English):** When reviewing a game, a coach (or the student) can leave notes on particular moves ("this was the losing blunder"). An **Annotation** records which game, which author, which move number, optionally the board position (FEN), and the note text.

**How it works, step by step:** `Annotation` links a `game` and an `author` (both FKs), stores `move_index`, optional `fen`, and the `body` text, plus timestamps. It's ordered by move then creation time so notes read naturally.

**Functions, classes & important values:**
- `Annotation`:
  - `id` (UUID), `game` (FK, `related_name="annotations"`), `author` (FK to user, `related_name="annotations"`).
  - `move_index` (positive integer), `fen` (optional position string), `body` (text), timestamps.
  - `Meta` ordered by `move_index`, then `created_at`; `__str__` → "Annotation on <game> move <n>".

**Connections:** Imports `uuid`, `settings`, Django `models`, and `games.Game`. Used by `annotations` serializer/views and by `coaching/services.py` (timeline).

---

## `backend/annotations/serializers.py`

**In one sentence:** JSON translator for annotations that nests the author and stamps the current user as author on creation.

**What it is & why it exists (plain English):** Converts annotation rows to/from JSON, showing the author as a nested user object and automatically recording who wrote a new note.

**How it works, step by step:** Declares a read-only nested `author`; on `create()`, sets the author to the requesting user before saving.

**Functions, classes & important values:**
- `AnnotationSerializer`:
  - Fields: `id, game, author (nested, read-only), move_index, fen, body, created_at, updated_at`.
  - `create(validated_data)` — sets `author = request.user` then creates; returns the annotation.

**Connections:** Imports DRF `serializers`, `accounts.serializers.UserSerializer`, and the local `Annotation`. Used by `annotations/views.py`.

---

## `backend/annotations/views.py`

**In one sentence:** The ViewSet for annotations, gated by the same game-access rule and filtered to a single game via a query parameter.

**What it is & why it exists (plain English):** Handles listing and creating move comments, but only for games the user is allowed to see. Listing requires a `game_id` query parameter; creating requires the user to pass the game-access permission check.

**How it works, step by step:**
1. `get_queryset()` requires a `game_id`; it loads the game and uses `IsGameOwnerOrCoach` to verify access, returning the game's annotations or an empty set.
2. `perform_create()` loads the game from the request body, re-checks access, and saves the annotation with the author and game set.

**Functions, classes & important values:**
- `AnnotationViewSet(ModelViewSet)`:
  - `serializer_class = AnnotationSerializer`; requires authentication.
  - `get_queryset()` — needs `game_id`; returns that game's annotations only if the user passes `IsGameOwnerOrCoach`; else empty.
  - `perform_create(serializer)` — verifies game access (else `PermissionDenied`) and saves with `author = user` and the resolved `game`.

**Connections:** Imports `get_user_model`, DRF pieces, `games.Game`, `games.permissions.IsGameOwnerOrCoach`, and the local model/serializer. Wired by `annotations/urls.py`.

---

## `backend/annotations/urls.py`

**In one sentence:** Maps the annotation CRUD routes via a DRF router.

**What it is & why it exists (plain English):** The annotations app's URL switchboard exposing standard CRUD for annotations.

**How it works, step by step:** A `DefaultRouter` registers `AnnotationViewSet`; `urlpatterns` includes the router URLs.

**Functions, classes & important values:**
- `router` — registers `AnnotationViewSet` (basename `annotation`).
- `urlpatterns` — includes the router URLs.

**Connections:** Imports Django `include`/`path`, DRF `DefaultRouter`, and the annotation view. Mounted under `/api/` by `voltchess_api/urls.py`.

---

## `backend/coaching/__init__.py`

**In one sentence:** Empty package marker for the `coaching` app.

**What it is & why it exists (plain English):** Makes `coaching/` an importable package; no behavior.

**How it works, step by step:** Nothing executes.

**Functions, classes & important values:** None.

**Connections:** Enables `coaching.*` imports; in `INSTALLED_APPS`.

---

## `backend/coaching/apps.py`

**In one sentence:** The configuration class registering the `coaching` app.

**What it is & why it exists (plain English):** Standard Django app config.

**How it works, step by step:** Django reads `CoachingConfig.name` on startup.

**Functions, classes & important values:**
- `CoachingConfig(AppConfig)` — `name = "coaching"`, `default_auto_field = "django.db.models.BigAutoField"`.

**Connections:** Imports Django's `AppConfig`. Referenced via `INSTALLED_APPS`.

---

## `backend/coaching/admin.py`

**In one sentence:** Registers the coaching models (LessonTemplate, CoachMessage, TrainingPlan) in the admin with default settings.

**What it is & why it exists (plain English):** Makes lesson templates, messages, and training plans visible in the admin panel for inspection.

**How it works, step by step:** Calls `admin.site.register(...)` for each of the three models (no custom options).

**Functions, classes & important values:** No classes — three `admin.site.register` calls for `LessonTemplate`, `CoachMessage`, `TrainingPlan`.

**Connections:** Imports Django's `admin` and the three local models. Visible at `/admin/`.

---

## `backend/coaching/models.py`

**In one sentence:** Defines three coaching tables: reusable lesson templates, coach→student messages, and multi-week training plans.

**What it is & why it exists (plain English):** Beyond single assignments, coaches need richer tools. A **LessonTemplate** is a saved, reusable lesson a coach can apply repeatedly. A **CoachMessage** is a direct note from coach to student (with read tracking). A **TrainingPlan** is a longer-term goal-oriented plan for a student. Each is its own table.

**How it works, step by step:**
1. `TemplateCategory` and `TrainingPlanStatus` enums constrain certain fields.
2. `LessonTemplate` belongs to a coach and stores title/category/instructions/optional PGN/estimate/favorite flag; ordered favorites-first then most recently updated.
3. `CoachMessage` links coach and student, stores subject/body and an optional `read_at`; newest first.
4. `TrainingPlan` links coach and student, stores title/description/status/target weeks/goals (JSON list); newest-updated first.

**Functions, classes & important values:**
- `TemplateCategory` — `OPENING/TACTICS/ENDGAME/GAME_REVIEW/STRATEGY/HOMEWORK`.
- `LessonTemplate` — `id`, `coach` (FK, `related_name="lesson_templates"`), `title`, `category`, `instructions`, `pgn`, `estimated_minutes`, `is_favorite`, timestamps. `__str__` → title.
- `CoachMessage` — `id`, `coach` (FK, `related_name="messages_sent"`), `student` (FK, `related_name="messages_received"`), `subject`, `body`, `read_at`, `created_at`. `__str__` → "subject → student".
- `TrainingPlanStatus` — `ACTIVE/COMPLETED/PAUSED`.
- `TrainingPlan` — `id`, `coach` (FK, `related_name="training_plans_created"`), `student` (FK, `related_name="training_plans"`), `title`, `description`, `status`, `target_weeks` (default 4), `goals` (JSON list), timestamps. `__str__` → "title (student)".

**Connections:** Imports `uuid`, `settings`, Django `models`. FKs tie to `accounts.User`. Used by `coaching` serializers/views/services.

---

## `backend/coaching/serializers.py`

**In one sentence:** JSON translators for lesson templates, coach messages, and training plans.

**What it is & why it exists (plain English):** Converts the three coaching models to/from JSON, exposing convenient extra fields (like usernames) and accepting a `student_id` when creating messages/plans.

**How it works, step by step:** Each serializer lists its model's fields, marks server-managed fields read-only, and (for messages/plans) adds a write-only `student_id` plus read-only username fields pulled from related objects.

**Functions, classes & important values:**
- `LessonTemplateSerializer` — fields `id, title, category, instructions, pgn, estimated_minutes, is_favorite, created_at, updated_at` (id/timestamps read-only).
- `CoachMessageSerializer` — read-only `coach_username`/`student_username` (sourced from related users), write-only `student_id`, plus `subject, body, read_at, created_at` (several read-only).
- `TrainingPlanSerializer` — write-only `student_id`, read-only `student_username`, plus `title, description, status, target_weeks, goals`, timestamps.

**Connections:** Imports DRF `serializers` and the three local models. Used by `coaching/views.py`.

---

## `backend/coaching/services.py`

**In one sentence:** The analytics engine that builds the coach dashboard, cohort analytics, weekly activity, engagement/at-risk scoring, and per-student timelines.

**What it is & why it exists (plain English):** This is the most computation-heavy file in the coaching app. It gathers data across many apps (games, assignments, annotations, messages, links) and turns it into the summaries coaches see: a roster sorted by engagement, who's at risk, recent activity, accuracy comparisons across students, and a chronological timeline for one student. Keeping it as plain functions makes the heavy logic reusable by views.

**How it works, step by step:**
1. `_coach_students` finds the users linked to a coach.
2. `_engagement_score` turns a student's stats + goal + weekly games into a 0–100 score using simple rules.
3. `compute_weekly_games` counts games per ISO week for the last N weeks.
4. `compute_coach_dashboard` builds the full dashboard: per-student roster items (stats, engagement, accuracy, activity gaps), an at-risk list (with reasons), a merged recent-activity feed (games + assignment updates), and summary counters (students, assignment counts, overdue/due-soon, active plans, unread messages, total analyzed games). Roster is sorted pinned-first then by engagement.
5. `_at_risk_reasons` produces human-readable reasons a student is flagged.
6. `compute_coach_analytics` aggregates cohort accuracy, mistake totals, assignment category/status breakdowns, and top opening events.
7. `compute_student_timeline` merges recent games, assignments, messages, and coach annotations into a single time-sorted event list.

**Functions, classes & important values:**
- `_coach_students(coach)` — returns a queryset of the coach's linked students.
- `_engagement_score(stats, link, games_this_week)` — returns an int 0–100 from rule-based points (analyzed games, total games, weekly activity, no pending assignments, meeting weekly goal, decent accuracy).
- `compute_weekly_games(student, weeks=8)` — returns a list of `{week_start, games}` for recent weeks.
- `compute_coach_dashboard(coach)` — returns `{summary, roster, at_risk, activity}` (the main dashboard payload).
- `_at_risk_reasons(item, student_overdue)` — returns a list of reason strings (inactivity, low engagement, below goal, overdue assignments).
- `compute_coach_analytics(coach)` — returns `{cohort_avg_accuracy, accuracy_by_student, mistake_totals, assignment_categories, assignment_status, top_opening_events}`.
- `compute_student_timeline(student, coach)` — returns up to 40 time-sorted events of types game/assignment/message/annotation.

**Connections:** Imports `defaultdict`, date utilities, `get_user_model`, Django ORM helpers (`Count`, `Q`, `timezone`), and pulls from `academies` (`CoachStudentLink`), `assignments` (`Assignment`/`AssignmentStatus`), `annotations` (`Annotation`), `games` (`Game`, plus `compute_student_stats`/`_parse_date`/`_count_classifications`), and the local models. Used by `coaching/views.py`.

---

## `backend/coaching/views.py`

**In one sentence:** Request handlers for the coach dashboard/analytics, student timelines, bulk assignment creation, and ViewSets for lesson templates, messages, and training plans.

**What it is & why it exists (plain English):** This file exposes all the coaching tools over the API. Several endpoints are coach/admin-only (enforced by a small helper), and writing to a student requires the coach to be linked to them. It reuses the analytics functions from `services.py` and the assignment serializer from the assignments app.

**How it works, step by step:**
1. Two helpers gate access: `_require_coach` rejects non-coaches; `_coach_has_student` checks the coach-student link (admins always pass).
2. `CoachDashboardView`/`CoachAnalyticsView` require a coach and return the computed dashboard/analytics.
3. `StudentTimelineView` (coach + linked) returns weekly games + the student timeline.
4. `BulkAssignmentView` creates the same assignment for many students (skipping unlinked ones).
5. Three ViewSets manage lesson templates (coach-owned), coach messages (coach writes, both sides read; with a `mark_read` action), and training plans (coach writes to linked students).

**Functions, classes & important values:**
- `_require_coach(user)` — raises `PermissionDenied` unless coach/admin.
- `_coach_has_student(coach, student_id)` — `True` for admins or when a link exists.
- `CoachDashboardView.get` / `CoachAnalyticsView.get` — return `compute_coach_dashboard` / `compute_coach_analytics`.
- `StudentTimelineView.get(request, student_id)` — coach + link required; returns `{weekly_games, timeline}`.
- `BulkAssignmentView.post(request)` — needs `student_ids`; builds a whitelisted payload; for each linked student validates+saves an `Assignment`; returns the created list (201).
- `LessonTemplateViewSet` — coach-only; `get_queryset` returns the coach's templates; `perform_create` saves with `coach = user`.
- `CoachMessageViewSet` — limited HTTP methods; `get_queryset` returns messages for the coach (or for the student); `perform_create` requires coach + link and sets coach/student; `mark_read` action stamps `read_at` (students may only mark their own).
- `TrainingPlanViewSet` — `get_queryset` by role; `perform_create` requires coach + link and sets coach/student.

**Connections:** Imports DRF building blocks, Django helpers, `academies.CoachStudentLink`, `assignments.Assignment`/`AssignmentSerializer`, the local models/serializers, and the `services` analytics functions. Wired by `coaching/urls.py`.

---

## `backend/coaching/urls.py`

**In one sentence:** Maps the coach dashboard/analytics, student timeline, bulk assignment, and the three coaching ViewSets to their handlers.

**What it is & why it exists (plain English):** The coaching app's URL switchboard. A router handles the three ViewSets; explicit paths handle the dashboard, analytics, timeline, and bulk assignment endpoints.

**How it works, step by step:** A `DefaultRouter` registers the lesson-template, coach-message, and training-plan ViewSets. `urlpatterns` adds explicit routes for `coach/dashboard/`, `coach/analytics/`, `students/<uuid:student_id>/timeline/`, and `assignments/bulk/`, then includes the router URLs.

**Functions, classes & important values:**
- `router` — registers `LessonTemplateViewSet`, `CoachMessageViewSet`, `TrainingPlanViewSet`.
- `urlpatterns` — `coach/dashboard/`, `coach/analytics/`, `students/<uuid:student_id>/timeline/`, `assignments/bulk/`, plus router URLs.

**Connections:** Imports Django `include`/`path`, DRF `DefaultRouter`, and the coaching views. Mounted under `/api/` by `voltchess_api/urls.py`. Note it also defines an `assignments/bulk/` route (distinct from the assignments app's routes).

---

## `backend/sync/__init__.py`

**In one sentence:** Empty package marker for the `sync` app.

**What it is & why it exists (plain English):** Makes `sync/` an importable package; no behavior.

**How it works, step by step:** Nothing executes.

**Functions, classes & important values:** None.

**Connections:** Enables `sync.*` imports; in `INSTALLED_APPS`.

---

## `backend/sync/apps.py`

**In one sentence:** The configuration class registering the `sync` app.

**What it is & why it exists (plain English):** Standard Django app config.

**How it works, step by step:** Django reads `SyncConfig.name` on startup.

**Functions, classes & important values:**
- `SyncConfig(AppConfig)` — `name = "sync"`, `default_auto_field = "django.db.models.BigAutoField"`.

**Connections:** Imports Django's `AppConfig`. Referenced via `INSTALLED_APPS`.

---

## `backend/sync/admin.py`

**In one sentence:** Registers the `StudentSyncPresence` model in the admin with presence columns.

**What it is & why it exists (plain English):** Lets operators see which students' browsers are recently online and whether they're busy — useful for understanding analysis routing.

**How it works, step by step:** `StudentSyncPresenceAdmin` declares list columns and is registered for the presence model.

**Functions, classes & important values:**
- `StudentSyncPresenceAdmin` — lists `student`, `last_seen_at`, `browser_busy`, `updated_at`.

**Connections:** Imports Django's `admin` and the local `StudentSyncPresence`. Visible at `/admin/`.

---

## `backend/sync/models.py`

**In one sentence:** Defines `StudentSyncPresence`, a one-row-per-student record of whether their browser is recently online and currently busy analyzing.

**What it is & why it exists (plain English):** VoltChess can analyze games either in the student's browser or on the server. To decide which, it needs to know if the student's browser is online and free. This tiny table tracks each student's last "heartbeat" and a busy flag.

**How it works, step by step:** `StudentSyncPresence` is one-to-one with a student and stores `last_seen_at` (updated on heartbeats), `browser_busy`, and `updated_at`.

**Functions, classes & important values:**
- `StudentSyncPresence`:
  - `student` (one-to-one FK, `related_name="sync_presence"`), `last_seen_at` (nullable), `browser_busy` (bool), `updated_at`.
  - `__str__` → "Presence: <username>".

**Connections:** Imports `settings`, Django `models`. Read/written by `sync/services.py` (the `StudentPresence` helper) and surfaced in admin.

---

## `backend/sync/services.py`

**In one sentence:** The orchestration layer for platform import and hybrid (browser-vs-server) analysis routing, including presence tracking, game upserts, claim/release locking, and the student sync overview.

**What it is & why it exists (plain English):** This is the brain of the sync app. It decides how imported games flow through analysis: it records browser presence, imports/updates games without duplicates, picks which games a browser or the server should analyze, safely "claims" a game so two workers don't both analyze it, releases stuck claims, and builds the per-student overview. The "claim" mechanism is essentially a short-lived lock that prevents double work.

**How it works, step by step:**
1. `StudentPresence` reads/writes the presence row: `mark_seen` records a heartbeat; `is_online` checks the last-seen time against a 120-second window; `is_browser_busy` combines the busy flag with online status.
2. `upsert_fetched_game` inserts a new game or updates an existing one (matched by owner+source+external_id), correctly setting analysis status depending on whether an eval already exists.
3. `sync_coach_student_link` (atomic) validates the link's platform/username, marks it syncing, fetches games from the platform, upserts each, records counts, and resets status to idle (or error on failure).
4. `sync_all_enabled_links_for_student` runs sync across all of a student's enabled links.
5. `games_pending_browser_analysis` / `games_pending_server_analysis` select eligible un-analyzed games, respecting fresh claims and (for the server) the student's online/busy state and a brief head-start window.
6. `claim_game_for_browser` / `release_game_for_retry` use row-locking transactions to atomically claim or release a game.
7. `mark_analysis_complete` / `mark_analysis_failed` / `release_stale_analysis_claims` update analysis state, including resetting games stuck "in progress."
8. `student_sync_overview` summarizes a student's platform links and game-analysis counts, treating "has a saved eval" as the source of truth for "analyzed."

**Functions, classes & important values:**
- Constants: `PRESENCE_ONLINE_SECONDS = 120`; `BROWSER_CLAIM_TIMEOUT = 4 minutes`; `SERVER_PENDING_TIMEOUT = 45 seconds`.
- `StudentPresence` — `get_or_create(student)`, `mark_seen(student, browser_busy=False)`, `is_online(student)`, `is_browser_busy(student)`.
- `upsert_fetched_game(student, fetched)` — returns `(game, created)`; inserts/updates a game and fixes its analysis status.
- `sync_coach_student_link(link, limit=30)` — imports games for one link; returns a result dict (`fetched/created/updated/pending_analysis/last_sync_at`); raises `ValueError` if platform/username missing.
- `sync_all_enabled_links_for_student(student)` — returns a list of per-link results (or error dicts).
- `games_pending_browser_analysis(student, limit=5)` — returns games the browser should analyze (skips ones with eval or fresh claims).
- `games_pending_server_analysis(limit=3)` — returns games the server should analyze when the browser is offline/busy/slow to claim.
- `claim_game_for_browser(game_id, student)` — returns the claimed game or `None` (atomic, row-locked).
- `release_game_for_retry(game_id, student)` — returns `True` after resetting a game to pending.
- `mark_analysis_complete(game, source)` / `mark_analysis_failed(game)` — update status/source/claim fields.
- `release_stale_analysis_claims()` — returns the count of stuck games reset to pending.
- `student_sync_overview(student)` — returns `{platform_links, games_total, games_analyzed, games_pending, games_in_progress, games_failed, last_sync_at}`.

**Connections:** Imports Django `transaction`/`timezone`/`get_user_model`, `academies` (`CoachStudentLink`/`PlatformChoice`/`SyncStatus`), `games` (`AnalysisStatus`/`Game`), and `platform_fetch` (`SYNC_GAME_LIMIT`/`fetch_platform_games`). Used by `sync/views.py`, `sync/server_analysis.py`, and the `run_platform_sync` command; verified by `sync/tests.py`.

---

## `backend/sync/server_analysis.py`

**In one sentence:** Runs the Stockfish chess engine on the server to analyze games when the student's browser isn't available, saving the results as a `GameEval`.

**What it is & why it exists (plain English):** Normally the student's browser analyzes games, but if it's offline VoltChess can fall back to the server. This file launches the Stockfish engine (a chess-analysis program) as a subprocess, walks through every position of a game, records the engine's evaluation, and saves it. It's designed to run on a small machine (like a Raspberry Pi) via a scheduled job.

**How it works, step by step:**
1. `_stockfish_path` finds the Stockfish binary via env var, settings, or common system locations (or returns `None`).
2. `_fens_from_pgn` parses the PGN with `python-chess` and produces the list of board positions (FEN strings) after each move.
3. `_eval_fen` sends one position to Stockfish over its text protocol (UCI), reads the engine's output, and extracts the centipawn score and principal variation (best line).
4. `analyze_game_on_server` launches Stockfish, waits for it to be ready, evaluates every position, saves a `GameEval` (note: server analysis is single-line, so accuracy is left at 0), marks the game complete (source = server), and always kills the engine at the end. Failures mark the game failed.
5. `process_server_queue` pulls a batch of server-eligible games, claims each for the server, analyzes them, and returns counts.

**Functions, classes & important values:**
- `_stockfish_path()` — returns the engine path or `None`.
- `_fens_from_pgn(pgn_text)` — returns a list of FEN strings (positions) for the game.
- `_eval_fen(process, fen, depth, movetime_ms)` — returns `{bestMove, lines:[{pv, cp, depth, multiPv}]}` for one position.
- `analyze_game_on_server(game, depth=4, movetime_ms=80)` — analyzes a whole game and saves the eval; returns `True`/`False` for success; marks complete or failed.
- `process_server_queue(max_games=3)` — returns `{processed, failed, attempted}` (or a reason dict if Stockfish isn't configured).

**Connections:** Imports `io`/`os`/`subprocess`, `datetime`, `chess.pgn` (the `python-chess` library), Django `settings`, `games` (`AnalysisSource`/`Game`/`GameEval`), and from `services`: `mark_analysis_complete`/`mark_analysis_failed`/`games_pending_server_analysis`. Used by `sync/views.py` (`ProcessServerQueueView`) and the `run_platform_sync --analyze` command.

---

## `backend/sync/platform_fetch.py`

**In one sentence:** Fetches recent games from the public Chess.com and Lichess APIs and converts them into a uniform `FetchedGame` shape.

**What it is & why it exists (plain English):** To import a student's games, VoltChess calls the chess websites' public APIs over the internet. Chess.com and Lichess return data in different formats, so this file normalizes both into one consistent `FetchedGame` structure the rest of the code understands. It also handles real-world quirks like Cloudflare requiring a proper User-Agent header.

**How it works, step by step:**
1. `_get` performs an HTTP GET with a descriptive User-Agent and timeout.
2. `FetchedGame` is the shared data shape (a dataclass) for one imported game.
3. `_pgn_header` extracts a header value (e.g. Event, Date) from PGN text via regex.
4. Chess.com path: `fetch_chesscom_games` resolves the player's monthly archive list, pulls newest months until it has enough games, then `_parse_chesscom_game` converts each into a `FetchedGame`.
5. Lichess path: `fetch_lichess_games` requests the user's games as newline-delimited JSON, and `_parse_lichess_game` converts each line.
6. `fetch_platform_games` dispatches to the right fetcher based on the platform string.

**Functions, classes & important values:**
- Constants: `SYNC_GAME_LIMIT = 30`; `REQUEST_TIMEOUT = 25`; `USER_AGENT` (descriptive identifier).
- `_get(url, headers=None)` — returns a `requests.Response` with the merged headers.
- `FetchedGame` (dataclass) — fields: `external_id, external_url, pgn, event, site, date, round, white, black, result, termination, time_control, source, played_at`.
- `_pgn_header(pgn, key)` — returns the header value or empty string.
- `_parse_chesscom_game(raw)` / `_parse_lichess_game(raw)` — return a `FetchedGame` or `None` (when there's no usable PGN/id).
- `fetch_chesscom_games(username, limit=30)` — returns a list of `FetchedGame` (raises `ValueError` for not-found/unavailable).
- `fetch_lichess_games(username, limit=30)` — returns a list of `FetchedGame` (raises `ValueError` for not-found/unavailable).
- `fetch_platform_games(platform, username, limit=30)` — dispatches to the correct fetcher; raises `ValueError` for unsupported platforms.

**Connections:** Imports `json`/`re`/`dataclass`/`datetime`/`typing` and the `requests` library. Used by `sync/services.py` (`fetch_platform_games`, `SYNC_GAME_LIMIT`); `FetchedGame` is used in `sync/tests.py`.

---

## `backend/sync/views.py`

**In one sentence:** Request handlers for the sync overview, triggering imports, the browser heartbeat, listing pending games, and the claim/release/complete/server-queue analysis flow.

**What it is & why it exists (plain English):** This file exposes the sync system over the API. The student's browser uses these endpoints to report it's online, ask which games to analyze, claim one, upload results, or release it; coaches/students can trigger an import; and there's an endpoint to run the server analysis queue. It leans on `services.py` for the real logic and reuses game serializers.

**How it works, step by step:**
1. `SyncOverviewView` returns the sync summary for the current user, or for a given student if the requester is an authorized coach/admin.
2. `SyncTriggerView` imports games for a specific link (with role-based lookup) or for all of a student's enabled links.
3. `PresenceView` records a browser heartbeat (with busy flag).
4. `PendingAnalysisView` returns games waiting for browser analysis (capped at 10).
5. `ClaimAnalysisView`/`ReleaseAnalysisView`/`CompleteAnalysisView` claim a game (409 if already claimed/analyzed), release it, or upload the eval and mark complete — each only for the game's owner.
6. `ProcessServerQueueView` runs the server Stockfish queue (students limited to one game; non-coach/admin/students forbidden).

**Functions, classes & important values:**
- `_get_link_for_coach(coach, link_id)` — fetches a link owned by that coach.
- `SyncOverviewView.get` — returns `student_sync_overview(student)` with access checks for the `student_id` case.
- `SyncTriggerView.post` — runs `sync_coach_student_link` (link case) or `sync_all_enabled_links_for_student` (student case); handles not-found/disabled.
- `PresenceView.post` — calls `StudentPresence.mark_seen`; returns `{ok: True}`.
- `PendingAnalysisView.get` — returns `games_pending_browser_analysis` serialized.
- `ClaimAnalysisView.post(request, game_id)` — owner-only; returns the claimed game or 409.
- `ReleaseAnalysisView.post(request, game_id)` — owner-only; releases the game.
- `CompleteAnalysisView.post(request, game_id)` — owner-only; validates/saves the eval and marks complete.
- `ProcessServerQueueView.post` — runs `process_server_queue` (role-limited).

**Connections:** Imports DRF pieces, Django helpers, `academies.CoachStudentLink`, `games` (`Game`, `IsGameOwnerOrCoach`, `GameDetailSerializer`, `GameEvalUploadSerializer`), `server_analysis.process_server_queue`, and many functions from `services`. Wired by `sync/urls.py`.

---

## `backend/sync/urls.py`

**In one sentence:** Maps the sync overview, trigger, presence, and analysis (pending/claim/complete/release/server) endpoints to their views.

**What it is & why it exists (plain English):** The sync app's URL switchboard. Unlike most apps it uses explicit `path` entries (no router), since these are action endpoints rather than standard CRUD.

**How it works, step by step:** `urlpatterns` lists the routes, including three game-scoped routes that take a `<uuid:game_id>` parameter for claim/complete/release.

**Functions, classes & important values:**
- `urlpatterns` — `sync/overview/`, `sync/trigger/`, `sync/presence/`, `sync/pending-analysis/`, `sync/games/<uuid:game_id>/claim/`, `.../complete/`, `.../release/`, and `sync/process-server/`.

**Connections:** Imports Django `path` and the eight sync views. Mounted under `/api/` by `voltchess_api/urls.py`.

---

## `backend/sync/tests.py`

**In one sentence:** Automated tests covering the full sync + hybrid-analysis flow: presence, overview, claim/complete/release, and the import service.

**What it is & why it exists (plain English):** The sync app has the most intricate logic (locking, routing, imports), so it has the most thorough tests. They use a shared fixture and mock the external platform calls so tests run fast and offline, proving the rules around claiming/completing games and importing without duplicates.

**How it works, step by step:** A `SyncFixtureMixin.setUp` creates a coach, two students, an academy, and a Lichess-enabled link. Test classes then authenticate and exercise the endpoints/services, asserting status codes and database state. A `make_fetched` helper builds fake imported games, and `mock.patch` replaces `fetch_platform_games` so no real network call happens.

**Functions, classes & important values:**
- `make_fetched(external_id, source="lichess")` — returns a `FetchedGame` for tests.
- `SyncFixtureMixin.setUp` — builds the shared coach/students/academy/link.
- `PresenceTests` — heartbeat marks the student online and tracks the busy flag.
- `OverviewTests` — student/coach/admin overview behavior, including that a saved eval counts as analyzed and that unlinked/missing students return 403/404.
- `ClaimCompleteTests` — 404s for missing games, the claim→complete happy path, forbidden claims on others' games, double-claim returning 409, claiming an already-analyzed game returning 409, release returning a game to pending, and the pending list.
- `SyncServiceTests` — `upsert_fetched_game` creates then updates (no duplicates), `sync_coach_student_link` imports games and updates link status (mocking the fetch), the username requirement raises, and the trigger endpoint works for a student.
- `DEMO_PGN` — a tiny PGN string reused across tests.

**Connections:** Imports `unittest.mock`, DRF `APITestCase`, `academies` models, `games` models, and `sync` (`FetchedGame`, plus service functions). Exercises `sync/views.py`, `sync/services.py`, and `sync/platform_fetch.py`. Run with `python manage.py test sync`.

---

## `backend/sync/management/__init__.py`

**In one sentence:** Empty marker making `sync/management/` a Python package for custom commands.

**What it is & why it exists (plain English):** Required so Django can find the commands folder inside the sync app.

**How it works, step by step:** No logic; presence enables the package.

**Functions, classes & important values:** None.

**Connections:** Required for `sync/management/commands/` to be discovered.

---

## `backend/sync/management/commands/__init__.py`

**In one sentence:** Empty marker making the sync `commands` folder a Python package where management commands are auto-discovered.

**What it is & why it exists (plain English):** Makes the `run_platform_sync` command discoverable by `manage.py`.

**How it works, step by step:** No logic; presence enables discovery.

**Functions, classes & important values:** None.

**Connections:** Enables the `run_platform_sync` command below.

---

## `backend/sync/management/commands/run_platform_sync.py`

**In one sentence:** A `manage.py run_platform_sync` command (intended for a Raspberry Pi cron job) that imports platform games and optionally runs the server-side analysis queue.

**What it is & why it exists (plain English):** This is the scheduled background worker. On a timer it imports new games for every enabled coach-student link, clears out any analysis claims that got stuck, and — only if asked — runs the server Stockfish queue. By default it skips server analysis because browser-side analysis produces richer reports.

**How it works, step by step:**
1. `add_arguments` defines flags: `--sync-only`, `--analyze`, `--analyze-only`, and `--max-analyze` (default 3).
2. `handle` first releases stale analysis claims (reporting how many).
3. Unless `--analyze-only`, it loops over enabled links that have a platform+username and syncs each, printing success/error per student.
4. If analysis was requested (and not `--sync-only`), it runs `process_server_queue` with the max; otherwise it prints a note that server analysis is skipped by default.

**Functions, classes & important values:**
- `Command(BaseCommand)`:
  - `help` — describes the command.
  - `add_arguments(parser)` — adds the four flags above.
  - `handle(*args, **options)` — releases stale claims, syncs enabled links (unless analyze-only), and optionally runs the server queue; prints progress throughout.

**Connections:** Imports `BaseCommand`, `sync.server_analysis.process_server_queue`, `sync.services` (`release_stale_analysis_claims`/`sync_coach_student_link`), and `academies.CoachStudentLink`. Run manually or via cron (see the Pi deployment docs).

---

## Database migrations (all apps)

**What migrations are (plain English):** A *migration* is an auto-generated Python file that records a change to the database structure — like "add a `metadata` column to assignments" or "create the classroom table." When you change a model in `models.py`, you run `python manage.py makemigrations` to create a migration file capturing that change, then `python manage.py migrate` to apply it to the real database. Migrations form an ordered, append-only history of the schema, so any database (a teammate's, the test database, production) can be brought up to date by replaying them in order.

**Why they're not documented individually here:** These files are machine-generated and only meaningful as a sequence. You rarely edit them by hand; the authoritative description of the data lives in each app's `models.py` (documented above). Each app keeps its migrations in a `migrations/` folder (with its own `__init__.py`), excluded from the file-by-file documentation per the scope of this guide. The current counts are below for orientation:

- **`accounts/migrations/`** — 1 migration: creates the custom `User` table and its roles.
- **`academies/migrations/`** — 5 migrations: build up academies, memberships, coach-student links, the classroom table, and later sync-related fields on links.
- **`games/migrations/`** — 2 migrations: create `Game`/`GameEval`, then add analysis source/claim fields.
- **`assignments/migrations/`** — 2 migrations: create `Assignment`, then add metadata.
- **`annotations/migrations/`** — 1 migration: creates the `Annotation` table.
- **`coaching/migrations/`** — 1 migration: creates `LessonTemplate`, `CoachMessage`, and `TrainingPlan`.
- **`sync/migrations/`** — 1 migration: creates the `StudentSyncPresence` table.

To inspect what a specific migration does, open the file in the relevant `migrations/` folder, or run `python manage.py sqlmigrate <app> <number>` to see the SQL it generates. The `voltchess_api/` project folder has no migrations because it defines no models of its own.
