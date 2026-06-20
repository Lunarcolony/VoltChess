# VoltChess Frontend — Pages (Routed Screens) & Theme System

This document is an exhaustive, beginner-friendly tour of two parts of the VoltChess web app: the **pages** (the individual screens you see at each web address) and the **theme system** (the colors and overall look of the app). Every file inside `src/pages/` (including the `blog/`, `coach/`, and `student/` sub-folders) and every file inside `src/theme/` is described below in plain language, so that even someone who has never written code can understand what each screen shows, what happens when you use it, and how it connects to the rest of the app.

## A short plain-English primer (read this first)

A few terms come up constantly. Here is what they mean in everyday language:

- **A "page"**: In this app a *page* is the whole screen you see at one particular web address (called a **route** or **URL**). For example, the address `/login` shows the sign-in screen, `/play` shows the play-vs-computer screen, and `/coach/students` shows a coach's list of students. Behind the scenes each page is a single file in `src/pages/`. When you click a link or type an address, the app swaps in the matching page file. The mapping of addresses to page files lives in `src/App.tsx` (the app's "switchboard").
- **Public vs protected pages**: Some pages are **public** — anyone can open them without signing in (for example the blog or the sign-in page itself). Other pages are **protected** — you must be logged in to see them. Protection is done with wrapper components: `RequireAuth` (you must be logged in at all) and `RoleRoute` (you must be logged in *and* have a specific job/role, like "coach"). A third wrapper, `GuestRoute`, does the opposite: it is for pages that only make sense when you are *not* logged in (sign-in, sign-up), and it bounces already-logged-in users away.
- **Coach pages vs the student page**: VoltChess Academy has two kinds of users. A **coach** runs a virtual classroom and manages many students; the coach pages (everything under `src/pages/coach/`) are tools for managing those students — a dashboard, a roster, per-student dossiers, assignments, lesson templates, messages, training plans, and analytics. A **student** is an individual learner; the student page (`src/pages/student/index.tsx`) is that one person's personal hub — their own game reports, their own assignments, and messages from their coach. In short: coach pages are about *managing other people*; the student page is about *yourself*.
- **Component**: A reusable chunk of screen (a button, a card, a chessboard). Pages are built by combining many components. They are written in **React**.
- **MUI (Material UI)**: A popular library of ready-made React components (buttons, text fields, dialogs, grids, tabs). Almost every page here is built from MUI building blocks like `Box`, `Typography`, `Button`, `TextField`, and `Dialog`.
- **Props**: The inputs you hand to a component, like settings. For example a `Button` receives props such as its label and what to do when clicked.
- **State**: Data that can change while the screen is open (what you typed in a box, which tab is selected). When state changes, React redraws the affected part of the screen. The `useState` hook creates a single piece of local state.
- **Hook**: A reusable piece of logic whose name starts with `use` (for example `usePalette`, `useRouter`). Hooks let a component "borrow" behavior in one line.
- **TanStack Query** (`useQuery` / `useMutation`): A tool for talking to the server. `useQuery` *reads* data (and remembers/caches it under a `queryKey` label); `useMutation` *changes* data (create/update/delete). After a change, the code often "invalidates" a query key, which tells the cached data to refresh.
- **Jotai atom**: A single shared "box" holding one value that any component can read or write. The chosen theme is stored in one such atom.
- **"Theming"**: The app's colors and look. VoltChess ships ~25 named color schemes (called **palettes** — e.g. "Forest", "Ruby", "Obsidian"). The currently-chosen palette is remembered in a Jotai atom (`colorThemeAtom`) and saved in the browser so it survives reloads. That palette is then fed into **MUI** to color every component consistently. A small hook, `usePalette()`, lets any page ask "what are the current colors?".
- **PGN / FEN**: Two standard chess text formats. **PGN** records a whole game (all moves plus details like player names). **FEN** describes a single board position. Several pages load games from PGN or set up positions from FEN.
- **Stockfish**: The free, very strong chess engine that runs *inside your browser* to analyze games and (eventually) to play against you.

With that vocabulary in hand, the rest of the document walks through every file.

## Table of contents

