# VoltChess Frontend Engine: The Stockfish Integration

This document is an exhaustive, beginner-friendly tour of the chess-engine layer that lives under `src/lib/engine/`. This is the part of VoltChess that takes a chess game, hands each position to the world-class **Stockfish** chess engine running directly inside your web browser, reads back the engine's verdicts, and turns them into the friendly numbers and labels you see in the app: evaluation bars, win percentages, move quality badges ("Blunder", "Brilliant", etc.), accuracy scores, and estimated player ratings. Everything here runs **on the user's device** — no server does the thinking.

---

## A Plain-English Primer (read this first if you're not a coder)

Before diving into individual files, here is the big picture in everyday language. If you've never written code, this section is for you.

### What is Stockfish?

**Stockfish** is a famous, free, open-source **chess engine**. A chess engine is a program that looks at a chess position and figures out who is winning and what the best move is. It does this by calculating millions of possible future positions very quickly. When Stockfish finishes thinking, it gives you two key things:

- A **score** ("centipawns", abbreviated `cp`): how good the position is, measured in hundredths of a pawn. `+100` means White is ahead by roughly one pawn; `-300` means Black is ahead by about three pawns; `0` is dead equal.
- A **best move** and a **principal variation** (`pv`): the move it recommends, plus the sequence of moves it expects to follow.

Sometimes instead of a score it reports a forced **mate** ("mate in 3"), meaning checkmate is unavoidable within that many moves.

### What is WebAssembly (WASM)?

Stockfish is written in C++, a fast "low-level" programming language. Web browsers normally run JavaScript, which is more convenient but slower for heavy number-crunching. **WebAssembly (WASM)** is a way to take fast C++ code and run it inside the browser at near-native speed. So VoltChess ships a WASM build of Stockfish: the same powerful engine, packaged so it can run on a web page without installing anything.

### What is a Web Worker?

If the browser tried to run Stockfish on the "main thread" (the part of the browser that draws the page and responds to clicks), the page would freeze every time the engine thought hard. A **Web Worker** is a separate background thread the browser provides — like a second worker in the kitchen. We run Stockfish inside a Web Worker so the engine can grind away in the background while the page stays smooth and responsive. VoltChess can even spin up **several workers at once** to analyze many positions in parallel, which is why a whole game gets analyzed quickly.

### What is UCI?

We need a way to "talk" to the engine. Chess engines speak a standard text language called **UCI** (Universal Chess Interface). It's just lines of text sent back and forth:

