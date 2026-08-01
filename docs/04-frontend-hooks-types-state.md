# VoltChess Frontend — Hooks, Types, State & Configuration

This document is an exhaustive, beginner-friendly tour of the "behind-the-scenes" plumbing of the VoltChess web app: the reusable logic pieces (hooks), the shared application state, the configuration helpers, the constant values, the data-shape descriptions (types), and the bundled static data. The goal is that even a non-coder can read any section and understand exactly what each file does, why it exists, and how the pieces connect together.

## A short plain-English primer (read this first)

If you have never written front-end code, the words below come up constantly. Here is what they mean in everyday language:

- **Component**: A self-contained chunk of the user interface — a button, a chessboard, a settings panel. The whole VoltChess screen is built by nesting many components together. Components are written in **React**, a popular library for building user interfaces.
- **A React "hook"**: A *reusable piece of component logic* whose name always starts with `use` (for example `useEngine`, `useDebounce`). A hook bundles up some behavior — like "remember a value", "watch the window size", or "talk to the chess engine" — so that any component can reuse that behavior with a single line, instead of copy-pasting the same code everywhere. Hooks are just functions, but they follow special React rules (they can only be called from inside components or other hooks, and always in the same order).
- **"State"**: Any *data that can change over time while the app is running* and that the screen needs to react to. Examples: which move you are looking at, whether you are logged in, the current window width, the chosen engine. When state changes, React automatically re-draws the parts of the screen that depend on it. "Local" state lives inside one component; "shared/global" state can be read by many components at once.
- **Jotai**: A *small library that holds shared app state in "atoms"*. Think of an **atom** as a single labeled box that holds one value (for example "the current chess game" or "the chosen engine depth"). Any component, anywhere in the app, can read from that box or write a new value into it, and everyone watching the box updates instantly. Jotai is lighter and simpler than older tools like Redux. In this codebase atoms are created with `atom(...)` and read/written with hooks like `useAtom`, `useAtomValue`, and `useSetAtom`.
- **TanStack Query** (also called React Query): A *tool that fetches and caches data from a server*. Instead of manually writing "start loading… got data… handle error… store it… don't re-fetch too often", you describe *what* you want with `useQuery`, give it a unique `queryKey` (a label for caching), and a `queryFn` (the function that actually fetches). TanStack Query then handles loading flags, errors, caching, background refreshing, and de-duplicating identical requests for you.
- **A TypeScript "type"**: A *description of the shape of data*, used for safety. For example, a type might say "a `Player` always has a `name` (text) and may have a `rating` (number)". The compiler then warns you if you accidentally use the data wrong (e.g. treat a number as text). Types do not exist when the app actually runs — they are only a development-time safety net. In this project you will see `interface`, `type`, and `enum`. An **enum** is a fixed list of named choices (for example the list of engine names).
- **localStorage / sessionStorage / IndexedDB**: Three browser "filing cabinets" for storing data on the user's own device. `localStorage` keeps small text values even after the browser closes; `sessionStorage` is the same but is wiped when the tab closes; `IndexedDB` is a larger in-browser database for structured records (VoltChess uses it to store saved games).
- **PGN / FEN**: Two standard chess text formats. **PGN** records a whole game (all the moves plus metadata like player names). **FEN** is a snapshot of a single board position.

With that vocabulary in hand, the rest of the document walks through every file.

## Table of contents

