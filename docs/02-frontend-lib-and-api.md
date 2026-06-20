# VoltChess Frontend — Core Logic Library (`src/lib`) & API Client

This document is an exhaustive, beginner-friendly tour of every file that lives **directly** inside the VoltChess frontend's core logic folder `src/lib/` (the `.ts` files at the top level) and inside its typed API client folder `src/lib/api/`. For each file you'll find a one-sentence summary, a plain-English explanation of why it exists, a step-by-step walk-through of how it works, a breakdown of every exported function/constant/type, and a note on how the file connects to the rest of the app. The chess engine code under `src/lib/engine/` is intentionally **not** covered here — it has its own document.

## What is `src/lib`?

`src/lib` is the home of **framework-agnostic logic**: pure helper functions and the typed API client layer, with **no UI** (no React components, no JSX). Think of it as the "brains" that the visible parts of the app call into. Because nothing here renders pixels, these files are small, focused, and easy to reason about. Some files talk to the browser's storage or to external servers (Chess.com, Lichess, Firebase, the VoltChess backend), but they never draw anything on screen themselves.

A few terms used throughout, explained once here:

- **`localStorage`** is a small storage box built into the browser that remembers data (as text) between visits, even after you close the tab.
- **An *axios instance*** is a pre-configured tool for sending requests to a server (e.g. "GET this URL", "POST this data"). VoltChess has one shared instance in `src/api.tsx` (imported as `@/api`) that automatically attaches the user's login token and retries when the token expires.
- **A *promise*** is a placeholder for a value that will arrive later (because it depends on a network call or a timer). `async`/`await` is the syntax for waiting on promises.
- **A *FEN*** is a short text string describing one chess position. A **PGN** is a longer text format describing a whole game (moves + metadata). A **UCI move** is a compact move format like `e2e4` (from-square + to-square + optional promotion piece).
- **An *eval* (evaluation)** is the chess engine's numeric opinion about a position, usually in *centipawns* (hundredths of a pawn) or as "mate in N".

## Table of contents

**Top-level `src/lib/` files**