**Top-level pages (`src/pages/`)**
- [`src/pages/index.tsx`](#srcpagesindextsx)
- [`src/pages/login.tsx`](#srcpageslogintsx)
- [`src/pages/register.tsx`](#srcpagesregistertsx)
- [`src/pages/analysis.tsx`](#srcpagesanalysistsx)
- [`src/pages/database.tsx`](#srcpagesdatabasetsx)
- [`src/pages/play.tsx`](#srcpagesplaytsx)
- [`src/pages/puzzles.tsx`](#srcpagespuzzlestsx)
- [`src/pages/openings.tsx`](#srcpagesopeningstsx)
- [`src/pages/review.tsx`](#srcpagesreviewtsx)
- [`src/pages/thanks.tsx`](#srcpagesthankstsx)
- [`src/pages/terms-and-conditions.tsx`](#srcpagesterms-and-conditionstsx)

**Blog pages (`src/pages/blog/`)**
- [`src/pages/blog/index.tsx`](#srcpagesblogindextsx)
- [`src/pages/blog/post.tsx`](#srcpagesblogposttsx)

**Coach pages (`src/pages/coach/`)**
- [`src/pages/coach/index.tsx`](#srcpagescoachindextsx)
- [`src/pages/coach/students.tsx`](#srcpagescoachstudentstsx)
- [`src/pages/coach/student-detail.tsx`](#srcpagescoachstudent-detailtsx)
- [`src/pages/coach/assignments.tsx`](#srcpagescoachassignmentstsx)
- [`src/pages/coach/templates.tsx`](#srcpagescoachtemplatestsx)
- [`src/pages/coach/messages.tsx`](#srcpagescoachmessagestsx)
- [`src/pages/coach/plans.tsx`](#srcpagescoachplanstsx)
- [`src/pages/coach/analytics.tsx`](#srcpagescoachanalyticstsx)

**Student page (`src/pages/student/`)**
- [`src/pages/student/index.tsx`](#srcpagesstudentindextsx)

**Theme system (`src/theme/`)**
- [`src/theme/themes.ts`](#srcthemethemests)
- [`src/theme/colorThemeAtom.ts`](#srcthemecolorthemeatomts)
- [`src/theme/voltchessTheme.ts`](#srcthemevoltchessthemets)
- [`src/theme/buttonStyles.ts`](#srcthemebuttonstylests)

---

## `src/pages/index.tsx`

**In one sentence:** The home screen — a "welcome back" landing page that lets you load a chess game to analyze, jump to Play or Puzzles, and browse analysis guides.

**What it is & why it exists (plain English):** This is the page you see at the root address `/` after signing in. It is the front door of the app. Its main job is to get a game *into* the analyzer: you can paste a game, import one, or pick a saved one, and the page then sends you to the Analysis screen with that game loaded. It also shows two big "feature cards" (Play vs Engine, Tactical Puzzles) and a short list of blog guides for newcomers.

For brand-new visitors, the page also runs an **onboarding** experience: a welcome pop-up (a "modal" — a small window that floats over the page) that helps a first-time user load their first game. Whether onboarding has already been completed is stored on the device, so returning users skip it and instead see the "Welcome back" heading.

**How it works, step by step:**
1. When the page opens, it checks the device's saved flag (via `isOnboardingComplete()`). If onboarding was never finished, it shows the `WelcomeModal` pop-up and the heading reads "Free Chess Game Review"; otherwise the heading reads "Welcome back".
2. The page can auto-load a game from the web address itself. If the URL contains a saved game id (`gameFromUrl`), it loads that game; if the URL contains a `pgn=` value (Base64-encoded game text), it decodes and loads that instead. It also reads an `orientation` value to decide whether the board faces White or Black.
3. The central `HomeGameLoader` component lets you supply a game. When a game is loaded, `startAnalysis` runs: it figures out the PGN, sets board orientation, resets evaluation, prepares a fresh analysis session, and navigates to `/analysis` (or `/analysis?tour=1` if it came from onboarding, which triggers a guided tour there).
4. While an evaluation is already running (`evaluationProgress` is non-zero), the page renders nothing (`return null`) to avoid flicker.
5. Below the loader sit two `FeatureCard`s linking to `/play` and `/puzzles`, then a panel listing the first five blog posts with a "View all guides" link.

**Functions, components & exports:**
- **`Home` (default export, a React component):** Takes no props. Renders the full home screen described above. Internally it wires together several helpers:
  - `resetAndSetGamePgn(pgn)` — resets the board, clears any old evaluation, and sets the game's PGN.
  - `startAnalysis(loadedGame, boardOrientation?, withTour?)` — the main "send this game to the analyzer" action; prepares the session and navigates to the Analysis page.
  - `handleOnboardingGameLoaded(loadedGame, boardOrientation?)` — used by the welcome modal: closes onboarding and starts analysis with the guided tour enabled.

**Connections:** Uses the analysis state atoms (`gameAtom`, `boardAtom`, `boardOrientationAtom`, `gameEvalAtom`, `evaluationProgressAtom`), `useChessActions`, `useGameDatabase`, `useRouter`, `usePalette`, and `prepareNewAnalysisSession`. It renders `HomeGameLoader`, `FeatureCard`, `WelcomeModal`, and `NavLink`, and pulls content from `BLOG_POSTS` and `DEFAULT_SEO`. Routed at `/` and wrapped in `RequireAuth` (you must be logged in).

---

## `src/pages/login.tsx`

**In one sentence:** The sign-in screen where existing academy users enter their username and password to access their account.

**What it is & why it exists (plain English):** This page lets coaches and enrolled students log into VoltChess Academy. It exists so the app can recognize who you are and show your synced games and student progress. A banner makes clear that signing in is *only* needed for academies and enrolled learners — casual game review needs no account.

**How it works, step by step:**
1. The page shows two text boxes (Username, Password) inside a styled `AuthLayout`.
2. When you press "Sign in", `handleSubmit` runs. It first checks both fields are filled; if not, it shows an error message and stops.
3. If the fields are valid, it shows a spinner and calls `login(username, password)` from the authentication context. This contacts the server and, on success, returns your account info (including your role).
4. On success, it decides where to send you: if you arrived here from a specific protected page (a "deep link" remembered in `location.state.from`), it returns you there; otherwise it sends you to your role's home page via `landingForRole(role)` (coaches to the coach area, students to their hub).
5. If sign-in fails, it shows a human-readable error message via `getApiErrorMessage`.

**Functions, components & exports:**
- **`LoginForm` (internal component):** No props. Renders the form, manages the `username`, `password`, `error`, and `loading` state, and runs `handleSubmit`.
- **`Login` (default export):** No props. Wraps `LoginForm` in `GuestRoute`, so logged-in users who hit `/login` are redirected away. Returns the guarded form.

**Connections:** Uses `useAuth` (for `login`), `useRouter`, `useLocation`, `usePalette`, `AuthLayout`, `landingForRole`, and `getApiErrorMessage`. Links to `/register` and `/`. Routed at `/login` (public, but additionally guarded by `GuestRoute`). The address `/sign-in` redirects here.

---

## `src/pages/register.tsx`

**In one sentence:** The sign-up screen where a new user chooses whether they are a coach or student and creates an account, then is signed in automatically.

**What it is & why it exists (plain English):** This page creates new VoltChess Academy accounts. The key choice up front is the user's **role** — coach or student — because that decides which experience they get. The form collects a username, email, password (twice, to confirm), and requires agreeing to the Terms and Conditions. It exists so people can join the platform without an admin manually creating accounts.

**How it works, step by step:**
1. At the top, a `RoleSelector` lets the new user pick "coach" or "student" (it defaults to student).
2. Below that are text fields for username, email, password, and confirm-password. The password field has a show/hide eye button, and a helper note that the password must be at least 8 characters. The confirm field turns red and shows "Passwords do not match." if the two passwords differ.
3. A checkbox requires accepting the Terms (with a link to the terms page). A computed flag `canSubmit` keeps the "Create account" button disabled until *everything* is valid (role chosen, username + email filled, password ≥ 8 chars, passwords match, terms accepted).
4. On submit, `handleSubmit` re-validates each rule and shows a specific error if any fails. If all pass, it shows a spinner and calls the server endpoint `POST /api/register/` with the username, email, password, and role.
5. After the account is created it shows "Account created! Signing you in…", then immediately tries to `login(...)` so the user lands on their role's dashboard without a separate sign-in step. If that auto-login somehow fails, it falls back to redirecting to `/login` after a short delay.
6. Any server error (for example "username taken") is shown as a red alert and the spinner is cleared.

**Functions, components & exports:**
- **`RegisterForm` (internal component):** No props. Holds all the form state (`role`, `username`, `email`, `password`, `confirmPassword`, `showPassword`, `acceptTerms`, plus `error`/`success`/`loading`), computes `passwordsMatch` and `canSubmit`, and runs `handleSubmit`.
- **`Register` (default export):** No props. Wraps `RegisterForm` in `GuestRoute` so already-logged-in users are bounced away.

**Connections:** Uses `useAuth` (for `login`), `useRouter`, `usePalette`, `AuthLayout`, `RoleSelector`, `landingForRole`, `getApiErrorMessage`, the `UserRole` type, and the shared `api` client for the register call. Links to `/terms-and-conditions` and `/login`. Routed at `/register` (public, plus `GuestRoute`).

---

## `src/pages/analysis.tsx`

**In one sentence:** The main game-analysis screen — a chessboard plus tabbed panels (Report, Analysis, Settings) where Stockfish evaluates your game move by move.

**What it is & why it exists (plain English):** This is the heart of VoltChess: the screen where a game is examined. It shows the board and an "Analyze" button that runs the Stockfish engine in your browser, then presents the results in three tabs — a human-readable **Report**, a deeper **Analysis** (engine lines and evaluation), and **Settings** (engine depth, etc.). It exists because reviewing your games to find mistakes is the app's core promise.

This file itself is deliberately thin: it is mostly an *arrangement* of bigger building blocks from `src/sections/analysis/`. The real work (running the engine, drawing the board, building the report) lives in those sections; this page decides which tabs exist, which one is active, and when each is visible/scrollable.

**How it works, step by step:**
1. On open, `useAnalysisSession()` runs — this hook loads whatever game the session/URL points to into the shared state so the board and panels have something to show.
2. It reads three shared values: the current `game`, its evaluation `gameEval` (if already computed), and `evaluationProgress`. From these it computes `gameLoaded` (is there actually a game here?) and `reportTabScrollable` (should the report tab scroll?).
3. The page renders the `AnalyzeButton` (kick off engine analysis), an optional guided `AnalysisTour` for first-timers, and the `AnalysisPageLayout` which holds the board and the tab panel.
4. `AnalysisPanelTabs` defines three tabs:
   - **Report** (always shown) → `ReportTabPanel`.
   - **Analysis** (only shown once an evaluation exists, i.e. `show: !!gameEval`) → `AnalysisTabPanel`.
   - **Settings** (always shown) → `SettingsTabPanel`.
5. The active tab is tracked in local state (`activeTab`, defaulting to "report"). The guided tour can switch the active tab via `handleTourTabChange`.
6. A footer (`AnalysisBottomNav`) provides move navigation (next/previous move) below the panel.

**Functions, components & exports:**
- **`AnalysisPage` (default export):** No props. Sets up the analysis session and renders the board + tabs layout described above.
  - `handleTourTabChange(tab)` — a small callback letting the onboarding tour force the "report" tab to be active.
- Imported building blocks it arranges: `AnalyzeButton`, `AnalysisPageLayout`, `AnalysisPanelTabs`, `AnalysisBottomNav`, `ReportTabPanel`, `AnalysisTabPanel`, `SettingsTabPanel`, `AnalysisTour`, and `PageTitle`.

**Connections:** Uses `useAnalysisSession`, the analysis state atoms (`gameAtom`, `gameEvalAtom`, `evaluationProgressAtom`), and the `AnalysisTabId` type. Routed at `/analysis` and wrapped in `RequireAuth`. Other pages link here with a `?gameId=...` (open a saved game) or `?tour=1` (start the tour) parameter.

---

## `src/pages/database.tsx`

**In one sentence:** A two-tab table of your saved games — "Local" (stored on this device) and "Server" (synced to your academy account) — each row letting you analyze or delete a game.

**What it is & why it exists (plain English):** Over time you accumulate games you have reviewed. This page is your library/archive. Games saved only in this browser appear under **Local**; games synced to your academy account appear under **Server**. From here you can re-open any game in the analyzer or delete it. It exists so you can find and revisit past games without re-importing them.

The data is shown in a **DataGrid** (a spreadsheet-like table component from MUI's X-Data-Grid). Each column is configured with a header and a way to read its value from the row; two special "actions" columns hold the Analyze and Delete icon-buttons.

**How it works, step by step:**
1. Local games come from `useGameDatabase(true)` (which reads the browser's IndexedDB store) and server games come from `useServerGames()` (a TanStack Query that fetches from the API).
2. At the top, a `LoadGameButton` lets you import a new game.
3. The Server tab only appears when authentication is enabled *and* you are logged in (`showServerTab`). When it shows, two MUI `Tabs` switch between "Local (count)" and "Server (count)".
4. The Local table columns are: Event, Date, White (name + rating), Black (name + rating), an "Evaluated" yes/no checkbox, an **Analyze** action (opens `/analysis?gameId=...`), and a **Delete** action.
5. The Server table columns are: Date, Game (white vs black), Result, an "Analyzed" checkbox, an **Analyze** action, and a **Delete** action.
6. Deleting differs by source: `handleDeleteLocal(id)` removes from the device database; `handleDeleteServer(id)` calls `removeServerGame` and then invalidates the `"server-games"` query so the table refreshes.
7. A small subtitle above each table reports the count ("3 local games (this device)" / "5 synced games (academy)"). Empty tables show "No games found".

**Functions, components & exports:**
- **`GameDatabase` (default export):** No props. Builds both column definitions, fetches both data sets, and renders the tab switch + the appropriate DataGrid.
  - `handleDeleteLocal(id)` — returns an async deleter for a numeric local id.
  - `handleDeleteServer(id)` — returns an async deleter for a string server id, then refreshes the cache.
  - `localColumns` / `serverColumns` — memoized column definitions for each table.
- `gridLocaleText` — a small config object that customizes the "No rows" label to "No games found".

**Connections:** Uses `useGameDatabase`, `useServerGames` + `removeServerGame`, `useAuth`, `useRouter`, `useQueryClient`, the `ENABLE_AUTHENTICATION` constant, and `LoadGameButton`. Both Analyze actions navigate to `/analysis`. Routed at `/database` and wrapped in `RequireAuth`.

---

## `src/pages/play.tsx`

**In one sentence:** The "play against the computer" screen — a board next to a settings/in-progress/recap panel — currently marked as under development.

**What it is & why it exists (plain English):** This page is where you will be able to play a full game against Stockfish at a chosen strength. It lays out a chessboard on the left and a control panel on the right (game settings before a game, live status during a game, and a recap afterward). A prominent yellow banner notes the feature is still "under development — coming soon," so the layout is in place even though the play loop is not finished.

**How it works, step by step:**
1. It reads `isGameInProgressAtom` (shared state: is a game currently being played?).
2. It renders a `PageContainer` titled "Play vs Engine" with a short subtitle.
3. A styled banner announces the under-development status.
4. The board (`Board`) sits on the left. On the right, inside a themed card, three components stack: `GameInProgress` (live game status), `GameSettingsButton` (shown only when no game is running), and `GameRecap` (post-game summary).
5. On wide screens board and panel sit side-by-side; on narrow screens they stack vertically.

**Functions, components & exports:**
- **`Play` (default export):** No props. Reads game-in-progress state and arranges the board + control panel. Uses `useCardSx()` for the themed card styling.

**Connections:** Uses `isGameInProgressAtom` from `src/sections/play/states`, `useCardSx`, `PageContainer`, `PageTitle`, and the play-section components `Board`, `GameInProgress`, `GameRecap`, `GameSettingsButton`. Routed at `/play` and wrapped in `RequireAuth`.

---

## `src/pages/puzzles.tsx`

**In one sentence:** A tactical-puzzle trainer where you drag pieces to find the best move on a small built-in set of puzzles, with hints, scoring, and progress — marked as under development.

**What it is & why it exists (plain English):** This page lets you practice chess tactics. It shows a position and asks you to find the winning move; you drag the right piece to the right square, and the page checks your move against the known solution. It tracks a running score and shows a progress bar through the moves of each puzzle. The puzzles here are a small hard-coded set (back-rank mate, queen mate, knight fork, pin) used as a starting point; a banner notes the feature is still evolving.

**How it works, step by step:**
1. Four puzzles are defined in code, each with a starting `fen` (position), a `rating` (difficulty), themes, a `solution` (a list of moves in UCI notation alternating player/opponent), and a description.
2. When a puzzle loads (`initializePuzzle`), the board is set to its FEN and progress is reset.
3. You make a move by dragging a piece (`onDrop`). The page converts your move to UCI and compares it to the expected next move:
   - If wrong, it shows "That's not the best move. Try again." and refuses the move.
   - If right, it plays your move, then auto-plays the opponent's scripted replies (`playOpponentReplies`), and advances the solution pointer.
4. When the last move is reached, the puzzle is marked solved, points are added to your score (rating ÷ 100, rounded), and a success message appears.
5. A **Hint** button reveals the next correct move in human-readable form (e.g. "Hint: try Qf8"). A **Reset** button restarts the current puzzle. A **Next puzzle** button (enabled only after solving) cycles to the next one (wrapping back to the first).
6. The right-hand card shows the themes, a progress bar, and the buttons; small pop-up "snackbar" messages give feedback. A difficulty-colored chip (green/amber/red) shows the puzzle's rating, and the board faces whichever side is to move.

**Functions, components & exports:**
- **`Puzzles` (default export):** No props. Manages all puzzle state (current index, board position, solution pointer, completion, hint, score, feedback) and renders the board + control card.
  - `onDrop(sourceSquare, targetSquare)` — validates and applies the player's dragged move; returns `true`/`false` to accept/reject the drag.
  - `playOpponentReplies(gameCopy, startIndex)` — auto-plays the opponent's scripted replies; returns the updated game and next solution index.
  - `initializePuzzle()` — (re)loads the current puzzle's starting position.
  - `nextPuzzle()` — advances to the next puzzle (wrapping).
  - `getDifficultyColor(rating)` — maps a rating to a chip color.
- `moveToUci(chess, from, to, promotion?)` — helper that applies a move and returns its UCI string (or `null`).

**Connections:** Uses `chess.js` (`Chess`), `react-chessboard` (`Chessboard`), `usePalette`/`useCardSx`, `uciMoveParams` from `@/lib/chess`, plus `PageTitle` and `PageContainer`. Routed at `/puzzles` and wrapped in `RequireAuth`. The puzzle data is local to this file (no server calls).

---

## `src/pages/openings.tsx`

**In one sentence:** A searchable, filterable catalog of famous chess openings — each shown as a card with its moves, ECO code, difficulty, popularity, themes, and famous games.

**What it is & why it exists (plain English):** This page is a reference library of well-known openings (Italian Game, Ruy Lopez, Sicilian, Queen's Gambit, etc.). For each one it shows the opening moves, its **ECO code** (a standard chess classification code like "C50-C59"), a short description, a difficulty level, a popularity percentage, the strategic themes, and a collapsible list of famous historical games. It exists as a learning aid so players can browse and study openings.

**How it works, step by step:**
1. A fixed list of eight openings is defined in code (`openingsDatabase`).
2. At the top, a search box and three difficulty chips (beginner/intermediate/advanced) act as filters.
3. `filteredOpenings` recomputes whenever the search text or selected difficulty changes: it matches the search against the name, ECO, moves, or themes, and matches the difficulty filter if one is selected.
4. A line reports how many openings matched ("5 openings found").
5. Each matching opening renders as a `Card`: title + ECO chip, the moves in a monospace box, the description, a difficulty chip and popularity star, theme chips, and — if it has famous games — an accordion that expands to list them.
6. If nothing matches, a friendly "No openings found" empty state appears.

**Functions, components & exports:**
- **`OpeningsDatabase` (default export):** No props. Manages `searchTerm`, `selectedDifficulty`, and `expandedOpening` state; computes `filteredOpenings`; and renders the search/filter bar plus the grid of opening cards.
  - `getDifficultyColor(difficulty)` — maps "beginner"/"intermediate"/"advanced" to a chip color.
- `OpeningData` (type) and `openingsDatabase` (the data array) describe and hold the catalog.

**Connections:** Uses `usePalette`/`useCardSx`, plus `PageTitle` and `PageContainer`. All data is local to the file (no server calls). Routed at `/openings` and wrapped in `RequireAuth`.

---

## `src/pages/review.tsx`

**In one sentence:** A read-only report viewer for games that already have a saved evaluation — it shows the Report tab only, and quietly redirects unanalyzed games to the full analyzer.

**What it is & why it exists (plain English):** Some games have already been analyzed and have a saved evaluation stored on the server. For those, you do not need to re-run Stockfish — you just want to *read* the report. This page is that lightweight, read-only report viewer. It is what the student hub and coach pages link to when they say "Open report" for an already-analyzed game. If you somehow open an *unanalyzed* synced game here, it sends you over to `/analysis` (where the engine can actually run).

**How it works, step by step:**
1. On open, `useAnalysisSession()` loads the game referenced by the URL, and `useCurrentPosition(null)` sets up position tracking.
2. It reads the `gameId` from the URL and the current `gameEval` and `serverGameFromUrl`.
3. A guard effect checks: if the `gameId` is a server game id but neither the loaded state nor the server record has an evaluation, it logs a note and `router.replace(...)` to `/analysis?gameId=...` so Stockfish can run there. (`router.replace` swaps the address without adding a back-button entry.)
4. Otherwise it renders the `AnalysisPageLayout` with a single **Report** tab containing the read-only `ReportViewerPanel`, plus the bottom move-navigation.

**Functions, components & exports:**
- **`ReviewPage` (default export):** No props. Sets up the session, runs the redirect guard, and renders the single-tab read-only report layout.

**Connections:** Uses `useAnalysisSession`, `useCurrentPosition`, `useGameDatabase` (for `serverGameFromUrl`), `useRouter`, the `gameEvalAtom`, and `isServerGameId` from `@/lib/gameSync`. Renders `AnalysisPageLayout`, `AnalysisPanelTabs`, `AnalysisBottomNav`, and `ReportViewerPanel`. Routed at `/review` and wrapped in `RequireAuth`.

---

## `src/pages/thanks.tsx`

**In one sentence:** A decorative "thank you" / credits screen with animated cards listing the technologies and contributors behind VoltChess.

**What it is & why it exists (plain English):** This is a small, visually flashy acknowledgements page — a dark, glowing background with a floating chess-piece graphic and three animated cards (Technologies, Contributors, Final Words). It exists to thank users and credit the people and tools behind the project. It is purely informational; it has no forms or data loading.

**How it works, step by step:**
1. The whole screen is a full-height dark box with a radial-gradient background and a large, blurred, slowly-pulsing chess pawn behind everything (animated with **framer-motion**, an animation library).
2. A centered title "⚡ Thank You for Using VoltChess" fades in, followed by a subtitle.
3. Three animated cards appear in sequence (staggered delays):
   - **Technologies** — mentions Stockfish and VoltChess.
   - **Contributors** — lists the people who built it.
   - **Final Words** — a closing message.
4. The cards react to hover and tap with scaling and glow effects. All colors here are hard-coded (this page does not use the theme palette).

**Functions, components & exports:**
- **`Thanks` (default export):** No props. Renders the animated credits layout. Uses `MotionCard` and `MotionBox` (framer-motion-wrapped MUI `Card`/`Box`) for the animations.

**Connections:** Uses `framer-motion` (`motion`) and MUI layout components only. No hooks, no API, no theme palette. Routed at `/thanks` (public — no sign-in required).

---

## `src/pages/terms-and-conditions.tsx`

**In one sentence:** A static legal page listing the app's Terms and Conditions, with links back to registration and home.

**What it is & why it exists (plain English):** This is the standard legal/terms document users agree to when registering. It is plain text content (acceptance of terms, license, accounts, privacy, prohibited uses, disclaimers, limitations, changes, contact). It exists so the registration checkbox has something real to link to, and so users can read the rules.

**How it works, step by step:**
1. It renders a centered column of headings and paragraphs — nine numbered sections of legal text.
2. At the top is a "← Back to Registration" link.
3. At the bottom it shows a "Last updated" date computed live from today's date, plus links back to Registration and Home.
4. There is no state, no data loading, and no theme palette — it uses plain inline styles.

**Functions, components & exports:**
- **`TermsAndConditions` (default export):** No props. Returns the static terms markup.

**Connections:** Uses only the `Link` component for navigation (to `/register` and `/`). Routed at `/terms-and-conditions` (public). Linked from the registration form's terms checkbox.

---

## `src/pages/blog/index.tsx`

**In one sentence:** The blog landing page — a list of all VoltChess analysis/guide articles, each a clickable card linking to the full post.

**What it is & why it exists (plain English):** VoltChess publishes free guides about chess game review (how to analyze on Chess.com/Lichess, finding blunders with Stockfish, reading PGN, etc.). This page lists every guide so visitors can browse and click into one. It is also important for search engines, so it includes SEO metadata and structured data describing the blog.

**How it works, step by step:**
1. It sets the page title and description via `PageTitle`, and adds machine-readable structured data via `SchemaOrg` (tells Google "this is a Blog").
2. It renders a heading "Chess Analysis Guides" and an intro line.
3. It loops over `BLOG_POSTS` (the bundled list of articles) and renders each as a clickable card showing the post's title and excerpt. Each card links to `/blog/<slug>` (the post's unique address fragment).
4. Cards highlight their border in the accent color on hover.

**Functions, components & exports:**
- **`BlogIndexPage` (default export):** No props. Renders the SEO tags and the list of post cards.

**Connections:** Uses `usePalette`, `PageTitle`, `SchemaOrg`, `BLOG_POSTS`, and `DEFAULT_SEO`/`SITE_URL`. Uses React Router's `Link` for navigation. Routed at `/blog` (public).

---

## `src/pages/blog/post.tsx`

**In one sentence:** The individual blog-post page — it reads the post's slug from the URL, finds the matching article, and renders it (or redirects to the blog list if not found).

**What it is & why it exists (plain English):** When you click a guide on the blog list, this page shows that single article. It is a thin "router" file: its only job is to figure out *which* post you asked for (from the address) and hand it to the component that actually renders article content. If the address points to a post that does not exist, it sends you back to the blog list.

**How it works, step by step:**
1. It reads the `slug` (the post identifier) from the URL via `useParams`.
2. It looks up the post with `getBlogPost(slug)`.
3. If no matching post is found, it returns `<Navigate to="/blog" replace />`, which redirects to the blog list.
4. Otherwise it renders `<BlogArticle post={post} />`, which draws the full article (title, body, SEO, etc.).

**Functions, components & exports:**
- **`BlogPostPage` (default export):** No props (it reads the slug from the URL itself). Returns either a redirect or the rendered article.

**Connections:** Uses React Router's `useParams` and `Navigate`, `getBlogPost` from `@/data/blogPosts`, and the `BlogArticle` section component. Routed at `/blog/:slug` (public).

---

## `src/pages/coach/index.tsx`

**In one sentence:** The coach dashboard ("Command Center") — an at-a-glance overview of the coach's academy: summary stats, at-risk students, recent activity, and a student-pulse roster snippet.

**What it is & why it exists (plain English):** This is a coach's home base after logging in. It answers "what needs my attention today?" with a row of summary numbers, a panel of students who may be falling behind, a recent-activity feed, and a compact roster with weekly-goal progress bars. It exists to give a coach a fast daily snapshot of their whole classroom before they dive into specific students.

Like all coach pages, it is rendered inside a shared `CoachShell` (the coach-area frame with navigation), and it includes a `ClassroomPanel` (for sharing the classroom join code).

**How it works, step by step:**
1. It fetches the dashboard data with `useQuery({ queryKey: ["coach-dashboard"], queryFn: fetchCoachDashboard })`.
2. While loading it shows a spinner; if the fetch returns nothing it shows an "Unable to load dashboard" empty state.
3. With data, it renders a row of `CoachStatCard`s: Students, Overdue (red, with a "due this week" hint), In progress, Analyzed games, Active plans, and Unread mail.
4. Two side-by-side panels follow:
   - **At-risk students** — up to five students with low engagement, each showing an engagement-percentage chip (color-coded via `engagementColor`) and the reasons they are flagged; with a "View roster →" link.
   - **Recent activity** — up to six recent events (game synced, assignment activity) with icons, the student's name, a summary, and a timestamp.
5. A **Student pulse** panel lists up to eight roster entries: pinned indicator, name (linking to that student's dossier), a "High" priority chip, a weekly-games progress bar against the student's goal, and an accuracy/engagement summary. If the roster is empty, it shows a "No students yet" empty state explaining the classroom-code flow.

**Functions, components & exports:**
- **`CoachDashboardPage` (default export):** No props. Fetches and renders all the dashboard sections described above. Greets the coach by `user?.username`.

**Connections:** Uses `useAuth`, `usePalette`, `useQuery` with `fetchCoachDashboard` from `@/lib/api/coaching`, `engagementColor` from the coach constants, and the coach UI pieces `CoachShell`, `ClassroomPanel`, `CoachPageHeader`, `CoachStatCard`, `CoachEmptyState`, plus `NavLink`. Links to `/coach/students` and `/coach/students/:id`. Routed at `/coach` and guarded by `RoleRoute([Coach, Admin])` (inside `RequireAuth`).

---

## `src/pages/coach/students.tsx`

**In one sentence:** The coach's student roster — a searchable, taggable list of all students with quick stats, plus a dialog to edit each student's coaching profile (notes, tags, goals, platform sync).

**What it is & why it exists (plain English):** This is where a coach manages *who* is in their classroom and the details for each learner. It lists every student with their engagement, game counts, accuracy, and any coach notes. The coach can search/filter by name, email, or tag; pin important students; and open an "Edit profile" dialog to record private notes, tags, priority, weekly game goals, target accuracy, and which online platform (Chess.com/Lichess) the student plays on for automatic game import. It exists as the central control panel for student management.

**How it works, step by step:**
1. It fetches the dashboard data (`["coach-dashboard"]`) which contains the `roster`.
2. A search box and a tag dropdown filter the roster. `allTags` collects every tag used across students; `filtered` narrows the list by the search text (matching username, email, or tags) and the chosen tag.
3. Each student renders as a card: a **pin** toggle (calls `updateCoachLink` then refreshes the caches), the username (links to the dossier), an engagement chip (color-coded), tag chips, a stats line (total/analyzed games, average accuracy, days inactive), and a preview of any coach note. Two buttons: **Edit profile** (opens the dialog) and **Open dossier** (goes to `/coach/students/:id`).
4. Pressing **Edit profile** runs `openEdit(linkId)`: it fetches the full coach links, finds the matching one, and pre-fills the dialog fields (notes, tags, priority, weekly goal, target accuracy, platform, platform username, sync on/off).
5. The dialog collects all those fields. **Save** runs the `updateMut` mutation, which calls `updateCoachLink(editId, payload)`; on success it refreshes the dashboard and links caches, and — if a platform + username were set — triggers a game sync (`triggerSync`) so the student's recent games import. Tags are split from a comma-separated string into a clean list, and a `last_reviewed_at` timestamp is stamped.
6. While loading it shows a spinner; if nothing matches it shows a "No students match" empty state.

**Functions, components & exports:**
- **`CoachStudentsPage` (default export):** No props. Holds the search/filter and dialog form state, computes `allTags` and `filtered`, and renders the roster cards plus the edit dialog.
  - `openEdit(linkId)` — fetches and pre-fills the edit dialog for one student.
  - `updateMut` — the mutation that saves the coaching profile (and optionally triggers a sync).

**Connections:** Uses `useQuery`/`useMutation`/`useQueryClient`, `fetchCoachDashboard`, `fetchCoachLinks` + `updateCoachLink` (from `@/lib/api/academies`), `triggerSync` (from `@/lib/api/sync`), `usePalette`, `engagementColor`/`PRIORITY_OPTIONS` (coach constants), and the coach UI (`CoachShell`, `ClassroomPanel`, `CoachPageHeader`, `CoachEmptyState`), plus `NavLink`. Routed at `/coach/students`, guarded by `RoleRoute([Coach, Admin])`.

---

## `src/pages/coach/student-detail.tsx`

**In one sentence:** A single student's full dossier — stats, platform sync, weekly-activity and accuracy charts, coach notes, exportable reports, an activity timeline, and the list of their synced games.

**What it is & why it exists (plain English):** When a coach clicks into one student, this is the deep-dive page. It pulls together everything about that learner: how many games they have, how accurate they are, how many blunders, their progress against weekly goals and accuracy targets, the coach's private notes, and every synced game with its analysis status. The coach can trigger a platform sync, export the student's games as JSON or CSV, jump straight into reviewing the latest analyzed game, quick-assign work, message the student, and mark the student "reviewed." It exists so a coach can prepare for and run a coaching session around one person.

**How it works, step by step:**
1. The student's id comes from the URL (`useParams`). Several queries fetch in parallel (each enabled only once `id` exists):
   - `fetchStudentStats(id)` → headline stats.
   - `fetchCoachLinks` (with a `select` to find this student's link) → the coaching relationship (tags, goals, platform, notes).
   - `fetchGames(id)` → the student's synced games.
   - `fetchStudentTimeline(id)` → weekly activity and an event timeline.
   - `fetchSyncOverview(id)` → counts of analyzed/pending/total synced games.
2. The header shows the student's name, their tags and a "High priority" chip, and action buttons: **Quick assign** (→ `/coach/assignments`), **Message** (→ `/coach/messages`), and **Mark reviewed** (stamps `last_reviewed_at` via `updateCoachLink`).
3. A **Platform sync** card shows the connected Chess.com/Lichess username with analyzed/pending/synced chips, any sync error, and a "Sync last 30 games" button (the `syncMut` mutation, which refreshes the sync overview and games on success). If no platform is set, it explains how to set one on the roster.
4. A row of `CoachStatCard`s: Games, Analyzed, Avg accuracy, Blunders (red), and Pending work.
5. If the student has a weekly game goal, a **weekly activity vs goal** area chart (recharts) is drawn. If they have a target accuracy, a progress bar shows current vs target. Private coach notes are shown if present.
6. An **Export & report** card has From/To date pickers and three buttons: **Export JSON** and **Export CSV** (both call `loadReport()` on demand and download a file), and — if any analyzed game exists — **Review latest analyzed game** (→ `/review?gameId=...`).
7. An **Activity timeline** lists up to 12 recent events. Finally, a **Synced games** card lists each game with an analysis-status chip (Analyzed / Analyzing / Not analyzed) and an "Open report" link that goes to `/review` (if analyzed) or `/analysis` (if not).

**Functions, components & exports:**
- **`CoachStudentDetail` (default export):** No props (reads `id` from the URL). Orchestrates the five queries, the sync mutation, and renders every card/section above.
  - `markReviewed()` — stamps the link's `last_reviewed_at`.
  - The on-demand report buttons call `loadReport()` and build downloadable Blobs.
- `exportCsv(report)` — module-level helper that turns a fetched report's games into a CSV file and triggers a browser download.

**Connections:** Uses `useParams`, `useQuery`/`useMutation`/`useQueryClient`, `usePalette`/`useCardSx`, `alpha`, and a wide set of API helpers: `avgAccuracy`, `fetchCoachLinks`, `fetchStudentReport`, `fetchStudentStats`, `updateCoachLink` (academies), `fetchGames` (games), `fetchStudentTimeline` (coaching), `fetchSyncOverview`/`triggerSync` (sync). Renders inside `CoachShell` with `CoachStatCard` and `NavLink`, and uses `recharts` for the chart. Links to `/coach/students`, `/coach/assignments`, `/coach/messages`, `/review`, and `/analysis`. Routed at `/coach/students/:id`, guarded by `RoleRoute([Coach, Admin])`.

---

## `src/pages/coach/assignments.tsx`

**In one sentence:** The assignment workspace — create assignments, view them as a Kanban board or due-date calendar or full list, bulk-assign to many students, and edit/advance each one's status.

**What it is & why it exists (plain English):** Coaches give students homework — review a game, study an opening, solve puzzles. This page is the full workflow for that. It has four tabs: **Create** (a form to make one assignment), **Kanban** (columns by status: pending / in progress / completed / cancelled), **Calendar** (grouped by due date), and **All list** (everything). A **Bulk assign** button hands the same task to several students at once. Each assignment card can be edited or moved through its lifecycle. It exists so a coach can plan and track student work in one place.

**How it works, step by step:**
1. It fetches the coach's student links (for the student dropdowns) and all assignments (`["assignments"]`).
2. It groups assignments two ways: `byStatus` (for the Kanban columns) and `dueCalendar` (a date-sorted map of upcoming, non-finished assignments for the Calendar).
3. **Create tab:** a form (`formFields`) collects student, title, category, priority, instructions, due date, and optional PGN. The "Create assignment" button is disabled until a student and instructions are provided; on click it runs the `createMut` mutation and resets the form.
4. **Kanban tab:** four columns, each header showing its count; each assignment is an `AssignmentCard` with action buttons to edit or change status.
5. **Calendar tab:** if there are upcoming due dates, it groups assignments by date; otherwise an empty state.
6. **All list tab:** every assignment as a wider `AssignmentCard`.
7. **Bulk assign dialog:** checkboxes for each student plus title/instructions/due date; the button reads "Assign to N students" and runs the `bulkMut` mutation.
8. **Edit dialog:** lets the coach change a single assignment's title, instructions, and status, saved via the `updateMut` mutation.
9. After any create/update/bulk action, the `invalidate()` helper refreshes both the assignments and dashboard caches.

**Functions, components & exports:**
- **`CoachAssignmentsPage` (default export):** No props. Manages the active tab, dialogs, form fields, and selected students; defines the three mutations; and renders all four tabs plus the two dialogs.
  - `invalidate()` — refreshes assignments + dashboard caches.
  - `resetForm()` — clears the create form.
  - `formFields` — the shared set of create-form inputs.
- **`AssignmentCard` (internal component):** Props: `assignment`, `onEdit`, `onStatus`, optional `list`. Renders one assignment (student, category/priority/overdue chips, title, truncated instructions, due date) with buttons to Edit and to move status (Start / Complete / Cancel). It computes `overdue` itself from the due date and status.

**Connections:** Uses `useQuery`/`useMutation`/`useQueryClient`, `fetchCoachLinks` (academies), `createAssignment`/`fetchAssignments`/`updateAssignment` + the `Assignment` type (assignments API), `bulkCreateAssignments` (coaching), `ASSIGNMENT_CATEGORIES`/`formatCategory`/`PRIORITY_OPTIONS` (coach constants), `usePalette`, and the coach UI (`CoachShell`, `CoachPageHeader`, `CoachEmptyState`). Routed at `/coach/assignments`, guarded by `RoleRoute([Coach, Admin])`.

---

## `src/pages/coach/templates.tsx`

**In one sentence:** A library of reusable lesson templates (drills/homework) that a coach can favorite, create, delete, and assign to a student in one click.

**What it is & why it exists (plain English):** Coaches often reuse the same drills. Instead of retyping an assignment each time, they save it once as a **template** and apply it to any student later. This page is that template library: a grid of saved templates (each with a category, estimated minutes, and instructions), a "New template" form, a favorite-star toggle, delete buttons, and an "Assign" flow that turns a template into a real assignment for a chosen student. It exists to save coaches repetitive work.

**How it works, step by step:**
1. It fetches all templates (`["lesson-templates"]`) and the coach's student links (for the assign dropdown).
2. Templates render as a grid of cards: title, a favorite-star icon (toggles `is_favorite` via `updateLessonTemplate`), a category chip and optional "N min" chip, truncated instructions, and **Assign** + **Delete** buttons. If there are none, an empty state invites the coach to save one.
3. **New template dialog:** a form (title, category, instructions, PGN, estimated minutes) saved via the `createMut` mutation; the Save button is disabled until title and instructions are filled.
4. **Assign dialog:** opened by clicking **Assign** on a card (stores the template in `applyTpl`); the coach picks a student and clicks "Create assignment", which runs the `applyMut` mutation — this calls `createAssignment(...)` copying the template's title, instructions, PGN, and category onto a new assignment for that student.
5. Deleting a template calls `deleteLessonTemplate` and refreshes the list.

**Functions, components & exports:**
- **`CoachTemplatesPage` (default export):** No props. Manages the create-form state, the "assign" target, and the selected student; defines the create and apply mutations; and renders the template grid plus both dialogs.
  - `createMut` — saves a new template.
  - `applyMut` — turns the chosen template into an assignment for the selected student.

**Connections:** Uses `useQuery`/`useMutation`/`useQueryClient`, the lesson-template API (`createLessonTemplate`, `deleteLessonTemplate`, `fetchLessonTemplates`, `updateLessonTemplate`, `LessonTemplate` type) and `createAssignment` (assignments), `fetchCoachLinks` (academies), `ASSIGNMENT_CATEGORIES`/`formatCategory` (constants), `usePalette`, and the coach UI (`CoachShell`, `CoachPageHeader`, `CoachEmptyState`). Routed at `/coach/templates`, guarded by `RoleRoute([Coach, Admin])`.

---

## `src/pages/coach/messages.tsx`

**In one sentence:** The coach's messaging screen — a history of messages sent to students plus a "Compose" dialog to send a new one.

**What it is & why it exists (plain English):** Coaches need to send feedback, reminders, and study notes to their students. This page lists all messages the coach has sent (subject, recipient, date, body) and provides a Compose dialog to write a new one. Students see these in their own academy inbox. It exists as the coach's outbound communication tool.

**How it works, step by step:**
1. It fetches the coach's student links (for the recipient dropdown) and the message history (`["coach-messages"]`).
2. While loading it shows a spinner; if there are no messages it shows an empty state.
3. Each message renders as a card: subject, timestamp, "To <student>", and the body text.
4. The **Compose** button opens a dialog with a student dropdown, a subject field, and a multi-line message field.
5. **Send** runs the `sendMut` mutation (`sendCoachMessage`), which on success refreshes the messages and dashboard caches, closes the dialog, and clears the fields. The Send button is disabled until student, subject, and body are all provided.

**Functions, components & exports:**
- **`CoachMessagesPage` (default export):** No props. Manages the compose dialog state (open flag, student, subject, body), defines the send mutation, and renders the message list plus the compose dialog.

**Connections:** Uses `useQuery`/`useMutation`/`useQueryClient`, `fetchCoachLinks` (academies), `fetchCoachMessages`/`sendCoachMessage` (coaching), `usePalette`, and the coach UI (`CoachShell`, `CoachPageHeader`, `CoachEmptyState`). Routed at `/coach/messages`, guarded by `RoleRoute([Coach, Admin])`.

---

## `src/pages/coach/plans.tsx`

**In one sentence:** The training-plans screen — create and track multi-week structured programs (with weekly goals) for individual students.

**What it is & why it exists (plain English):** Beyond one-off assignments, coaches design longer programs: "a four-week plan to improve endgames." This page lists each student's training plans (title, weeks, status, and weekly goals with checkmarks), lets a coach create a new plan, and lets them mark an active plan complete or pause it. It exists for structured, longer-term coaching.

**How it works, step by step:**
1. It fetches the coach's student links (for the dropdown) and all training plans (`["training-plans"]`).
2. Each plan renders as a card: title, a summary line (student · N weeks · status), and the list of weekly goals (each shown as "Week N: goal text ✓" if done). Active plans get **Mark complete** and **Pause** buttons, each calling `updateTrainingPlan` and refreshing the list.
3. The **New plan** button opens a dialog with student, plan title, target weeks, and a "Weekly goals (one per line)" text area.
4. On **Create plan**, the `createMut` mutation runs `createTrainingPlan(...)`: it parses the goals text into one goal object per non-empty line (each tagged with its week number and `done: false`), then refreshes the plans and dashboard caches and closes the dialog.

**Functions, components & exports:**
- **`CoachPlansPage` (default export):** No props. Manages the create-dialog form state (student, title, weeks, goals text), defines `createMut`, and renders the plan cards plus the create dialog.

**Connections:** Uses `useQuery`/`useMutation`/`useQueryClient`, `fetchCoachLinks` (academies), `createTrainingPlan`/`fetchTrainingPlans`/`updateTrainingPlan` (coaching), `usePalette`, and the coach UI (`CoachShell`, `CoachPageHeader`). Routed at `/coach/plans`, guarded by `RoleRoute([Coach, Admin])`.

---

## `src/pages/coach/analytics.tsx`

**In one sentence:** The cohort-analytics screen — bar charts comparing accuracy across students, a cohort mistake breakdown, and a list of the most common openings in synced games.

**What it is & why it exists (plain English):** This page zooms out from individual students to the whole class. It shows the cohort's average accuracy, how many students are tracked, a bar chart of each student's accuracy, a bar chart of total mistakes by type (Blunder/Mistake/Inaccuracy), and a list of the openings appearing most often in the cohort's games. It exists to help a coach spot class-wide patterns and trends.

**How it works, step by step:**
1. It fetches analytics data with `useQuery({ queryKey: ["coach-analytics"], queryFn: fetchCoachAnalytics })`.
2. It reshapes the data into two chart-friendly arrays: `chartData` (per-student accuracy and blunders, names trimmed to 10 chars) and `mistakeData` (counts for Blunder/Mistake/Inaccuracy).
3. While loading it shows a spinner; with data it renders two `CoachStatCard`s (cohort average accuracy, students tracked).
4. An **Accuracy by student** bar chart (recharts) and a **Mistake breakdown (cohort)** bar chart follow.
5. If there are top opening events, a panel lists each opening name and how many games it appeared in.

**Functions, components & exports:**
- **`CoachAnalyticsPage` (default export):** No props. Fetches the analytics, derives `chartData` and `mistakeData`, and renders the stat cards, two charts, and the openings list.

**Connections:** Uses `useQuery` with `fetchCoachAnalytics` (coaching), `usePalette`, the coach UI (`CoachShell`, `CoachPageHeader`, `CoachStatCard`), and `recharts` for the bar charts. Routed at `/coach/analytics`, guarded by `RoleRoute([Coach, Admin])`.

---

## `src/pages/student/index.tsx`

**In one sentence:** The student's personal hub ("My Hub") — their own synced game reports, summary stats, assignments from coaches, platform connection, classroom-join card, and coach messages.

**What it is & why it exists (plain English):** This is the single most important screen for a learner. It is *their* dashboard: a welcome greeting, four summary tiles (games synced, reports ready, average accuracy, open assignments), a grid of their game reports (each openable in the analyzer/viewer), and a sidebar with their platform card (connect Chess.com/Lichess), their assignments (which they can start and mark done), a card to join a coach's classroom, and any messages from their coach. It exists so a student has one place to see their progress and act on their homework.

**How it works, step by step:**
1. Four queries fetch in parallel: all assignments (`["assignments"]`), the student's own games (`["my-games"]`, auto-refreshing every 30 seconds), coach messages (`["coach-messages"]`), and the student's stats (`["student-stats", user.id]`, only once the user id is known).
2. From assignments it derives `myAssignments` (those addressed to this user) and `openAssignments` (not yet completed). It computes `avgAcc` (average of white/black accuracy) and `sortedGames` (analyzed reports first, then newest first).
3. Four `StatTile`s show: games synced, reports ready, average accuracy, and open assignments (each tile color-accented).
4. **Main column — My reports:** a header with a live count and an "Analyze new" button (→ `/analysis`). If loading, a spinner; if empty, a prompt to connect an account or analyze a new game; otherwise a grid of game cards. Each card shows the matchup, result, date, an accuracy chip, an analysis-status chip (via `gameAnalysisChipColor`/`gameAnalysisLabel`), and a link that opens `/review` (if analyzed) or `/analysis` (if not).
5. **Right column:** the `StudentPlatformCard` (connect/import from an online platform); an **Assignments** card listing each assignment with its coach, status chip, instructions, and buttons — "Open game" (loads the assignment's PGN into the analyzer via `openAssignmentPgn`), "Start" (pending → in progress), and "Mark done" (in progress → completed), each driven by the `statusMut` mutation; a `JoinClassroomCard` (enter a coach's code); and, if any exist, a **Coach messages** card showing the latest five.

**Functions, components & exports:**
- **`StudentHome` (default export):** No props. Runs the four queries, derives the lists/averages, and renders the whole hub.
  - `openAssignmentPgn(pgn)` — prepares a fresh analysis session from an assignment's PGN and navigates to `/analysis`.
  - `statusMut` — mutation that advances an assignment's status and refreshes the assignments cache.
- `StatTile({ label, value, accent })` — small presentational component for a single summary tile.
- `gameAccuracy(g)` — helper returning a game's rounded average accuracy (or `null`).
- `gameDate(g)` — helper formatting a game's date for display.

**Connections:** Uses `useAuth`, `usePalette`/`useCardSx`, `useRouter`, `useQuery`/`useMutation`/`useQueryClient`, `fetchAssignments`/`updateAssignment` (assignments), `fetchGames` + `ServerGame` type (games), `fetchCoachMessages` (coaching), `fetchStudentStats` (academies), `prepareNewAnalysisSession`, and `gameAnalysisChipColor`/`gameAnalysisLabel` (`@/lib/analysisStatus`). Renders `StudentPlatformCard`, `JoinClassroomCard`, and `NavLink`. Links to `/analysis` and `/review`. Routed at `/student`, guarded by `RoleRoute([Student])` (inside `RequireAuth`).

---

## `src/theme/themes.ts`

**In one sentence:** The catalog of all color schemes ("palettes") — it defines what a palette contains, builds ~25 named themes from a shared dark base, and exports helpers to look one up by id.

**What it is & why it exists (plain English):** This file is the single source of truth for the app's colors. The whole app is dark-themed and "luxury grey" by default; each named theme mostly just swaps the **accent** color (the highlight color used for buttons, links, and emphasis) while sharing the same dark backgrounds, with a few themes also tweaking backgrounds or text. It exists so the look can be changed app-wide by picking one id, and so every color used in the UI is defined in one consistent place.

**The "palette" concept (what a palette contains):** A **palette** (`ColorPalette` type) is a complete set of named colors the rest of the app refers to by role rather than by raw hex value. That way components say "use the accent color" instead of "use #6a9a6a", and switching themes recolors everything at once. A palette contains these fields:
- `bg` — the page background color.
- `surface` — a slightly raised surface (e.g. input backgrounds).
- `surfaceRaised` — cards and panels that sit above the surface.
- `border` — standard borders.
- `borderSubtle` — fainter dividers.
- `text` — primary text color.
- `textMuted` — secondary/dimmed text.
- `accent` — the main highlight/brand color.
- `accentHover` — the accent when hovered (slightly lighter).
- `accentDark` — a darker accent variant.
- `onAccent` — text/icon color that sits *on top of* the accent (for contrast).
- `playerLightBg` / `playerLightText` — colors for the "light" chess player block.
- `playerDarkBg` / `playerDarkText` — colors for the "dark" chess player block.
- `chartAreaFill` — fill color used in charts.

**How it works, step by step:**
1. `ColorThemeId` is the union of all valid theme names (obsidian, platinum, roseGold, emerald, copper, ruby, amethyst, teal, coral, mint, wine, slate, ivory, graphite, cherry, jade, mauve, sand, frost, pearl, bronze, espresso, smoke, velvet, forest).
2. `LUXURY_GREY` is the shared base palette — a complete dark grey scheme that every theme starts from.
3. Each theme is described as a `ThemeDef` with a human-readable `label`, an optional `base` (a few fields to override on top of `LUXURY_GREY`), and a required `accent` set (`accent`, `accentHover`, `accentDark`, `onAccent`). `buildTheme(def)` merges them: `{ ...LUXURY_GREY, ...def.base, ...def.accent }`.
4. `THEME_DEFS` holds all the definitions. From it, three lookups are generated: `COLOR_THEME_LABELS` (id → label), `COLOR_THEMES` (id → finished palette), and `COLOR_THEME_IDS` (the list of ids).
5. `DEFAULT_COLOR_THEME` is `"forest"`. `LEGACY_THEME_IDS` lists old names ("blueNeutral", "classic") that no longer exist.
6. `normalizeThemeId(id)` returns a safe, valid id — falling back to the default if the id is legacy or unknown. `getPalette(themeId)` returns the finished palette for an id (normalizing first).

**Functions, components & exports:**
- `ColorThemeId` (type) — every valid theme name.
- `ColorPalette` (type) — the shape of a palette (the fields listed above).
- `buildTheme(def)` — merges base + accent over `LUXURY_GREY` into a full palette.
- `COLOR_THEME_LABELS`, `COLOR_THEMES`, `COLOR_THEME_IDS` — generated lookups (labels, palettes, id list).
- `DEFAULT_COLOR_THEME` — the default theme id (`"forest"`).
- `normalizeThemeId(id)` — input: a string id; output: a valid `ColorThemeId` (falls back to default).
- `getPalette(themeId)` — input: a string id; output: the finished `ColorPalette`.

**Connections:** No app-internal imports. Consumed by `colorThemeAtom.ts` (default id + type), `voltchessTheme.ts` (`COLOR_THEMES`, `DEFAULT_COLOR_THEME`), `buttonStyles.ts` (`ColorPalette` type), and `usePalette()`/`useCardSx()` — which is how essentially every page gets its colors.

---

## `src/theme/colorThemeAtom.ts`

**In one sentence:** The single shared "box" that remembers which color theme the user picked, saved in the browser so it survives reloads.

**What it is & why it exists (plain English):** The app needs to remember the user's chosen theme everywhere and between visits. This file creates one Jotai **atom** (a shared value any component can read/write) that holds the current theme id, and — crucially — persists it to the browser's `localStorage`. So when you pick "Ruby", everything recolors instantly and the choice is still there next time you open the app.

**How it works, step by step:**
1. It uses `atomWithStorage` from Jotai's utils, which creates an atom that automatically reads from and writes to `localStorage`.
2. The storage key is `"voltchess-color-theme"`, and the initial value is `DEFAULT_COLOR_THEME` (forest) if nothing is saved yet.
3. Any component can read the current id with `useAtomValue(colorThemeAtom)` or change it with a setter; the new value is saved to `localStorage` automatically.

**Functions, components & exports:**
- `colorThemeAtom` — a persisted Jotai atom holding the current `ColorThemeId`. Inputs/outputs: read it to get the current theme id; set it to change (and persist) the theme.

**Connections:** Imports `DEFAULT_COLOR_THEME` and the `ColorThemeId` type from `themes.ts`. Read by `usePalette()` (in `src/hooks/usePalette.ts`) to resolve the current palette, and written by whatever theme-picker UI lets the user change themes.

---

## `src/theme/voltchessTheme.ts`

**In one sentence:** The bridge from a VoltChess palette to a full MUI theme object — it builds the Material UI theme (typography, shapes, component overrides) from whichever palette is active, plus a shared card-style helper.

**What it is & why it exists (plain English):** VoltChess defines its own simple color palettes, but the UI is built with **MUI**, which expects its colors in a specific structured "theme" object. This file is the translator: given one of our palettes, it produces a complete MUI theme — mapping our colors onto MUI's slots (primary, background, text, divider), setting fonts and heading sizes, rounding corners, and overriding how buttons, papers, text fields, and tabs look. It exists so the whole MUI component library automatically matches the chosen VoltChess palette.

**How it works, step by step:**
1. `createAppTheme(colorPalette)` calls MUI's `createTheme(...)` and fills it in from the given palette:
   - **palette:** dark mode; `primary` from the accent colors; `secondary`/`background` from surfaces; `text` from text colors; `divider` from the border.
   - **typography:** the Inter font family and specific sizes/weights for `h1`–`h5`, `body1`/`body2`, and buttons.
   - **shape:** a base border radius of 10.
   - **components:** overrides for `MuiCssBaseline` (body background + scrollbar colors), `MuiButton` (flat, rounded, no shadow; accent contained buttons), `MuiPaper` (no background image, a themed border), `MuiTextField` (surface background, themed border that brightens on hover and turns accent on focus), and `MuiTabs` (hides the default underline indicator).
2. `getCardSx(colorPalette)` returns a reusable style object for a standard "card" (raised surface, border, padding, and an accent-tinted border on hover).
3. Several deprecated exports remain for backward compatibility: `palette`, `createVoltChessTheme()`, and `cardSx` — each pinned to the default theme and marked `@deprecated` in favor of the hook-based equivalents (`usePalette()`, `createAppTheme`, `useCardSx()`).

**Functions, components & exports:**
- `createAppTheme(colorPalette)` — input: a `ColorPalette`; output: a complete MUI theme object. This is the main, current export.
- `getCardSx(colorPalette)` — input: a `ColorPalette`; output: an MUI `sx` style object for a standard card.
- `palette` *(deprecated)* — the default theme's palette.
- `createVoltChessTheme()` *(deprecated)* — builds the MUI theme for the default palette.
- `cardSx` *(deprecated)* — card style for the default palette.

**Connections:** Imports `createTheme`/`alpha` from MUI, and `COLOR_THEMES`/`DEFAULT_COLOR_THEME`/`ColorPalette` from `themes.ts`. `createAppTheme` is what the app's top-level theme provider uses to apply the active palette; `getCardSx` mirrors the logic exposed through `useCardSx()`, which pages like Play, Puzzles, Openings, the student hub, and the coach dossier use for their cards.

---

## `src/theme/buttonStyles.ts`

**In one sentence:** Two helper functions that produce ready-made MUI style objects for accent-colored buttons (icon and contained) that stay readable in both enabled and disabled states.

**What it is & why it exists (plain English):** Accent-colored buttons need careful contrast — text and icons must stay readable both on the bright accent and when the button is greyed-out (disabled). Rather than re-writing that styling on every button, this file provides two helpers that return the correct `sx` (MUI style) object for a given palette. It exists to keep accent buttons consistent and accessible across the app.

**How it works, step by step:**
1. Each helper takes the current palette and computes a readable icon/text color for the accent via `getReadableTextOn(palette.accent)` (which picks black or white depending on the accent's brightness).
2. It returns an `sx` object that: sets the accent background and readable foreground, brightens to `accentHover` on hover, and — when disabled — keeps full opacity but switches to a muted surface background with `textMuted` text and a border, so the disabled state is clearly readable rather than washed out.
3. Both helpers also force any nested icons (`.iconify`, `svg`) to follow the current text color, including in the disabled state.

**Functions, components & exports:**
- `accentIconButtonSx(palette)` — input: a `ColorPalette`; output: an `SxProps<Theme>` for a high-contrast accent **icon** button (with a readable disabled state).
- `accentContainedButtonSx(palette)` — input: a `ColorPalette`; output: an `SxProps<Theme>` for an accent **contained** (filled, labeled) button, bold and non-uppercased, with the same readable disabled handling.

**Connections:** Imports MUI's `SxProps`/`Theme` types, the `ColorPalette` type from `themes.ts`, and `getReadableTextOn` from `@/lib/contrast`. Used by components that render accent buttons and want guaranteed contrast; the palette is typically obtained from `usePalette()`.

---

## Summary

**Pages** are the routed screens of VoltChess. The public ones (`login`, `register`, `blog/*`, `terms-and-conditions`, `thanks`) need no account; the rest require sign-in via `RequireAuth`, and the `coach/*` and `student` pages additionally require the right role via `RoleRoute`. Coach pages are tools for *managing students* (dashboard, roster, dossiers, assignments, templates, messages, plans, analytics); the student page is one learner's *personal hub*. The chess pages (`analysis`, `review`, `database`, `play`, `puzzles`, `openings`) and the home page revolve around loading and reviewing games with the in-browser Stockfish engine.

**Theming** is centralized in `src/theme/`: `themes.ts` defines ~25 named palettes, `colorThemeAtom.ts` remembers the chosen one (persisted in the browser), `voltchessTheme.ts` translates a palette into a full MUI theme, and `buttonStyles.ts` provides consistent accent-button styling. Pages read the active colors through `usePalette()` / `useCardSx()`.