- Commands we **send** to the engine: `uci` (introduce yourself), `isready` (are you ready?), `position fen <...>` (here is the board), `go depth 16` (think this many moves deep), `stop` (stop thinking now), `setoption ...` (change a setting).
- Replies the engine **sends back**: `uciok` (I'm initialized), `readyok` (I'm ready), `info ... score cp 35 ... pv e2e4 ...` (here's my running analysis), and finally `bestmove e2e4` (my conclusion).

A **FEN** (mentioned above) is a compact text string that describes an entire chessboard position — where every piece sits, whose turn it is, castling rights, etc.

### How a whole game gets analyzed, end to end

When you ask VoltChess to analyze a game, here's the journey, in order:

1. **Positions in.** The game is broken into a list of board positions (FEN strings) and the list of moves actually played.
2. **Engine evaluation.** Each position is sent to a Stockfish worker with `position fen ...` then `go depth N`. The worker streams back `info` lines and a final `bestmove`.
3. **Parsing.** The raw text replies are parsed into tidy objects: for each position we record the candidate lines, their scores (`cp` or `mate`), and the moves.
4. **Win% conversion.** Each score is converted into a **win percentage** (0–100%) — a far more human number than centipawns.
5. **Move classification.** By comparing the win% before and after each move, every move gets a label: Blunder, Mistake, Inaccuracy, Okay, Excellent, Best, plus special labels (Opening, Forced, Perfect, Splendid).
6. **Accuracy.** Each player's moves are rolled up into a single **accuracy score** (0–100), like the ones on Lichess/Chess.com.
7. **Estimated Elo.** From how much each player "lost" on average per move, the app estimates each player's **rating (Elo)**.

The files below implement exactly these steps. Read on.

---

## Table of Contents

1. [`src/lib/engine/shared.ts`](#srclibenginesharedts) — capability detection (can this browser run the engine?)
2. [`src/lib/engine/worker.ts`](#srclibengineworkerts) — creating Web Workers and the send/receive plumbing
3. [`src/lib/engine/uciEngine.ts`](#srclibengineuciengints) — the central engine controller (the brain of this layer)
4. [`src/lib/engine/stockfish11.ts`](#srclibenginestockfish11ts) — factory for Stockfish 11
5. [`src/lib/engine/stockfish16.ts`](#srclibenginestockfish16ts) — factory for Stockfish 16
6. [`src/lib/engine/stockfish16_1.ts`](#srclibenginestockfish16_1ts) — factory for Stockfish 16.1
7. [`src/lib/engine/stockfish17.ts`](#srclibenginestockfish17ts) — factory for Stockfish 17
8. [`src/lib/engine/helpers/parseResults.ts`](#srclibenginehelpersparseresultsts) — turning raw UCI text into structured data
9. [`src/lib/engine/helpers/winPercentage.ts`](#srclibenginehelperswinpercentagets) — score → win%
10. [`src/lib/engine/helpers/accuracy.ts`](#srclibenginehelpersaccuracyts) — per-player accuracy scores
11. [`src/lib/engine/helpers/estimateElo.ts`](#srclibenginehelpersestimateelots) — estimated player ratings
12. [`src/lib/engine/helpers/moveClassification.ts`](#srclibenginehelpersmoveclassificationts) — labeling each move

---

## `src/lib/engine/shared.ts`

**In one sentence:** A small toolbox of "can this browser/device do X?" checks that the rest of the engine layer uses to decide which Stockfish build to load.

**What it is & why it exists (plain English):** Not every browser or phone can run the engine the same way. Some support WebAssembly; some support running across multiple CPU threads at once (which needs a browser feature called `SharedArrayBuffer`); iPhones in particular have quirks. This file centralizes all those "feature detection" questions in one place so the rest of the code can simply ask, for example, "is multi-threading supported?" without repeating the gnarly checks everywhere.

**How it works, step by step:** Each function inspects something about the current browser — the global `WebAssembly` object, whether `SharedArrayBuffer` exists, or the browser's `userAgent` string (a text label browsers send that identifies the device/OS). Based on those, the app later picks a single-thread vs. multi-thread engine file, or refuses to offer an unsupported engine.

**Functions & classes:**

- `isWasmSupported()` — **Inputs:** none. **Output:** `true`/`false`. **What it does:** Checks that the `WebAssembly` object exists and can validate a tiny known-good WASM byte sequence. If yes, the browser can run the WASM Stockfish builds.
- `isMultiThreadSupported()` — **Inputs:** none. **Output:** `true`/`false`. **What it does:** Returns `true` only if `SharedArrayBuffer` exists (the mechanism that lets worker threads share memory) **and** the device is not iOS. Wrapped in a `try/catch` so that if even referencing `SharedArrayBuffer` throws, it safely returns `false`.
- `isIosDevice()` — **Inputs:** none. **Output:** `true`/`false`. **What it does:** Tests the browser's `userAgent` for "iPhone/iPad/iPod" to detect Apple mobile devices (which need special handling).
- `isMobileDevice()` — **Inputs:** none. **Output:** `true`/`false`. **What it does:** Returns `true` for iOS devices or Android/Opera Mini, i.e. phones/tablets generally.
- `isEngineSupported(name)` — **Inputs:** an `EngineName` (e.g. `Stockfish17`, `Stockfish16`, `Stockfish11`). **Output:** `true`/`false`. **What it does:** Routes to the matching engine class's `isSupported()` so callers can check support by engine name in one call.

**Connections:** Imports `EngineName` (the enum of engine identifiers) and each Stockfish class (`Stockfish11/16/16_1/17`). Its helpers are used by `worker.ts` (`isIosDevice`, `isMobileDevice` for worker-count limits), by every Stockfish factory (`isWasmSupported`, `isMultiThreadSupported`), and `isWasmSupported`/`isEngineSupported` are used by UI/hooks such as `useEngine.ts` and settings dialogs to decide which engines to offer.

---

## `src/lib/engine/worker.ts`

**In one sentence:** The low-level plumbing that creates a Web Worker running a Stockfish file and provides a clean "send these UCI commands and wait for the reply" helper.

**What it is & why it exists (plain English):** A raw Web Worker only gives you two crude operations: "post a message to it" and "receive a message from it." This file wraps that into something friendlier: it builds an object that knows how to send a UCI command, listen for replies, and shut down. It also solves a real-world deployment bug (explained in the code comment): the engine file path must be **absolute** (starting with `/`), otherwise on nested routes like `/coach/students` the browser would look for the engine in the wrong folder and accidentally download the app's HTML page instead of the engine, crashing the worker.

**How it works, step by step:** `getEngineWorker` builds the absolute URL, creates a browser `Worker`, and wires its incoming messages to a `listen` callback that the rest of the code can swap out. `sendCommandsToWorker` is the workhorse: it sets up a fresh listener, fires off your commands, collects every reply line, and resolves a Promise once a designated "final" line appears (like `bestmove` or `readyok`).

**Functions & classes:**

- `getEngineWorker(enginePath)` — **Inputs:** `enginePath`, the path to the engine's `.js` file (e.g. `"engines/stockfish-17/stockfish-17.js"`). **Output:** an `EngineWorker` object with `isReady`, `uci(command)`, `listen(data)`, and `terminate()`. **What it does:** (1) Forces the path to be absolute. (2) Logs in dev mode. (3) Creates a browser `Worker`. (4) Returns a wrapper whose `uci()` posts a message and whose `terminate()` kills the worker; the worker's `onmessage` forwards each reply to the wrapper's current `listen`.
- `sendCommandsToWorker(worker, commands, finalMessage, onNewMessage?)` — **Inputs:** the worker; an array of UCI command strings to send in order; `finalMessage`, the reply prefix that signals completion (e.g. `"bestmove"`); and an optional `onNewMessage` callback fired on every reply (used for live/streaming updates). **Output:** a Promise resolving to the full array of reply lines. **What it does:** Replaces the worker's `listen` so each reply is pushed into a `messages` array, calls `onNewMessage` with the running list, and resolves the Promise once a line starts with `finalMessage`. Then it sends every command.
- `getRecommendedWorkersNb()` — **Inputs:** none. **Output:** a number (how many parallel workers to use). **What it does:** Picks a safe worker count as the **minimum** of three caps: based on CPU cores (`hardwareConcurrency`), based on device memory (`deviceMemory`), and a hard device cap (2 for iOS, 4 for other mobile, 8 for desktop). This prevents overloading weaker devices.

**Connections:** Imports the `EngineWorker` type and `isIosDevice`/`isMobileDevice` from `shared.ts`. Used heavily by `uciEngine.ts` (for all command sending and worker creation) and by `stockfish16.ts` (its custom init step). `getRecommendedWorkersNb` is consumed by higher-level analysis code (e.g. `useAnalyzeGame.ts`).

---

## `src/lib/engine/uciEngine.ts`

**In one sentence:** The central controller class (`UciEngine`) that manages a pool of Stockfish workers and exposes high-level methods to evaluate a single position, evaluate an entire game, or get the engine's chosen move at a given strength.

**What it is & why it exists (plain English):** Everything else in this layer is either a thin helper or a small factory; this file is the brain. A real chess analysis needs careful coordination: spin up worker(s), introduce them with UCI, set options (like how many candidate lines to show, or what playing strength to use), feed them positions, gather results, queue work when all workers are busy, and clean up afterward. `UciEngine` encapsulates all of that behind a tidy interface so the UI just calls `evaluateGame(...)` and gets back a finished analysis.

A few jargon terms used below: **MultiPV** is how many distinct candidate lines the engine reports (the app uses 3 by default so it can compare the best move to alternatives). **Depth** is how many plies (half-moves) deep the engine searches. **Elo limiting** tells Stockfish to deliberately play at a weaker, human-like strength.

**How it works, step by step:**
1. You create an engine via the static `create(...)` factory, which builds one worker and marks the engine ready.
2. Each worker carries an `isReady` flag. To do work, the engine **acquires** a free worker (marking it busy); if none are free, the job is pushed onto a **queue**.
3. When a worker finishes, `releaseWorker` either pulls the next queued job and runs it, or marks the worker free again. This is a simple but effective job scheduler.
4. For a single position, it sends `position fen ...` + `go depth ...`, waits for `bestmove`, then parses the result.
5. For a whole game, it temporarily scales up to several workers, evaluates every position in parallel (short-circuiting checkmate/stalemate positions without bothering the engine), tracks progress, then scales back to one worker and runs classification/accuracy/Elo on the collected results.

**Functions & classes:** `UciEngine` is the single exported class.

- `static create(engineName, enginePath, customEngineInit?)` — **Inputs:** the engine's name, the path to its worker file, and an optional async initialization function (used by Stockfish 16 to toggle NNUE). **Output:** a ready `UciEngine` (Promise). **What it does:** Constructs the instance (the constructor is private, so this factory is the only way in), adds the first worker, marks ready.
- `acquireWorker()` *(private)* — **Output:** a free worker or `undefined`. Finds the first `isReady` worker, marks it busy, returns it.
- `releaseWorker(worker)` *(private)* — Pulls the next queued job (if any) and runs it on this worker, recursively releasing afterward and resolving that job's Promise; otherwise marks the worker ready. This is the core of the scheduler.
- `setMultiPv(multiPv)` *(private)* — **Inputs:** desired candidate-line count. Validates it's 2–6, sends `setoption name MultiPV ...` to every worker, and remembers it. Skips work if unchanged.
- `setElo(elo)` *(private)* — **Inputs:** desired playing strength. Validates 1320–3190, enables `UCI_LimitStrength`, sets `UCI_Elo`, remembers it. Used to make the engine play like a human of a given rating.
- `getIsReady()` — **Output:** boolean readiness flag.
- `throwErrorIfNotReady()` *(private)* — Throws if the engine isn't ready; a guard used before public operations.
- `shutdown()` — Marks not ready, clears the queue, terminates and discards all workers. Called when switching engines.
- `terminateWorker(worker)` *(private)* — Sends `quit` and terminates a single worker (with a dev log).
- `stopAllCurrentJobs()` — Clears the queue and sends `stop` + `isready` to every worker, then releases them. Used to interrupt an in-progress search (e.g. when the user jumps to a different position).
- `sendCommands(commands, finalMessage, onNewMessage?)` *(private)* — Acquires a worker and runs the commands; if none are free, queues the job and returns a Promise that resolves when it eventually runs. The single-worker entry point.
- `sendCommandsToEachWorker(commands, finalMessage, onNewMessage?)` *(private)* — Runs the same commands on **all** workers in parallel (used for global options like MultiPV/Elo and `ucinewgame`).
- `addNewWorker()` *(private)* — Creates a worker via `getEngineWorker`, performs the UCI handshake (`uci`→`uciok`), sets MultiPV, runs any `customEngineInit`, sends `ucinewgame`, then registers and releases it.
- `setWorkersNb(workersNb)` *(private)* — Grows or shrinks the worker pool to the requested size (validates ≥ 1); used to fan out during game analysis and contract afterward.
- `evaluateGame({ fens, uciMoves, depth=16, multiPv, setEvaluationProgress, playersRatings, workersNb=1 })` — **Inputs:** the list of position FENs, the moves played, search depth, candidate count, a progress callback, optional known player ratings, and how many workers to use. **Output:** a `GameEval` containing every position's evaluation **plus** move classifications, accuracy, estimated Elo, and the settings used. **What it does:** the full game pipeline — set options, fan out workers, evaluate all positions in parallel (instantly resolving checkmate as `mate ±1` and stalemate as `cp 0` without calling the engine), report smooth progress, then run `getMovesClassification`, `computeAccuracy`, and `computeEstimatedElo`. A `finally` block always restores readiness so one failed analysis never permanently breaks the engine.
- `evaluatePosition(fen, depth=16, _workersNb?)` *(private)* — Evaluates one position (`position fen` + `go depth`) and parses the result. (`_workersNb` is currently unused.)
- `evaluatePositionWithUpdate({ fen, depth=16, multiPv, setPartialEval })` — **Inputs:** a single position plus an optional `setPartialEval` callback. **Output:** the final `PositionEval`. **What it does:** stops any current job, sets MultiPV, then evaluates while streaming **partial** results to `setPartialEval` on every `info` line — this powers the live-updating evaluation bar/arrows in the analysis board.
- `getEngineNextMove(fen, elo, depth=16)` — **Inputs:** a position, a target Elo, and depth. **Output:** the engine's move in UCI notation, or `undefined` if there is none. **What it does:** stops current jobs, limits strength to `elo`, searches, and extracts the `bestmove`. This is what lets users **play against** the engine at a chosen rating.

**Connections:** Imports parsing (`parseResults.ts`), accuracy (`accuracy.ts`), move classification (`moveClassification.ts`), Elo estimation (`estimateElo.ts`), chess utilities (`getIsStalemate`, `getWhoIsCheckmated`), worker plumbing (`worker.ts`), and various types. It is instantiated through the Stockfish factory classes and consumed by hooks like `useEngine.ts`, `useAnalyzeGame.ts`, and `useCurrentPosition.ts`.

---

## `src/lib/engine/stockfish11.ts`

**In one sentence:** A tiny factory class that creates a `UciEngine` configured for Stockfish 11.

**What it is & why it exists (plain English):** Each Stockfish version ships as different files and has slightly different requirements. Rather than scatter those details around, each version gets its own small "factory" class whose only job is to know the right file path and any version-specific setup, then hand back a ready `UciEngine`. Stockfish 11 is the oldest, most-compatible build (it works even without WebAssembly), so it serves as the universal fallback.

**How it works, step by step:** `create()` points at the fixed file `engines/stockfish-11.js` and calls `UciEngine.create(...)` with the `Stockfish11` name. There's no thread/NNUE branching because v11 doesn't need it.

**Functions & classes:**
- `static create()` — **Inputs:** none. **Output:** a ready `UciEngine` (Promise). **What it does:** builds the engine from the v11 path.
- `static isSupported()` — **Inputs:** none. **Output:** always `true`. **What it does:** declares v11 universally supported (the safe fallback).

**Connections:** Imports `EngineName` and `UciEngine`. Used by `shared.ts` (`isEngineSupported`) and `useEngine.ts` (`pickEngine`).

---

## `src/lib/engine/stockfish16.ts`

**In one sentence:** Factory for Stockfish 16 that chooses a single- vs. multi-thread build and can toggle the NNUE neural-network evaluation.

**What it is & why it exists (plain English):** Stockfish 16 comes in two flavors: a multi-threaded build (faster, when the browser supports shared memory) and a single-threaded build (for browsers/devices that don't, like iOS). It also supports **NNUE** — a neural-network-based way of evaluating positions that's stronger than the older hand-written evaluation. This factory picks the correct file and, via a custom init step, turns NNUE on or off.

**How it works, step by step:** `create(nnue?)` first checks WASM support, decides single vs. multi-thread via `isMultiThreadSupported()`, selects the matching `.js` path, builds a `customEngineInit` that sends `setoption name Use NNUE value ...`, picks the engine name (`Stockfish16NNUE` or `Stockfish16`), and calls `UciEngine.create(...)`.

**Functions & classes:**
- `static create(nnue?)` — **Inputs:** optional `nnue` boolean (enable the neural-net evaluation). **Output:** a ready `UciEngine`. **What it does:** validates support, picks the path, wires up the NNUE option as a custom init, and creates the engine. Throws if unsupported.
- `static isSupported()` — **Output:** `isWasmSupported()`. **What it does:** v16 requires WebAssembly.

**Connections:** Imports `EngineName`, `UciEngine`, `isMultiThreadSupported`/`isWasmSupported` (`shared.ts`), `sendCommandsToWorker` (`worker.ts`), and the `EngineWorker` type. Used by `shared.ts` and `useEngine.ts`.

---

## `src/lib/engine/stockfish16_1.ts`

**In one sentence:** Factory for Stockfish 16.1 that selects a "lite" or full build and a single- or multi-thread variant.

**What it is & why it exists (plain English):** Stockfish 16.1 adds a **"lite"** option — a smaller, faster-to-download build that's slightly less strong, good for lower-end devices or quicker startup. Combined with the single/multi-thread choice, that's up to four possible files; this factory assembles the correct filename from those two toggles.

**How it works, step by step:** `create(lite?)` checks WASM support, determines thread support, then builds the path by string-templating in `-lite` (if lite) and `-single` (if no multi-thread). It picks the matching engine name and calls `UciEngine.create(...)`.

**Functions & classes:**
- `static create(lite?)` — **Inputs:** optional `lite` boolean. **Output:** a ready `UciEngine`. **What it does:** validates support, computes the file path from the lite/thread flags, picks `Stockfish16_1Lite` or `Stockfish16_1`, and creates the engine. Throws if unsupported.
- `static isSupported()` — **Output:** `isWasmSupported()`.

**Connections:** Imports `EngineName`, `UciEngine`, and `isMultiThreadSupported`/`isWasmSupported`. Used by `shared.ts` and `useEngine.ts`.

---

## `src/lib/engine/stockfish17.ts`

**In one sentence:** Factory for Stockfish 17 (the newest, strongest engine) that selects lite/full and single/multi-thread builds.

**What it is & why it exists (plain English):** Stockfish 17 is the latest and strongest engine VoltChess offers, and it's the default. Structurally this factory is identical to the 16.1 one — same lite and thread toggles — just pointing at the `stockfish-17` folder.

**How it works, step by step:** `create(lite?)` validates WASM support, checks thread support, builds the path with optional `-lite`/`-single` suffixes, selects the engine name, and calls `UciEngine.create(...)`.

**Functions & classes:**
- `static create(lite?)` — **Inputs:** optional `lite` boolean. **Output:** a ready `UciEngine`. **What it does:** validates support, assembles the path, picks `Stockfish17Lite` or `Stockfish17`, creates the engine. Throws if unsupported.
- `static isSupported()` — **Output:** `isWasmSupported()`.

**Connections:** Imports `EngineName`, `UciEngine`, and the thread/WASM checks. Used by `shared.ts` and `useEngine.ts` (where it's the default).

---

## `src/lib/engine/helpers/parseResults.ts`

**In one sentence:** Converts Stockfish's raw stream of UCI text lines into a clean, structured `PositionEval` object the rest of the app can use.

**What it is & why it exists (plain English):** Stockfish talks in terse text like `info depth 18 multipv 1 score cp 34 pv e2e4 e7e5 ...`. That's hard to use directly. This file reads those lines and extracts the useful pieces — the best move, each candidate line's score, depth, and move sequence — into proper data. It also fixes a crucial perspective issue: Stockfish always reports the score from the **side-to-move's** point of view, but the app wants every score from **White's** point of view, so when it's Black's turn the parser flips the sign.

**How it works, step by step:** It scans every reply line. From `bestmove` lines it grabs the best move. From `info` lines it reads `multipv`, `depth`, `pv`, and either `cp` or `mate`. It keeps only the **deepest** result seen for each candidate line (engines emit shallower results first), stores them keyed by their MultiPV index, then sorts the lines best-first. Finally, if it's Black to move, it negates all `cp`/`mate` values so everything is from White's perspective.

**Functions & classes:**
- `parseEvaluationResults(results, fen)` — **Inputs:** `results` (the array of raw UCI lines) and `fen` (the position, used both to format moves and to know whose turn it is). **Output:** a `PositionEval` (`{ bestMove?, lines[] }`). **What it does:** the full parse-and-normalize described above.
- `sortLines(a, b)` — **Inputs:** two `LineEval`s. **Output:** a sort number. **What it does:** orders lines best-first, with forced mates ranked appropriately (faster mates first; mate-for-you beats any centipawn score) and otherwise by descending centipawns.
- `getResultProperty(result, property)` — **Inputs:** one UCI line and the property name (e.g. `"cp"`, `"depth"`, `"bestmove"`). **Output:** the string value that follows that keyword, or `undefined`. **What it does:** splits the line on spaces and returns the token right after the keyword. A general-purpose UCI field reader (also reused by `uciEngine.ts` to read `bestmove`).
- `getResultPv(result, fen)` *(private)* — **Inputs:** a UCI line and the FEN. **Output:** an array of formatted moves, or `undefined`. **What it does:** extracts everything after `pv` and runs it through `formatUciPv` (from `lib/chess`) to convert raw UCI moves into the app's move format.

**Connections:** Imports `formatUciPv` from `lib/chess` and the `LineEval`/`PositionEval` types. `parseEvaluationResults` and `getResultProperty` are used throughout `uciEngine.ts`.

---

## `src/lib/engine/helpers/winPercentage.ts`

**In one sentence:** Converts an engine score (centipawns or mate) into a human-friendly **win percentage** from 0 to 100.

**What it is & why it exists (plain English):** Centipawns aren't intuitive — most people don't know whether `+250` is "a little ahead" or "crushing." A **win percentage** answers the natural question: "what's my chance of winning?" 50% means equal, 100% means completely winning, 0% means completely lost. This conversion is also the foundation for accuracy and move classification, which compare win% before and after each move. The formula matches Lichess's published model (links are in the code).

**How it works, step by step:** It takes the top line's score. If it's a centipawn score, it clamps it to ±1000 and runs it through a logistic (S-curve) function that maps scores onto 0–100%. If it's a mate score, it treats it as an effectively infinite advantage (`mate * Infinity`) and feeds that into the same curve, which yields ~100% (or ~0% for being mated).

**Functions & classes:**
- `getPositionWinPercentage(position)` — **Inputs:** a `PositionEval`. **Output:** win% (0–100). **What it does:** delegates to `getLineWinPercentage` using the position's best line (`lines[0]`).
- `getLineWinPercentage(line)` — **Inputs:** a single `LineEval`. **Output:** win% (0–100). **What it does:** uses `cp` if present, otherwise `mate`; throws if the line has neither.
- `getWinPercentageFromMate(mate)` *(private)* — **Inputs:** a mate distance. **Output:** win%. **What it does:** converts mate to an infinite centipawn value and reuses the cp formula.
- `getWinPercentageFromCp(cp)` *(private)* — **Inputs:** a centipawn score. **Output:** win%. **What it does:** clamps to ±1000, applies the logistic formula `50 + 50 * (2/(1+e^(MULTIPLIER*cp)) - 1)` with Lichess's constant, returning 0–100.

**Connections:** Imports `ceilsNumber` (a clamp helper from `lib/math`) and the eval types. Used by `accuracy.ts` and `moveClassification.ts` (and indirectly anything showing win% in the UI).

---

## `src/lib/engine/helpers/accuracy.ts`

**In one sentence:** Computes each player's overall **accuracy score** (0–100) for a game by measuring how much win% they gave up on each move.

**What it is & why it exists (plain English):** "Accuracy" is the single headline number that says how cleanly you played — 95% means near-perfect, 60% means lots of errors. The idea: every time you move, your win% might drop because you didn't play the best move; small drops barely hurt accuracy, big drops hurt a lot. Importantly, moves in **sharp, volatile positions** (where it's easy to go wrong) are weighted more than moves in calm positions, so a blunder in a tense moment counts more. The math mirrors Lichess's accuracy model (links in code).

**How it works, step by step:**
1. Convert every position to a win% list.
2. Compute per-move **weights** based on how volatile the surrounding positions are (standard deviation of win% in a sliding window) — sharper swings → bigger weight.
3. Compute per-move **accuracy** from the win% drop on each move via an exponential formula (no drop → ~100; big drop → toward 0).
4. Split moves by player (even indices = White, odd = Black) and combine each player's move accuracies into one number by averaging a **weighted mean** and a **harmonic mean** (the harmonic mean punishes occasional disasters, matching how people feel about blunders).

**Functions & classes:**
- `computeAccuracy(positions)` — **Inputs:** the array of `PositionEval`s for the game. **Output:** `{ white, black }` accuracy numbers. **What it does:** orchestrates steps 1–4 above.
- `getPlayerAccuracy(movesAccuracy, weights, player)` *(private)* — **Inputs:** all per-move accuracies, all weights, and which player. **Output:** that player's accuracy. **What it does:** filters to that player's moves (by even/odd index), then averages the weighted mean and harmonic mean.
- `getAccuracyWeights(movesWinPercentage)` *(private)* — **Inputs:** the win% list. **Output:** an array of weights. **What it does:** slides a window over the win% values, takes the standard deviation in each window (clamped to 0.5–12) so volatile phases weigh more.
- `getMovesAccuracy(movesWinPercentage)` *(private)* — **Inputs:** the win% list. **Output:** per-move accuracy (0–100). **What it does:** for each move computes how much win% the mover lost (only counting losses, direction depending on color), then maps that drop through Lichess's exponential accuracy formula, clamped to 0–100.

**Connections:** Imports math helpers (`ceilsNumber`, `getHarmonicMean`, `getStandardDeviation`, `getWeightedMean`) and `getPositionWinPercentage` from `winPercentage.ts`. Called by `uciEngine.ts`'s `evaluateGame`.

---

## `src/lib/engine/helpers/estimateElo.ts`

**In one sentence:** Estimates each player's strength (Elo rating) for the game based on their average centipawn loss, optionally calibrated against a known rating.

**What it is & why it exists (plain English):** Beyond accuracy, players like to see "you played like a 1700 here." **Average Centipawn Loss (ACPL)** measures, on average, how much value you threw away per move compared to the best play. Lower ACPL means stronger play. There's a well-known relationship between ACPL and Elo, and this file uses it to estimate a rating. If a player's actual rating is known, it nudges the estimate toward how they performed *relative to expectation* for that rating.

**How it works, step by step:**
1. If there are fewer than 2 positions, give up (return `undefined`).
2. Compute each player's average centipawn loss across their moves (only counting moves that worsened their own evaluation, capping any single loss at 1000).
3. Convert ACPL to a base Elo with `3100 * e^(-0.01 * ACPL)`.
4. If a known rating is provided, compare actual ACPL to the ACPL expected for that rating and scale the rating up (played better than expected) or down (worse) accordingly.

**Functions & classes:**
- `computeEstimatedElo(positions, whiteElo?, blackElo?)` — **Inputs:** the game's positions and optional known ratings for each side (each falls back to the other if missing). **Output:** `{ white, black }` estimated Elos, or `undefined` if too few positions. **What it does:** computes per-player ACPL and converts to Elo with optional calibration.
- `getPositionCp(position)` *(private)* — **Inputs:** a `PositionEval`. **Output:** a centipawn value clamped to ±1000 (mate treated as ±1000). **What it does:** extracts a single comparable score from a position.
- `getPlayersAverageCpl(positions)` *(private)* — **Inputs:** the positions. **Output:** `{ whiteCpl, blackCpl }`. **What it does:** walks move by move, adds up each side's losses (a move counts as a loss only when it worsened that side's score, capped at 1000 per move), and divides by each side's move count.
- `getEloFromAverageCpl(averageCpl)` *(private)* — **Inputs:** ACPL. **Output:** base Elo via the exponential formula.
- `getAverageCplFromElo(elo)` *(private)* — **Inputs:** a rating. **Output:** the ACPL expected for that rating (the inverse formula).
- `getEloFromRatingAndCpl(gameCpl, rating?)` *(private)* — **Inputs:** the game's ACPL and an optional known rating. **Output:** the calibrated Elo. **What it does:** returns the raw ACPL-based Elo if no rating; otherwise adjusts the rating up/down based on whether the player out- or under-performed their expected ACPL.

**Connections:** Imports `ceilsNumber` from `lib/math` and the eval types. Called by `uciEngine.ts`'s `evaluateGame` (passing through `playersRatings`).

---

## `src/lib/engine/helpers/moveClassification.ts`

**In one sentence:** Assigns each move in the game a quality label — `Opening`, `Forced`, `Splendid`, `Perfect`, `Best`, `Excellent`, `Okay`, `Inaccuracy`, `Mistake`, or `Blunder` — by comparing win percentages and detecting special tactical patterns.

**What it is & why it exists (plain English):** This produces the colorful badges players love: a red "Blunder," a sparkling "Splendid," etc. The core idea is simple: compare the win% **before** your move with the win% **after** it. If your win% barely changed, you played well; if it crashed, you erred — and the size of the crash sets the severity. On top of that baseline, the file detects special cases: book **opening** moves (matched against a database), **forced** moves (only one legal/reasonable reply), brilliant **sacrifices** ("Splendid"), and **only-good-move / outcome-changing** moves ("Perfect"). This is the most nuanced file in the layer.

**How it works, step by step (per move, skipping move 0 which is the starting position):**
1. **Opening:** if the resulting position matches a known opening (by board layout), label `Opening` and remember the opening name.
2. **Forced:** if the previous position had only one candidate line, the move was forced → `Forced`.
3. **Splendid:** if win% held steady, the move was a genuine **piece sacrifice** (verified via `getIsPieceSacrifice`), and it isn't losing nor merely matching an already-completely-winning alternative → `Splendid` (a brilliant move).
4. **Perfect:** if win% held steady, it wasn't a simple recapture, it isn't losing/redundant, and it either **flipped the game's outcome** (crossed the 50% line for the better) or was the **only good move** (much better than the best alternative) → `Perfect`.
5. **Best:** if the move equals the engine's recommended `bestMove` → `Best`.
6. **Otherwise**, fall back to the basic win%-drop scale (Blunder/Mistake/Inaccuracy/Okay/Excellent).

A key concept used throughout is the **alternative line**: the best move the player did *not* play. Comparing the played move against that alternative is what distinguishes a "you found the only path" Perfect move from a routine one.

**Functions & classes:**
- `getMovesClassification(rawPositions, uciMoves, fens)` — **Inputs:** the engine evaluations per position, the moves actually played (UCI), and the FENs. **Output:** the same positions, each now carrying `opening` and `moveClassification`. **What it does:** runs the per-move decision cascade above for every move.
- `getMoveBasicClassification(lastWin%, win%, isWhiteMove)` *(private)* — **Inputs:** win% before/after and the mover's color. **Output:** a `MoveClassification`. **What it does:** computes the win% drop (sign-adjusted for color) and bins it: `< -20` Blunder, `< -10` Mistake, `< -5` Inaccuracy, `< -2` Okay, else Excellent.
- `isSplendidMove(...)` *(private)* — **Inputs:** win% before/after, color, the played move, the engine's best line, the FEN, and the alternative line's win%. **Output:** boolean. **What it does:** returns true only when win% basically held, the move was a real piece sacrifice, and it isn't losing or redundant with an already-winning alternative.
- `isLosingOrAlternateCompletelyWinning(win%, altWin%, isWhiteMove)` *(private)* — **Output:** boolean. **What it does:** a guard used by both Splendid and Perfect to reject moves that are actually losing, or where an alternative was already ~totally winning (so brilliance wouldn't be meaningful).
- `isPerfectMove(...)` *(private)* — **Inputs:** win% before/after, color, the alternative's win%, the FEN two moves ago, and the last two UCI moves. **Output:** boolean. **What it does:** returns true when win% held, it isn't a simple recapture, isn't losing/redundant, and it either changed the game's outcome or was the only good move.
- `getHasChangedGameOutcome(lastWin%, win%, isWhiteMove)` *(private)* — **Output:** boolean. **What it does:** true if the move both improved win% by >10 and crossed the 50% line (turned a losing/equal position into a winning one or vice versa).
- `getIsTheOnlyGoodMove(win%, altWin%, isWhiteMove)` *(private)* — **Output:** boolean. **What it does:** true if the played move's win% beats the best alternative's by more than 10 — i.e. there was essentially only one good move.

**Connections:** Imports the win% helpers (`getLineWinPercentage`, `getPositionWinPercentage`), the `MoveClassification` enum, the `openings` database (`@/data/openings`), and chess tactics helpers (`getIsPieceSacrifice`, `isSimplePieceRecapture`) from `lib/chess`. Called by `uciEngine.ts`'s `evaluateGame`.

---

## Putting it all together

To recap the dependency flow in one breath: the UI/hooks (`useEngine`, `useAnalyzeGame`, `useCurrentPosition`) ask a **Stockfish factory** (`stockfish11/16/16_1/17.ts`) — guided by `shared.ts`'s capability checks — to build a `UciEngine`. The `UciEngine` (`uciEngine.ts`) uses `worker.ts` to spawn Web Workers running the WASM Stockfish and to exchange **UCI** messages. Raw replies are turned into data by `parseResults.ts`, scores are humanized by `winPercentage.ts`, and from there `accuracy.ts`, `estimateElo.ts`, and `moveClassification.ts` produce the final accuracy scores, estimated ratings, and per-move badges that the player sees. That's the whole journey from a chess position to a fully annotated game review.
