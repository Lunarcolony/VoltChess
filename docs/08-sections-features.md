# VoltChess Feature UI Sections (Everything Except Analysis)

This document is an exhaustive, beginner-friendly tour of the feature-specific UI building blocks that live in `src/sections`, **excluding** the large `analysis` folder (which is documented separately). It covers authentication screens, the app shell and navigation, coach tools, the student hub, the first-run onboarding tour, the play-vs-engine experience, the "load a game" tooling (Chess.com / Lichess / PGN), the home page widgets, engine settings, and the blog renderer. Every file documented below was read directly from the current codebase, so the names, props, and behavior described here match what actually ships today.

## Plain-English primer: what is `src/sections`?

In this project the code is layered. The smallest reusable pieces (buttons, sliders, logos) live in `src/components`. The **pages** the user navigates to (the URL routes like `/`, `/play`, `/coach`) live in `src/pages`. In between sit the **sections** (`src/sections`): larger, feature-specific UI building blocks. A "section" is a chunk of screen that does one job for one feature — for example "the sidebar," "the join-a-classroom card," or "the dialog for starting a game against the engine." Pages assemble sections; sections assemble components. Sections are where most of the feature logic lives.

Some `.ts` files in these folders contain no UI at all — they are **constants** (lists of options, labels) or **state**/**storage helpers** (shared data and small functions). They are included because the UI files import them.

Each subfolder has a theme:

- **`auth`** — sign-in / register page scaffolding (the framed card layout and the Student-vs-Coach role picker).
- **`layout`** — the global app shell: theme provider, left sidebar / mobile top bar, and the wrapper that decides which routes get a sidebar.
- **`coach`** — tools for chess coaches: classroom code panel, tabbed navigation shell, and small reusable cards (stat tiles, headers, empty states).
- **`student`** — the student hub's "connect your chess account" card that imports and tracks analysis of their games.
- **`onboarding`** — the first-time-user experience: a welcome modal that loads your latest game, plus a reusable spotlight tour that highlights features one step at a time.
- **`play`** — play a game against the Stockfish engine: the board, "game in progress" controls, end-of-game recap, undo button, and game-setup dialog.
- **`loadGame`** — load a game to analyze or store, from Chess.com, Lichess, or a pasted/uploaded PGN, including the list rows ("game items") that show each result.
- **`home`** — home-page widgets: the feature promo card and the tabbed game loader.
- **`engineSettings`** — the analysis engine configuration dialog and its arrow display toggles.
- **`blog`** — renders a single blog/guide article from structured data with SEO metadata.

> **Jargon quick-reference:**
> - **Component** — a reusable piece of UI written as a function that returns what to show on screen.
> - **Props** — the inputs a component receives from its parent (like function arguments).
> - **Atom / Jotai** — a small piece of shared global state. `useAtomValue` reads it; `useSetAtom` writes it; `useAtom` does both. Atoms let far-apart components share data (e.g., the current game).
> - **MUI** — Material UI, the component library providing `Box`, `Button`, `Dialog`, etc. `sx` is its inline styling prop.
> - **react-query (`useQuery`/`useMutation`)** — fetches data from the server, caches it, and re-fetches when needed. `useMutation` is for actions that change server data.
> - **PGN / FEN** — text formats for chess. PGN records a whole game's moves; FEN snapshots a single position.
> - **palette** — the active color theme values (`usePalette()`), e.g. `accent`, `bg`, `text`, `border`.

---

## Table of Contents

**auth**
- [`src/sections/auth/AuthLayout.tsx`](#srcsectionsauthauthlayouttsx)
- [`src/sections/auth/RoleSelector.tsx`](#srcsectionsauthroleselectortsx)

**layout**
- [`src/sections/layout/AppThemeProvider.tsx`](#srcsectionslayoutappthemeprovidertsx)
- [`src/sections/layout/index.tsx`](#srcsectionslayoutindextsx)
- [`src/sections/layout/Sidebar.tsx`](#srcsectionslayoutsidebartsx)
- [`src/sections/layout/SidebarAccount.tsx`](#srcsectionslayoutsidebaraccounttsx)

**coach**
- [`src/sections/coach/ClassroomPanel.tsx`](#srcsectionscoachclassroompaneltsx)
- [`src/sections/coach/CoachShell.tsx`](#srcsectionscoachcoachshelltsx)
- [`src/sections/coach/CoachUi.tsx`](#srcsectionscoachcoachuitsx)
- [`src/sections/coach/constants.ts`](#srcsectionscoachconstantsts)
- [`src/sections/coach/JoinClassroomCard.tsx`](#srcsectionscoachjoinclassroomcardtsx)

**student**
- [`src/sections/student/StudentPlatformCard.tsx`](#srcsectionsstudentstudentplatformcardtsx)

**onboarding**
- [`src/sections/onboarding/AnalysisTour.tsx`](#srcsectionsonboardinganalysistourtsx)
- [`src/sections/onboarding/SpotlightTour.tsx`](#srcsectionsonboardingspotlighttourtsx)
- [`src/sections/onboarding/WelcomeModal.tsx`](#srcsectionsonboardingwelcomemodaltsx)
- [`src/sections/onboarding/constants.ts`](#srcsectionsonboardingconstantsts)
- [`src/sections/onboarding/loadOnboardingGame.ts`](#srcsectionsonboardingloadonboardinggamets)
- [`src/sections/onboarding/onboardingStorage.ts`](#srcsectionsonboardingonboardingstoragets)

**play**
- [`src/sections/play/board.tsx`](#srcsectionsplayboardtsx)
- [`src/sections/play/gameInProgress.tsx`](#srcsectionsplaygameinprogresstsx)
- [`src/sections/play/gameRecap.tsx`](#srcsectionsplaygamerecaptsx)
- [`src/sections/play/states.ts`](#srcsectionsplaystatests)
- [`src/sections/play/undoMoveButton.tsx`](#srcsectionsplayundomovebuttontsx)
- [`src/sections/play/gameSettings/gameSettingsButton.tsx`](#srcsectionsplaygamesettingsgamesettingsbuttontsx)
- [`src/sections/play/gameSettings/gameSettingsDialog.tsx`](#srcsectionsplaygamesettingsgamesettingsdialogtsx)

**loadGame**
- [`src/sections/loadGame/chessComInput.tsx`](#srcsectionsloadgamechesscominputtsx)
- [`src/sections/loadGame/gamePgnInput.tsx`](#srcsectionsloadgamegamepgninputtsx)
- [`src/sections/loadGame/lichessInput.tsx`](#srcsectionsloadgamelichessinputtsx)
- [`src/sections/loadGame/loadGameButton.tsx`](#srcsectionsloadgameloadgamebuttontsx)
- [`src/sections/loadGame/loadGameDialog.tsx`](#srcsectionsloadgameloadgamedialogtsx)
- [`src/sections/loadGame/loadGameInlinePanel.tsx`](#srcsectionsloadgameloadgameinlinepaneltsx)
- [`src/sections/loadGame/gameItem/index.tsx`](#srcsectionsloadgamegameitemindextsx)
- [`src/sections/loadGame/gameItem/dateChip.tsx`](#srcsectionsloadgamegameitemdatechiptsx)
- [`src/sections/loadGame/gameItem/gameResultChip.tsx`](#srcsectionsloadgamegameitemgameresultchiptsx)
- [`src/sections/loadGame/gameItem/movesNbChip.tsx`](#srcsectionsloadgamegameitemmovesnbchiptsx)
- [`src/sections/loadGame/gameItem/timeControlChip.tsx`](#srcsectionsloadgamegameitemtimecontrolchiptsx)

**home**
- [`src/sections/home/FeatureCard.tsx`](#srcsectionshomefeaturecardtsx)
- [`src/sections/home/HomeGameLoader.tsx`](#srcsectionshomehomegameloadertsx)

**engineSettings**
- [`src/sections/engineSettings/arrowOptions.tsx`](#srcsectionsenginesettingsarrowoptionstsx)
- [`src/sections/engineSettings/engineSettingsDialog.tsx`](#srcsectionsenginesettingsenginesettingsdialogtsx)

**blog**
- [`src/sections/blog/BlogArticle.tsx`](#srcsectionsblogblogarticletsx)

---

## `src/sections/auth/AuthLayout.tsx`

**In one sentence:** A reusable, centered, branded "card" frame that wraps the contents of the sign-in and register screens.

**What it is & why it exists (plain English):** Every authentication screen (login, register) should look the same: a dark page with the VoltChess logo at the top, a heading, and a neat bordered card holding the actual form. Rather than copy that decoration onto every page, this component provides the shared shell. A page just says "render my form inside `AuthLayout` with this title," and the consistent branding and spacing come for free.

**How it works, step by step:** It reads the current theme colors with `usePalette()`. It renders a full-height (`100vh`) flex container that vertically and horizontally centers its content, painted with the theme background plus a soft radial gradient glow in the accent color near the top. Inside sits a max-width 420px column. If a `banner` was passed, it shows above everything (used for messages like "your session expired"). Below that is the brand block: the `VoltChessLogo`, the title "VoltChess Academy," and a fixed tagline. Finally comes the raised card: a surface-colored box with a border, rounded corners, padding, and a soft shadow. The card shows the page-specific `title`, an optional `subtitle`, and then the `children` (the form itself). When there is no subtitle it still adds a small spacer so layout stays consistent.

**Components, functions & exports:**
- **`AuthLayout` (default export)** — Props: `children` (the form to wrap), `title` (string, card heading), `subtitle?` (string, optional sub-heading), `banner?` (a React node shown above the card). Output: the full centered page with branding and the framed card around `children`. Steps: read palette → render centered page background → optional banner → logo + brand text → card with title/subtitle → render children.

**Connections:** Imports `VoltChessLogo` (`@/components/VoltChessLogo`), `usePalette` (`@/hooks/usePalette`), and MUI `Box`/`Typography`/`alpha`. Used by the login and register pages (`src/pages/login.tsx`, `src/pages/register.tsx`).

---

## `src/sections/auth/RoleSelector.tsx`

**In one sentence:** A two-card picker that lets a new user choose whether they are signing up as a **Student** or a **Coach**.

**What it is & why it exists (plain English):** During registration the app must know what kind of account to create, because students and coaches see different features. This component shows two side-by-side selectable cards, each with an icon, a label, and a one-line explanation of what that role does. The chosen card is highlighted in the accent color. Keeping this as its own component means the choice looks and behaves identically anywhere it is needed.

**How it works, step by step:** A constant `ROLE_OPTIONS` lists the two selectable roles (Student first, Coach second) with their label, description, and icon name. The component maps over that list and renders a card per option. Each card is given accessibility attributes so it behaves like a radio button: `role="radio"`, `aria-checked`, and `tabIndex={0}` so it is keyboard-focusable. Clicking a card, or pressing Enter/Space while it is focused, calls `onChange(role)`. The currently `selected` card (where `value === opt.role`) gets an accent-tinted background, an accent border, and accent-colored icon/label; unselected cards use muted colors and brighten their border on hover.

**Components, functions & exports:**
- **`RoleSelector` (default export)** — Props: `value` (the currently selected role, or `null`), `onChange` (callback receiving the newly picked role). Output: a row of two clickable role cards. Steps: read palette → map `ROLE_OPTIONS` → for each, compute `selected` → render styled card with click + keyboard handlers calling `onChange`.
- **`SelectableRole` (internal type)** — restricts the choice to `UserRole.Coach | UserRole.Student` (the `Admin` role can't be self-selected at signup).

**Connections:** Imports `usePalette`, `UserRole` (`@/types/user`), `Icon` (Iconify), and MUI primitives. Used by `src/pages/register.tsx`.

---

## `src/sections/layout/AppThemeProvider.tsx`

**In one sentence:** Wraps the whole app in the currently selected color theme and keeps the browser UI color in sync.

**What it is & why it exists (plain English):** VoltChess supports multiple color themes. Something at the very top of the app must take the user's chosen theme and feed it into Material UI so every component is styled correctly. That is this provider's job. It also updates the browser's `theme-color` meta tag so that, on mobile, the address bar / status bar matches the app background.

**How it works, step by step:** It reads the selected theme id from `colorThemeAtom` (Jotai global state). It converts that id into a color palette via `getPalette(themeId)`, and converts the palette into a full MUI theme object via `createAppTheme(...)`. Both conversions are wrapped in `useMemo`, so they only recompute when the theme actually changes (avoiding wasted work). A `useEffect` finds the `<meta name="theme-color">` tag and sets its content to the palette's background color whenever that color changes. Finally it renders MUI's `ThemeProvider` (passing the computed theme) with `CssBaseline` (which applies sensible global CSS resets) and then the app's `children`.

**Components, functions & exports:**
- **`AppThemeProvider` (default export)** — Props: `children` (the entire app tree to theme). Output: a `ThemeProvider` + `CssBaseline` wrapper around `children`. Steps: read theme id atom → memoize palette → memoize MUI theme → sync `theme-color` meta in an effect → render providers.

**Connections:** Imports `colorThemeAtom` (`@/theme/colorThemeAtom`), `getPalette` (`@/theme/themes`), `createAppTheme` (`@/theme/voltchessTheme`), and MUI. Used by `src/sections/layout/index.tsx` (the main `Layout`), which wraps it around every page.

---

## `src/sections/layout/index.tsx`

**In one sentence:** The top-level page wrapper that applies the theme, and conditionally renders the sidebar + padded content area depending on the current route.

**What it is & why it exists (plain English):** Most pages should have the left sidebar and some breathing-room padding. But a few special routes need different treatment: auth pages (`/login`, `/register`) should have **no** sidebar at all, and full-screen pages (`/analysis`, `/review`) should run edge-to-edge with no padding. This file centralizes those rules so individual pages don't each reinvent the layout.

**How it works, step by step:** Two constant arrays define the special routes: `FULL_BLEED_ROUTES` (edge-to-edge) and `AUTH_ROUTES` (no sidebar). The exported `Layout` checks if the current path starts with any auth route; if so, it renders just the themed children (no sidebar). Otherwise it renders the theme provider wrapping a flex row containing the `Sidebar` and a `MainContent` area. `MainContent` figures out whether the current route is full-bleed; based on that and screen size it sets margins (leaving room for the fixed sidebar on desktop via `SIDEBAR_WIDTH`), top padding (52px on mobile to clear the fixed mobile header), horizontal/vertical padding (zero when full-bleed), max width, and—when full-bleed on desktop—a fixed `100dvh` height with hidden overflow so the analysis board fills the screen.

**Components, functions & exports:**
- **`Layout` (default export)** — Props: `children` (page content). Output: themed page; either bare (auth routes) or sidebar + main content. Steps: detect auth route → branch → render `AppThemeProvider` (+ optional `Sidebar`/`MainContent`).
- **`MainContent` (internal)** — Props: `children`. Output: the `<main>` region with responsive spacing. Steps: detect mobile + full-bleed → compute `sx` spacing → render children.

**Connections:** Imports `Sidebar`/`SIDEBAR_WIDTH` and `AppThemeProvider` from the same folder, `useRouter` (`@/hooks/useRouter`), and MUI. It is the app's main layout, applied around every route.

---

## `src/sections/layout/Sidebar.tsx`

**In one sentence:** The primary navigation — a fixed left sidebar on desktop and a hamburger-drawer + top bar on mobile — whose links adapt to the signed-in user's role.

**What it is & why it exists (plain English):** This is how users move around the app. On a wide screen it's a permanent column of links down the left. On a phone there isn't room, so it collapses into a top bar with a menu (hamburger) button that opens a slide-in drawer. The list of links changes depending on who you are: everyone sees Home / Analysis / Guides / Database, coaches additionally get "Coach Hub," and students get "My Hub." The active page's link is highlighted.

**How it works, step by step:** `BASE_NAV` lists the four links everyone sees. `navForRole(role, isAuthenticated)` returns a copy of that list with a role-specific entry spliced in at position 1: "Coach Hub" for coaches/admins, "My Hub" for students; logged-out or role-less users get the base list. `SIDEBAR_WIDTH` (220) is exported so the main layout can offset content. `SidebarContent` builds the actual column: brand header, the list of nav links (each computing `isActive` — exact match for "/", prefix match otherwise — and styling itself accent-highlighted when active), then at the bottom the `SidebarAccount` block and a small "Powered by Chesskit" credit. The default-exported `Sidebar` decides presentation by screen size: on mobile it renders a fixed 52px top header (hamburger `IconButton` that opens a `Drawer`, logo, and `MobileHeaderAccount`); the drawer hosts `SidebarContent` and closes on navigation. On desktop it renders a fixed full-height `<nav>` containing `SidebarContent`.

**Components, functions & exports:**
- **`Sidebar` (default export)** — Props: none. Output: mobile top bar + drawer, or desktop fixed sidebar. Steps: detect mobile → render the appropriate variant.
- **`SidebarContent` (internal)** — Props: `onNavigate?` (called after a link click, used to close the mobile drawer). Output: the brand + nav list + account + credit column.
- **`navForRole` (internal helper)** — Inputs: `role`, `isAuthenticated`. Output: the ordered `NavItem[]` for that user.
- **`SIDEBAR_WIDTH` (named export)** — the numeric width (220) shared with the layout.

**Connections:** Imports `NavLink` and `VoltChessLogo` (`@/components`), `useRouter`, `usePalette`, `useAuth` (`@/contexts/AuthContext`), `UserRole`, and `SidebarAccount`/`MobileHeaderAccount` from `./SidebarAccount`. Used by `src/sections/layout/index.tsx`.

---

## `src/sections/layout/SidebarAccount.tsx`

**In one sentence:** The account area shown inside the sidebar (and mobile header): a "Sign in" button when logged out, or the user's avatar, name, role, and a sign-out control when logged in.

**What it is & why it exists (plain English):** The bottom of the sidebar needs to reflect login state. If you're not signed in, it shows a prominent "Sign in" button. If you are, it shows a circular avatar (your first initial), your username, your role with a matching icon, and a logout button that asks for confirmation before signing you out. Because the desktop sidebar and the compact mobile header need slightly different layouts of the same idea, this file exports several variants.

**How it works, step by step:** A small `roleIcon(role)` helper maps "coach"/"admin"/other to an icon name. `SidebarAccount` reads `useAuth()` (giving `user`, `logout`, `isAuthenticated`, `loading`). While auth is still `loading` it renders an empty spacer (prevents flicker). If not authenticated, it renders a full-width contained "Sign in" button linking to `/login`. Otherwise it computes the avatar `initial` and a human `roleLabel` (from `USER_ROLE_LABELS`) and renders the avatar + name + role row plus a tooltip'd sign-out `IconButton`. Clicking sign-out opens a `ConfirmLogoutDialog`; confirming calls `logout()`, closes the dialog, optionally runs `onNavigate`, and routes to `/login`. `MobileHeaderAccount` is the compact version for the mobile top bar: an empty spacer while loading, `MobileSignInButton` when logged out, otherwise a small chip-like avatar+name+role badge (name/role hidden on the smallest screens) with its own confirm-logout flow. `MobileSignInButton` renders a small "Sign in" button and returns `null` when loading or already authenticated.

**Components, functions & exports:**
- **`SidebarAccount` (named export)** — Props: `onNavigate?`. Output: sign-in button or account row + confirm-logout dialog. Steps: read auth → branch on loading / unauth / auth.
- **`MobileHeaderAccount` (named export)** — Props: none. Output: compact account badge or sign-in button for the mobile header.
- **`MobileSignInButton` (named export)** — Props: none. Output: a small sign-in button, or `null` when not needed.
- **`roleIcon` (internal helper)** — Input: role string. Output: icon name.

**Connections:** Imports `NavLink`, `ConfirmLogoutDialog` (`@/components`), `useAuth`, `usePalette`, `useRouter`, and `USER_ROLE_LABELS` (`@/types/user`). Used by `Sidebar.tsx`.

---

## `src/sections/coach/ClassroomPanel.tsx`

**In one sentence:** The coach's classroom card — shows the shareable join code, lets the coach rename the classroom, regenerate the code, copy it, and see how many students have joined.

**What it is & why it exists (plain English):** Coaches invite students by giving them a short "join code." This panel is where the coach manages that code. It fetches the coach's classroom from the server, prominently displays the code in a large monospaced font, and offers buttons to copy it, generate a fresh one (which invalidates the old), and edit the classroom name. It also shows whether the classroom is open and a live count of joined students.

**How it works, step by step:** It uses react-query's `useQuery(["my-classroom"], fetchMyClassroom)` to load the classroom; while loading it shows a spinner, on error a red alert with a friendly message (`getApiErrorMessage`), and if there is no classroom it renders nothing. Two `useMutation`s handle changes: `regenMut` calls `regenerateClassroomCode`, and `saveNameMut` calls `updateMyClassroom({ name })`; both invalidate the `["my-classroom"]` query on success so the UI refreshes. Local state tracks `copied` (for the copy-button feedback) and `nameEdit` (the in-progress name text; `null` means "not editing"). `copyCode()` writes the join code to the clipboard and flips `copied` true for two seconds. The render is a gradient-accented card: a header (icon, "Your classroom," explanatory text, and an Open/Closed status chip), a name `TextField` (a "Save name" button appears only when the text differs from the saved name), and a dashed box containing the big join code, a copy `IconButton` (check icon when copied), a "New code" button, and the "N student(s) joined" count. Regenerate errors show their own alert.

**Components, functions & exports:**
- **`ClassroomPanel` (default export)** — Props: none. Output: the classroom management card (or spinner/alert/nothing). Steps: query classroom → handle loading/error/empty → render header + name editor + code box → wire copy/regenerate/save mutations.
- **`copyCode` (internal)** — copies the code to clipboard and toggles the "Copied!" state.

**Connections:** Imports classroom API helpers (`fetchMyClassroom`, `regenerateClassroomCode`, `updateMyClassroom` from `@/lib/api/classrooms`), `getApiErrorMessage`, `usePalette`, react-query, and MUI. Used by the coach dashboard pages under `src/pages/coach/`.

---

## `src/sections/coach/CoachShell.tsx`

**In one sentence:** The tabbed navigation bar that wraps every coach page, highlighting the active section and switching routes when a tab is clicked.

**What it is & why it exists (plain English):** The Coach Hub has several sub-pages (Command Center, Students, Assignments, Templates, Messages, Training Plans, Analytics). They should all share one row of tabs across the top, with the current one highlighted. `CoachShell` is that shared frame: each coach page renders its content inside the shell, and the shell draws the tabs.

**How it works, step by step:** It reads the `COACH_NAV` list (label/href/icon per tab) from `./constants`. It computes which tab is `active` by finding the nav item whose href matches the current path — exact match for `/coach`, prefix match for the others — defaulting to `/coach`. It renders a centered, max-width container with a scrollable MUI `Tabs` row (so tabs don't overflow on narrow screens); changing tabs calls `navigate(v)` (React Router) to go to that href. Each `Tab` shows its icon (start-positioned) and label, styled with the accent indicator and accent-tinted hover. Below the tabs it renders the page's `children`.

**Components, functions & exports:**
- **`CoachShell` (default export)** — Props: `children` (the coach page body). Output: the tab bar + the page content. Steps: derive active tab from the route → render scrollable `Tabs` from `COACH_NAV` → `navigate` on change → render children.

**Connections:** Imports `COACH_NAV` (`./constants`), `useRouter`, `usePalette`, `useNavigate` (react-router-dom), and MUI. Used by every page under `src/pages/coach/`.

---

## `src/sections/coach/CoachUi.tsx`

**In one sentence:** A small library of three reusable presentational building blocks for coach pages: a stat tile, a page header, and an empty-state placeholder.

**What it is & why it exists (plain English):** Coach pages repeatedly need the same visual pieces: little "metric" tiles (e.g., "12 Students"), a big page title with optional subtitle and an action button, and a centered "nothing here yet" message. Bundling them into one file keeps the coach dashboard visually consistent and avoids duplicating styling.

**How it works, step by step:** Each export is a pure presentational component (no data fetching) styled from the palette. `CoachStatCard` renders a bordered tile with an icon chip (in an accent or custom color), a label, a large value, and an optional hint line; it grows/shrinks responsively and brightens its border on hover. `CoachPageHeader` renders a flex row with a large bold title, an optional subtitle (max-width for readability), and an optional `action` node pushed to the right (wraps on small screens). `CoachEmptyState` renders a centered column: a muted icon, a bold title, and a description — used when a list has no items yet.

**Components, functions & exports:**
- **`CoachStatCard` (named export)** — Props: `label`, `value` (string or number), `icon` (icon name), `hint?`, `accent?` (custom highlight color). Output: a metric tile. Steps: pick color → render icon chip + label + value + optional hint.
- **`CoachPageHeader` (named export)** — Props: `title`, `subtitle?`, `action?` (a React node, e.g., a button). Output: the page's title row.
- **`CoachEmptyState` (named export)** — Props: `icon`, `title`, `description`. Output: a centered empty-state message.

**Connections:** Imports `usePalette`, `Icon` (Iconify), `alpha`, and MUI. Used across the coach pages under `src/pages/coach/`.

---

## `src/sections/coach/constants.ts`

**In one sentence:** Shared constant lists and small helpers for the coach feature (assignment categories, priorities, the tab navigation list, and two formatting helpers).

**What it is & why it exists (plain English):** Several coach screens need the same fixed lists — the categories an assignment can have, the priority levels and their colors, and the set of tabs in the Coach Hub. Defining them once here keeps everything consistent and makes it easy to add or rename an item in one place. It also has two tiny helper functions used by the UI.

**How it works, step by step:** This is a data/logic file with no UI. `ASSIGNMENT_CATEGORIES` is a fixed list of `{ value, label }` pairs (General, Opening, Tactics, Endgame, Game review, Homework). `PRIORITY_OPTIONS` lists `{ value, label, color }` for Low/Normal/High. `COACH_NAV` lists the Coach Hub tabs as `{ label, href, icon }` (consumed by `CoachShell`). `engagementColor(score)` returns green/amber/red hex codes for scores ≥70 / ≥40 / below. `formatCategory(cat)` looks up a category's human label by its value, falling back to the raw value if unknown. All arrays use `as const` so their values are treated as fixed, exact types.

**Components, functions & exports:**
- **`ASSIGNMENT_CATEGORIES` / `PRIORITY_OPTIONS` / `COACH_NAV`** — constant arrays described above.
- **`engagementColor(score)`** — Input: a number. Output: a hex color string indicating engagement level.
- **`formatCategory(cat)`** — Input: a category value. Output: its display label (or the input if unmatched).

**Connections:** No imports. `COACH_NAV` is used by `CoachShell.tsx`; the rest are used by coach pages/components under `src/pages/coach/`.

---

## `src/sections/coach/JoinClassroomCard.tsx`

**In one sentence:** The student-side card for joining a coach's classroom by code — with a safety "preview" step that confirms the coach's name before actually joining.

**What it is & why it exists (plain English):** Students connect to a coach by entering the coach's classroom code (like `VC-ABC123`). To prevent joining the wrong coach, the flow is two-step: first "Verify code," which shows the classroom and coach name; then "Join this classroom" to confirm. If the student is already enrolled with one or more coaches, the card instead lists those coaches and offers a "Join another classroom" option.

**How it works, step by step:** It loads the student's existing enrollments with `useQuery(["coach-links"], fetchCoachLinks)`. Local state tracks the typed `code`, a `preview` result, a `previewError`, a `checking` flag, a `successMsg`, and whether to `showJoinForm`. `handleVerify()` validates the code is non-empty, then calls `previewClassroomJoin(code)` and stores the returned preview (or an error). The `joinMut` mutation calls `joinClassroom(preview.join_code)`; on success it sets a success message ("You joined X's classroom!" or "already in..."), clears the form, and invalidates the `["coach-links"]` and `["assignments"]` queries so the rest of the UI updates. Rendering: a header that reads "Your coaches" when enrolled or "Join your coach's classroom" when not; if enrolled, a list of coach rows (name + joined date + check icon) plus a "Join another classroom" text button; if not, instructions. The code entry section (shown when not enrolled, or when "join another" is active) has a monospaced code `TextField` (auto-uppercased), a "Verify code" button, error alert, and — once a preview exists — a confirmation box showing the classroom name, coach name, and code, with a "Join this classroom" button (hidden if already a member).

**Components, functions & exports:**
- **`JoinClassroomCard` (default export)** — Props: none. Output: the join/enrollment card. Steps: query enrollments → verify code (preview) → confirm + join (mutation) → show success and refresh related queries.
- **`handleVerify` (internal)** — validates and previews the code.

**Connections:** Imports `fetchCoachLinks` (`@/lib/api/academies`), `joinClassroom`/`previewClassroomJoin`/`ClassroomPreview` (`@/lib/api/classrooms`), `getApiErrorMessage`, `usePalette`, react-query, and MUI. Used by the student hub page (`src/pages/student/index.tsx`).

---

## `src/sections/student/StudentPlatformCard.tsx`

**In one sentence:** The student hub card to connect a Chess.com or Lichess account, which imports the student's recent games and shows live import + analysis progress.

**What it is & why it exists (plain English):** A student tells the app their chess username so VoltChess can automatically pull their recent games and analyze them. This card is where the student picks a platform (Chess.com or Lichess), enters their username, and watches progress as games import and get analyzed. It shows chips summarizing how many reports are ready, pending, analyzing, or failed, plus a progress bar and a "Sync now" button. Importantly, the **student** owns this connection (not the coach), and if the student has multiple coaches the account is connected for all of them so every coach receives the games.

**How it works, step by step:** It uses `useQuery(["sync-overview"], fetchSyncOverview)` with a smart `refetchInterval`: while games are pending or in-progress it polls every 8 seconds (so the progress bar moves without manual refresh), otherwise every 60 seconds. From the data it derives the platform links, the currently `connected` link, and totals (`total`, `analyzed`, `pending`, `inProgress`, `failed`) plus a `progress` percentage. `saveMut` connects the account: it calls `updateCoachLink(...)` for **every** link id in parallel (`Promise.all`) with the chosen platform, username, and `sync_enabled: true`, then calls `triggerSync()`; on success it exits edit mode and invalidates `["sync-overview"]` and `["my-games"]`. `syncMut` just calls `triggerSync()` to re-import on demand. Local state tracks `editing`, the selected `platform`, and the typed `username`; `startEdit()` pre-fills from the connected link. The render branches: loading → spinner; error → warning alert; no links yet → instructions to join a classroom first; editing → platform select + username field + Connect/Cancel; connected → the platform/username row with a "Change" button (and any sync error). When connected and not editing, it also shows the status chips, the import/analysis progress bar (indeterminate while importing, determinate otherwise, with helpful captions like "keep a VoltChess tab open"), a "Sync now" button, and the last-sync timestamp.

**Components, functions & exports:**
- **`StudentPlatformCard` (default export)** — Props: none. Output: the connect-account card with progress. Steps: poll sync overview → derive counts → save/connect (multi-link) → trigger sync → render the state-dependent card.
- **`platformLabel` (internal helper)** — Input: platform string. Output: "Lichess" or "Chess.com".

**Connections:** Imports `fetchSyncOverview`/`triggerSync` (`@/lib/api/sync`), `updateCoachLink` (`@/lib/api/academies`), `getApiErrorMessage`, `usePalette`, react-query, and MUI. Used by the student hub page (`src/pages/student/index.tsx`).

---

## `src/sections/onboarding/AnalysisTour.tsx`

**In one sentence:** Controller that, when the analysis page is opened with `?tour=1`, waits for the game evaluation to be ready and then launches the step-by-step spotlight tour.

**What it is & why it exists (plain English):** After a brand-new user loads their first game from the welcome modal, the app sends them to the analysis page with a special `?tour=1` flag in the URL. This component watches for that flag and runs a guided tour of the analysis features. Because some tour steps point at things that only appear once the engine has finished evaluating the game, it waits for the evaluation (up to a timeout) before starting, showing a small "Analyzing your game for the tour…" toast in the meantime.

**How it works, step by step:** It reads `router.query.tour === "1"` into `tourRequested` and the engine result from `gameEvalAtom`. A `useEffect` does the waiting logic: if no tour is requested, do nothing; if the evaluation is already present, start the tour immediately; otherwise show the "waiting" toast and set a 12-second timeout after which it starts the tour anyway (cleaned up on unmount). `finishTour` marks onboarding complete (`markOnboardingComplete()`), hides the tour, and replaces the URL with a clean `/analysis` (dropping the `?tour=1`). `handleStepChange` switches the analysis panel to the "report" tab when the tour reaches any report-related step, by calling the `onTabChange` prop — this guarantees the highlighted element is actually visible. If no tour was requested it renders nothing; otherwise it renders the optional waiting toast plus the `SpotlightTour` configured with `ANALYSIS_TOUR_STEPS`, `waitForTarget`, and the complete/skip/step-change callbacks.

**Components, functions & exports:**
- **`AnalysisTour` (default export)** — Props: `onTabChange?` (callback to switch the analysis panel to `"report"`). Output: the waiting toast + a configured `SpotlightTour`, or nothing. Steps: detect `?tour=1` → wait for eval (or 12s) → activate tour → on report-step switch tabs → on finish mark complete + clean URL.

**Connections:** Imports `gameEvalAtom` (`@/sections/analysis/states`), `ANALYSIS_TOUR_STEPS` (`./constants`), `markOnboardingComplete` (`./onboardingStorage`), `SpotlightTour`/`TourStep` (`./SpotlightTour`), `useRouter`, `usePalette`, and MUI. Used by the analysis page (`src/pages/analysis.tsx`).

---

## `src/sections/onboarding/SpotlightTour.tsx`

**In one sentence:** A reusable guided-tour engine that dims the screen, cuts a highlighted "spotlight" hole around a target element, and shows a positioned tooltip with Back/Next/Skip controls.

**What it is & why it exists (plain English):** A "spotlight tour" walks a user through features one at a time. For each step it darkens everything except one element (the "target"), draws an accent border around it, and pops a tooltip explaining it. This file is the generic machinery; the actual steps (titles, text, which elements to highlight) are passed in, so the same component can power any tour. It handles tricky details: finding the target element on screen, scrolling it into view on mobile, repositioning when the window resizes or scrolls, and keeping the tooltip on-screen.

**How it works, step by step:** Targets are found via a `data-tour-id` attribute on the highlighted element. `getTargetRect(id)` returns that element's position/size; `scrollTourTargetIntoView(id)` smooth-scrolls it to center (mobile) and resolves after a short settle delay. `getTooltipPosition(...)` computes where to place the tooltip given the target rect, the requested `placement` (top/bottom/left/right), and the tooltip's measured size, clamping it inside the viewport (or centering it if there is no target). The component tracks `stepIndex`, the current `targetRect`, and the measured `tooltipSize`. Effects: reset to step 0 when the tour activates; notify `onStepChange` whenever the step changes; in a layout effect, optionally scroll the target into view, measure it, and attach resize/scroll listeners plus (when `waitForTarget`) a 250ms polling interval that keeps re-measuring until the element appears; a fallback effect retries measurement shortly after if the rect is still missing. It renders through a `Portal` (so it sits above everything): a dark full-screen overlay (clicking it skips, but only when there's no target yet), a highlighted hole drawn as a box with a huge spread `box-shadow` (which darkens everything around it) plus an accent border, and a `Paper` tooltip showing the step title, a close (skip) button, the content text, Back (after step 0), Next/Done, a "Skip tour" button, and an "X of N" counter. The tooltip measures itself via a `ref` callback so its position can account for its real size. "Next" advances or, on the last step, calls `onComplete`. Advancing is blocked (`canAdvance`) until the target is found, unless it's a step with no target or the last step.

**Components, functions & exports:**
- **`SpotlightTour` (default export)** — Props: `steps` (the tour step list), `active`, `onComplete`, `onSkip`, `onStepChange?`, `waitForTarget?` (default true). Output: the overlay + spotlight + tooltip, or nothing when inactive. Steps: track step → locate/scroll/measure target → position tooltip → render portal UI → handle Back/Next/Skip.
- **`TourStep` (exported interface)** — shape of a step: `id`, `title`, `content`, optional `target` and `placement`.
- **Internal helpers:** `isMobileViewport`, `scrollTourTargetIntoView`, `getTargetRect`, `getTooltipPosition`; internal `Rect`/`Props` types.

**Connections:** Imports `usePalette`, `Icon`, and MUI (`Portal`, `Paper`, etc.). Used by `AnalysisTour.tsx` (and reusable for any future tour).

---

## `src/sections/onboarding/WelcomeModal.tsx`

**In one sentence:** The first-run popup that asks a new user for their Chess.com/Lichess username, loads their most recent game, and hands it back to start the guided analysis.

**What it is & why it exists (plain English):** The very first time someone uses VoltChess, this modal greets them and gets them straight into the product by analyzing one of *their own* games. If they've used the app before, it remembers their username and shows a friendly "Is that you?" confirmation with their avatar and platform badge, so they can re-analyze in one click. Either way, choosing a username loads their latest game and triggers the analysis flow. They can also "Skip."

**How it works, step by step:** It has three internal steps: `"welcome"` (the "Is that you?" confirmation for returning users), `"username"` (the entry form), and `"loading"`. On open it reads any stored username (`getStoredUsername()`): if found, it starts on `"welcome"` pre-filled with that name and platform; if not, it starts on `"username"`. The `activePlatform` derives from the selected tab (Chess.com vs Lichess). `loadGame(user, platform)` switches to the loading step, calls `loadFirstGameForUser(...)`, and on success saves the username (`saveUsername`) and calls `onGameLoaded(game, boardOrientation)` so the parent can route into analysis; on failure it shows the error and returns to the appropriate step (back to "welcome" if the failed attempt used the stored user, otherwise to "username"). `handleSkip()` marks onboarding complete and closes. The render is an `xs` MUI `Dialog` with a "Skip" button. In the loading step it shows a spinner. In the welcome step (returning user) it shows a chat-bubble "Is that you?", a large avatar with the user's initial, a `PlatformBadge`, the username, and a big "Yes, analyze my games" button plus a "Use a different username" link. Otherwise it shows the "Enter your username" form: platform `Tabs`, a username `TextField` (Enter submits), an error alert, and an "Analyze my latest game" button, with an optional "Back to saved username" link when a stored user exists.

**Components, functions & exports:**
- **`WelcomeModal` (default export)** — Props: `open`, `onClose`, `onGameLoaded(game, boardOrientation)`. Output: the onboarding dialog. Steps: read stored user → choose initial step → load latest game on submit → save username → hand game to parent (or show error / skip).
- **`PlatformBadge` (internal component)** — Props: `platform`. Output: a small colored badge showing "Chess.com" or "Lichess".
- **`loadGame` / `handleSkip` (internal)** — load-and-handoff and skip-and-complete handlers.

**Connections:** Imports `loadFirstGameForUser` (`./loadOnboardingGame`), `getStoredUsername`/`saveUsername`/`markOnboardingComplete` (`./onboardingStorage`), `OnboardingPlatform` (`./constants`), `GameOrigin` (`@/types/enums`), `Chess` (chess.js), `usePalette`, `Icon`, and MUI. Used by the page that triggers first-run onboarding (e.g., `src/pages/index.tsx`).

---

## `src/sections/onboarding/constants.ts`

**In one sentence:** The onboarding feature's shared constants: localStorage keys, the platform/username types, and the full list of analysis-tour steps.

**What it is & why it exists (plain English):** This is a no-UI data file holding values shared across the onboarding code. It defines the storage keys used to remember whether onboarding is done and the user's saved usernames, the small types describing a stored username, and — most importantly — the scripted list of tour steps (titles and explanations) that the spotlight tour walks through on the analysis page.

**How it works, step by step:** It exports three string keys: `ONBOARDING_COMPLETE_KEY`, `CHESSCOM_USERNAME_KEY`, and `LICHESS_USERNAME_KEY`. It exports the `OnboardingPlatform` type (`"chesscom" | "lichess"`) and the `StoredUsername` interface (`{ username, platform }`). `ANALYSIS_TOUR_STEPS` is a fixed (`as const`) array of step objects: each has an `id`, `title`, and `content`, and the middle steps also have a `target` (matching a `data-tour-id` on the page) and a `placement`. The steps in order are: Welcome, Report tab, Evaluation graph, Accuracy scores, Move classification, Eval Lead, Position Dominance, Move navigation, and a final "You're all set!" step.

**Components, functions & exports:**
- **`ONBOARDING_COMPLETE_KEY`, `CHESSCOM_USERNAME_KEY`, `LICHESS_USERNAME_KEY`** — localStorage key strings.
- **`OnboardingPlatform` (type)** — `"chesscom" | "lichess"`.
- **`StoredUsername` (interface)** — `{ username: string; platform: OnboardingPlatform }`.
- **`ANALYSIS_TOUR_STEPS`** — the ordered list of tour steps.

**Connections:** No imports. Consumed by `onboardingStorage.ts`, `WelcomeModal.tsx`, `AnalysisTour.tsx`, and `loadOnboardingGame.ts`.

---

## `src/sections/onboarding/loadOnboardingGame.ts`

**In one sentence:** A helper that fetches a user's most recent game from Chess.com or Lichess and returns it as a ready-to-use `Chess` object plus the correct board orientation.

**What it is & why it exists (plain English):** The welcome modal needs one concrete game to analyze. This function does the fetching: given a username and platform, it asks the right service for that user's recent games, takes the latest one, converts its PGN into a usable game object, and figures out which way the board should face (so the user sees the game from their own side). It throws clear errors when the username is empty or no games exist.

**How it works, step by step:** `loadFirstGameForUser(username, platform, signal?)` trims the username and throws "Please enter a username." if empty. It calls either `getChessComUserRecentGames` or `getLichessUserRecentGames` (passing an optional `AbortSignal` so the request can be cancelled). If the result list is empty it throws "No recent games found for that username." Otherwise it takes the first (most recent) game, builds a `Chess` object from its PGN via `getGameFromPgn`, and computes `boardOrientation` as `true` (white at the bottom) unless the user played Black — i.e., it compares the username against the black player's name. It returns `{ game, boardOrientation }`.

**Components, functions & exports:**
- **`loadFirstGameForUser(username, platform, signal?)`** — Inputs: username string, `OnboardingPlatform`, optional abort signal. Output: a `Promise<OnboardingGameResult>` (`{ game: Chess; boardOrientation: boolean }`). Steps: validate → fetch recent games → take latest → parse PGN → derive orientation → return.
- **`OnboardingGameResult` (interface)** — the return shape described above.

**Connections:** Imports `Chess` (chess.js), `getGameFromPgn` (`@/lib/chess`), `getChessComUserRecentGames` (`@/lib/chessCom`), `getLichessUserRecentGames` (`@/lib/lichess`), and `OnboardingPlatform` (`./constants`). Used by `WelcomeModal.tsx`.

---

## `src/sections/onboarding/onboardingStorage.ts`

**In one sentence:** Small localStorage helpers to record whether onboarding is finished and to read/save the user's chess usernames.

**What it is & why it exists (plain English):** The browser's localStorage is where the app remembers things between visits. This file wraps that storage with safe, friendly functions so the rest of the onboarding code doesn't touch localStorage directly. It can tell whether the user already finished onboarding, mark it complete, fetch a previously saved username (preferring Chess.com, then Lichess), and save a username while keeping a short history of recent ones.

**How it works, step by step:** A private `parseUsernameList(raw)` reads a stored value that may be JSON-encoded or a plain comma-separated string and returns just the first username (the most recent). `isOnboardingComplete()` returns `true` on the server (where there is no `window`) and otherwise checks if the complete-key equals `"true"`. `markOnboardingComplete()` writes that key. `getStoredUsername()` returns `null` on the server; otherwise it reads the Chess.com username first (returning `{ username, platform: "chesscom" }` if present), then falls back to Lichess, else `null`. A private `readUsernameList(key)` parses the full list of stored usernames (handling both JSON and plain formats). `saveUsername(username, platform)` picks the right key, trims and ignores empty input, then builds a new list with the just-used name first, removes any case-insensitive duplicate, caps the list at 8, and stores it back as a JSON-encoded comma-joined string.

**Components, functions & exports:**
- **`isOnboardingComplete()`** — Output: boolean (treats server-side as complete).
- **`markOnboardingComplete()`** — writes the completion flag.
- **`getStoredUsername()`** — Output: `StoredUsername | null` (prefers Chess.com).
- **`saveUsername(username, platform)`** — saves the name to recent history (deduped, max 8).
- **Internal helpers:** `parseUsernameList`, `readUsernameList`.

**Connections:** Imports the storage keys and types from `./constants`. Used by `WelcomeModal.tsx` and `AnalysisTour.tsx` (`markOnboardingComplete`), and wherever first-run is decided.

---

## `src/sections/play/board.tsx`

**In one sentence:** The interactive board for playing against the engine — it renders the chessboard and automatically makes the engine's moves when it's the engine's turn.

**What it is & why it exists (plain English):** On the "Play" page you face the Stockfish engine. This component shows the board and contains the brains for the opponent: whenever it becomes the engine's turn, it asks the engine for a move and plays it. It also makes sure you can only move your own pieces and that the board is oriented to your color.

**How it works, step by step:** It reads several Jotai atoms from `./states`: the engine name (`enginePlayNameAtom`), the game (`gameAtom`), your color (`playerColorAtom`), the engine's Elo strength (`engineEloAtom`), and whether a game is in progress (`isGameInProgressAtom`). It loads the engine via `useEngine(engineName)` and player metadata via `usePlayersData(gameAtom)`. A `useEffect` keyed on the current FEN and the in-progress flag runs `playEngineMove()`: it bails out if the engine isn't ready, if it's the human's turn, if the game is finished, or if no game is in progress. Otherwise it starts a 1-second `sleep` (so the engine doesn't move instantly), asks `engine.getEngineNextMove(fen, elo)` for the best move, waits out the delay, and plays the move via `playMove(uciMoveParams(move))`. Its cleanup stops any running engine jobs. It also computes a responsive `boardSize` from the screen size and calls `useGameData(gameAtom, gameDataAtom)` to keep the shared position data updated. Finally it renders the shared `Board` component, passing `canPlay` (your color only while a game is in progress), the game atom, board size, the white/black player info, the board orientation (your color), and the current-position atom.

**Components, functions & exports:**
- **`BoardContainer` (default export)** — Props: none (reads everything from atoms). Output: the `Board` component wired for play-vs-engine. Steps: read atoms → load engine → on FEN change auto-play engine move → compute board size → render `Board`.
- **`playEngineMove` (internal async)** — gets and plays the engine's move when appropriate.

**Connections:** Imports the play atoms (`./states`), `useChessActions`, `useScreenSize`/`getPlayBoardSize`, `useEngine`, `useGameData`, `usePlayersData`, `uciMoveParams` (`@/lib/chess`), `sleep` (`@/lib/helpers`), and the shared `Board` (`@/components/board`). Used by the play page (`src/pages/play.tsx`).

---

## `src/sections/play/gameInProgress.tsx`

**In one sentence:** The controls shown while a game against the engine is underway: a "game in progress" indicator, an Undo button, and a Resign button.

**What it is & why it exists (plain English):** When you're mid-game against the engine, you need a couple of actions: undo your last move (in case of a slip) and resign. This small panel shows those, along with a spinner and "Game in progress" label. It only appears while a game is actually running; once the game ends it disappears (making room for the recap).

**How it works, step by step:** It reads the game (`gameAtom`) and reads/writes `isGameInProgressAtom`. A `useEffect` watches the game and, if `game.isGameOver()` becomes true, sets in-progress to false (so the panel hides and the recap can show). `handleResign()` simply sets in-progress to false. If no game is in progress it renders `null`. Otherwise it renders a centered grid with three rows: "Game in progress" + a spinner, the `UndoMoveButton`, and an outlined "Resign" button wired to `handleResign`.

**Components, functions & exports:**
- **`GameInProgress` (default export)** — Props: none. Output: the in-progress controls, or `null` when no game is running. Steps: read game + in-progress atom → auto-end on game over → render indicator + Undo + Resign.
- **`handleResign` (internal)** — ends the game by clearing the in-progress flag.

**Connections:** Imports the play atoms (`./states`), `UndoMoveButton` (`./undoMoveButton`), and MUI. Used by the play page (`src/pages/play.tsx`).

---

## `src/sections/play/gameRecap.tsx`

**In one sentence:** The end-of-game summary that states the result (win/draw/resign) and offers an "Analyze this game" button which hands the finished game to the analysis page.

**What it is & why it exists (plain English):** Once your game against the engine ends, this panel tells you what happened — checkmate, a type of draw, or a resignation — and lets you jump straight into analyzing it. Clicking "Analyze this game" copies the game into the analysis tooling, saves it to your local game database, and navigates to `/analysis`.

**How it works, step by step:** It reads the play game (`playGameAtom`), your color, and the in-progress flag. It returns `null` while a game is still in progress or if no moves have been played. `getResultLabel()` inspects the game to produce a human result: checkmate names the winner as "You" or "Stockfish" based on whose turn it *isn't*; insufficient material, stalemate, threefold repetition, and the fifty-move rule each return their draw text; otherwise it returns "You resigned." `handleOpenGameAnalysis()` prepares the game for analysis: it sets PGN headers (recording a resignation if the game wasn't actually over), gets the PGN, and computes the orientation from your color. It then primes the analysis atoms — resetting the analysis board to that PGN, setting the analysis game PGN, clearing any old evaluation, and setting the board orientation — and calls `prepareNewAnalysisSession(pgn, orientation)`. Finally it saves the game with `addGame(...)` and routes to `/analysis`. The render is a centered grid showing the result label and the contained "Analyze this game" button.

**Components, functions & exports:**
- **`GameRecap` (default export)** — Props: none. Output: the result text + "Analyze this game" button, or `null`. Steps: read play atoms → compute result label → on click, copy game into analysis state + save + navigate.
- **`getResultLabel` / `handleOpenGameAnalysis` (internal)** — compute the outcome text and the analyze-handoff.

**Connections:** Imports the play atoms (`./states`), the analysis atoms (`@/sections/analysis/states`), `setGameHeaders` (`@/lib/chess`), `useGameDatabase`, `useRouter`, `useChessActions`, and `prepareNewAnalysisSession` (`@/hooks/useAnalysisSession`). Used by the play page (`src/pages/play.tsx`).

---

## `src/sections/play/states.ts`

**In one sentence:** The shared Jotai state atoms for the play-vs-engine feature (the game, board data, your color, engine choice, engine strength, and in-progress flag).

**What it is & why it exists (plain English):** The various play components (board, controls, recap, settings) all need to read and change the same handful of values. Rather than passing them around, this file defines them once as global "atoms" so any play component can access the same live data.

**How it works, step by step:** It creates atoms with sensible defaults: `gameAtom` holds a fresh `Chess()` game; `gameDataAtom` holds the current position data (`CurrentPosition`, initially empty); `playerColorAtom` defaults to `Color.White`; `enginePlayNameAtom` defaults to the app's `DEFAULT_ENGINE`; `engineEloAtom` defaults to `1320` (the engine's minimum strength); and `isGameInProgressAtom` defaults to `false`.

**Components, functions & exports:**
- **`gameAtom`** — the current play game (`Chess`).
- **`gameDataAtom`** — the current position data (`CurrentPosition`).
- **`playerColorAtom`** — which color the human plays (`Color`).
- **`enginePlayNameAtom`** — which engine the opponent uses (`EngineName`).
- **`engineEloAtom`** — the engine's Elo strength (number).
- **`isGameInProgressAtom`** — whether a game is currently running (boolean).

**Connections:** Imports `DEFAULT_ENGINE` (`@/constants`), `Color`/`EngineName` (`@/types/enums`), `CurrentPosition` (`@/types/eval`), `Chess` (chess.js), and `atom` (jotai). Used by `board.tsx`, `gameInProgress.tsx`, `gameRecap.tsx`, `undoMoveButton.tsx`, `gameSettingsButton.tsx`, and `gameSettingsDialog.tsx`.

---

## `src/sections/play/undoMoveButton.tsx`

**In one sentence:** A button that undoes the player's last move, correctly handling whether it's currently the player's or the engine's turn.

**What it is & why it exists (plain English):** In a game against the engine, "undo" is slightly tricky: if it's your turn again it means the engine has already replied, so undoing your move requires stepping back two half-moves (yours and the engine's reply); if it's the engine's turn, only your last move needs undoing. This button works out which case applies and does the right thing.

**How it works, step by step:** It reads the game and your color, and gets `goToMove`/`undoMove` from `useChessActions(gameAtom)`. On click, `handleClick()` looks at the move history and whose turn it is. If it's your turn (white turn while you're White, or black turn while you're Black), the engine has already moved, so it needs to remove two plies: if there are fewer than two moves it does nothing, otherwise it jumps to `history.length - 2`. If it's the engine's turn, it just undoes the single last move (your move), unless there is no history. It renders an outlined "Undo your last move" button.

**Components, functions & exports:**
- **`UndoMoveButton` (default export)** — Props: none. Output: an outlined undo button. Steps: read game + color → on click, decide one-ply vs two-ply undo → call `undoMove`/`goToMove`.
- **`handleClick` (internal)** — the turn-aware undo logic.

**Connections:** Imports the play atoms (`./states`), `useChessActions`, `Color` (`@/types/enums`), and MUI. Used by `gameInProgress.tsx`.

---

## `src/sections/play/gameSettings/gameSettingsButton.tsx`

**In one sentence:** The button that opens the game-setup dialog, labeled "Start game" or "Start new game" depending on whether a game already exists.

**What it is & why it exists (plain English):** This is the entry point for playing against the engine. Clicking it opens the settings dialog where you pick the engine, its strength, your color, and an optional starting position. Its label changes to "Start new game" once moves have been played, so it's clear you'll be starting over.

**How it works, step by step:** It keeps a local `openDialog` boolean. It reads the play `gameAtom` to check `game.history().length`: if there are moves the button reads "Start new game," otherwise "Start game." Clicking the contained button sets `openDialog` true. It always renders the `GameSettingsDialog`, passing `open` and an `onClose` that resets the flag.

**Components, functions & exports:**
- **`GameSettingsButton` (default export)** — Props: none. Output: the start button + the (closed-by-default) `GameSettingsDialog`. Steps: read game history for label → toggle dialog open/closed.

**Connections:** Imports `GameSettingsDialog` (`./gameSettingsDialog`), the play `gameAtom` (`../states`), and MUI. Used by the play page (`src/pages/play.tsx`).

---

## `src/sections/play/gameSettings/gameSettingsDialog.tsx`

**In one sentence:** The dialog for configuring and starting a game against the engine — choose engine, Elo strength, your color, and an optional FEN/PGN starting position.

**What it is & why it exists (plain English):** Before you play, you set the rules: which Stockfish engine to face, how strong it should be (its Elo rating), whether you play White or Black, and—optionally—a custom starting position. This dialog gathers those choices and starts the game. Several choices are remembered between sessions so you don't re-pick them each time.

**How it works, step by step:** It stores the engine Elo and engine name in atoms that are also persisted to localStorage (`useAtomLocalStorage`), and reads/sets your color and the in-progress flag from atoms; it gets `reset` from `useChessActions(gameAtom)`. Local state holds the optional `startingPositionInput` text and any `parsingError`. A `useEffect` makes sure a supported engine is selected: if the current one isn't supported it falls back to `Stockfish16_1Lite` (if that build is supported) or else `Stockfish11`. `handleGameStart()` parses the optional starting position — if the text starts with `[` it's treated as PGN (converted to a FEN), otherwise it's used directly as a FEN (or left undefined) — then resets the game with white/black player names and ratings derived from your color and the engine label/Elo (the human side is labeled "You" with no rating; the engine side shows its label and Elo). On a parse error it shows a message and stops. On success it sets the game in progress, closes the dialog, and logs a `"play_game"` analytics event. `handleClose()` clears the inputs and closes. The render is a wide dialog: an explanatory paragraph about the default vs strongest engine, an engine `Select` (unsupported engines disabled), a "Bot Elo rating" `Slider` (1320–3190), a Switch toggling your color, a multiline FEN/PGN `TextField`, an optional error line, and Cancel / "Start game" actions.

**Components, functions & exports:**
- **`GameSettingsDialog` (default export)** — Props: `open`, `onClose`. Output: the game-setup dialog. Steps: read persisted engine/elo + color atoms → ensure supported engine → on start, parse position + reset game with player labels → flag in-progress + log analytics → close.
- **`handleGameStart` / `handleClose` (internal)** — start-the-game and reset-and-close handlers.

**Connections:** Imports the play atoms (`../states`), `useAtomLocalStorage`, `useChessActions`, `Slider` (`@/components/slider`), `Color`/`EngineName` (`@/types/enums`), `isEngineSupported`/`Stockfish16_1`, engine constants (`DEFAULT_ENGINE`, `ENGINE_LABELS`, `STRONGEST_ENGINE`), `getGameFromPgn` (`@/lib/chess`), `logAnalyticsEvent` (`@/lib/firebase`), and MUI. Used by `gameSettingsButton.tsx`.

---

## `src/sections/loadGame/chessComInput.tsx`

**In one sentence:** A Chess.com username box with autocomplete history that fetches and lists the user's recent games for selection.

**What it is & why it exists (plain English):** To analyze a Chess.com game you type the player's username; this component then fetches their recent games and shows them as a clickable list. It remembers usernames you've used before (so you can pick from a dropdown), debounces input so it doesn't fetch on every keystroke, and reports clear errors if the user isn't found or has no games.

**How it works, step by step:** It persists a comma-separated username history in localStorage (`"chesscom-username"`) and parses it into an array `storedValues` (most recent first). Local state tracks the current input and whether the user `hasEdited`. If a `presetUsername` prop is given, an effect fills it in (used by the home page "Try it out" buttons); otherwise, if the user hasn't edited and there's history, it pre-fills the most recent name. `updateHistory(username)` adds a name to the front of the list (deduped, capped at 8); `deleteUsername` removes one (via the little ✕ on each dropdown option). Input changes set the username; the value is debounced 300ms into `debouncedUsername`, which drives `useQuery(["CCUserGames", debouncedUsername], ...)` (enabled only when there's a username, retrying once). The render is an `Autocomplete` text field plus, when there's a debounced username, a results area: a spinner while fetching, an error message if the query failed or returned no games, or a scrollable `List` of `GameItem`s. Each game computes the user's color (white/black) for the result chip, and clicking it computes the board orientation (your color at the bottom) and calls `onSelect(pgn, boardOrientation)` then records the username in history.

**Components, functions & exports:**
- **`ChessComInput` (default export)** — Props: `onSelect(pgn, boardOrientation?)`, `presetUsername?`, `fullWidth?`, `fillHeight?` (lets the list grow to fill a side panel). Output: the username field + recent-games list. Steps: read history → debounce input → fetch games → render list → on click select game + save history.
- **Internal helpers:** `updateHistory`, `deleteUsername`, `handleChange`.

**Connections:** Imports `useLocalStorage`, `getChessComUserRecentGames` (`@/lib/chessCom`), `useDebounce`, react-query, `GameItem` (`./gameItem`), `Icon`, and MUI. Used by `loadGameDialog.tsx`, `loadGameInlinePanel.tsx`, and `home/HomeGameLoader.tsx`.

---

## `src/sections/loadGame/gamePgnInput.tsx`

**In one sentence:** A text area for pasting PGN plus an "Upload PGN File" button.

**What it is & why it exists (plain English):** Sometimes you have a game's PGN text or a `.pgn` file rather than an online username. This small input lets you paste the moves directly or upload a file; either way it reports the text back to its parent, which decides what to do with it (analyze or store).

**How it works, step by step:** It's a controlled input: the current `pgn` and a `setPgn` setter come from props. The multiline `TextField` shows `pgn` and calls `setPgn` on every change. The "Upload PGN File" button is an MUI `Button` acting as a file `<label>` wrapping a hidden file input that accepts `.pgn`. `handleFileChange` grabs the selected file, reads it as text via a `FileReader`, and on load calls `setPgn(fileContent)`. It does not parse or validate the PGN itself — that's the parent's job.

**Components, functions & exports:**
- **`GamePgnInput` (default export)** — Props: `pgn` (current text), `setPgn(pgn)` (setter). Output: a PGN text area + upload button. Steps: render controlled textarea → on file upload, read file text → call `setPgn`.
- **`handleFileChange` (internal)** — reads an uploaded `.pgn` file into text.

**Connections:** Imports `Icon` and MUI. Used by `loadGameDialog.tsx`, `loadGameInlinePanel.tsx`, and `home/HomeGameLoader.tsx`.

---

## `src/sections/loadGame/lichessInput.tsx`

**In one sentence:** A Lichess username box with autocomplete history that fetches and lists the user's recent games for selection (the Lichess twin of `chessComInput`).

**What it is & why it exists (plain English):** Identical idea to the Chess.com input, but for Lichess. You type a Lichess username, it fetches recent games, and shows them as a clickable list with remembered username history and clear error messages.

**How it works, step by step:** It persists history in localStorage (`"lichess-username"`), parsed into `storedValues`. State tracks the input and `hasEdited`; if unedited with history, it pre-fills the most recent username (note: unlike the Chess.com input, this one has no `presetUsername` prop). `updateHistory`/`deleteUsername` manage the history (deduped, capped at 8). Input is debounced 500ms into `debouncedUsername`, driving `useQuery(["LichessUserGames", debouncedUsername], ...)` (enabled when non-empty, one retry). The render mirrors the Chess.com version: an `Autocomplete` field, then (when there's a debounced username) a spinner / error / "no games" message, or a scrollable `List` of `GameItem`s. Clicking a game computes the board orientation from the username vs the black player and calls `onSelect(pgn, boardOrientation)`, then saves the username.

**Components, functions & exports:**
- **`LichessInput` (default export)** — Props: `onSelect(pgn, boardOrientation?)`, `fullWidth?`, `fillHeight?`. Output: the username field + recent-games list. Steps: read history → debounce input (500ms) → fetch games → render list → on click select + save history.
- **Internal helpers:** `updateHistory`, `deleteUsername`, `handleChange`.

**Connections:** Imports `useLocalStorage`, `getLichessUserRecentGames` (`@/lib/lichess`), `useDebounce`, react-query, `GameItem` (`./gameItem`), `Icon`, and MUI. Used by `loadGameDialog.tsx`, `loadGameInlinePanel.tsx`, and `home/HomeGameLoader.tsx`.

---

## `src/sections/loadGame/loadGameButton.tsx`

**In one sentence:** A simple button that opens the "load a game" dialog.

**What it is & why it exists (plain English):** This is the convenient trigger placed around the app (e.g., on the database page) to open the game-loading dialog. It's deliberately tiny and configurable — you can change its label, size, styling, and what happens with the loaded game.

**How it works, step by step:** It keeps a local `openDialog` boolean. It renders a contained button (label defaults to "Add game") that opens the dialog on click, and always renders `NewGameDialog` (from `loadGameDialog.tsx`) wired to `open`/`onClose`, forwarding the optional `setGame` callback. If `setGame` is provided the dialog loads the game via that callback; if not, the dialog falls back to adding the game to the local database.

**Components, functions & exports:**
- **`LoadGameButton` (default export)** — Props: `setGame?` (async handler for the loaded game), `label?`, `size?` (`small`/`medium`/`large`), `sx?` (extra styles). Output: a button + the load-game dialog. Steps: render button → toggle dialog → pass `setGame` through.

**Connections:** Imports `NewGameDialog` (`./loadGameDialog`), `Chess` (chess.js), and MUI. Used where a "load/add game" action is needed (e.g., `src/pages/database.tsx`).

---

## `src/sections/loadGame/loadGameDialog.tsx`

**In one sentence:** The modal dialog for loading a game from Chess.com, Lichess, or pasted/uploaded PGN, with a platform selector and error feedback.

**What it is & why it exists (plain English):** This is the central "where does your game come from?" dialog. You pick a source (Chess.com, Lichess, or PGN) and the matching input appears; choosing a game (or pasting a PGN and clicking Add) loads it. Depending on how it's used, the loaded game is either handed to a caller-provided function or saved to your local game database. The title even changes to reflect which behavior applies.

**How it works, step by step:** It tracks the typed `pgn`, the preferred `gameOrigin` (persisted in localStorage as `"preferred-game-origin"`, default Chess.com), and a transient `parsingError` (auto-cleared after 3 seconds via a ref'd timeout). It reads `setBoardOrientation` from the analysis atoms and `addGame` from `useGameDatabase`. `handleAddGame(pgn, boardOrientation?)` is the core: it returns early on empty input, parses the PGN with `getGameFromPgn`, sets a Sentry context (`loadedGame`) for debugging, then either calls the provided `setGame(game)` or `addGame(game)`, sets the board orientation (default `true`), and closes; on a parse error it shows the message in a Snackbar for 3 seconds. `handleClose` clears state (and the timeout) and calls `onClose`. The render is a top-anchored responsive `Dialog`: a title that reads "Load a game" when `setGame` is given, else "Add a game to your database"; a "Game origin" `Select` (Chess.com / Lichess.org / PGN); the matching input (`ChessComInput`/`LichessInput` wired to `handleAddGame`, or `GamePgnInput`); an error `Snackbar`; and actions with Cancel plus, for PGN, an "Add" button that submits the pasted text.

**Components, functions & exports:**
- **`NewGameDialog` (default export)** — Props: `open`, `onClose`, `setGame?`. Output: the load-game dialog. Steps: pick origin → show matching input → on selection/Add, parse PGN → hand to `setGame` or `addGame` → set orientation + close (or show error).
- **`handleAddGame` / `handleClose` (internal)** — load-and-handoff and reset-and-close handlers.
- **`gameOriginLabel` (module constant)** — maps each `GameOrigin` to its display label.

**Connections:** Imports `useGameDatabase`, `getGameFromPgn` (`@/lib/chess`), `GameOrigin` (`@/types/enums`), `GamePgnInput`/`ChessComInput`/`LichessInput` (same folder), `useLocalStorage`, the analysis `boardOrientationAtom`, Sentry's `setContext`, and MUI. Used via `loadGameButton.tsx` and directly by pages needing it.

---

## `src/sections/loadGame/loadGameInlinePanel.tsx`

**In one sentence:** A non-modal (embedded) version of the game loader that lives inside a side panel, with a platform selector and a scrollable game list.

**What it is & why it exists (plain English):** Sometimes you want the "load a game" controls embedded directly in a page or side panel instead of in a popup. This component is that inline panel: a compact dashed-border box with a platform dropdown and the matching input, designed to optionally stretch to fill the available height (so the game list scrolls inside it).

**How it works, step by step:** It persists the preferred `gameOrigin` in localStorage (same key as the dialog, `"preferred-game-origin"`), reads `setBoardOrientation` from the analysis atoms, and holds local `pgn` text for the PGN tab. `handlePgn(rawPgn, boardOrientation?)` parses the PGN with `getGameFromPgn`, sets the board orientation (default `true`), and calls the `onLoadGame(game)` prop (awaited). The render is a flex column box (filling height when `fillHeight`): a header with the `title` (default "Load a game") and a "Platform" `Select`, then the matching input. For Chess.com/Lichess it renders the respective input with `fullWidth`/`fillHeight` and `onSelect={handlePgn}`. For PGN it renders `GamePgnInput` plus a "Load PGN" text button that's disabled (greyed, not-allowed cursor) until text is entered.

**Components, functions & exports:**
- **`LoadGameInlinePanel` (default export)** — Props: `onLoadGame(game)` (handler for the loaded game), `title?`, `fillHeight?`. Output: the embedded loader panel. Steps: pick platform → show matching input → on selection/Load, parse PGN + set orientation → call `onLoadGame`.
- **`handlePgn` (internal)** — parse + orientation + handoff.
- **`gameOriginLabel` (module constant)** — platform display labels.

**Connections:** Imports `useLocalStorage`, `usePalette`, `GameOrigin`, the analysis `boardOrientationAtom`, `ChessComInput`/`LichessInput`/`GamePgnInput` (same folder), `getGameFromPgn`, and MUI. Used where an embedded loader is needed (e.g., analysis-side panels).

---

## `src/sections/loadGame/gameItem/index.tsx`

**In one sentence:** A single clickable row representing one game in a results list — showing both players (names and ratings), the result, and metadata chips.

**What it is & why it exists (plain English):** When the Chess.com/Lichess inputs fetch a list of games, each game is displayed as one of these rows. It shows "White (rating) vs Black (rating)," a colored result chip from the searching user's perspective, and small chips for time control, number of moves, and date. The winner's name is emphasized. Clicking the row selects that game.

**How it works, step by step:** It receives a `game` (a `LoadedGame`), an `onClick`, and the `perspectiveUserColor` (whether the searched user was White or Black). It destructures white, black, result, time control, date, and moves count. It computes `whiteWon`/`blackWon` from the result string. The render is an MUI `ListItem` (hover highlight, border, pointer cursor) wired to `onClick`. Its `primary` row shows the white player's name+rating (greened and full-opacity if white won, dimmed otherwise), a "vs" separator, the black player's name+rating (greened if black won), and a `GameResultChip`. Its `secondary` row shows `TimeControlChip`, `MovesNbChip`, and `DateChip`. A small `formatPlayerName` helper prefixes a player's title (e.g., "GM") to their name when present.

**Components, functions & exports:**
- **`GameItem` (named export)** — Props: `game` (`LoadedGame`), `onClick`, `perspectiveUserColor` (`"white" | "black"`). Output: a clickable game row. Steps: destructure game → compute winner → render players + result chip + metadata chips.
- **`formatPlayerName` (internal helper)** — Input: a player object. Output: "Title Name" or just "Name".

**Connections:** Imports `LoadedGame` (`@/types/game`), the four chip components from the same folder, and MUI. Used by `chessComInput.tsx` and `lichessInput.tsx`.

---

## `src/sections/loadGame/gameItem/dateChip.tsx`

**In one sentence:** A small chip showing the date a game was played, with a calendar icon and "Date Played" tooltip.

**What it is & why it exists (plain English):** One of the little info badges on a game row. It displays when the game happened. If no date is available, it shows nothing at all.

**How it works, step by step:** It receives an optional `date` string. If `date` is missing/empty it returns `null` (renders nothing). Otherwise it renders a `Tooltip` ("Date Played") wrapping a small `Chip` with a calendar icon and the date as its label.

**Components, functions & exports:**
- **`DateChip` (default export)** — Props: `date?` (string). Output: a date chip, or `null`. Steps: guard on missing date → render tooltip + chip.

**Connections:** Imports `Icon` (Iconify) and MUI `Chip`/`Tooltip`. Used by `gameItem/index.tsx`.

---

## `src/sections/loadGame/gameItem/gameResultChip.tsx`

**In one sentence:** A colored chip showing the game result (e.g., `1-0`) tinted green/red/blue/grey from the searched user's point of view.

**What it is & why it exists (plain English):** This badge tells you at a glance whether the searched player won, lost, drew, or the game is unfinished. It uses color: green when the user won, red when they lost, blue for a draw, grey for in-progress. The label text is the raw score (`1-0`, `0-1`, `1/2-1/2`), and the tooltip spells out who won.

**How it works, step by step:** It receives the `result` string and the `perspectiveUserColor`. A helper `getResultSpecs(theme, perspectiveUserColor, result)` returns the `label`, text `color`, and background `bgColor`: if the user's color matches the winning side it returns success (green) colors; if it matches the losing side it returns error (red) colors; `1/2-1/2` returns info (blue) "Draw" colors; anything else returns muted "Game in Progress" colors. The component renders a `Tooltip` (the label) wrapping a small `Chip` whose label is the raw result, styled with the computed colors, a subtle translucent border, and a bold weight.

**Components, functions & exports:**
- **`GameResultChip` (default export)** — Props: `result?` (string), `perspectiveUserColor` (`"white" | "black"`). Output: a colored result chip. Steps: compute specs from result + perspective → render tooltip + styled chip.
- **`getResultSpecs` (internal helper)** — Inputs: theme, perspective color, result. Output: `{ label, color, bgColor }`.

**Connections:** Imports MUI `Chip`/`Tooltip`/`useTheme`/`Theme`. Used by `gameItem/index.tsx`.

---

## `src/sections/loadGame/gameItem/movesNbChip.tsx`

**In one sentence:** A small chip showing how many full moves the game lasted, with a hashtag icon.

**What it is & why it exists (plain English):** Another info badge on a game row, indicating game length. The stored number counts half-moves (one per player turn), so it's halved and rounded up to show full moves. If there's no count, it renders nothing.

**How it works, step by step:** It receives an optional `movesNb` (a half-move/ply count). If it's missing/zero it returns `null`. Otherwise it renders a `Tooltip` ("Number of Moves") wrapping a `Chip` with a hashtag icon and a label of `Math.ceil(movesNb / 2)` followed by "moves" — converting plies to full moves.

**Components, functions & exports:**
- **`MovesNbChip` (default export)** — Props: `movesNb?` (number of plies). Output: a moves-count chip, or `null`. Steps: guard on missing/zero → compute full moves → render tooltip + chip.

**Connections:** Imports `Icon` and MUI `Chip`/`Tooltip`. Used by `gameItem/index.tsx`.

---

## `src/sections/loadGame/gameItem/timeControlChip.tsx`

**In one sentence:** A small chip showing the game's time control, with a timer icon.

**What it is & why it exists (plain English):** The final info badge on a game row, showing the time format (e.g., "10+0"). If no time control is known, it renders nothing.

**How it works, step by step:** It receives an optional `timeControl` string. If missing/empty it returns `null`. Otherwise it renders a `Tooltip` ("Time Control") wrapping a `Chip` with a timer-outline icon and the time control as its label.

**Components, functions & exports:**
- **`TimeControlChip` (default export)** — Props: `timeControl?` (string). Output: a time-control chip, or `null`. Steps: guard on missing → render tooltip + chip.

**Connections:** Imports `Icon` and MUI `Chip`/`Tooltip`. Used by `gameItem/index.tsx`.

---

## `src/sections/home/FeatureCard.tsx`

**In one sentence:** A reusable promo card for the home page showing an icon, title, description, and a call-to-action button linking somewhere.

**What it is & why it exists (plain English):** The home page advertises the app's main features as a grid of cards. Each card has an icon in an accent tile, a heading, a short description, and a button that links to that feature. This component standardizes that card so all of them match.

**How it works, step by step:** It reads the palette and the shared card style (`useCardSx()`). It renders a full-height flex-column box (using the shared card style) containing: an accent-tinted rounded icon tile, the `title` (h3), the `description` (muted, flex-grows so buttons align across cards), and a `NavLink` to `href` wrapping a contained button with the `actionLabel` and a right-arrow icon.

**Components, functions & exports:**
- **`FeatureCard` (default export)** — Props: `title`, `description`, `icon` (icon name), `href` (link target), `actionLabel` (button text). Output: a feature promo card. Steps: render icon tile → title + description → linked CTA button.

**Connections:** Imports `NavLink`, `useCardSx`/`usePalette`, `Icon`, `alpha`, and MUI. Used by the home page (`src/pages/index.tsx`).

---

## `src/sections/home/HomeGameLoader.tsx`

**In one sentence:** The home page's tabbed game-loading widget (Chess.com / Lichess / PGN) with quick-try example players and inline error feedback.

**What it is & why it exists (plain English):** This is the prominent "load a game and analyze it" box on the home page. It offers three tabs — Chess.com, Lichess, and PGN — and, on the Chess.com tab, a few famous-player shortcut buttons ("MagnusCarlsen," "GothamChess," "Hikaru") so first-time visitors can try the product instantly. When a game is chosen, it parses it and hands it to the page to open analysis.

**How it works, step by step:** It reads the palette and shared card style, and tracks the active `tab`, the `pgn` text, the `chessComUser` (set by the quick-try buttons), and an `error`. It reads `setBoardOrientation` from the analysis atoms. `loadGame(pgnText, boardOrientation = true)` returns early on empty text, then parses with `getGameFromPgn`, sets a Sentry `loadedGame` context, sets the board orientation, and calls `onGameLoaded(game, boardOrientation)`; on parse failure it sets the error. The render is a card with a `Tabs` header and a body that switches on the tab: Chess.com shows a hint + `ChessComInput` (passing the quick-try `presetUsername`); Lichess shows a hint + `LichessInput`; PGN shows `GamePgnInput` plus an "Analyze Game" button (disabled until text exists). On the Chess.com tab it also renders a "Try it out:" row of outlined buttons that set `chessComUser` to each `QUICK_USERS` name (which flows into `ChessComInput` via `presetUsername`). A `Snackbar` shows any error for 4 seconds.

**Components, functions & exports:**
- **`HomeGameLoader` (default export)** — Props: `onGameLoaded(game, boardOrientation?)`. Output: the tabbed loader card. Steps: pick tab → show matching input → on selection/Analyze, parse PGN + set orientation → call `onGameLoaded`; quick-try buttons prefill the Chess.com username.
- **`loadGame` (internal)** — parse + orientation + handoff (with error capture).
- **`TABS` / `QUICK_USERS` (module constants)** — the tab list and example usernames.

**Connections:** Imports `getGameFromPgn`, `GameOrigin`, the analysis `boardOrientationAtom`, `ChessComInput`/`LichessInput`/`GamePgnInput` (`@/sections/loadGame/...`), `useCardSx`/`usePalette`, Sentry's `setContext`, and MUI. Used by the home page (`src/pages/index.tsx`).

---

## `src/sections/engineSettings/arrowOptions.tsx`

**In one sentence:** Two checkboxes that toggle whether the engine's best-move arrow and the played-move icon appear on the board.

**What it is & why it exists (plain English):** When analyzing, the board can show a colored arrow for the engine's recommended best move and a little icon marking the move actually played. Some people find these helpful, others find them distracting. These two checkboxes let the user turn each on or off, and the choices are remembered between sessions.

**How it works, step by step:** It binds each checkbox to an atom that is also persisted to localStorage via `useAtomLocalStorage`: `showBestMoveArrowAtom` (key `"show-arrow-best-move"`) and `showPlayerMoveIconAtom` (key `"show-icon-player-move"`). It renders a grid with two `FormControlLabel`s, each a checkbox: "Show engine best move arrow" and "Show played move icon"; toggling either updates its atom (and thus localStorage and the board).

**Components, functions & exports:**
- **`ArrowOptions` (default export)** — Props: none. Output: two persisted toggle checkboxes. Steps: bind atoms to localStorage → render checkboxes → on change, update atoms.

**Connections:** Imports `showBestMoveArrowAtom`/`showPlayerMoveIconAtom` (`../analysis/states`), `useAtomLocalStorage`, and MUI. Used by `engineSettingsDialog.tsx`.

---

## `src/sections/engineSettings/engineSettingsDialog.tsx`

**In one sentence:** The analysis settings dialog for choosing the engine and tuning analysis depth, number of lines, board hue, arrow options, and thread count.

**What it is & why it exists (plain English):** This dialog controls how the analysis engine behaves and how the board looks. You pick which Stockfish engine to use, how deep it analyzes, how many candidate lines it shows, the board color hue, whether to show move arrows/icons, and how many CPU threads to use (faster but heavier). It explains the trade-off between the fast default engine and the stronger-but-larger one.

**How it works, step by step:** It binds each setting to an analysis atom via `useAtom`: `engineDepthAtom`, `engineMultiPvAtom` (number of lines), `engineNameAtom`, the board `boardHueAtom`, and `engineWorkersNbAtom` (thread count). A `useEffect` ensures a supported engine is selected, falling back to `Stockfish16_1Lite` or `Stockfish11` if the current one isn't supported. The render is a wide dialog: an explanatory paragraph quoting the default engine's tuned values (depth, lines, threads from `ENGINE_DEFAULTS`) and the strongest engine's download size; then a grid of controls — an engine `Select` (unsupported options disabled), a "Maximum depth" `Slider` (10–30), a "Number of lines" `Slider` (2–6), a "Board hue" `Slider` (0–360), the `ArrowOptions` checkboxes, and a "Number of threads" `Slider` (1–12) with an info popover recommending values up to `getRecommendedWorkersNb()`. A single "Close" button dismisses it.

**Components, functions & exports:**
- **`EngineSettingsDialog` (default export)** — Props: `open`, `onClose`. Output: the analysis settings dialog. Steps: bind setting atoms → ensure supported engine → render engine select + sliders + arrow toggles → close.

**Connections:** Imports `Slider` (`@/components/slider`), `ArrowOptions` (`./arrowOptions`), `EngineName`, the analysis atoms (`engineNameAtom`, `engineDepthAtom`, `engineMultiPvAtom`, `engineWorkersNbAtom`), `boardHueAtom` (`@/components/board/states`), `isEngineSupported`/`Stockfish16_1`, constants (`ENGINE_LABELS`, `STRONGEST_ENGINE`, `ENGINE_DEFAULTS`), `getRecommendedWorkersNb`, and MUI. Used by the analysis settings UI (`src/sections/analysis/panel/SettingsTabPanel.tsx`).

---

## `src/sections/blog/BlogArticle.tsx`

**In one sentence:** Renders a single blog/guide article from structured data, including SEO metadata, a back link, the body sections, and a call-to-action.

**What it is & why it exists (plain English):** The Guides/blog section stores each article as structured data (a title, excerpt, and a list of sections with headings and paragraphs). This component turns one such article into a readable page and also injects the SEO bits search engines like: the page title/description and a machine-readable "Article" schema. At the bottom it nudges readers to try the product.

**How it works, step by step:** It receives a `post` (a `BlogPost`) and builds the canonical `url` from `SITE_URL` and the post slug. It renders `PageTitle` (setting the browser tab title and meta description from the post's meta fields) and `SchemaOrg` (emitting JSON-LD structured data describing the article: headline, description, publish date, author/publisher as "VoltChess," logo, canonical URL, and keywords). The visible article is a centered, max-width 720px column: a "← All guides" back link (to `/blog`), the post title (h1), the excerpt, then the body — mapping over `post.sections`, each rendering an optional `h2` heading followed by its paragraphs. Finally a bordered call-to-action box invites the reader to "Try it now — free game review" with a button linking to `/` ("Analyze a game free").

**Components, functions & exports:**
- **`BlogArticle` (default export)** — Props: `post` (`BlogPost`). Output: the rendered article page + SEO metadata. Steps: build URL → emit `PageTitle` + `SchemaOrg` → render back link + title + excerpt → map sections to headings/paragraphs → render CTA.

**Connections:** Imports `PageTitle` and `SchemaOrg` (`@/components`), `NavLink`, `usePalette`, `BlogPost` (`@/data/blogPosts`), `SITE_URL` (`@/data/seo`), `Link` (react-router-dom), `Icon`, and MUI. Used by the blog post page (`src/pages/blog/post.tsx`).

---

*End of document.*