- [`src/lib/analysisStatus.ts`](#srclibanalysisstatusts)
- [`src/lib/apiErrors.ts`](#srclibapierrorsts)
- [`src/lib/auth.ts`](#srclibauthts)
- [`src/lib/authStorage.ts`](#srclibauthstoragets)
- [`src/lib/chess.ts`](#srclibchessts)
- [`src/lib/chessCom.ts`](#srclibchesscomts)
- [`src/lib/contrast.ts`](#srclibcontrastts)
- [`src/lib/evalLead.ts`](#srclibevalleadts)
- [`src/lib/firebase.ts`](#srclibfirebasets)
- [`src/lib/gameSync.ts`](#srclibgamesyncts)
- [`src/lib/helpers.ts`](#srclibhelpersts)
- [`src/lib/lichess.ts`](#srcliblichessts)
- [`src/lib/math.ts`](#srclibmathts)
- [`src/lib/positionDominance.ts`](#srclibpositiondominancets)
- [`src/lib/sentry.ts`](#srclibsentryts)
- [`src/lib/sounds.ts`](#srclibsoundsts)
- [`src/lib/syncEngineSettingsDefaults.ts`](#srclibsyncenginesettingsdefaultsts)

**API client `src/lib/api/` files**

- [`src/lib/api/index.ts`](#srclibapiindexts)
- [`src/lib/api/academies.ts`](#srclibapiacademiests)
- [`src/lib/api/annotations.ts`](#srclibapiannotationsts)
- [`src/lib/api/assignments.ts`](#srclibapiassignmentsts)
- [`src/lib/api/classrooms.ts`](#srclibapiclassroomsts)
- [`src/lib/api/coaching.ts`](#srclibapicoachingts)
- [`src/lib/api/games.ts`](#srclibapigamests)
- [`src/lib/api/sync.ts`](#srclibapisyncts)

---

## `src/lib/analysisStatus.ts`

**In one sentence:** Turns a synced game's analysis state into a human-readable label and a colored UI "chip" color.

**What it is & why it exists (plain English):** When VoltChess analyzes your games on the server, each game moves through stages: waiting in line, being analyzed, finished, or failed. This tiny file is the single source of truth for how those stages are *named* and *colored* in the interface, so every screen shows the same wording ("Analyzing", "Report ready", etc.) instead of each page inventing its own. It contains no logic beyond mapping a state to text and a color — it's "UI only" in the sense that it decides display strings, not behavior.

**How it works, step by step:** It defines the set of possible status values as a type, then defines a small shape (`GameAnalysisFields`) describing the two pieces of data it needs: whether the game already has an evaluation (`has_eval`) and its current `analysis_status`. The two functions check these fields in priority order and return the right label/color.

**Functions & exports:**

- **`AnalysisStatusValue`** (type): the allowed status strings — `"pending"`, `"in_progress"`, `"complete"`, `"failed"`, or `undefined` (not set yet).
- **`GameAnalysisFields`** (type): the minimal object a status helper needs — `has_eval: boolean` and optional `analysis_status`.
- **`gameAnalysisLabel(game)`**: *Input:* an object with the analysis fields. *Output:* a string. *Logic:* if the game has an eval, return `"Report ready"`; otherwise if it failed, `"Retry queued"`; if it's in progress, `"Analyzing"`; otherwise `"Not analyzed"`.
- **`gameAnalysisChipColor(game)`**: *Input:* the same object. *Output:* one of `"success" | "warning" | "error" | "default"`. *Logic:* `success` if it has an eval, `error` if failed, `warning` if in progress, otherwise `default`. These map onto the design system's chip colors.

**Connections:** It imports nothing. It's consumed by UI components/pages that list synced games (game tables, dashboards) to render status badges.

---

## `src/lib/apiErrors.ts`

**In one sentence:** Converts any error thrown by an API call into a friendly, specific message to show the user.

**What it is & why it exists (plain English):** Network requests fail in many confusing ways — server offline, wrong URL, validation problems, bad password. Raw error objects are unreadable to a normal user. This file centralizes the translation from "ugly technical error" to "clear sentence you can act on", so error messages are consistent everywhere.

**How it works, step by step:** It inspects the error in layers. First it checks whether the error came from axios at all; if not, it returns a generic apology. If axios produced no server response (a connectivity problem), it diagnoses likely causes — an HTTPS page trying to reach an HTTP API, a missing API URL, or a generally unreachable server. If there *is* a response, it digs into the response body for a `detail` message or per-field validation errors, special-cases HTTP 401 (unauthorized) as a login problem, and finally falls back to reporting the raw status code.

**Functions & exports:**

- **`getApiErrorMessage(err)`**: *Input:* `err` of unknown type (whatever was caught). *Output:* a user-facing string. *Logic, in order:* (1) If `isAxiosError(err)` is false → `"Something went wrong. Please try again."` (2) If there's no `err.response`, look at the configured base URL (`err.config?.baseURL` or `getApiBaseUrl()`): if the page is HTTPS but the API is HTTP, warn about the protocol mismatch; if there's no URL, tell the user to set `VITE_API_URL`; otherwise say the server may be offline. (3) If the response body is an object with a string `detail`, return it; else collect array-valued fields into `"field: msg1, msg2"` pairs joined by `;`. (4) If the status is 401, return `"Invalid username or password."` (5) Otherwise return `Request failed (<status>).`

**Connections:** Imports `isAxiosError` from `axios` and `getApiBaseUrl` from `@/config/apiUrl`. Used by forms and pages (login, uploads, coaching screens) inside `catch` blocks to display readable errors.

---

## `src/lib/auth.ts`

**In one sentence:** Decides which home page a signed-in user should land on based on their role.

**What it is & why it exists (plain English):** Different kinds of users (students vs. coaches/admins) belong on different home screens after logging in. Two separate places need this decision — the login handler and the "guest-only" route guard — and if they disagreed, a user could be bounced back and forth. Putting the rule in one function guarantees both agree.

**How it works, step by step:** It receives the user's role and returns a route path string. Students go to `/student`; coaches and admins go to `/coach`; anyone else (or unknown) goes to the site root `/`.

**Functions & exports:**

- **`landingForRole(role)`**: *Input:* a `UserRole` value or `undefined`. *Output:* a route path string. *Logic:* `Student` → `"/student"`; `Coach` or `Admin` → `"/coach"`; otherwise → `"/"`.

**Connections:** Imports the `UserRole` enum from `@/types/user`. Used by the login flow and the `GuestRoute` component for post-authentication redirects.

---

## `src/lib/authStorage.ts`

**In one sentence:** Reads, writes, and clears the user's login tokens and cached profile in the browser's `localStorage`.

**What it is & why it exists (plain English):** To stay logged in across page reloads, the app saves two security tokens (a short-lived *access* token and a longer-lived *refresh* token) plus a copy of the user's profile in `localStorage`. This file is the only place that knows the storage keys and handles edge cases like server-side rendering (where `window` doesn't exist) and corrupted data, so the rest of the app never touches `localStorage` for auth directly.

**How it works, step by step:** Each getter guards against `window` being undefined (returns `null` in that case) before reading. Setters write the values. Clearing removes all three keys and also fires a custom browser event (`voltchess:auth-expired`) so other parts of the app can react (e.g. redirect to login). The cached-user reader safely parses JSON and self-heals by deleting the entry if it's unparseable.

**Functions & exports:**

- **`getAccessToken()`** → the access token string or `null`.
- **`getRefreshToken()`** → the refresh token string or `null`.
- **`hasStoredSession()`** → `true` if either token exists (i.e. the user might be logged in).
- **`setTokens(access, refresh)`**: saves both tokens. *Inputs:* two strings. *Output:* none.
- **`clearAuthStorage()`**: removes both tokens **and** the cached user, then dispatches the `voltchess:auth-expired` window event. *Output:* none.
- **`readCachedUser()`** → the previously cached `User` object, or `null`; if the stored JSON is invalid it deletes it and returns `null`.
- **`writeCachedUser(user)`**: stores the given `User` object as JSON under the cache key. *Output:* none.

**Connections:** Imports the `ACCESS_TOKEN` / `REFRESH_TOKEN` key names from `@/constants` and the `User` type from `@/types/user`. Used heavily by the shared axios instance (`src/api.tsx`) for attaching/refreshing tokens, and by `AuthContext` for session state.

---

## `src/lib/chess.ts`

**In one sentence:** A toolbox of pure chess helpers built on the `chess.js` library — converting between formats, setting PGN headers, computing material, detecting sacrifices, and formatting evaluations.

**What it is & why it exists (plain English):** VoltChess constantly needs to manipulate chess data: turn a PGN into a playable game, turn a game into something the database understands, fix up move notation, count material, and label engine scores. Rather than scatter this logic, it lives here as small reusable functions. `chess.js` is a third-party library that knows the rules of chess; these helpers wrap it for VoltChess's specific needs. It's one of the larger files because chess has many small rules.

**How it works, step by step:** Most functions create a fresh `chess.js` `Chess` object from a FEN or PGN, ask it questions (legal moves, material, checkmate, etc.), and return formatted results. A few mutate a passed-in game by setting PGN headers. The sacrifice detector simulates a sequence of moves and compares material before and after.

**Functions & exports:**

- **`getEvaluateGameParams(game)`**: *Input:* a `Chess` game. *Output:* `{ fens, uciMoves }` — the list of FEN positions before each move (plus the final position) and the list of UCI moves. Used to feed the engine a whole game.
- **`getGameFromPgn(pgn)`**: *Input:* a PGN string. *Output:* a loaded `Chess` game object.
- **`formatGameToDatabase(game)`**: *Input:* a `Chess` game. *Output:* a database-shaped game object (without `id`) built from the PGN headers — players (name/rating from `WhiteElo`/`BlackElo`), event, site, date, result, termination, time control. Defaults like `"White"`/`"Black"` and round `"?"` fill blanks.
- **`getGameToSave(game, board)`**: *Inputs:* the recorded `game` and the live `board`. *Output:* a `Chess` to persist — returns `game` if it has moves, else stamps headers onto `board`.
- **`setGameHeaders(game, params?)`**: *Inputs:* a `Chess` and optional `{ white, black, resigned }`. *Output:* the same game with standard headers set (Event, Site, today's Date) plus player names/Elos. If `resigned` is given, it sets the Result and a "won by resignation" Termination. If the game is over it also records checkmate, insufficient material, stalemate, or threefold-repetition outcomes.
- **`moveLineUciToSan(fen)`**: *Input:* a starting FEN. *Output:* a function that takes a UCI move and returns its SAN (standard algebraic, e.g. `Nf3`) form, advancing an internal game each call; on illegal moves it returns the original UCI.
- **`getEvaluationBarValue(position)`**: *Input:* a `PositionEval`. *Output:* `{ whiteBarPercentage, label }` for the evaluation bar — `whiteBarPercentage` from `getPositionWinPercentage`, and a label that's `M<n>` for mate or the centipawn score in pawns (shortened to whole numbers when too long).
- **`getIsStalemate(fen)`** → `true` if the FEN is a stalemate.
- **`getWhoIsCheckmated(fen)`** → `"w"`/`"b"` (the side to move, which is the checkmated side) or `null` if not checkmate.
- **`uciMoveParams(uciMove)`** → splits a UCI string into `{ from, to, promotion? }`.
- **`isSimplePieceRecapture(fen, [uci1, uci2])`** → `true` if both moves target the same square and a piece was there to recapture.
- **`getIsPieceSacrifice(fen, playedMove, bestLinePvToPlay)`**: simulates the played move plus the engine's best line, tallies captured pieces per side, cancels out matching trades, ignores pure equal-pawn trades, then compares ending vs. starting material from the mover's perspective; returns `true` if the mover ends up materially down (a sacrifice).
- **`getMaterialDifference(fen)`** → the white-minus-black material count using piece values (pawn 1, knight/bishop 3, rook 5, queen 9).
- **`isCheck(fen)`** → `true` if the side to move is in check.
- **`getCapturedPieces(fen, color)`**: *Inputs:* a FEN and a `Color`. *Output:* a list of `{ piece, count }` showing how many of each piece type the given color has lost, by comparing the full starting set to what's still on the board; piece letters are mapped to board-image symbols (e.g. `bP`).
- **`getLineEvalLabel(line)`**: *Input:* `{ cp, mate }`. *Output:* a signed label like `+1.25` (centipawns/100) or `+M3`/`-M3` for mate, else `"?"`.
- **`formatUciPv(fen, uciMoves)`**: rewrites king-castling moves from the engine's "king-takes-rook" style (`e1h1`) into standard castling (`e1g1`), tracking remaining castling rights so it only does it once per side.

Two internal (non-exported) helpers — `getPieceValue` and the `pieceFenToSymbol` map — support the material and captured-piece functions.

**Connections:** Imports types from `@/types/eval`, `@/types/game`, `@/types/enums`, the `Chess`/`PieceSymbol`/`Square` types from `chess.js`, `getPositionWinPercentage` from the engine helpers, and a `Piece` type from `react-chessboard`. Used widely: by `lichess.ts` (`formatUciPv`), `gameSync.ts` (`formatGameToDatabase`), the analysis board, and report screens.

---

## `src/lib/chessCom.ts`

**In one sentence:** Fetches a Chess.com user's recent games (and avatar) from Chess.com's public API and reshapes them into VoltChess's game format.

**What it is & why it exists (plain English):** Users want to import and analyze games they played on Chess.com. Chess.com offers a free public API organized by month. This file calls that API, gathers enough recent games, and normalizes each one into the app's `LoadedGame` shape so the rest of VoltChess doesn't care where the game came from.

**How it works, step by step:** It computes the current year/month, requests that month's games, and — if fewer than 50 are found — also pulls the previous month (rolling the year back if needed). It tolerates the "Date cannot be set in the future" message but throws on other HTTP errors. Then it keeps only games that have a PGN and end time, sorts newest-first, takes the top 50, and maps each through a formatter that extracts result, players, time control, and date.

**Functions & exports:**

- **`getChessComUserRecentGames(username, signal?)`**: *Inputs:* a Chess.com `username` and an optional `AbortSignal` (to cancel the request). *Output:* a promise of up to 50 `LoadedGame` objects, newest first. *Logic:* as described above (current month, optionally previous month, filter/sort/slice/format).
- **`getChessComUserAvatar(username)`**: *Input:* a username. *Output:* a promise of the avatar URL string, or `null` if none. Trims/lowercases and URL-encodes the username before requesting the player profile.

Two internal helpers: `formatChessComGame` (maps a raw `ChessComGame` to `LoadedGame`, deriving result and move count via regex on the PGN) and `getGameTimeControl` (turns Chess.com's `"seconds+increment"` string into a readable label like `5m+3` or `1h30m`).

**Connections:** Imports the `ChessComGame` type from `@/types/chessCom`, `getPaddedNumber` from `./helpers`, and `LoadedGame` from `@/types/game`. Used by the game-import UI (e.g. the "load games from Chess.com" feature).

---

## `src/lib/contrast.ts`

**In one sentence:** Picks a readable light or dark text color for a given solid background color.

**What it is & why it exists (plain English):** When the UI lets users pick custom colors (e.g. a board hue or a tag color), text on top of that color must stay legible. This file computes how bright a background is and chooses near-black or near-white text accordingly, following web accessibility math.

**How it works, step by step:** An internal `luminance` function converts a `#rrggbb` hex color into its relative brightness (0 = black, 1 = white) using the standard sRGB formula (gamma-correcting each channel, then weighting red/green/blue). The exported function compares that brightness to a threshold and returns the appropriate text color.

**Functions & exports:**

- **`getReadableTextOn(bgHex)`**: *Input:* a hex color string like `"#3366cc"`. *Output:* `"#0d0d0d"` (near-black) if the background is bright (luminance > 0.45), otherwise `"#f5f5f5"` (near-white).
- *Internal:* `luminance(hex)` — returns `0.5` if the hex isn't 6 digits, otherwise the computed relative luminance.

**Connections:** Imports nothing. Used by UI components that render text over user-chosen background colors (badges, tags, color pickers).

---

## `src/lib/evalLead.ts`

**In one sentence:** Computes per-player "who was ahead" statistics across a whole game from its engine evaluations.

**What it is & why it exists (plain English):** Beyond a single accuracy number, players like to know storylines: what share of the game each side was winning, their best moment, their longest winning streak, and how many comebacks they staged. This file crunches the move-by-move evaluations into those narrative stats for both colors.

**How it works, step by step:** It converts each position's evaluation into a win percentage (from the engine helper), then re-frames it from each player's point of view. For each player it counts how many moves they were ahead (>50% win chance), tracks the peak win %, finds the longest consecutive run above 50%, and counts "comebacks" (dipping below 45% then climbing above 55%). Finally it turns "moves ahead" into a percentage *lead share*, splitting equal positions evenly so the two players' shares add to 100.

**Functions & exports:**

- **`PlayerEvalLead`** (interface): `leadShare` (0–100, both sum to 100), `peakAdvantage` (highest win % while ahead), `longestRun` (longest streak >50%), `comebacks` (count).
- **`computeEvalLead(positions)`**: *Input:* an array of `PositionEval`. *Output:* `{ white, black }`, each a `PlayerEvalLead`. *Logic:* if fewer than 2 positions, returns a neutral 50/50 default; otherwise builds both players' profiles, computes equal-move count, and derives each side's lead share.
- *Internal helpers:* `playerWinPct` (flip white's win % for black), `longestRunAbove` (longest streak over a threshold), `countComebacks` (the <45%→>55% rule), and `buildProfile` (gathers a player's raw stats plus `aheadMoves`).

**Connections:** Imports `getPositionWinPercentage` from the engine helpers and `PositionEval` from `@/types/eval`. Used by game-report/insight UI that visualizes the eval story.

---

## `src/lib/firebase.ts`

**In one sentence:** Optionally initializes Firebase Analytics and exposes a safe helper to log analytics events.

**What it is & why it exists (plain English):** VoltChess can send anonymous usage events (e.g. "user analyzed a game") to Google's Firebase Analytics to understand how the product is used. Because analytics should be optional and must never break the app, this file only initializes Firebase if the config environment variables are present, only runs in supported environments, and skips logging entirely on `localhost`.

**How it works, step by step:** It reads Firebase settings from Vite environment variables (`import.meta.env.VITE_FIREBASE_*`). If a project ID is set, it builds the config object and initializes the Firebase app; otherwise it stays `undefined`. It then asks Firebase whether analytics is supported in this browser and, if so, sets it up. The exported logger double-checks support and the app's existence before sending anything.

**Functions & exports:**

- **`logAnalyticsEvent(eventName, eventParams?)`**: *Inputs:* an event name string and optional parameters object. *Output:* a promise (resolves with nothing). *Logic:* returns immediately on `localhost`; otherwise checks `isSupported()` and that the app exists, then calls Firebase's `logEvent`.

**Connections:** Imports from `firebase/app` and `firebase/analytics`, plus Vite env vars. Used across the app wherever usage events are tracked.

---

## `src/lib/gameSync.ts`

**In one sentence:** Bridges locally-stored games and the VoltChess backend — creating server records, uploading evaluations, mapping local↔server IDs, and migrating old local games to the cloud.

**What it is & why it exists (plain English):** Originally VoltChess stored games only in the browser (in IndexedDB, a larger browser database). With accounts, games and their analysis should live on the server too. This file keeps the two worlds in sync: it remembers which local game corresponds to which server game, pushes new games and evals up, and performs a one-time bulk migration of a user's old local library. All of it is a no-op when authentication is disabled.

**How it works, step by step:** It keeps a `localId → serverId` map in `localStorage` (read/written as JSON) plus a "migration done" flag. "Ensure on server" looks up an existing server ID for a local game, or creates one via the API. "Sync eval" uploads an evaluation to a known server game. The combined "sync analysis result" resolves the server ID (from argument, map, or by creating) then uploads. Migration opens the IndexedDB `games` store, converts each game's PGN into the server payload (attaching its eval if present), bulk-uploads them, records the returned IDs into the map, and marks migration complete.

**Functions & exports:**

- **`isServerGameId(id)`** → `true` if `id` looks like a UUID (server IDs are UUIDs; local IDs are numbers).
- **`getServerIdForLocal(localId)`** / **`setServerIdForLocal(localId, serverId)`** → read/write one entry in the ID map.
- **`hasMigratedLocalGames()`** / **`markLocalGamesMigrated()`** → read/set the one-time migration flag.
- **`ensureGameOnServer(chess, localId?)`**: *Output:* a promise of the server ID (or `undefined` if auth disabled). Reuses a mapped ID or creates a new server game and stores the mapping.
- **`syncEvalToServer(serverId, evalData)`**: uploads a `GameEval` to the given server game (converted to the server's snake_case eval payload).
- **`syncAnalysisResult(chess, evalData, localId?, serverId?)`**: resolves/creates the server ID then uploads the eval; returns the ID.
- **`migrateLocalGamesToServer()`**: *Output:* a promise of the number of games migrated. Bulk-uploads all IndexedDB games, records mappings, marks done; returns 0 (and marks done) when there are no local games.
- **`serverGameToSession(game)`**: converts a `ServerGameDetail` (snake_case) into the session shape the app uses (camelCase eval fields, players, PGN, `serverId`).
- *Internal helpers:* `readMap`/`writeMap` (the ID map), `gamePayloadFromChess` (PGN→server payload, source `"upload"`), and `evalPayload` (camelCase→snake_case eval).

**Connections:** Imports `Chess` from `chess.js`, `openDB` from `idb`, `ENABLE_AUTHENTICATION` from `@/constants`, `formatGameToDatabase` from `@/lib/chess`, and several functions/types from `@/lib/api/games`, plus eval/game types. Used by the analysis flow and the post-login migration step.

---

## `src/lib/helpers.ts`

**In one sentence:** A grab-bag of tiny, general-purpose utility functions used across the app.

**What it is & why it exists (plain English):** Every codebase accumulates small reusable snippets that don't belong to any one feature — padding a number, capitalizing a word, pausing for a moment. Collecting them here avoids re-writing them everywhere.

**How it works, step by step:** Each function is a one-liner doing exactly what its name says.

**Functions & exports:**

- **`getPaddedNumber(month)`**: *Input:* a number. *Output:* the number as-is, or a string with a leading `0` if it's below 10 (e.g. `3` → `"03"`). Used for month/time formatting.
- **`capitalize(s)`**: *Input:* a string. *Output:* the same string with its first letter uppercased.
- **`isInViewport(element)`**: *Input:* an HTML element. *Output:* `true` if the element is fully within the visible vertical area of the window.
- **`sleep(ms)`**: *Input:* milliseconds. *Output:* a promise that resolves after that delay (for `await`-ing a pause).
- **`decodeBase64(encoded)`**: *Input:* a base64 string or `null`. *Output:* the decoded text, or `null` on empty input or a decode error (errors are logged).

**Connections:** Imports nothing. Used broadly — e.g. `getPaddedNumber` by `chessCom.ts`, and the others by various components and flows.

---

## `src/lib/lichess.ts`

**In one sentence:** Fetches positions evaluations from Lichess's cloud-eval API and a user's recent games from Lichess, formatting both for VoltChess.

**What it is & why it exists (plain English):** Lichess offers two useful free services: a *cloud evaluation* (a precomputed engine opinion for common positions) and a public games export. This file calls both — using the cloud eval as a fast shortcut before running the in-browser engine, and importing Lichess games like the Chess.com importer does.

**How it works, step by step:** For evaluations it calls the cloud-eval endpoint with a short 200ms timeout (so a slow/missing answer doesn't stall analysis), handles "not found" by returning an empty eval, maps each principal variation into VoltChess's `LineEval` (fixing castling notation via `formatUciPv`), sorts the lines and reverses them when it's black to move so the best line is first, and returns the best move plus the requested number of lines. Any failure is logged to Sentry and returns an empty result. For games it requests up to 50 recent games as newline-delimited JSON (ndjson), parses each line, and formats them.

**Functions & exports:**

- **`getLichessEval(fen, multiPv = 1)`**: *Inputs:* a FEN and how many lines (`multiPv`) to return. *Output:* a promise of a `PositionEval` (`{ bestMove, lines }`); empty on not-found or error.
- **`getLichessUserRecentGames(username, signal?)`**: *Inputs:* a username and optional `AbortSignal`. *Output:* a promise of `LoadedGame[]` (up to 50). Throws on HTTP errors ≥ 400.
- *Internal helpers:* `fetchLichessEval` (the raw cloud-eval request with the 200ms timeout, returning a not-found error on failure), `formatLichessGame` (maps a `LichessGame` to `LoadedGame`), and `getGameResult` (derives `"1/2-1/2"`, `"1-0"`, `"0-1"`, or `"*"`).

**Connections:** Imports eval/game/lichess types, `sortLines` from the engine helpers, `logErrorToSentry` from `./sentry`, and `formatUciPv` from `./chess`. Used by the analysis engine flow (cloud-eval shortcut) and the Lichess game importer.

---

## `src/lib/math.ts`

**In one sentence:** Small numeric utilities: clamping and several kinds of averages.

**What it is & why it exists (plain English):** Computing accuracy and other stats needs specific math — keeping a value within bounds and computing means that weight values differently. These reusable formulas live here.

**How it works, step by step:** Each function is a standard mathematical formula implemented directly over arrays of numbers.

**Functions & exports:**

- **`ceilsNumber(number, min, max)`**: *Inputs:* a value and a range. *Output:* the value clamped into `[min, max]` (despite the name, it clamps both ends).
- **`getHarmonicMean(array)`**: *Input:* numbers. *Output:* their harmonic mean (count divided by the sum of reciprocals) — useful when averaging rates.
- **`getStandardDeviation(array)`**: *Input:* numbers. *Output:* the population standard deviation (spread around the mean).
- **`getWeightedMean(array, weights)`**: *Inputs:* values and per-value weights. *Output:* the weighted average; **throws** if there are more values than weights.

**Connections:** Imports nothing. Used by accuracy/statistics calculations (e.g. in the engine's accuracy helpers and report math).

---

## `src/lib/positionDominance.ts`

**In one sentence:** Computes a rich per-player "dominance profile" of a game — control, swings, recoveries, peaks, worst leaks, critical errors, and phase-by-phase quality.

**What it is & why it exists (plain English):** This is the deepest game-analysis summary in `lib`. It turns the move-by-move evaluations into a many-faceted scorecard for each color: how much of the game they controlled, how steady they were, whether they bounced back from mistakes, their best and worst moments, and how they did in the opening, middlegame, and endgame. These feed advanced insight visualizations.

**How it works, step by step:** For each player it walks only that player's moves, converting before/after positions to win percentages from the player's perspective. It records win% after each move, the swing (after − before), control moves (win% ≥ 55), the peak win%, and the worst "leak" (largest drop). It buckets each move into a phase by ply (opening ≤12, middlegame ≤35, endgame after). It counts critical errors using each position's `moveClassification` (mistakes/blunders). For "recoveries" it finds big leaks (≥8 points) and checks whether the player climbs back near the prior level within their next two moves. It then blends these into a single weighted `qualityRaw` score per player and per phase. Finally `normalizeShare` converts each pair of raw scores into 0–100 shares that sum to 100 (overall *dominance share* and per-phase *phase share*).

**Functions & exports:**

- **`PhaseId`** (type): `"opening" | "middlegame" | "endgame"`.
- **`PhaseStats`** (interface): `moves`, `avgWinPct`, and `phaseShare` for one phase.
- **`PlayerDominanceProfile`** (interface): the full scorecard — `dominanceShare`, `controlShare`, `avgWinPct`, `avgMoveSwing`, `recoveryRate`, `peakWinPct`, `worstLeakMoveIdx`, `worstLeakPct`, per-phase `phases`, and `criticalErrors` (see inline comments for exact meaning of each).
- **`computePositionDominance(positions)`**: *Input:* an array of `PositionEval`. *Output:* `{ white, black }`, each a `PlayerDominanceProfile`. *Logic:* builds both raw profiles, normalizes overall dominance and each phase's share, and assembles the final objects.
- *Internal helpers:* `phaseForPly`, `playerWinPct`, `clamp`, `buildProfile` (the heavy per-player computation including the weighted `qualityRaw`), and `normalizeShare` (turns two raw numbers into 0–100 shares, defaulting to 50/50 when both are zero).

**Connections:** Imports `getPositionWinPercentage` from the engine helpers, `PositionEval` from `@/types/eval`, and `MoveClassification` from `@/types/enums`. Used by advanced game-insight UI/charts.

---

## `src/lib/sentry.ts`

**In one sentence:** A thin wrapper for reporting errors to Sentry, falling back to the console when Sentry is off.

**What it is & why it exists (plain English):** Sentry is an error-monitoring service that collects crashes so developers can fix them. This file centralizes "report this error" so callers don't have to check whether Sentry is configured — if it's enabled, the error goes to Sentry with optional context; if not, it just logs to the browser console.

**How it works, step by step:** `isSentryEnabled` checks both that a Sentry DSN env var exists and that the Sentry SDK has actually initialized. `logErrorToSentry` branches on that: capture to Sentry (attaching the `context` as `extra` data) or `console.error`.

**Functions & exports:**

- **`isSentryEnabled()`** → `true` if `VITE_SENTRY_DSN` is set and Sentry is initialized.
- **`logErrorToSentry(error, context?)`**: *Inputs:* any caught error and an optional context object. *Output:* none. Sends to Sentry (with `extra: context`) when enabled, else logs to the console.

**Connections:** Imports `@sentry/react`. Used by error-prone async code such as `lichess.ts` and anywhere robust error reporting is needed.

---

## `src/lib/sounds.ts`

**In one sentence:** Plays short move/capture/error sound effects via the Web Audio API, with caching and debouncing.

**What it is & why it exists (plain English):** Playing a sound when a piece moves or is captured makes the board feel responsive. This file loads small MP3 files once, caches the decoded audio, and plays them at a comfortable volume. It uses the Web Audio API (the browser's low-latency sound system) and guards against rapid-fire overlaps.

**How it works, step by step:** It lazily creates a single shared `AudioContext` and a cache of decoded buffers. The core `play` function debounces with a tiny timeout (so only the latest of a burst plays), resumes the audio context if the browser suspended it, fetches and decodes the requested sound (caching it), then routes it through a gain (volume) node set to 0.3 and starts playback.

**Functions & exports:**

- **`play(sound)`**: *Input:* a `Sound` (`"move" | "capture" | "illegalMove"`). *Output:* a promise. Handles the debounce, context setup, caching, and playback described above.
- **`playCaptureSound()`** / **`playIllegalMoveSound()`** / **`playMoveSound()`**: convenience wrappers calling `play` with the respective sound.
- **`playSoundFromMove(move)`**: *Input:* a `chess.js` `Move` or `null`. *Output:* picks the right sound — illegal-move sound for `null`, capture sound if the move captured a piece, otherwise the move sound.

**Connections:** Imports the `Move` type from `chess.js`; plays files from `/sounds/*.mp3` in the public folder. Used by the interactive chessboard whenever a move is made or attempted.

---

## `src/lib/syncEngineSettingsDefaults.ts`

**In one sentence:** Applies sensible default chess-engine settings into `localStorage` once per settings version.

**What it is & why it exists (plain English):** New users (and users after a settings upgrade) should start with good engine defaults — which engine, search depth, number of lines, worker threads, and board color. This file writes those defaults into `localStorage`, but only once per "settings version", so it won't keep overwriting choices the user later changes (until the version bumps).

**How it works, step by step:** It bails out during server-side rendering (no `window`). It compares the stored settings version against the current one; if they match, it does nothing. Otherwise it writes each default value (JSON-encoded) under its `localStorage` key and finally records the new version. The whole thing is wrapped in a `try/catch` to ignore private-browsing or quota errors.

**Functions & exports:**

- **`syncEngineSettingsDefaults()`**: *Inputs:* none. *Output:* none. *Logic:* version check → write `engine-name`, `engine-depth`, `engine-multi-pv`, `engineWorkersNb`, `boardHue` → stamp the version. Silently ignores storage errors.

**Connections:** Imports `ENGINE_DEFAULTS`, `ENGINE_SETTINGS_VERSION`, and `ENGINE_SETTINGS_VERSION_KEY` from `@/constants/engineDefaults`. Typically called once at app startup so engine settings are initialized before the analysis UI reads them.

---

## `src/lib/api/index.ts`

**In one sentence:** A "barrel" file that re-exports every API domain module so callers can import from one place.

**What it is & why it exists (plain English):** A *barrel* is a single file that gathers and re-exports the contents of many sibling files. Instead of importing `joinClassroom` from a deep path, code can write `import { joinClassroom } from "@/lib/api"`. This keeps import statements short and stable even as the API surface grows.

**How it works, step by step:** It simply does `export * from "./<module>"` for each domain file in the folder.

**Functions & exports:** No functions of its own. It re-exports everything from `academies`, `annotations`, `assignments`, `classrooms`, `coaching`, `games`, and `sync`.

**Connections:** Imports (re-exports) the sibling API modules. Imported throughout the app's pages, components, and hooks that talk to the backend.

---

## `src/lib/api/academies.ts`

**In one sentence:** Typed client functions and types for coach↔student links, per-student stats, academies, and student reports.

**What it is & why it exists (plain English):** Coaches manage students through "coach links" that carry notes, goals, tags, and platform-sync settings. This file defines the data shapes for those relationships and provides functions to fetch and modify them via the shared axios instance, so UI code never hand-writes URLs.

**How it works, step by step:** Each function calls a method on the shared `api` axios instance (which automatically adds the auth token and base URL) against a REST endpoint, and returns `res.data` typed to the right shape. One pure helper computes an average accuracy.

**Functions & exports:**

- **Types:** `CoachStudentLink` (the relationship: coach, student, notes, tags, priority, goals, platform-sync fields, timestamps), `StudentStats` (per-student totals like games, accuracy, blunders, pending assignments), and `StudentReport` (a dated report bundling summary, games, and assignments).
- **`avgAccuracy(stats)`**: *Input:* `StudentStats`. *Output:* the mean of the non-null white/black accuracies, or `null` if none. (Pure; no network.)
- **`fetchCoachLinks()`** → `GET /api/coach-links/` → all of the current coach's links.
- **`createCoachLink(data)`** → `POST /api/coach-links/` with `student_username` or `student_id` → the new link.
- **`updateCoachLink(id, data)`** → `PATCH /api/coach-links/<id>/` with a partial set of editable fields → the updated link.
- **`deleteCoachLink(id)`** → `DELETE /api/coach-links/<id>/`.
- **`fetchStudentStats(studentId)`** → `GET /api/students/<id>/stats/` → that student's `StudentStats`.
- **`fetchAcademies()`** → `GET /api/academies/` → academy data (untyped `res.data`).
- **`fetchStudentReport(studentId, from?, to?)`** → `GET /api/students/<id>/report/` with optional date range → a `StudentReport`.

**Connections:** Imports the shared `api` from `@/api` and the `User` type from `@/types/user`. Re-exported via `index.ts`; used by coach dashboard, roster, and student-detail screens. Its `StudentStats` type is reused by `coaching.ts`.

---

## `src/lib/api/annotations.ts`

**In one sentence:** Typed client for creating, reading, updating, and deleting move-level annotations (notes) on a game.

**What it is & why it exists (plain English):** Coaches and students attach text notes to specific positions in a game ("here you should have castled"). This file defines the annotation shape and the four standard operations to manage them through the backend.

**How it works, step by step:** Each function calls the shared axios instance against the `/api/annotations/` endpoints and returns the typed data. Fetching filters by `game_id` via query params.

**Functions & exports:**

- **`Annotation`** (type): `id`, `game`, `author` (`id`/`username`), `move_index`, `fen`, `body`, and timestamps.
- **`fetchAnnotations(gameId)`** → `GET /api/annotations/?game_id=<id>` → that game's annotations.
- **`createAnnotation(data)`** → `POST /api/annotations/` with `{ game, move_index, fen, body }` → the new annotation.
- **`updateAnnotation(id, body)`** → `PATCH /api/annotations/<id>/` with the new `body` text → the updated annotation.
- **`deleteAnnotation(id)`** → `DELETE /api/annotations/<id>/`.

**Connections:** Imports the shared `api` from `@/api`. Re-exported via `index.ts`; used by the analysis board's annotation UI.

---

## `src/lib/api/assignments.ts`

**In one sentence:** Typed client for coach-to-student assignments (training tasks).

**What it is & why it exists (plain English):** Coaches give students assignments — instructions, an optional position (PGN), a category, priority, and due date — and track their status. This file defines the assignment shape and functions to list, create, and update them. (Bulk creation lives in `coaching.ts`.)

**How it works, step by step:** Standard axios calls against `/api/assignments/`, returning typed data.

**Functions & exports:**

- **`Assignment`** (type): `id`, `coach`, `student`, `title`, `instructions`, `category`, `priority` (`low`/`normal`/`high`), `status` (`pending`/`in_progress`/`completed`/`cancelled`), `due_date`, `pgn`, and timestamps.
- **`fetchAssignments()`** → `GET /api/assignments/` → the relevant assignments.
- **`createAssignment(data)`** → `POST /api/assignments/` with at least `student_id` and `instructions` (plus optional title, due date, PGN, category, priority, game_id) → the new assignment.
- **`updateAssignment(id, data)`** → `PATCH /api/assignments/<id>/` with a partial set of editable fields (including `status`) → the updated assignment.

**Connections:** Imports the shared `api` from `@/api`. Re-exported via `index.ts`; its `Assignment` type is reused by `coaching.ts` (bulk create). Used by assignment-management UI for both coaches and students.

---

## `src/lib/api/classrooms.ts`

**In one sentence:** Typed client for a coach's classroom and for students joining a classroom by code.

**What it is & why it exists (plain English):** A coach has one classroom with a shareable join code; students preview and join it with that code. This file defines the classroom shapes and the operations to manage and join classrooms.

**How it works, step by step:** Standard axios calls against the `/api/classroom/*` endpoints, returning typed data.

**Functions & exports:**

- **Types:** `Classroom` (id, name, join code, active flag, coach username, student count, timestamps), `ClassroomPreview` (what a student sees before joining, including `already_member`), and `JoinClassroomResult` (the outcome of joining).
- **`fetchMyClassroom()`** → `GET /api/classroom/mine/` → the coach's classroom.
- **`updateMyClassroom(data)`** → `PATCH /api/classroom/mine/` with `name`/`is_active` → the updated classroom.
- **`regenerateClassroomCode()`** → `POST /api/classroom/regenerate/` → the classroom with a fresh join code.
- **`previewClassroomJoin(join_code)`** → `POST /api/classroom/preview/` → a `ClassroomPreview`.
- **`joinClassroom(join_code)`** → `POST /api/classroom/join/` → a `JoinClassroomResult`.

**Connections:** Imports the shared `api` from `@/api`. Re-exported via `index.ts`; used by classroom-management (coach) and join (student) screens.

---

## `src/lib/api/coaching.ts`

**In one sentence:** The broadest coaching client — dashboard, analytics, lesson templates, messages, training plans, student timelines, and bulk assignments.

**What it is & why it exists (plain English):** This file backs the coach's command center. It defines many data shapes (dashboard summary, roster, analytics, lesson templates, messages, training plans, timelines) and the functions to fetch and mutate them, so the coaching UI has a single typed gateway to the backend.

**How it works, step by step:** Each function is a standard axios call against a coaching-related endpoint, returning typed data. The types describe the nested JSON the backend returns.

**Functions & exports:**

- **Types:** `CoachDashboard` (summary counts + `roster` + `at_risk` + `activity`), `RosterEntry` (a student's at-a-glance card, reusing `StudentStats`), `ActivityItem`, `CoachAnalytics` (cohort accuracy, per-student accuracy, mistake totals, assignment breakdowns, top openings), `LessonTemplate`, `CoachMessage`, `TrainingPlan` (with weekly `goals`), and `StudentTimeline`.
- **`fetchCoachDashboard()`** → `GET /api/coach/dashboard/`.
- **`fetchCoachAnalytics()`** → `GET /api/coach/analytics/`.
- **`fetchLessonTemplates()`** / **`createLessonTemplate(data)`** / **`updateLessonTemplate(id, data)`** / **`deleteLessonTemplate(id)`** → CRUD over `/api/lesson-templates/`.
- **`fetchCoachMessages()`** → `GET /api/coach-messages/`; **`sendCoachMessage(data)`** → `POST /api/coach-messages/` with `student_id`, `subject`, `body`.
- **`fetchTrainingPlans()`** / **`createTrainingPlan(data)`** / **`updateTrainingPlan(id, data)`** → manage training plans at `/api/training-plans/`.
- **`fetchStudentTimeline(studentId)`** → `GET /api/students/<id>/timeline/`.
- **`bulkCreateAssignments(data)`** → `POST /api/assignments/bulk/` with a list of `student_ids` and shared assignment fields → an array of `Assignment`.

**Connections:** Imports the shared `api` from `@/api`, the `Assignment` type from `@/lib/api/assignments`, and `StudentStats` (via an inline `import("@/lib/api/academies")` type reference). Re-exported via `index.ts`; used by the entire coach dashboard area.

---

## `src/lib/api/games.ts`

**In one sentence:** Typed client for server-stored games and their evaluations — list, fetch, create, delete, upload eval, and bulk upload.

**What it is & why it exists (plain English):** Games saved to a user's account live on the backend with optional analysis attached. This file defines the server's game/eval shapes (snake_case, as the backend sends them) and the functions to manage them. It's the API layer that `gameSync.ts` builds on.

**How it works, step by step:** Standard axios calls against `/api/games/*`, returning typed data. List supports an optional `student_id` filter (for coaches viewing a student's games).

**Functions & exports:**

- **Types:** `ServerGame` (id, PGN, players, result/date/event/etc., `has_eval`, accuracy, source, `analysis_status`, `analysis_source`, `external_url`, `created_at`), `ServerGameEval` (positions, accuracy, `estimated_elo`, settings, timestamps), and `ServerGameDetail` (a `ServerGame` plus optional `eval`, termination, time control, `updated_at`).
- **`fetchGames(studentId?)`** → `GET /api/games/` (optionally filtered by student) → `ServerGame[]`.
- **`fetchGame(gameId)`** → `GET /api/games/<id>/` → a `ServerGameDetail`.
- **`uploadGameEval(gameId, evalData)`** → `PUT /api/games/<id>/eval/` with positions/accuracy/estimated_elo/settings → the saved eval.
- **`createGame(game)`** → `POST /api/games/` with a game payload (without server-generated fields) → the new `ServerGame`.
- **`deleteServerGame(gameId)`** → `DELETE /api/games/<id>/`.
- **`bulkUploadGames(games)`** → `POST /api/games/bulk/` with an array of game records → `{ created: string[] }` (the new IDs in order).

**Connections:** Imports the shared `api` from `@/api` and `GameEval` from `@/types/eval`. Re-exported via `index.ts`; consumed directly by `gameSync.ts` and by game-library/report UI.

---

## `src/lib/api/sync.ts`

**In one sentence:** Typed client for the background analysis pipeline — platform-sync overview, triggering syncs, browser presence, and the claim/complete/release queue for analyzing games.

**What it is & why it exists (plain English):** VoltChess can pull games from linked Chess.com/Lichess accounts and analyze them either in the user's browser or on the server. This file is the API for that whole pipeline: checking sync status, kicking off a sync, telling the server whether the browser is busy, and coordinating a work queue where browsers "claim" a game, analyze it, then "complete" (or "release" if they give up). It also lets the server process its own queue.

**How it works, step by step:** Standard axios calls against `/api/sync/*`. The overview and trigger accept an optional student filter/link. The queue functions move a game through states: fetch pending → claim one → upload the finished eval (complete) or hand it back (release). `sendSyncPresence` reports a busy/idle flag so the server can decide whether to analyze server-side.

**Functions & exports:**

- **Types:** `PlatformLinkSync` (one linked platform account's sync state), `SyncOverview` (aggregate counts + per-link list + last sync), and `SyncTriggerResult` (per-sync outcome, possibly nested `results`).
- **`fetchSyncOverview(studentId?)`** → `GET /api/sync/overview/` (optionally per student) → a `SyncOverview`.
- **`triggerSync(payload?)`** → `POST /api/sync/trigger/` with optional `link_id`/`student_id` → a `SyncTriggerResult`.
- **`sendSyncPresence(browserBusy)`** → `POST /api/sync/presence/` with `{ browser_busy }`.
- **`fetchPendingAnalysis(limit = 3)`** → `GET /api/sync/pending-analysis/?limit=` → `ServerGameDetail[]` awaiting analysis.
- **`claimGameAnalysis(gameId)`** → `POST /api/sync/games/<id>/claim/` → the claimed `ServerGameDetail` (locks it for this browser).
- **`releaseGameAnalysis(gameId)`** → `POST /api/sync/games/<id>/release/` (returns an unfinished game to the queue).
- **`completeGameAnalysis(gameId, evalPayload)`** → `POST /api/sync/games/<id>/complete/` with positions/accuracy/estimated_elo/settings.
- **`processServerAnalysisQueue(maxGames = 3)`** → `POST /api/sync/process-server/` → `{ processed, failed?, attempted?, reason? }`.

**Connections:** Imports the shared `api` from `@/api` and `ServerGameDetail` from `@/lib/api/games`. Re-exported via `index.ts`; used by the background sync worker/hooks and sync-status UI.