**Hooks (`src/hooks/`)**
- [`src/hooks/useAnalysisSession.ts`](#srchooksuseanalysissessionts)
- [`src/hooks/useAnalyzeGame.ts`](#srchooksuseanalyzegamets)
- [`src/hooks/useAtomLocalStorage.ts`](#srchooksuseatomlocalstoragets)
- [`src/hooks/useChessActions.ts`](#srchooksusechessactionsts)
- [`src/hooks/useDebounce.ts`](#srchooksusedebouncets)
- [`src/hooks/useEngine.ts`](#srchooksuseenginets)
- [`src/hooks/useGameApi.ts`](#srchooksusegameapits)
- [`src/hooks/useGameDatabase.ts`](#srchooksusegamedatabasets)
- [`src/hooks/useGameData.ts`](#srchooksusegamedatats)
- [`src/hooks/useLocalStorage.ts`](#srchooksuselocalstoragets)
- [`src/hooks/usePalette.ts`](#srchooksusepalettets)
- [`src/hooks/usePlayersData.ts`](#srchooksuseplayersdatats)
- [`src/hooks/useRouter.ts`](#srchooksuserouterts)
- [`src/hooks/useScreenSize.ts`](#srchooksusescreensizets)

**Contexts (`src/contexts/`)**
- [`src/contexts/AuthContext.tsx`](#srccontextsauthcontexttsx)

**Configuration (`src/config/`)**
- [`src/config/apiUrl.ts`](#srcconfigapiurlts)

**Constants (`src/constants/` and `src/constants.ts`)**
- [`src/constants/engineDefaults.ts`](#srcconstantsenginedefaultsts)
- [`src/constants.ts`](#srcconstantsts)

**Types (`src/types/`)**
- [`src/types/chessCom.ts`](#srctypeschesscomts)
- [`src/types/engine.ts`](#srctypesenginets)
- [`src/types/enums.ts`](#srctypesenumsts)
- [`src/types/eval.ts`](#srctypesevalts)
- [`src/types/game.ts`](#srctypesgamets)
- [`src/types/lichess.ts`](#srctypeslichessts)
- [`src/types/user.ts`](#srctypesuserts)

**Bundled data (`src/data/`)**
- [`src/data/blogPosts.ts`](#srcdatablogpoststs)
- [`src/data/openings.ts`](#srcdataopeningsts)
- [`src/data/seo.ts`](#srcdataseots)

---

## `src/hooks/useAnalysisSession.ts`

**In one sentence:** Restores and persists the current analysis (the loaded game, its engine report, and board orientation) so that reloading the page, or visiting `/analysis` with a game in the URL, brings everything back exactly where you left off.

**What it is & why it exists (plain English):** When you analyze a chess game and then accidentally refresh the page, you do not want to lose the game and the whole engine report. This hook saves a small "session" snapshot into the browser's `sessionStorage` (a per-tab filing cabinet that clears when the tab closes) and restores it automatically. It also understands two ways of opening a game by web address: `?gameId=...` (a saved game, either local or on the server) and `?pgn=...` (a game encoded directly in the link). So it is the glue that makes the Analysis page "remember" what you were doing and react to links you paste in.

This file mixes a React hook (`useAnalysisSession`) with a few plain helper functions (`saveAnalysisSession`, `clearAnalysisSession`, `prepareNewAnalysisSession`) that other code can call even when not inside a component.

**How it works, step by step:**
1. A constant `SESSION_KEY = "voltchess-analysis-session"` is the label used in `sessionStorage`.
2. On first mount, the hook reads any saved session JSON and, if it contains a `pgn`, applies it to the app (loading the moves, evaluation, and orientation). A `restoredRef` flag ensures this only happens once.
3. It watches the URL query. If `gameFromUrl` (a locally saved game) or `serverGameFromUrl` (a game fetched from the server) is present, it loads that game; otherwise if a `?pgn=` parameter is present it decodes it (from base64 text) and loads it. Before applying, it compares move histories to avoid pointlessly reloading the same game.
4. Whenever the game, evaluation, or orientation changes, it re-saves the session so the snapshot stays fresh.

**Functions, hooks, types & exports:**
- `AnalysisSession` (internal interface): the saved snapshot shape — `pgn` (the game text), optional `eval` (the engine report, type `GameEval`), and `boardOrientation` (a boolean; `true` means white at the bottom).
- `saveAnalysisSession(pgn, evalData, boardOrientation)`: Inputs are the game text, optional evaluation, and orientation. It loads the PGN to verify there is at least one move; if there are none it deletes the saved session, otherwise it writes the JSON snapshot. Returns nothing. Any error also clears the session.
- `clearAnalysisSession()`: No inputs; removes the saved snapshot. Returns nothing.
- `prepareNewAnalysisSession(pgn, boardOrientation = true)`: Convenience wrapper that saves a brand-new game (with no evaluation yet) before navigating to `/analysis`. Returns nothing.
- `useAnalysisSession()`: The hook. Takes no arguments and returns nothing — it is used purely for its side effects. Internally it reads/writes several Jotai atoms (`gameAtom`, `gameEvalAtom`, `boardOrientationAtom`, `evaluationProgressAtom`, `boardAtom`) and uses `useChessActions`, `useGameDatabase`, and `useRouter`. `applyGame(pgn, evalData?, orientation?)` is the internal helper that pushes a game into all the relevant atoms at once.

**Connections:** Imports `chess.js`, Jotai, `useChessActions`, `useGameDatabase`, `useRouter`, `decodeBase64` from `@/lib/helpers`, the analysis state atoms from `@/sections/analysis/states`, and the `Game`/`GameEval` types. It is used on the Analysis page (`src/pages/analysis.tsx`) and its helper functions are called wherever a new game is sent to analysis.

---

## `src/hooks/useAnalyzeGame.ts`

**In one sentence:** Runs the Stockfish engine over the whole loaded game to produce a full report (accuracy, move classifications, estimated Elo), and exposes the controls and status flags the Analysis UI needs.

**What it is & why it exists (plain English):** "Analyzing a game" means asking the chess engine to look at every position and judge how good each move was. That is a heavy, multi-step operation. This hook wraps all of it into two simple actions — `analyzeGame()` and `reanalyzeGame()` — plus a set of status values (is the engine ready? how far along is the analysis? is this a server game?). The Analysis page calls these instead of dealing with the engine directly.

**How it works, step by step:**
1. It reads the chosen engine settings from Jotai atoms (name, depth, number of lines/`multiPv`, number of worker threads) and spins up the matching engine via `useEngine`.
2. `readyToAnalyse` is `true` only when the engine is ready, the game has moves, and no analysis is currently running.
3. `analyzeGame(force)`: gathers the positions to evaluate, bails out early if the engine is not ready or an analysis is already running, and (unless `force` is set) skips re-running if a report already exists. It then calls `engine.evaluateGame(...)`, stores the result in `gameEvalAtom`, saves it into the local game database if applicable, syncs the result to the server in the background, caches per-position evaluations in `savedEvalsAtom`, logs an analytics event, and returns `true` on success / `false` otherwise.
4. `reanalyzeGame()`: clears the existing report and forces a fresh analysis.

**Functions, hooks, types & exports:**
- `useAnalyzeGame()`: The only export. Takes no arguments. Returns an object with:
  - `analyzeGame(force = false)`: async; runs analysis, returns a boolean success flag.
  - `reanalyzeGame()`: async; wipes and re-runs analysis.
  - `readyToAnalyse`: boolean, whether analysis can start now.
  - `gameEval`: the current report (`GameEval` or undefined).
  - `evaluationProgress`: a number tracking analysis progress.
  - `engineReady`: boolean, whether the engine has finished loading.
  - `isServerGame`: boolean, true when viewing a synced server game that already has a saved report.
  - `serverGameId`: the server's id for the game, if any.

**Connections:** Imports `getEvaluateGameParams` from `@/lib/chess`, `useEngine`, `useGameDatabase`, `usePlayersData`, `logAnalyticsEvent` from `@/lib/firebase`, `syncAnalysisResult` from `@/lib/gameSync`, the `SavedEvals` type, and many analysis atoms from `@/sections/analysis/states`. It is the engine behind the Analysis page's "Analyze"/"Re-analyze" buttons.

---

## `src/hooks/useAtomLocalStorage.ts`

**In one sentence:** Connects a Jotai atom to the browser's `localStorage` so its value is both shared app-wide *and* remembered across browser sessions.

**What it is & why it exists (plain English):** A normal Jotai atom forgets its value when you close the browser. Sometimes you want a shared value to *persist* — for example a user preference. This hook takes an existing atom and a storage `key`, loads any previously-saved value into the atom on startup, and writes the atom back to `localStorage` whenever it changes. The result behaves just like React's own `useState`, but is both global (via Jotai) and persistent (via `localStorage`).

**How it works, step by step:**
1. It tracks a temporary key (`keyTemp`) in local state to guard against writing before the initial read has completed (this avoids overwriting saved data with a default on first render).
2. On mount (and whenever `key` changes) it reads `localStorage[key]`, safely parses the JSON, and if a value exists pushes it into the atom.
3. A second effect writes the current atom value back to `localStorage[key]` whenever it changes — but only once `keyTemp` matches the real `key`.

**Functions, hooks, types & exports:**
- `useAtomLocalStorage<T>(key, atom)`: Generic over the value type `T`. Inputs are a string `key` (the storage label) and a Jotai `PrimitiveAtom<T>`. Returns the familiar `[value, setValue]` tuple, where `value` is the current value and `setValue` accepts either a new value or an updater function (matching React's `SetStateAction`).
- `parseJSON<T>(value)` (internal): safely turns a stored string into a value, returning `undefined` for the literal text `"undefined"`.

**Connections:** Imports `PrimitiveAtom`, `SetStateAction`, and `useAtom` from Jotai, plus React's `useEffect`/`useState`. Used wherever a shared setting needs to survive reloads.

---

## `src/hooks/useChessActions.ts`

**In one sentence:** Provides a clean set of actions (play a move, undo, jump to a move, reset, load a PGN) that operate on a chess game stored in a Jotai atom, while playing the appropriate move sounds.

**What it is & why it exists (plain English):** The board and the analysis both hold their chess game in a Jotai atom (a shared box) containing a `chess.js` game object. Mutating that object correctly — and replacing it immutably so React notices the change — is fiddly. This hook centralizes every common game manipulation into named functions, so components just call `playMove(...)` or `undoMove()` without worrying about the mechanics. It also plays the correct sound effect for each move (capture, check, illegal, etc.).

**How it works, step by step:**
1. You pass in *which* atom holds the game (so the same hook can drive the main game board or a side board).
2. Every action makes a fresh copy of the game (via `copyGame`), applies the change to the copy, then stores the copy back into the atom — this immutable swap is what tells React to re-render.
3. Move actions call `playSoundFromMove(...)`; illegal moves call `playIllegalMoveSound()`.

**Functions, hooks, types & exports:**
- `resetGameParams` (exported interface): optional `fen` (a starting position), `white`/`black` (`Player` objects), and `noHeaders` (skip adding PGN header tags).
- `useChessActions(chessAtom)`: Input is the `PrimitiveAtom<Chess>` to control. Returns an object of actions:
  - `setPgn(pgn)`: load a full game from PGN text.
  - `reset(params?)`: start a new game, optionally from a FEN and with player headers.
  - `playMove({ from, to, promotion?, comment? })`: attempt a move; returns the `Move` on success or `null` if illegal.
  - `undoMove()`: take back the last move.
  - `goToMove(moveIdx, fullGame)`: jump to a specific move number by replaying `fullGame` and undoing back to that index.
  - `resetToStartingPosition(pgn?)`: rewind to the game's initial position while keeping headers.
  - `addMoves(moves)`: apply a list of moves in sequence.
  - `copyGame` (internal): clones the current game, with special handling so a game that is only headers (no moves) is copied without a trailing result token.

**Connections:** Imports `getGameFromPgn`/`setGameHeaders` from `@/lib/chess`, sound helpers from `@/lib/sounds`, the `Player` type, `chess.js`, and Jotai. Used by the analysis board, the play board, and `useAnalysisSession`.

---

## `src/hooks/useDebounce.ts`

**In one sentence:** Returns a "delayed" copy of a value that only updates after the value has stopped changing for a given number of milliseconds.

**What it is & why it exists (plain English):** "Debouncing" means waiting until rapid activity settles down before reacting. For example, if a user is dragging a slider, you do not want to re-run an expensive operation on every tiny movement — you want to wait until they pause. This hook gives you a value that lags behind the live one and only catches up after a quiet period, smoothing out bursts of changes.

**How it works, step by step:**
1. It keeps a `debouncedValue` in state, initialized to the current value.
2. When the live `value` changes, it starts a timer for `delayMs`. If the value changes again before the timer fires, the old timer is cleared and a new one starts.
3. When the timer finally fires (the value has been stable), `debouncedValue` updates to match.
4. A special case: if there is currently no debounced value (falsy), it updates immediately rather than waiting.

**Functions, hooks, types & exports:**
- `useDebounce<T>(value, delayMs)`: Generic over the value type. Inputs are the live `value` and a delay in milliseconds. Returns the debounced value (same type as the input).

**Connections:** Imports only React's `useEffect`/`useState`. Used by inputs/controls (for example board or analysis components) that need to avoid reacting to every rapid change.

---

## `src/hooks/useEngine.ts`

**In one sentence:** Loads and returns the correct Stockfish engine instance for a chosen engine name, cleanly shutting down the previous one when the choice changes.

**What it is & why it exists (plain English):** VoltChess can run several different versions of the Stockfish chess engine inside your browser, each with different strength and download size. This hook takes the *name* of the engine you want and asynchronously loads the matching implementation, returning the live engine object once it is ready. It also makes sure that when you switch engines, the old one is properly shut down so it does not waste memory or CPU.

**How it works, step by step:**
1. It holds the loaded engine in local state, starting as `null`.
2. When `engineName` changes, an effect checks: if it is not Stockfish 11 and the browser does not support WebAssembly (`isWasmSupported()`), it bails out (those engines need WASM).
3. Otherwise it calls `pickEngine(engineName)` to create the right engine, then stores it — first calling `.shutdown()` on whatever engine was loaded before.

**Functions, hooks, types & exports:**
- `useEngine(engineName)`: Input is an `EngineName` (or `undefined`). Returns the loaded `UciEngine` instance, or `null` while loading or if none is selected.
- `pickEngine(engine)` (internal): a `switch` mapping each `EngineName` to the right factory (`Stockfish17.create(...)`, `Stockfish16_1.create(...)`, etc.), where the boolean argument selects the "lite/full" variant. Returns a `Promise<UciEngine>`.

**Connections:** Imports `isWasmSupported` and the various Stockfish classes from `@/lib/engine/*`, the `UciEngine` base type, and the `EngineName` enum. Used by `useAnalyzeGame` (and any other engine-driven feature).

---

## `src/hooks/useGameApi.ts`

**In one sentence:** A small set of TanStack Query hooks and helpers for reading and deleting games stored on the VoltChess server (used by the academy/authenticated features).

**What it is & why it exists (plain English):** Beyond games saved locally in the browser, logged-in users (students/coaches) have games stored on the server. This file provides the cached, ready-to-use data hooks for fetching a list of games, fetching one game, refreshing that cache after changes, and deleting a server game. It uses TanStack Query so the data is cached, de-duplicated, and only fetched when authentication is actually enabled and the user is logged in.

**How it works, step by step:**
1. Each query is gated by `enabled: ENABLE_AUTHENTICATION && isAuthenticated` (and, for a single game, a valid id), so no network call happens for logged-out users or when auth is turned off.
2. `queryKey` arrays act as cache labels; identical keys share cached results.
3. The invalidate helper tells TanStack Query that cached "server-games" data is stale so it re-fetches.

**Functions, hooks, types & exports:**
- `useServerGames(studentId?)`: Fetches the list of server games (optionally for a specific student). Returns a TanStack Query result object (with `data`, `isLoading`, `error`, etc.). Cache key: `["server-games", studentId ?? "me"]`.
- `useServerGame(gameId?)`: Fetches one server game by id. Returns a query result. Cache key: `["server-game", gameId]`; only enabled when `gameId` is provided.
- `useInvalidateServerGames()`: Returns a function that, when called, marks the `["server-games"]` cache as stale (triggering a refresh).
- `removeServerGame(gameId)`: A plain async function that deletes a server game via the API.
- Re-exports the `ServerGame` type for convenience.

**Connections:** Imports `useQuery`/`useQueryClient` from TanStack Query, `useAuth` from the auth context, `ENABLE_AUTHENTICATION` from constants, and `deleteServerGame`/`fetchGames`/`fetchGame`/`ServerGame` from `@/lib/api/games`. Used by academy/coach/student pages that list or open server-stored games.

---

## `src/hooks/useGameDatabase.ts`

**In one sentence:** Manages the in-browser IndexedDB database of saved games (add/read/update/delete) and resolves the game referenced by the current URL — whether it lives locally or on the server.

**What it is & why it exists (plain English):** VoltChess lets you save games in your own browser so you can reopen them later without an account. This hook wraps the browser's IndexedDB (a local database) behind friendly functions, keeps a shared list of saved games in a Jotai atom, and figures out which game the current web address is pointing at. Crucially, it handles two kinds of links: a local saved game (a plain number id) and a server game (a special id), and for server games it even polls in the background until the engine report finishes generating.

**How it works, step by step:**
1. On mount it opens (or creates) an IndexedDB database named `games` with one object store, also named `games`, keyed by an auto-incrementing `id`.
2. It exposes CRUD functions (`addGame`, `getGame`, `setGameEval`, `deleteGame`) and keeps the shared `gamesAtom` list in sync by reloading after each change (only when fetching is enabled via `fetchGamesAtom`).
3. It watches the URL's `gameId`. If it is a server id, it fetches the server game and, if no report exists yet, keeps polling every 5 seconds until one appears (cleaning up on unmount). If it is a numeric local id, it loads that game from IndexedDB.

**Functions, hooks, types & exports:**
- `LoadedServerGame` (exported type): a server game shaped for the UI — `serverId`, `pgn`, optional `eval` (`GameEval`), and `white`/`black` players.
- `useGameDatabase(shouldFetchGames?)`: Optional boolean controls whether the saved-games list is actively loaded. Returns:
  - `addGame(game)`: async; saves a `chess.js` game, returns the new id.
  - `setGameEval(gameId, evaluation)`: async; attaches an engine report to a saved game.
  - `getGame(gameId)`: async; returns one saved game or `undefined`.
  - `deleteGame(gameId)`: async; removes a saved game.
  - `games`: the shared array of saved games.
  - `isReady`: boolean, true once the database is open.
  - `gameFromUrl`: the local game referenced by the URL (or `undefined`).
  - `serverGameFromUrl`: the server game referenced by the URL (or `undefined`).
- Internal: `GameDatabaseSchema` (the IndexedDB shape) and the module-level `gamesAtom`/`fetchGamesAtom`.

**Connections:** Imports `formatGameToDatabase` from `@/lib/chess`, `fetchGame` from `@/lib/api/games`, `isServerGameId` from `@/lib/gameSync`, the `idb` library, the `Game`/`GameEval` types, Jotai, and `useRouter`. Used by `useAnalysisSession`, `useAnalyzeGame`, `usePlayersData`, and the database page.

---

## `src/hooks/useGameData.ts`

**In one sentence:** Keeps a small "current position" state atom in sync with the latest move of a chess game.

**What it is & why it exists (plain English):** As you step through a game, various UI pieces want to know "what was the last move played to reach the position now on screen?". This tiny hook watches a game atom and, whenever the game changes, writes the most recent move into a separate "position data" atom so the rest of the app can read it.

**How it works, step by step:**
1. It reads the game from `gameAtom` and reads/writes the `gameDataAtom`.
2. Whenever the game changes, it grabs the verbose move history, takes the last move, and stores `{ lastMove }` into the data atom.
3. It returns the current `gameData` value.

**Functions, hooks, types & exports:**
- `useGameData(gameAtom, gameDataAtom)`: Inputs are the `PrimitiveAtom<Chess>` holding the game and a `PrimitiveAtom<CurrentPosition>` to update. Returns the current `CurrentPosition` value (which includes `lastMove`).

**Connections:** Imports the `CurrentPosition` type from `@/types/eval`, `chess.js`, and Jotai. Used by board/position-display components that need the last move.

---

## `src/hooks/useLocalStorage.ts`

**In one sentence:** A `useState`-like hook backed by the browser's `localStorage`, so a component's value persists across reloads (without sharing it globally).

**What it is & why it exists (plain English):** Sometimes a single component just wants to remember a value between visits — without involving Jotai's global atoms. This hook behaves like React's `useState` but reads its initial value from `localStorage` and writes every update back to it. (Contrast with `useAtomLocalStorage`, which adds global sharing via a Jotai atom.)

**How it works, step by step:**
1. It starts as `null` (meaning "not loaded yet").
2. On mount it reads `localStorage[key]`; if a valid stored value exists it uses it, otherwise it falls back to `initialValue`.
3. `setValue` writes to `localStorage` and updates state. It throws if called before the value has loaded (while still `null`), to prevent overwriting stored data with a half-initialized value. It supports both a direct value and an updater function.

**Functions, hooks, types & exports:**
- `useLocalStorage<T>(key, initialValue)`: Generic (defaults to `string | number | boolean`). Inputs are the storage `key` and an `initialValue`. Returns `[storedValue, setValue]`, where `storedValue` is `T | null` (`null` until loaded) and `setValue` accepts a value or updater.
- `parseJSON<T>(value)` (internal): safely parses JSON, treating the literal `"undefined"` as `undefined`.

**Connections:** Imports React's `Dispatch`, `SetStateAction`, `useEffect`, `useState`. Used by components needing simple per-component persistence.

---

## `src/hooks/usePalette.ts`

**In one sentence:** Returns the active color palette for the chosen theme (with an automatically-computed readable text color on accent backgrounds), plus a ready-made "card" style helper.

**What it is & why it exists (plain English):** VoltChess supports multiple color themes. Rather than each component figuring out the current theme's colors, this hook reads the selected theme from a Jotai atom and returns the full set of colors to use. It also calculates a legible text color to place on top of the accent color (so text never becomes unreadable). A companion hook returns a reusable MUI style object for "card" surfaces.

**How it works, step by step:**
1. `usePalette` reads `colorThemeAtom`, looks up the matching palette with `getPalette`, and adds an `onAccent` color computed by `getReadableTextOn(palette.accent)`. The result is memoized so it only recomputes when the theme changes.
2. `useCardSx` builds a memoized MUI `sx` style object (background, border, rounded corners, padding, and a subtle accent-tinted hover border) derived from the palette.

**Functions, hooks, types & exports:**
- `usePalette()`: No inputs. Returns a `ColorPalette` object extended with `onAccent` (readable text color over the accent).
- `useCardSx()`: No inputs. Returns a memoized MUI style object (`sx`) for card-like surfaces, using the current palette.

**Connections:** Imports React's `useMemo`, Jotai's `useAtomValue`, MUI's `alpha`, `colorThemeAtom` from `@/theme/colorThemeAtom`, `getPalette`/`ColorPalette` from `@/theme/themes`, and `getReadableTextOn` from `@/lib/contrast`. Used broadly across UI components for theme-aware styling.

---

## `src/hooks/usePlayersData.ts`

**In one sentence:** Works out the two players' display info (name, rating, and Chess.com avatar) for a game by combining the saved-game record, the PGN headers, and a cached avatar lookup.

**What it is & why it exists (plain English):** A game's player details can come from several places: the saved-game record in the database, the PGN's header tags, or sensible defaults ("White"/"Black"). This hook merges those sources into a tidy `{ white, black }` pair. If the game is from Chess.com, it also fetches each player's avatar image (cached for an hour) so the UI can show profile pictures.

**How it works, step by step:**
1. It reads the game from the passed atom and pulls its headers.
2. For each side it picks the best available name: saved-game record → header (ignoring `?`) → default ("White"/"Black"). Ratings come from the record or the header's Elo.
3. It detects whether the game is from Chess.com (from the site header).
4. For Chess.com games with real names, it calls the internal `usePlayerAvatarUrl` to fetch the avatar via TanStack Query (cached one hour, kept for a day).
5. It returns both players with name, rating, and avatar URL.

**Functions, hooks, types & exports:**
- `usePlayersData(gameAtom)`: Input is the `PrimitiveAtom<Chess>` for the game. Returns `{ white: Player; black: Player }`, each with `name`, optional `rating`, and optional `avatarUrl`.
- `usePlayerAvatarUrl(playerName, enabled)` (internal): uses TanStack Query (`queryKey: ["CCAvatar", playerName]`) to fetch a Chess.com avatar only when `enabled`; `staleTime` 1 hour, `gcTime` 1 day. Returns the URL (or `null`/`undefined`).

**Connections:** Imports `chess.js`, Jotai, `useGameDatabase`, TanStack Query's `useQuery`, `getChessComUserAvatar` from `@/lib/chessCom`, and the `Player` type. Used by `useAnalyzeGame` and player-header components.

---

## `src/hooks/useRouter.ts`

**In one sentence:** A thin adapter that gives the rest of the app a single, Next.js-style router object on top of React Router's navigation hooks.

**What it is & why it exists (plain English):** Different routing libraries expose navigation differently. To keep the rest of the codebase consistent (and easy to migrate), this hook wraps React Router and presents a familiar interface — `push`, `replace`, `back`, `pathname`, `query`, `asPath` — similar to Next.js's `useRouter`. Components can read the current path and URL query and navigate without learning React Router's specifics.

**How it works, step by step:**
1. It pulls `navigate`, `location`, and `searchParams` from React Router.
2. It converts the URL's search parameters into a plain `query` object, collecting repeated keys into arrays.
3. It returns an object with navigation methods and current-location info.

**Functions, hooks, types & exports:**
- `Router` (exported interface): `push(url)`, `replace(url)`, `back()`, `pathname` (string), `query` (a record of string or string-array values), and `asPath` (path + search string).
- `useRouter()`: No inputs. Returns a `Router`. `push` navigates forward, `replace` navigates without adding history, `back` goes to the previous page.

**Connections:** Imports `useNavigate`/`useLocation`/`useSearchParams` from `react-router-dom`. Used pervasively, including by `useAnalysisSession` and `useGameDatabase`, for reading URL parameters and navigating.

---

## `src/hooks/useScreenSize.ts`

**In one sentence:** Tracks the live browser window size and provides helper functions that compute the ideal chessboard pixel size for the analysis and play pages across desktop and mobile layouts.

**What it is & why it exists (plain English):** The chessboard should be as large as possible while still leaving room for sidebars, panels, player bars, and navigation — and the right size differs between desktop and mobile. This hook keeps the current window width/height in state (updating on resize) and exposes math helpers that turn those numbers into a sensible board size for each page.

**How it works, step by step:**
1. `useScreenSize` initializes from `window.innerWidth`/`innerHeight` (with safe fallbacks for non-browser environments), then listens for the window `resize` event and updates state, cleaning up the listener on unmount.
2. `getAnalysisBoardSize` and `getPlayBoardSize` subtract fixed layout dimensions (sidebar width, panel width, eval-bar width, player bars, headers, padding) based on whether the screen is wide enough for a side-by-side layout, then clamp the result between a minimum and maximum.

**Functions, hooks, types & exports:**
- Exported layout constants: `MOBILE_MOVE_NAV_HEIGHT`, `ANALYSIS_PANEL_WIDTH` (400), `PLAYER_BAR_HEIGHT` (52). (Internal constants: `MOBILE_HEADER`, `EVAL_BAR_TOTAL`, `MD_BREAKPOINT` = 900.)
- `useScreenSize()`: No inputs. Returns `{ width, height }` of the window, kept current on resize.
- `getAnalysisBoardSize(screenWidth, screenHeight)`: Returns the best board pixel size for the analysis page (minimum 280 desktop / 240 mobile).
- `getPlayBoardSize(screenWidth, screenHeight)`: Returns the best board pixel size for the play page (clamped to 400 on mobile, 560 on desktop).

**Connections:** Imports React's `useEffect`/`useState` and `SIDEBAR_WIDTH` from `@/sections/layout/Sidebar`. Used by the analysis board, the play board, and related layout components.

---

## `src/contexts/AuthContext.tsx`

**In one sentence:** Provides app-wide authentication state and actions (current user, loading flag, login, logout, refresh) via a React Context, including silent token renewal so an active session rarely forces a re-login.

**What it is & why it exists (plain English):** "Authentication" is the system that knows *who* is logged in. A React **Context** is a way to make one piece of state available to the entire component tree without passing it down manually at every level. This file wraps the app in an `AuthProvider` that holds the logged-in user and exposes a `useAuth()` hook any component can call to read the user or trigger login/logout. It is careful to keep users logged in across reloads and transient network hiccups, only signing them out when the session is genuinely invalid.

**How it works, step by step:**
1. It seeds `user` from a cached value and `loading` from whether a stored session exists (only when `ENABLE_AUTHENTICATION` is on).
2. `refreshUser` proactively renews the access token (so a reload does not depend on a failed request retry), then fetches `/api/me/` to confirm the user. It only logs the user out if the session was actually invalidated — transient/CORS/offline errors keep the cached session.
3. An interval re-rotates the access token every 6 hours (well before its 12-hour lifetime) so an open tab stays logged in.
4. It listens for a global `voltchess:auth-expired` event to clear the user when the session truly expires.
5. `login` posts credentials to `/api/token/`, stores the tokens, then loads the profile. `logout` clears stored auth and the user.

**Functions, hooks, types & exports:**
- `AuthContextValue` (internal type): `user` (`User | null`), `loading` (boolean), `isAuthenticated` (boolean), `login(username, password)` (returns the `User`), `logout()`, `refreshUser()`.
- `AuthProvider({ children })`: A component that wraps the app and supplies the auth value. Input: `children` (the app). Returns the provider element.
- `useAuth()`: No inputs. Returns the `AuthContextValue`. Throws a clear error if used outside an `AuthProvider`. `isAuthenticated` is `true` only when there is a user *and* a stored session.

**Connections:** Imports `api`/`refreshAccessToken` from `@/api`, `ENABLE_AUTHENTICATION` from constants, storage helpers from `@/lib/authStorage`, and the `User` type. Used by `useGameApi`, account/login/coach/student pages, and anywhere the UI must react to login state.

---

## `src/config/apiUrl.ts`

**In one sentence:** Resolves the backend API base URL safely across local development, production, and an optional runtime override file — with guards against shipping private/local addresses in production.

**What it is & why it exists (plain English):** The front-end needs to know where the backend lives. That answer differs by environment: in local dev the URL is empty (a dev proxy forwards `/api`); in production it comes from an environment variable (`VITE_API_URL`); and it can optionally be overridden at runtime by a small `/api-config.json` file so you can repoint the API without rebuilding the whole site. This file centralizes that logic and refuses unsafe values (like a private LAN IP) in production builds.

**How it works, step by step:**
1. `resolveApiBaseUrl` reads `VITE_API_URL`; if set, it trims, normalizes (drops a trailing slash), validates it, and returns it. In dev with no value, it returns `""` (so relative `/api` requests use the dev proxy).
2. `assertSafeApiUrl` parses the URL and, in production, throws if the host is a private/local address and warns if it is plain `http`.
3. A runtime override (`runtimeApiUrl`) can be set via `setApiBaseUrl` and is preferred by `getApiBaseUrl`.
4. `loadApiConfig` fetches `/api-config.json`; if it contains a valid HTTPS `apiUrl`, it validates and applies it.

**Functions, hooks, types & exports:**
- `resolveApiBaseUrl()`: Returns the base URL from env/dev defaults (string, possibly empty).
- `getApiBaseUrl()`: Returns the runtime override if set, otherwise the resolved default. Use this at request time for the latest URL.
- `setApiBaseUrl(url)`: Sets the runtime override (normalized). Returns nothing.
- `loadApiConfig()`: async; loads and (if valid HTTPS) applies `/api-config.json`, returning the effective base URL.
- Internal helpers: `normalizeUrl` (strip trailing slash), `assertSafeApiUrl` (safety checks), and the `PRIVATE_HOST` regex.

**Connections:** Uses Vite's `import.meta.env`. `resolveApiBaseUrl` is imported by `src/constants.ts` to set `API_URL`; the API client and app bootstrap use these helpers to know where to send requests.

---

## `src/constants/engineDefaults.ts`

**In one sentence:** Defines the default chess-engine settings for in-browser analysis and for the lightweight background sync queue, plus a version number used to push new defaults to existing users.

**What it is & why it exists (plain English):** The engine has tunable settings — which engine, how deep to search, how many candidate lines, how many worker threads. This file stores sensible defaults in one place so the app starts with reasonable, low-resource settings. It also defines weaker/faster settings for background tasks where speed matters more than strength, and a "settings version" so that when defaults change, returning users get the new ones.

**How it works, step by step:** The file simply exports constant objects. The `as const` marking makes them read-only and precisely typed. The version constants let other code detect when a user's stored settings are older than the current defaults and reset them.

**Functions, hooks, types & exports:**
- `ENGINE_DEFAULTS`: foreground defaults — `engine` (`Stockfish17Lite`), `depth` (10), `multiPv` (2 lines), `workers` (1), `boardHue` (0).
- `SYNC_ANALYSIS_DEFAULTS`: background-queue settings — `engine` (`Stockfish17Lite`), `depth` (4), `multiPv` (1), `workers` (1); deliberately fastest/weakest.
- `ENGINE_SETTINGS_VERSION`: number (currently `2`); bump it to force new defaults onto existing users.
- `ENGINE_SETTINGS_VERSION_KEY`: the `localStorage` key (`"voltchess-engine-settings-v"`) where the user's settings version is stored.

**Connections:** Imports the `EngineName` enum. Imported by `src/constants.ts` (for `DEFAULT_ENGINE`), by analysis state/settings code, and by the background sync queue.

---

## `src/constants.ts`

**In one sentence:** The central grab-bag of app-wide constant values: auth token keys, the API URL, the authentication on/off flag, move-classification colors, engine labels/strength, and the available piece sets.

**What it is & why it exists (plain English):** Many fixed values are needed in lots of places — the color used for a "blunder", the human-readable name of each engine, the storage keys for tokens, whether the academy login is enabled. Putting them in one file avoids duplication and makes them easy to find and change. Nothing here runs logic; it is mostly labeled values.

**How it works, step by step:** It computes the API URL once (via `resolveApiBaseUrl`), reads the authentication flag from an environment variable (on unless explicitly `"false"`), and defines several lookup tables keyed by enum values (colors per classification, labels per engine).

**Functions, hooks, types & exports:**
- `ACCESS_TOKEN` / `REFRESH_TOKEN`: storage key strings (`"access"` / `"refresh"`) for auth tokens.
- `API_URL`: the initial resolved base URL (use `getApiBaseUrl()` for the live value at request time).
- `ENABLE_AUTHENTICATION`: boolean; `true` unless `VITE_ENABLE_AUTHENTICATION` is `"false"`.
- `CLASSIFICATION_COLORS`: a record mapping each `MoveClassification` (Opening, Forced, Splendid, Perfect, Best, Excellent, Okay, Inaccuracy, Mistake, Blunder) to a hex color.
- `DEFAULT_ENGINE`: the default engine (from `ENGINE_DEFAULTS.engine`).
- `STRONGEST_ENGINE`: `EngineName.Stockfish17`.
- `ENGINE_LABELS`: a record mapping each `EngineName` to `{ small, full, sizeMb }` for UI display (short name, full name with size, and download size in MB).
- `PIECE_SETS`: the list of available board piece sets (currently just `"maestro"`).

**Connections:** Imports `EngineName`/`MoveClassification` enums, `ENGINE_DEFAULTS`, and `resolveApiBaseUrl`. Imported very widely, including by `AuthContext`, `useGameApi`, the engine UI, and classification displays.

---

## `src/types/chessCom.ts`

**In one sentence:** Describes the shape of a chess game (and its players) as returned by the Chess.com API.

**What it is & why it exists (plain English):** When VoltChess imports a game from Chess.com, the data arrives as JSON with a specific structure. These types document that structure so the code that reads it is checked for correctness (e.g. it won't try to read a field that does not exist).

**Functions, hooks, types & exports:**
- `ChessComPlayer` (internal interface): `username` (text), `rating` (number), optional `result` (outcome text), optional `title` (e.g. "GM").
- `ChessComGame` (exported interface): `uuid`, `id`, `url`, `pgn` (game text), `white`/`black` (`ChessComPlayer`), `result`, `time_control`, `end_time` (a timestamp number), optional `eco` (opening code), optional `termination` (how the game ended).

**Connections:** No imports. Used by the Chess.com import code (`@/lib/chessCom`) and the load-game UI.

---

## `src/types/engine.ts`

**In one sentence:** Describes the low-level interfaces for talking to a chess-engine worker (a background thread) and for queuing jobs to it.

**What it is & why it exists (plain English):** Stockfish runs in a Web Worker — a separate background thread so it does not freeze the page. Communication uses the UCI protocol (text commands). These types define the contract for a worker object and for a single unit of work sent to it.

**Functions, hooks, types & exports:**
- `EngineWorker` (exported interface): `isReady` (boolean), `uci(command)` (send a UCI command), `listen(data)` (receive a message), `terminate()` (stop the worker).
- `WorkerJob` (exported interface): `commands` (the UCI commands to send), `finalMessage` (the text that signals the job is done), optional `onNewMessage(messages)` (progress callback), and `resolve(messages)` (called with the final results).

**Connections:** No imports. Used by the engine implementation classes in `@/lib/engine/*`.

---

## `src/types/enums.ts`

**In one sentence:** Defines the fixed lists of named choices used throughout analysis: game sources, engine names, move classifications, and colors.

**What it is & why it exists (plain English):** An **enum** is a fixed menu of allowed values. Using enums prevents typos (you can't write `"blundr"` where a `MoveClassification` is expected) and keeps the same labels consistent across the whole app.

**Functions, hooks, types & exports:**
- `GameOrigin`: where a game came from — `Pgn` (`"pgn"`), `ChessCom` (`"chesscom"`), `Lichess` (`"lichess"`).
- `EngineName`: the supported engines — `Stockfish17`, `Stockfish17Lite`, `Stockfish16_1`, `Stockfish16_1Lite`, `Stockfish16NNUE`, `Stockfish16`, `Stockfish11` (each maps to a string id like `"stockfish_17"`).
- `MoveClassification`: the quality labels for a move — `Blunder`, `Mistake`, `Inaccuracy`, `Okay`, `Excellent`, `Best`, `Forced`, `Opening`, `Perfect`, `Splendid`.
- `Color`: side to move — `White` (`"w"`), `Black` (`"b"`).

**Connections:** No imports. Imported very widely — by `constants.ts`, `engineDefaults.ts`, `useEngine`, the eval types, and the analysis UI.

---

## `src/types/eval.ts`

**In one sentence:** Describes every data shape involved in engine evaluation — single positions, candidate lines, accuracy, the full game report, and cached evaluations.

**What it is & why it exists (plain English):** A game "report" is rich data: each position has a best move, a classification, and several candidate lines with scores; the game as a whole has accuracy and estimated Elo per side. These types pin down all of that so the analysis code and UI agree on the exact shape of every piece.

**Functions, hooks, types & exports:**
- `PositionEval`: one position — optional `bestMove`, optional `moveClassification`, optional `opening` name, and `lines` (an array of `LineEval`).
- `LineEval`: one candidate line — `pv` (the sequence of moves), optional `cp` (centipawn score), optional `mate` (moves-to-mate), `depth` (search depth), `multiPv` (which line number this is).
- `Accuracy`: `white` and `black` accuracy percentages.
- `EstimatedElo`: estimated `white` and `black` rating performance.
- `EngineSettings`: the settings a report was produced with — `engine`, `depth`, `multiPv`, `date`.
- `GameEval`: the whole report — `positions` (array of `PositionEval`), `accuracy`, optional `estimatedElo`, and `settings`.
- `EvaluatePositionWithUpdateParams`: inputs for evaluating a single position — `fen`, optional `depth`, optional `multiPv`, optional `setPartialEval` callback for streaming partial results.
- `CurrentPosition`: the UI's current-position state — optional `lastMove`, `eval`, `lastEval`, `currentMoveIdx`, `opening`.
- `EvaluateGameParams`: inputs for evaluating a whole game — `fens`, `uciMoves`, optional `depth`, `multiPv`, `setEvaluationProgress`, `playersRatings`, and `workersNb`.
- `SavedEval`: a cached evaluation — optional `bestMove`, `lines`, and the `engine` used.
- `SavedEvals`: a lookup mapping a position (FEN string) to its `SavedEval` (or undefined).

**Connections:** Imports `Move` from `chess.js` and the `EngineName`/`MoveClassification` enums. Imported by `useAnalyzeGame`, `useGameData`, `useGameDatabase`, `game.ts`, and the engine/analysis code.

---

## `src/types/game.ts`

**In one sentence:** Describes a saved/loaded chess game, its players, and a lighter "loaded game" summary used by import lists.

**What it is & why it exists (plain English):** A game stored in the local database is more than just moves — it has player names, ratings, event details, result, and possibly an engine report. These types define that full record, the player record, and a slimmer version used when listing games to import.

**Functions, hooks, types & exports:**
- `Game`: a full saved game — `id` (number), `pgn`, optional `event`/`site`/`date`/`round`, `white`/`black` (`Player`), optional `result`, optional `eval` (`GameEval`), optional `termination`, optional `timeControl`.
- `Player`: a player — `name` (text), optional `rating`, optional `avatarUrl`, optional `title`.
- `LoadedGame`: a lighter import summary — `id` (string), `pgn`, optional `date`, `white`/`black`, optional `result`, `timeControl`, `movesNb` (move count), and `url`.

**Connections:** Imports `GameEval` from `./eval`. Imported by `useChessActions`, `useGameDatabase`, `usePlayersData`, `useAnalysisSession`, and import/database UI.

---

## `src/types/lichess.ts`

**In one sentence:** Describes the shapes of Lichess API responses — cloud evaluations, error bodies, and full game data — that VoltChess consumes.

**What it is & why it exists (plain English):** VoltChess can fetch positions' cloud evaluations and full games from Lichess. Those responses have specific JSON structures (and a specific error format). These types document them so the import/evaluation code reads them safely.

**Functions, hooks, types & exports:**
- `LichessErrorBody`: `{ error }` where `error` is text or a `LichessError`.
- `LichessEvalBody`: a cloud evaluation — `depth` and `pvs` (an array of `{ moves, cp?, mate? }`).
- `LichessResponse<T>`: a helper meaning "either the data `T` or an error body".
- `LichessError` (enum): known errors, currently `NotFound` ("No cloud evaluation available for that position").
- `LichessPlayer` (internal): `{ user: { name, title? }, rating }`.
- `LichessClock` (internal): `initial`, `increment`, `totalTime`.
- `LichessGame`: a full game — `id`, `createdAt`, `lastMoveAt`, `status`, `players` (white/black), optional `winner`, `moves`, `pgn`, `clock`, optional `url`.

**Connections:** No imports. Used by the Lichess import/evaluation code and the load-game UI.

---

## `src/types/user.ts`

**In one sentence:** Defines the user account shape, the set of user roles, and human-readable labels for each role.

**What it is & why it exists (plain English):** The academy side of VoltChess has accounts with roles (admin, coach, student). This file describes what a user record looks like, lists the valid roles, and provides display names for them.

**Functions, hooks, types & exports:**
- `UserRole` (enum): `Admin` (`"admin"`), `Coach` (`"coach"`), `Student` (`"student"`).
- `User` (type): `id`, `username`, `email`, `role` (`UserRole`), `first_name`, `last_name`.
- `USER_ROLE_LABELS`: a record mapping each role to its display label ("Admin", "Coach", "Student").

**Connections:** No imports. Used by `AuthContext` and the academy/coach/student/account UI.

---

## `src/data/blogPosts.ts`

**In one sentence:** Holds the full content of the marketing/SEO blog as in-code data, plus helpers to look posts up by slug.

**What it is & why it exists (plain English):** Instead of a separate CMS, VoltChess keeps its blog articles directly in the codebase as structured data. Each post has SEO metadata (title, description, keywords) and a series of sections with headings and paragraphs. The blog pages render these objects, and helper functions fetch a post by its URL slug or list all slugs (useful for generating pages).

**Functions, hooks, types & exports:**
- `BlogSection` (interface): an optional `heading` and an array of `paragraphs`.
- `BlogPost` (interface): `slug` (URL id), `title`, `metaTitle`, `metaDescription`, `keywords`, `publishedAt` (date string), `excerpt`, and `sections` (array of `BlogSection`).
- `BLOG_POSTS`: the array of all blog posts (currently nine articles about free chess analysis, game review, etc.).
- `getBlogPost(slug)`: returns the matching `BlogPost` or `undefined`.
- `getAllBlogSlugs()`: returns an array of every post's slug.

**Connections:** No imports. Used by the blog pages (`src/pages/blog/index.tsx`, `src/pages/blog/post.tsx`) and the `BlogArticle` section.

---

## `src/data/openings.ts`

**In one sentence:** A large lookup table mapping chess opening names to the board position (FEN) that defines them, used to label which opening a game is playing.

**What it is & why it exists (plain English):** Chess has thousands of named openings, each identified by a specific sequence of moves (and therefore a specific board position). This file is a big, generated list pairing each opening's name with its position. The analysis code matches the current position against this list to display the opening's name (e.g. "Sicilian Defense"). It is by far the largest file here (~13,600 lines, around 3,400 openings) because it is essentially a reference database.

**Functions, hooks, types & exports:**
- `openings`: an array of objects, each `{ name, fen }` — where `name` is the opening's human-readable name and `fen` is the position (in FEN notation, board layout only) that identifies it.

**Connections:** No imports. Used by opening-detection logic (`@/lib/engine/helpers/moveClassification.ts`), the openings page (`src/pages/openings.tsx`), and `useCurrentPosition`.

---

## `src/data/seo.ts`

**In one sentence:** Defines the site's canonical URL and the default SEO metadata (title, description, keywords) used as fallbacks for page `<head>` tags.

**What it is & why it exists (plain English):** "SEO metadata" is the information search engines and social-media previews read about a page — its title, a short description, and keywords. This file stores the site-wide defaults so every page has sensible metadata unless it overrides them.

**Functions, hooks, types & exports:**
- `SITE_URL`: the canonical site address (from `VITE_SITE_URL`, default `"https://voltchess.vercel.app"`).
- `SITE_HOST`: hostname derived from `SITE_URL`.
- `LEGACY_SITE_HOSTS`: former hosts (e.g. `voltchess.me`) kept for PGN compatibility.
- `DEFAULT_SEO`: the default `{ title, description, keywords }`, where `keywords` is a comma-joined list of search terms. Marked `as const` (read-only).

**Connections:** No imports. Used by the page-title/SEO component (`src/components/pageTitle.tsx`) and app bootstrap (`src/App.tsx`).

---

## Summary

This document covered the VoltChess front-end's hooks, contexts, configuration, constants, type definitions, and bundled data — the supporting layer beneath the visible UI. The hooks encapsulate reusable behavior (engine control, persistence, routing, sizing, players, theming), the context manages login state, the config/constants centralize environment and fixed values, the types guarantee data shapes, and the data files supply blog, opening, and SEO content.
