# VoltChess Analysis Feature UI (`src/sections/analysis/`)

This document is an exhaustive, beginner-friendly tour of every file that builds the VoltChess **analysis screen** — the page where a player reviews a finished chess game and sees how good or bad each move was. It is written so that someone who has never read this codebase (or even someone who does not write code) can understand exactly what each file does, how the pieces fit together, and where the data comes from. Every section corresponds to one real file that currently exists in the folder; a recent cleanup removed several legacy files, and those deleted files are intentionally **not** documented here.

## Plain-English primer: what is the "analysis" screen?

Imagine you just finished a game of chess and you want a coach to tell you, move by move, what you did well and where you went wrong. That is exactly what this screen does, except the "coach" is a famous chess engine called **Stockfish** that runs right inside your web browser.

The typical flow is:

1. **You load a game.** This can be a game you played online, a game from a file (PGN — a plain-text chess format), or a game already saved on the VoltChess server.
2. **Stockfish analyzes it.** The engine looks at every position in the game and decides how winning or losing it was, and what the best move would have been.
3. **This folder draws the results.** It renders:
   - the **chess board** itself (so you can step through the moves),
   - the **move list** (every move, with little quality icons),
   - the **evaluation graph** (a line chart showing who was winning over time),
   - **accuracy and estimated Elo** (overall scores for each player),
   - **move classifications** — VoltChess gives each move a friendly label like "Surge" (brilliant), "Best", "Slip" (a mistake), or "Shock" (a blunder),
   - the **engine lines** — the engine's recommended sequences of moves for the current position.

### What are "Jotai atoms"?

Many files in this folder talk to each other through **Jotai atoms**. Think of an atom as a small, shared box that holds one piece of information — for example "the current chess game", "the engine's evaluation", or "is the best-move arrow turned on?". Any component can read from a box, and when the value in a box changes, every component reading that box automatically re-draws itself with the new value. This is how, for instance, clicking a move in the move list instantly updates the board, the graph, and the engine lines all at once. All of these shared boxes are defined in one place: [`states.ts`](#srcsectionsanalysisstatests). Atoms whose names you will see constantly include `gameAtom` (the full loaded game), `boardAtom` (the position currently shown on the board), `gameEvalAtom` (the finished Stockfish report), and `currentPositionAtom` (the live evaluation of the position you are looking at).

### Two pages use this folder

- **`/analysis`** (`src/pages/analysis.tsx`) — the interactive page. It can load a game, run Stockfish in the browser, and show live engine lines.
- **`/review`** (`src/pages/review.tsx`) — a read-only viewer for games that already have a saved analysis on the server.

Both pages reuse the same building blocks documented below.

---

## Table of Contents

- [`src/sections/analysis/states.ts`](#srcsectionsanalysisstatests)
- [`src/sections/analysis/AnalysisEmptyState.tsx`](#srcsectionsanalysisanalysisemptystatetsx)
- [`src/sections/analysis/AnalysisPageLayout.tsx`](#srcsectionsanalysisanalysispagelayouttsx)
- [`src/sections/analysis/AnalysisPanelTabs.tsx`](#srcsectionsanalysisanalysispaneltabstsx)
- [`src/sections/analysis/EvaluationGraphSection.tsx`](#srcsectionsanalysisevaluationgraphsectiontsx)
- [`src/sections/analysis/EvaluationProgress.tsx`](#srcsectionsanalysisevaluationprogresstsx)
- [`src/sections/analysis/board/index.tsx`](#srcsectionsanalysisboardindextsx)
- [`src/sections/analysis/chessigma/classifications.ts`](#srcsectionsanalysischessigmaclassificationsts)
- [`src/sections/analysis/hooks/useCurrentPosition.ts`](#srcsectionsanalysishooksusecurrentpositionts)
- [`src/sections/analysis/panel/AccuracyOverview.tsx`](#srcsectionsanalysispanelaccuracyoverviewtsx)
- [`src/sections/analysis/panel/AnalysisBottomNav.tsx`](#srcsectionsanalysispanelanalysisbottomnavtsx)
- [`src/sections/analysis/panel/AnalysisTabPanel.tsx`](#srcsectionsanalysispanelanalysistabpaneltsx)
- [`src/sections/analysis/panel/ClassificationGoodBad.tsx`](#srcsectionsanalysispanelclassificationgoodbadtsx)
- [`src/sections/analysis/panel/classificationLabels.ts`](#srcsectionsanalysispanelclassificationlabelsts)
- [`src/sections/analysis/panel/CriticalAnalysis.tsx`](#srcsectionsanalysispanelcriticalanalysistsx)
- [`src/sections/analysis/panel/EloOverview.tsx`](#srcsectionsanalysispanelelooverviewtsx)
- [`src/sections/analysis/panel/EngineEvalBar.tsx`](#srcsectionsanalysispanelengineevalbartsx)
- [`src/sections/analysis/panel/EngineLinesPanel.tsx`](#srcsectionsanalysispanelenginelinespaneltsx)
- [`src/sections/analysis/panel/EnginePositionTracker.tsx`](#srcsectionsanalysispanelenginepositiontrackertsx)
- [`src/sections/analysis/panel/EvalLeadPanel.tsx`](#srcsectionsanalysispanelevalleadpaneltsx)
- [`src/sections/analysis/panel/FollowBestLineButton.tsx`](#srcsectionsanalysispanelfollowbestlinebuttontsx)
- [`src/sections/analysis/panel/GameMovesCard.tsx`](#srcsectionsanalysispanelgamemovescardtsx)
- [`src/sections/analysis/panel/MoveAnnotations.tsx`](#srcsectionsanalysispanelmoveannotationstsx)
- [`src/sections/analysis/panel/PlayerStatsPanel.tsx`](#srcsectionsanalysispanelplayerstatspaneltsx)
- [`src/sections/analysis/panel/reportColors.ts`](#srcsectionsanalysispanelreportcolorsts)
- [`src/sections/analysis/panel/ReportSection.tsx`](#srcsectionsanalysispanelreportsectiontsx)
- [`src/sections/analysis/panel/ReportTabPanel.tsx`](#srcsectionsanalysispanelreporttabpaneltsx)
- [`src/sections/analysis/panel/ReportViewerPanel.tsx`](#srcsectionsanalysispanelreportviewerpaneltsx)
- [`src/sections/analysis/panel/SettingsTabPanel.tsx`](#srcsectionsanalysispanelsettingstabpaneltsx)
- [`src/sections/analysis/panel/SplitShareBar.tsx`](#srcsectionsanalysispanelsplitsharebartsx)
- [`src/sections/analysis/panelHeader/analyzeButton.tsx`](#srcsectionsanalysispanelheaderanalyzebuttontsx)
- [`src/sections/analysis/panelHeader/loadGame.tsx`](#srcsectionsanalysispanelheaderloadgametsx)
- [`src/sections/analysis/panelBody/classificationTab/movesPanel/index.tsx`](#srcsectionsanalysispanelbodyclassificationtabmovespanelindextsx)
- [`src/sections/analysis/panelBody/classificationTab/movesPanel/moveItem.tsx`](#srcsectionsanalysispanelbodyclassificationtabmovespanelmoveitemtsx)
- [`src/sections/analysis/panelBody/classificationTab/movesPanel/movesLine.tsx`](#srcsectionsanalysispanelbodyclassificationtabmovespanelmoveslinetsx)
- [`src/sections/analysis/panelBody/graphTab/index.tsx`](#srcsectionsanalysispanelbodygraphtabindextsx)
- [`src/sections/analysis/panelBody/graphTab/dot.tsx`](#srcsectionsanalysispanelbodygraphtabdottsx)
- [`src/sections/analysis/panelBody/graphTab/tooltip.tsx`](#srcsectionsanalysispanelbodygraphtabtooltiptsx)
- [`src/sections/analysis/panelBody/graphTab/types.ts`](#srcsectionsanalysispanelbodygraphtabtypests)

---

## `src/sections/analysis/states.ts`

**In one sentence:** Defines all the shared "boxes" (Jotai atoms) that hold the analysis screen's state — the game, the board, the engine settings, and the evaluation results.

**What it is & why it exists (plain English):** This is the single source of truth for the analysis feature. Rather than passing data manually from component to component, VoltChess stores each important value in a globally accessible atom. Any part of the screen can read or update these atoms, and the UI re-draws automatically when a value changes. Centralizing them here means there is exactly one place to look when you ask "where does the board state live?" or "how is engine depth remembered?".

A subtle but important detail: some atoms use `atom()` (memory only — reset when you refresh the page), while others use `atomWithStorage()` (saved in the browser's `localStorage` so your preferences survive a refresh and future visits).

**How it works, step by step:** It imports `atom` and `atomWithStorage` from Jotai, the `Chess` class from the `chess.js` library (which represents a chess game and enforces the rules), default engine settings from `@/constants/engineDefaults`, and the TypeScript types `CurrentPosition`, `GameEval`, and `SavedEvals`. Each exported line creates one atom with an initial value. There is no logic here beyond declaring these boxes — the behavior lives in the components and hooks that consume them.

**Components, functions & exports:** This file exports only atoms (no components or functions):

- `gameEvalAtom` — holds the finished Stockfish report for the whole game (`GameEval`), or `undefined` if the game has not been analyzed yet. This includes accuracy, estimated Elo, and per-position evaluations.
- `gameAtom` — holds the full loaded game as a `chess.js` `Chess` object. This is the *complete* game from start to the last move played.
- `boardAtom` — holds another `Chess` object representing **what is currently shown on the board**. As you step backward/forward through the game, this changes while `gameAtom` stays fixed. Comparing the two tells the code where you are in the game.
- `currentPositionAtom` — holds a `CurrentPosition` object describing the position you are looking at: the last move played, the move index, and the live engine evaluation (`eval` and `lastEval`). Starts as an empty object `{}`.
- `boardOrientationAtom` — `true` means White is at the bottom; `false` flips the board. Defaults to `true`.
- `showBestMoveArrowAtom` — `true`/`false` toggle for drawing the engine's best-move arrow on the board. Defaults to `true`.
- `showPlayerMoveIconAtom` — `true`/`false` toggle for showing the little move-quality icon on the board. Defaults to `true`.
- `engineNameAtom` — which Stockfish variant to use (an `EngineName` enum value). Saved to `localStorage` under the key `"engine-name"`, defaulting to `ENGINE_DEFAULTS.engine`.
- `engineDepthAtom` — how deeply the engine searches (a number). Saved under `"engine-depth"`. Higher depth = stronger but slower.
- `engineMultiPvAtom` — how many alternative lines the engine reports (number). Saved under `"engine-multi-pv"`. "PV" means *principal variation*, i.e. a best-play line.
- `engineWorkersNbAtom` — how many background CPU threads (web workers) the engine may use. Saved under `"engineWorkersNb"`.
- `evaluationProgressAtom` — a number `0–100` showing how far along whole-game analysis is. `0` means not analyzing.
- `savedEvalsAtom` — an in-memory cache (`SavedEvals`) mapping a position (FEN string) to its already-computed evaluation, so the same position is not recalculated. Reset on refresh.

**Connections:** Imports `ENGINE_DEFAULTS`, the `EngineName` enum, eval types, `Chess` from `chess.js`, and Jotai helpers. It is the most widely imported file in this folder — practically every component and the `useCurrentPosition` hook reads or writes one or more of these atoms.

---

## `src/sections/analysis/AnalysisEmptyState.tsx`

**In one sentence:** Shows a small "Not analyzed" placeholder card when a game is loaded but Stockfish has not produced a report yet (and is not currently running).

**What it is & why it exists (plain English):** Without this, a freshly loaded game would show a blank report area, leaving the user unsure whether anything is happening. This component fills that gap with a friendly message reassuring the user that analysis will start automatically and results will appear here.

**How it works, step by step:** It reads two atoms — `evaluationProgressAtom` (how far along analysis is) and `gameEvalAtom` (the finished report). If a report already exists *or* analysis progress is above zero, the component renders nothing (`return null`) because the placeholder is no longer relevant. Otherwise it draws a dashed-border box containing a chart icon, a bold "Not analyzed" heading, and an explanatory sentence: "Stockfish will evaluate this game automatically. Results appear here when analysis finishes."

**Components, functions & exports:**

- `AnalysisEmptyState` (default export) — a React component.
  - **Props/params:** none.
  - **Renders/returns:** either `null` (when a report exists or analysis is running) or a styled MUI `Box` with an Iconify icon and two `Typography` lines.
  - **Steps:** (1) get the color `palette` via `usePalette`; (2) read `gameEval` and `progress`; (3) early-return `null` if `gameEval` is truthy or `progress > 0`; (4) otherwise render the placeholder card.

**Connections:** Imports `evaluationProgressAtom` and `gameEvalAtom` from `./states`, the `usePalette` hook for theme colors, MUI's `Box`/`Typography`, and Iconify's `Icon`. It is rendered by [`ReportTabPanel`](#srcsectionsanalysispanelreporttabpaneltsx) when a game is loaded but unevaluated.

---

## `src/sections/analysis/AnalysisPageLayout.tsx`

**In one sentence:** The overall page skeleton — it places the chess board (with player name bars above and below) on the left and a fixed-width report/tools panel on the right, adapting between desktop and mobile.

**What it is & why it exists (plain English):** Every analysis-type page needs the same basic shape: a board in the middle and a panel of information on the side. Instead of each page re-building that layout, this component provides the reusable frame. The actual contents of the side panel are passed in as "slots" so different pages can show different things (the interactive report vs. the read-only viewer) inside the same consistent structure. On phones, the layout stacks vertically and even moves the move-navigation buttons closer to the board so they stay reachable.

**How it works, step by step:** The component accepts several optional "slot" props and `children`. The outer container is a flex box that is a row on desktop (`md` and up) and a column on mobile (`xs`). The **middle column** holds, top to bottom: a top `PlayerBar`, the centered board, a bottom `PlayerBar`, and — on mobile only — the `panelFooter` (move controls) right below the board. The **right panel** is a fixed-width MUI `Paper` that stacks: the `panelHeader`, an optional pinned area (`panelPinned`, only when not using tabs), the scrollable `children`, and — on desktop only — the `panelFooter` pinned to the bottom.

The internal helper `PlayerBar` decides, based on the board orientation atom, which player (White or Black) to show at the top vs. bottom, so that flipping the board also swaps the name bars correctly.

The `useTabs` flag changes scrolling behavior: when `true`, the children manage their own scrolling (used by the tabbed pages); when `false`, this component wraps children in its own scrolling area.

**Components, functions & exports:**

- `PlayerBar` (internal, not exported) — a small component.
  - **Props/params:** `{ position: "top" | "bottom" }`.
  - **Renders/returns:** a fixed-height bar containing a `PlayerHeader` for the correct player.
  - **Steps:** reads `boardOrientationAtom`, computes whether this bar should show White or Black, pulls player data via `usePlayersData(gameAtom)`, then renders `PlayerHeader` bound to `boardAtom`.
- `AnalysisPageLayout` (default export) — the main layout component.
  - **Props/params (`Props`):** `panelHeader?`, `panelFooter?`, `panelPinned?` (all `ReactNode` slots), `useTabs?` (boolean, default `false`), and `children`.
  - **Renders/returns:** the full board-plus-panel page structure.
  - **Steps:** (1) get `palette`; (2) render the responsive flex container; (3) build the middle board column with two `PlayerBar`s and the `Board`; (4) conditionally render the mobile footer; (5) build the right `Paper` panel with header, optional pinned section, scrollable body, and desktop footer.

**Connections:** Imports `boardAtom`, `boardOrientationAtom`, and `gameAtom` from `./states`; `Board` from `./board`; layout constants `ANALYSIS_PANEL_WIDTH` and `PLAYER_BAR_HEIGHT` and the `Color` enum; the `usePalette` and `usePlayersData` hooks; and the shared `PlayerHeader` component. It is used directly by both `src/pages/analysis.tsx` and `src/pages/review.tsx`, which pass `<AnalysisPanelTabs>` as `children` and `<AnalysisBottomNav>` as the `panelFooter`.

---

## `src/sections/analysis/AnalysisPanelTabs.tsx`

**In one sentence:** A reusable tabbed container for the right-hand panel that shows tab buttons (Report, Analysis, Settings, etc.) and swaps the content beneath them.

**What it is & why it exists (plain English):** The side panel needs to present several different views without cluttering the screen. Tabs solve this: the user clicks "Report", "Analysis", or "Settings" and the area below changes. This component is generic — it does not know what a "Report" tab contains; it just takes a list of tab definitions and renders the buttons and bodies. That makes it reusable across the analysis and review pages, which supply different tab sets.

**How it works, step by step:** It receives a `tabs` array. Each tab can be hidden (`show: false`), so it first filters to the visible tabs. It supports both "uncontrolled" mode (it remembers the active tab internally via `useState`) and "controlled" mode (the parent passes `activeTab` and `onActiveTabChange`). When a tab is clicked, it updates internal state only if the parent is not controlling it, and always calls the parent's change callback if provided. It renders an MUI `Tabs` row of buttons (each with an icon and label), then below it renders **all** tab bodies but hides the inactive ones with CSS. Each body's scrolling behavior depends on the tab's `scrollable` flag: scrollable tabs get their own vertical scrollbar; non-scrollable tabs fill the available height and manage scrolling themselves.

**Components, functions & exports:**

- `AnalysisTabId` (exported type) — a string union: `"report" | "engine" | "moves" | "game" | "settings"`. These are the allowed tab identifiers.
- `AnalysisTabDef` (exported interface) — the shape of one tab: `id`, `label`, `icon` (an Iconify name), optional `show`, optional `tourId` (for the onboarding tour), optional `scrollable`, and `content` (the React node to display).
- `AnalysisPanelTabs` (default export) — the component.
  - **Props/params (`Props`):** `tabs` (array of `AnalysisTabDef`), `defaultTab?`, `activeTab?` (controlled value), `onActiveTabChange?` (callback).
  - **Renders/returns:** a column containing the `Tabs` bar plus the active tab's content.
  - **Steps:** (1) filter visible tabs; (2) set up internal vs. controlled active-tab state; (3) render tab buttons mapping over visible tabs; (4) render each tab's body, hiding inactive ones and applying scroll styling based on `scrollable`.

**Connections:** Imports MUI `Tabs`/`Tab`/`Box`, Iconify `Icon`, and `usePalette`. It is rendered by `src/pages/analysis.tsx` (Report/Analysis/Settings tabs) and `src/pages/review.tsx` (Report tab only). The tab `content` slots reference [`ReportTabPanel`](#srcsectionsanalysispanelreporttabpaneltsx), [`AnalysisTabPanel`](#srcsectionsanalysispanelanalysistabpaneltsx), [`SettingsTabPanel`](#srcsectionsanalysispanelsettingstabpaneltsx), and [`ReportViewerPanel`](#srcsectionsanalysispanelreportviewerpaneltsx).

---

## `src/sections/analysis/EvaluationGraphSection.tsx`

**In one sentence:** A wrapper that shows the evaluation line-chart once analysis exists, or a "chart appears after analysis" placeholder when it does not.

**What it is & why it exists (plain English):** The evaluation graph is the squiggly line that shows who was winning throughout the game. This file is a thin presentation layer around the actual chart: it decides whether to draw the chart or a placeholder, and it standardizes the chart's height and optional "sticky" behavior (staying pinned to the top while you scroll). Separating this from the chart's internals keeps the chart component focused purely on drawing.

**How it works, step by step:** It reads `gameEvalAtom`. If a report exists, it renders the `GraphTab` chart with a set of responsive height styles merged in. If no report exists, it renders a dashed-border box with the message "Evaluation chart appears after analysis finishes." The `sticky` prop (default `true`) adds CSS so the section sticks to the top of its scroll container; `containerSx` lets callers override the outer styling. Any extra props are forwarded to `GraphTab`.

**Components, functions & exports:**

- `EvaluationGraphSection` (default export) — the component.
  - **Props/params (`Props`, extends MUI `Grid2Props`):** `sticky?` (boolean, default `true`), `containerSx?` (style overrides), plus any grid props forwarded to the chart.
  - **Renders/returns:** either the `GraphTab` chart or a placeholder box.
  - **Steps:** (1) read `gameEval`; (2) render outer `Box` with optional sticky styling; (3) conditionally render `GraphTab` (with size styles) or the placeholder.

**Connections:** Imports `gameEvalAtom` from `./states`, `GraphTab` from `./panelBody/graphTab`, and `usePalette`. It is used by [`ReportTabPanel`](#srcsectionsanalysispanelreporttabpaneltsx) and [`ReportViewerPanel`](#srcsectionsanalysispanelreportviewerpaneltsx) inside their "Evaluation graph" sections.

---

## `src/sections/analysis/EvaluationProgress.tsx`

**In one sentence:** A progress banner that appears while the Stockfish engine is loading or while it is analyzing the whole game, with a percentage bar and helpful status text.

**What it is & why it exists (plain English):** Analyzing a full game can take a few seconds to a minute, and loading the engine itself happens once per session. Users need feedback so they do not think the app is frozen. This banner communicates two distinct phases — "loading the engine" and "analyzing" — with appropriate wording and either an animated (indeterminate) or filling (determinate) progress bar.

**How it works, step by step:** It reads `evaluationProgressAtom`, `gameEvalAtom`, `gameAtom`, and `engineNameAtom`, and gets the engine instance via `useEngine`. It computes `hasMoves` (does the game contain moves?), `engineLoading` (there are moves, no report yet, the engine is not ready, and progress is still zero), and `isAnalyzing` (progress above zero). If neither condition holds, it renders nothing. Otherwise it chooses a `label` and `helper` string based on whether the engine is loading, analysis is finishing (`progress >= 95`), or analysis is mid-run, and shows a `LinearProgress` bar that is *indeterminate* while loading the engine and *determinate* (filling to `progress`%) while analyzing.

**Components, functions & exports:**

- `EvaluationProgress` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** either `null` or a styled banner with a label, an optional percentage, a progress bar, and a helper caption.
  - **Steps:** (1) read the relevant atoms and engine; (2) derive `engineLoading` and `isAnalyzing`; (3) early-return `null` if idle; (4) pick label/helper text; (5) render the banner and bar.

**Connections:** Imports `evaluationProgressAtom`, `gameEvalAtom`, `gameAtom`, and `engineNameAtom` from `./states`; the `useEngine` hook (engine readiness); and `usePalette`. It is rendered near the top of [`ReportTabPanel`](#srcsectionsanalysispanelreporttabpaneltsx).

---

## `src/sections/analysis/board/index.tsx`

**In one sentence:** Wires the shared chess-board component to the analysis atoms so the board reflects analysis state (orientation, arrows, current position) and is correctly sized.

**What it is & why it exists (plain English):** VoltChess has a generic `Board` component used in multiple features (play, analysis, etc.). This file is the analysis-specific "adapter": it connects that generic board to the analysis atoms and turns on the features the analysis screen wants — the evaluation bar, the best-move arrow, move-quality icons — while sizing the board to fit the available screen space.

**How it works, step by step:** It measures the screen via `useScreenSize` and computes a `boardSize` with `getAnalysisBoardSize` (recomputed only when the screen size changes, via `useMemo`). It reads `boardOrientationAtom` and `showBestMoveArrowAtom`, and pulls the White/Black player data with `usePlayersData(gameAtom)`. Then it renders the generic `Board` bound to `boardAtom` (the position currently shown), passing the current-position and move-icon atoms so the board can highlight the engine's evaluation and draw quality icons. It enables `canPlay` (you can move pieces to explore variations), `showEvaluationBar`, and hides the player headers (because the surrounding layout already shows them).

**Components, functions & exports:**

- `BoardContainer` (default export, named `BoardContainer` but imported elsewhere as `Board`) — the component.
  - **Props/params:** none.
  - **Renders/returns:** the configured shared `Board`.
  - **Steps:** (1) compute responsive `boardSize`; (2) read orientation and arrow atoms; (3) get player data; (4) render `Board` with analysis atoms and feature flags.

**Connections:** Imports `boardAtom`, `boardOrientationAtom`, `currentPositionAtom`, `gameAtom`, `showBestMoveArrowAtom`, and `showPlayerMoveIconAtom` from `../states`; the `getAnalysisBoardSize`/`useScreenSize` helpers; the `Color` enum; `usePlayersData`; and the shared `Board` from `@/components/board`. It is rendered by [`AnalysisPageLayout`](#srcsectionsanalysisanalysispagelayouttsx).

---

## `src/sections/analysis/chessigma/classifications.ts`

**In one sentence:** Produces ready-to-display lists of "good" and "bad" move classifications, each paired with its friendly VoltChess label, for use by classification UIs.

**What it is & why it exists (plain English):** Elsewhere the code knows move classifications as raw enum values (like `splendid` or `blunder`). UI lists, however, want both the value *and* a human label ("Surge", "Shock"). This small file builds those paired lists once so multiple components do not repeat the work. It also drops the "Forced" classification from the good list, since a forced move is not really a credit to the player.

**How it works, step by step:** It imports the canonical key lists `GOOD_CLASSIFICATIONS` and `BAD_CLASSIFICATIONS` (aliased to `GOOD_KEYS`/`BAD_KEYS`) and the `CLASSIFICATION_DISPLAY_LABELS` map from [`../panel/classificationLabels`](#srcsectionsanalysispanelclassificationlabelsts). It filters out `MoveClassification.Forced` from the good keys, then maps each remaining key to an object `{ key, label }`. It does the same (without filtering) for the bad keys.

**Components, functions & exports:**

- `GOOD_CLASSIFICATIONS` (exported constant) — an array of `{ key, label }` for good move types, excluding `Forced`.
- `BAD_CLASSIFICATIONS` (exported constant) — an array of `{ key, label }` for bad move types (Drift/Slip/Shock).

**Connections:** Imports the `MoveClassification` enum and the key lists/labels from [`../panel/classificationLabels`](#srcsectionsanalysispanelclassificationlabelsts). Note: this re-exports the same *names* as `classificationLabels.ts` but in a different *shape* (objects with labels rather than raw keys). It lives in the `chessigma/` subfolder as a convenience export for classification-display consumers.

---

## `src/sections/analysis/hooks/useCurrentPosition.ts`

**In one sentence:** The core hook that keeps `currentPositionAtom` in sync with whatever position is on the board — pulling from the saved game report when available, and asking the live engine to evaluate on-the-fly otherwise.

**What it is & why it exists (plain English):** As you click around the board, the app constantly needs to answer: "What is the evaluation of *this exact* position, and what was the previous one?" Sometimes the answer already exists in the finished game report. Sometimes (for example, when you explore a side variation that was never in the original game) no saved answer exists, so the engine must compute it on demand. This hook does all of that bookkeeping and writes the result into `currentPositionAtom`, which the eval bar, engine lines, and move list all read.

**How it works, step by step:** It is a React hook taking the engine instance (or `null`). Inside a `useEffect` that re-runs whenever the game eval, board, game, engine, depth, or multiPv changes:

1. It reads the board's move history and seeds a `position` object with the last move played.
2. It checks whether the board's moves are a **prefix** of the full game's moves (i.e. you are simply somewhere along the real game, not in a side line). If so, it records `currentMoveIdx` and — when a finished report exists — copies that position's evaluation (and the previous position's) out of `gameEval.positions`, trimming the engine lines to the user's `multiPv` setting.
3. If the position has no known opening name, it scans the move history backward looking up positions in the `openings` database to label the opening.
4. It writes the assembled `position` into `currentPositionAtom`.
5. If there is **no** stored eval and the engine is ready (and the position is not checkmate/stalemate), it computes one live: it first checks the `savedEvals` cache (keyed by FEN) and reuses it if it is from the same engine and is deep/wide enough; otherwise it calls `engine.evaluatePositionWithUpdate(...)`, streaming partial results into the atom and caching the final result. It additionally evaluates the previous position so it can run `getMovesClassification(...)` and label the move you just reached (e.g. brilliant/blunder) even in side lines.
6. The effect returns a cleanup function that stops any in-flight engine jobs when dependencies change or the component unmounts.

**Components, functions & exports:**

- `useCurrentPosition` (named export) — the hook.
  - **Props/params:** `engine: UciEngine | null` — the live engine, or `null` to disable live evaluation (used on the read-only review page).
  - **Returns:** the current `currentPosition` value read from the atom.
  - **Internal helpers (defined inside the effect):** `getFenEngineEval(fen, setPartialEval?)` — returns the eval for a FEN, using the cache or the engine and saving the result; `getPositionEval()` — orchestrates evaluating the current and previous positions and classifying the move.

**Connections:** Reads/writes `currentPositionAtom`, `savedEvalsAtom`, and reads `boardAtom`, `gameAtom`, `gameEvalAtom`, `engineDepthAtom`, `engineMultiPvAtom` from `@/sections/analysis/states`. Uses `getEvaluateGameParams` from `@/lib/chess`, `getMovesClassification` from the engine helpers, the `openings` dataset, and the `UciEngine` type. It is called by [`EnginePositionTracker`](#srcsectionsanalysispanelenginepositiontrackertsx), [`analyzeButton`](#srcsectionsanalysispanelheaderanalyzebuttontsx), and directly by `src/pages/review.tsx` (with `null`).

---

## `src/sections/analysis/panel/AccuracyOverview.tsx`

**In one sentence:** Shows each player's overall accuracy score plus a small green/red bar comparing their counts of good vs. bad moves.

**What it is & why it exists (plain English):** After a game is analyzed, players want a single headline number: "how accurate was I?" This component displays White's and Black's accuracy percentages side by side, with a speedometer icon in the middle, and under each score a tiny bar that visually splits good moves (green) from bad moves (red).

**How it works, step by step:** It reads `gameEvalAtom`; if there is no report, it renders nothing. Otherwise it counts each player's good and bad moves by filtering `gameEval.positions` — using move index parity to tell whose move it was (odd indices are White's moves, even are Black's, because index 0 is the starting position) and checking whether each move's classification is in the good or bad list. It then renders two `PlayerScoreCard`s (White, Black) showing accuracy to one decimal, each with a `GoodBadBar` beneath, separated by the labeled "Accuracy" icon column.

**Components, functions & exports:**

- `countMoves(positions, isWhite, types)` (internal helper) — returns how many of a player's moves fall into the given classification `types`.
- `GoodBadBar({ good, bad })` (internal) — renders the green/red proportion bar and the "good vs bad" counts.
- `PlayerScoreCard({ value, side, good, bad })` (internal) — renders one player's big accuracy number with a `GoodBadBar` underneath; styled lighter for White.
- `AccuracyOverview` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** `null` if no report, otherwise the two score cards plus center label.
  - **Steps:** (1) read `gameEval`; (2) count good/bad for each side; (3) render the row.

**Connections:** Imports `gameEvalAtom` from `../states`, the `MoveClassification` enum, and `GOOD_CLASSIFICATIONS`/`BAD_CLASSIFICATIONS` from [`./classificationLabels`](#srcsectionsanalysispanelclassificationlabelsts); uses `usePalette`. It is composed by [`PlayerStatsPanel`](#srcsectionsanalysispanelplayerstatspaneltsx).

---

## `src/sections/analysis/panel/AnalysisBottomNav.tsx`

**In one sentence:** The move-navigation control bar (start / previous / next / end) for stepping through the game, also wired to the arrow keys.

**What it is & why it exists (plain English):** Reviewing a game means moving back and forth through its moves. This component provides the four standard navigation buttons and also lets the user press the keyboard arrow keys, which is faster than clicking. It carefully enables/disables buttons so you cannot, say, go forward past the end of the game.

**How it works, step by step:** It reads `boardAtom` and `gameAtom` and obtains chess actions via `useChessActions(boardAtom)`. It compares board history with game history to compute `canGoBack`, `canGoForward` (the board is a prefix of the game and there is a next move), and `canGoEnd`. Each button calls a memoized handler: `goToStart` resets to the starting position; `goBack` undoes one move; `handleGoForward` plays the next game move (also attaching any stored comment for that position); `goToEnd` loads the full game PGN. A `useEffect` registers a global `keydown` listener mapping ArrowLeft/Right to back/forward and ArrowDown/Up to start/end, cleaning up on unmount.

**Components, functions & exports:**

- `AnalysisBottomNav` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** a row of four `IconButton`s (Start, Previous, Next, End) with tooltips, each disabled when its action is not possible.
  - **Steps:** (1) compute can-navigate flags; (2) define handlers; (3) attach keyboard listener; (4) render buttons.

**Connections:** Imports `boardAtom`/`gameAtom` from `../states`, `useChessActions`, `usePalette`, and the `accentIconButtonSx` button style. It is passed as the `panelFooter` to [`AnalysisPageLayout`](#srcsectionsanalysisanalysispagelayouttsx) by both the analysis and review pages.

---

## `src/sections/analysis/panel/AnalysisTabPanel.tsx`

**In one sentence:** The "Analysis" tab body that stacks the live engine readout — evaluation number, follow-best-line button, engine lines, and the game move list — and keeps the engine evaluation running.

**What it is & why it exists (plain English):** This is the deep-dive engine view, shown after a game has been evaluated. While the "Report" tab gives summaries, the "Analysis" tab is for actively exploring positions: it shows the engine's current evaluation, its recommended lines, a one-click button to play out the best line, and the full move list so you can jump around. It assembles those independent pieces into one scrollable column and silently keeps the engine in sync as you move.

**How it works, step by step:** It is a pure composition component — it renders a vertical flex `Box` containing, in order:

1. `EnginePositionTracker` — renders nothing visible but runs the live-evaluation hook so the engine keeps re-evaluating whichever position you are on.
2. A non-shrinking block holding `EngineEvalBar` (the big evaluation number, depth, and engine name) and `FollowBestLineButton`.
3. A non-shrinking block holding `EngineLinesPanel` (the engine's recommended lines).
4. `GameMovesCard` — the move list, which grows to fill the rest and scrolls internally.

Because it is wrapped by a non-scrollable tab (`scrollable: false` in `analysis.tsx`), the panel fills the full panel height and the move list manages its own scrolling, keeping the eval/lines pinned at the top.

**Components, functions & exports:**

- `AnalysisTabPanel` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** the stacked engine-analysis column.
  - **Steps:** simply renders the five child components in a flex column; all logic lives in those children and in the tracker's hook.

**Connections:** Imports and composes [`EnginePositionTracker`](#srcsectionsanalysispanelenginepositiontrackertsx), [`EngineEvalBar`](#srcsectionsanalysispanelengineevalbartsx), [`FollowBestLineButton`](#srcsectionsanalysispanelfollowbestlinebuttontsx), [`EngineLinesPanel`](#srcsectionsanalysispanelenginelinespaneltsx), and [`GameMovesCard`](#srcsectionsanalysispanelgamemovescardtsx). It is supplied as the "Analysis" tab's content in `src/pages/analysis.tsx` (only shown when a report exists).

---

## `src/sections/analysis/panel/ClassificationGoodBad.tsx`

**In one sentence:** Two side-by-side cards ("Good" and "Bad") listing each move-quality type with per-player counts that you can click to jump to the next such move.

**What it is & why it exists (plain English):** Beyond a single accuracy number, players want a breakdown: how many "Best" moves did each side play? How many blunders ("Shock")? This component shows that breakdown in two columns and makes the numbers interactive — click White's blunder count to jump the board to White's next blunder, which is a great way to study mistakes.

**How it works, step by step:** The top-level component reads `gameEvalAtom` and renders two `ClassificationColumn`s: "Good" (using `REPORT_GOOD_CLASSIFICATIONS`) and "Bad" (using `BAD_CLASSIFICATIONS`), with colored dots from `REPORT_COLORS`. Each `ClassificationColumn` shows a header, then a row of White/Black king icons, then one row per classification with the friendly label, its icon (`/icons/<classification>.png`), and the counts for each side. Counts are computed by `countFor` (filtering positions by classification and index parity). Clicking a non-zero count calls `handleClick`, which finds the next position (after the current move) matching that classification and color and jumps there via `goToMove`; if none is ahead, it wraps to the first one.

**Components, functions & exports:**

- `PlayerColorIcon({ color })` (internal) — renders a small white or black king SVG.
- `countFor(positions, classification, isWhite)` (internal) — counts a single classification for one side.
- `ClassificationColumn({ title, dotColor, classifications })` (internal) — renders one card with clickable per-side counts and the jump-to-move logic.
- `ClassificationGoodBad` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** `null` if there are no positions, otherwise the Good and Bad columns.

**Connections:** Imports `boardAtom`/`gameAtom`/`gameEvalAtom` from `../states`, the `MoveClassification`/`Color` enums, `useChessActions`, `usePalette`, the classification lists/labels from [`./classificationLabels`](#srcsectionsanalysispanelclassificationlabelsts), and `REPORT_COLORS` from [`./reportColors`](#srcsectionsanalysispanelreportcolorsts). Rendered by [`ReportTabPanel`](#srcsectionsanalysispanelreporttabpaneltsx) and [`ReportViewerPanel`](#srcsectionsanalysispanelreportviewerpaneltsx).

---

## `src/sections/analysis/panel/classificationLabels.ts`

**In one sentence:** The canonical lists of good/bad move classifications and the map from each classification to its friendly VoltChess display name.

**What it is & why it exists (plain English):** VoltChess renames the standard chess-engine move qualities into its own playful vocabulary — a brilliant move is a "Surge", a blunder is a "Shock". This file is the single dictionary for those names, plus the grouping of which classifications count as "good" vs. "bad". Centralizing this means every component shows the same labels and uses the same groupings.

**How it works, step by step:** It declares three constant arrays and one map. `GOOD_CLASSIFICATIONS` lists the positive qualities (Splendid, Perfect, Best, Excellent, Okay, Opening/Book, Forced). `REPORT_GOOD_CLASSIFICATIONS` is `GOOD_CLASSIFICATIONS` minus `Opening` and `Forced` (so the report's "Good" column stays focused on genuine player merit). `BAD_CLASSIFICATIONS` lists Inaccuracy, Mistake, and Blunder. `CLASSIFICATION_DISPLAY_LABELS` maps every `MoveClassification` enum value to its UI string.

**Components, functions & exports:**

- `GOOD_CLASSIFICATIONS` — full good-quality key list (`as const`).
- `REPORT_GOOD_CLASSIFICATIONS` — good keys excluding `Opening` and `Forced`, with a precise TypeScript type.
- `BAD_CLASSIFICATIONS` — bad-quality key list.
- `CLASSIFICATION_DISPLAY_LABELS` — record mapping each classification to its label: Splendid→"Surge", Perfect→"Clean", Best→"Best", Excellent→"Nice", Okay→"Ok", Opening→"Book", Forced→"Forced", Inaccuracy→"Drift", Mistake→"Slip", Blunder→"Shock".

**Connections:** Imports only the `MoveClassification` enum. It is imported widely: by [`AccuracyOverview`](#srcsectionsanalysispanelaccuracyoverviewtsx), [`ClassificationGoodBad`](#srcsectionsanalysispanelclassificationgoodbadtsx), [`SettingsTabPanel`](#srcsectionsanalysispanelsettingstabpaneltsx), and [`chessigma/classifications.ts`](#srcsectionsanalysischessigmaclassificationsts).

---

## `src/sections/analysis/panel/CriticalAnalysis.tsx`

**In one sentence:** A "Position Dominance" report card showing, per game phase and per player, who controlled the game, with clickable rows that jump to each player's worst evaluation drop.

**What it is & why it exists (plain English):** This is an advanced summary that goes beyond move counts. It computes how much "dominance" each player had — the quality of positions they created on their own moves — broken down by opening/middlegame/endgame, and surfaces stats like control share, average win percentage, and the player's biggest blunder ("worst leak"). It helps a reviewer see *when* and *how* a player took or lost control.

**How it works, step by step:** It reads `gameEvalAtom` and game/player data, then uses `useMemo` to call `computePositionDominance(gameEval.positions)`, returning per-player profiles (or `null` if no positions). If null, it renders nothing. Otherwise it renders a `ReportSection` titled "Position Dominance" with an info tooltip. Inside, a row of `PhaseShareBar`s shows who owned each phase, and two `PlayerDominanceRow`s show each player's dominance percentage, an avatar, and metric chips (Control, Avg win, Swing, and Worst when significant). A row is clickable when the player has a meaningful worst leak; clicking calls `jumpToWorst`, which uses `goToMove` to navigate the board to that move.

**Components, functions & exports:**

- `PhaseShareBar({ phase, whiteShare, blackShare })` (internal) — a labeled two-color bar for one phase.
- `MetricStat({ label, value, color? })` (internal) — a small inline label/value pair.
- `PlayerDominanceRow({ name, profile, side, onJumpToWorst })` (internal) — one player's dominance summary row, clickable to jump to their worst moment.
- `CriticalAnalysis` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** `null` if no profiles, else the Position Dominance `ReportSection`.

**Connections:** Imports `boardAtom`/`gameAtom`/`gameEvalAtom` from `../states`, `usePlayersData`, `useChessActions`, the `computePositionDominance` helper and its types from `@/lib/positionDominance`, [`ReportSection`](#srcsectionsanalysispanelreportsectiontsx), and `REPORT_COLORS`/`PHASE_COLORS` from [`./reportColors`](#srcsectionsanalysispanelreportcolorsts). Rendered by [`ReportTabPanel`](#srcsectionsanalysispanelreporttabpaneltsx) and [`ReportViewerPanel`](#srcsectionsanalysispanelreportviewerpaneltsx).

---

## `src/sections/analysis/panel/EloOverview.tsx`

**In one sentence:** Displays each player's estimated Elo rating (a strength score) derived from the analyzed game.

**What it is & why it exists (plain English):** After analysis, VoltChess estimates how strong each player performed in this specific game, expressed as an Elo number (the standard chess rating scale). This component presents White's and Black's estimated Elo side by side, mirroring the accuracy display's layout, with a bar-chart icon in the middle.

**How it works, step by step:** It reads `gameEvalAtom`. If there is no report or no `estimatedElo`, it renders nothing. Otherwise it renders two `EloCard`s showing the rounded white and black estimated Elo values, separated by a labeled "ELO" icon column. The White card uses a lighter background to distinguish the sides.

**Components, functions & exports:**

- `EloCard({ value, side })` (internal) — renders one player's big Elo number, styled lighter for White.
- `EloOverview` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** `null` if there is no `estimatedElo`, otherwise the two Elo cards plus the center label.

**Connections:** Imports `gameEvalAtom` from `../states` and `usePalette`. Composed by [`PlayerStatsPanel`](#srcsectionsanalysispanelplayerstatspaneltsx).

---

## `src/sections/analysis/panel/EngineEvalBar.tsx`

**In one sentence:** A header row showing the current position's engine evaluation number, search depth, engine name, a best-move-arrow toggle, and a gear that opens engine settings.

**What it is & why it exists (plain English):** When studying a position, the most important single piece of information is the engine's evaluation — a number like "+1.2" meaning White is a bit better, or "M3" meaning mate in three. This bar shows that prominently, along with how deep the engine searched and which engine is running, and gives quick controls: a switch to show/hide the best-move arrow on the board and a settings gear.

**How it works, step by step:** It reads `currentPositionAtom` (for the live eval), `engineNameAtom`, `engineDepthAtom`, and the `showBestMoveArrowAtom` toggle, and keeps local state for whether the settings dialog is open. It takes the first (best) engine line and converts it to a display label with `getLineEvalLabel`; if there is no line it shows "—". The shown depth is the line's depth or the configured depth; the engine label comes from `ENGINE_LABELS`. It renders the toggle switch, the big eval text, a spacer, depth and engine captions, and a gear button that opens `EngineSettingsDialog`.

**Components, functions & exports:**

- `EngineEvalBar` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** the evaluation header row plus the (closed-by-default) `EngineSettingsDialog`.
  - **Steps:** (1) read atoms; (2) derive eval label/depth/engine label; (3) render the row and dialog.

**Connections:** Imports `currentPositionAtom`, `engineDepthAtom`, `engineNameAtom`, `showBestMoveArrowAtom` from `../states`; `ENGINE_LABELS`; `getLineEvalLabel` from `@/lib/chess`; `EngineSettingsDialog`; and `usePalette`. Rendered inside [`AnalysisTabPanel`](#srcsectionsanalysispanelanalysistabpaneltsx).

---

## `src/sections/analysis/panel/EngineLinesPanel.tsx`

**In one sentence:** Lists the engine's top recommended move sequences (principal variations) for the current position, with clickable moves and a "best" highlight.

**What it is & why it exists (plain English):** The engine does not only judge the move you played — it suggests what to do *now*. This panel shows the engine's best few continuations. Each line shows its first move, its evaluation, and the follow-up moves in proper chess notation; you can click any move in a line to play out that variation on the board. The single best line is highlighted with a crown.

**How it works, step by step:** The top-level component reads `boardAtom`, `currentPositionAtom`, and `engineMultiPvAtom`. If the position is checkmate, it renders nothing. It builds a placeholder skeleton array sized to the number of lines, then uses the real `position.eval.lines` if available (otherwise the skeleton). It renders one `EngineLineRow` per line, marking index 0 as the best. Each `EngineLineRow` shows a loading skeleton while depth is shallow (`< 6`); once ready it shows the first move (`firstSan`), an evaluation chip (colored by which side is better), an "is best" tag for the top line, and the remaining moves as clickable `PrettyMoveSan` elements. Clicking a follow-up move calls `addMoves` to play that variation up to the clicked move; converting UCI move strings to readable SAN is done with `moveLineUciToSan`.

**Components, functions & exports:**

- `EngineLineRow({ line, isBest })` (internal) — renders one engine line; includes `getColorFromMoveIdx` to alternate move colors and the click handler that calls `addMoves`.
- `EngineLinesPanel` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** `null` on checkmate, otherwise a scrollable list of engine lines (or skeletons).

**Connections:** Imports `boardAtom`/`currentPositionAtom`/`engineMultiPvAtom` from `../states`, `getLineEvalLabel`/`moveLineUciToSan` from `@/lib/chess`, `useChessActions`, the `LineEval` type, `usePalette`, and the shared `PrettyMoveSan` component. Rendered inside [`AnalysisTabPanel`](#srcsectionsanalysispanelanalysistabpaneltsx).

---

## `src/sections/analysis/panel/EnginePositionTracker.tsx`

**In one sentence:** An invisible component whose only job is to run the live-evaluation hook so the engine keeps evaluating the current position.

**What it is & why it exists (plain English):** Sometimes a component renders nothing but exists to run a behind-the-scenes process. This is one of those: by mounting it inside the Analysis tab, the app guarantees the engine is continuously re-evaluating whatever position is on the board, keeping `currentPositionAtom` fresh for the eval bar and engine lines.

**How it works, step by step:** It reads `engineNameAtom`, gets the matching engine via `useEngine`, and calls `useCurrentPosition(engine)` to wire up live evaluation. It then returns `null` (renders nothing).

**Components, functions & exports:**

- `EnginePositionTracker` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** `null`; its effect is the side effect of running live evaluation.

**Connections:** Imports `engineNameAtom` from `../states`, `useEngine`, and [`useCurrentPosition`](#srcsectionsanalysishooksusecurrentpositionts). Rendered by [`AnalysisTabPanel`](#srcsectionsanalysispanelanalysistabpaneltsx).

---

## `src/sections/analysis/panel/EvalLeadPanel.tsx`

**In one sentence:** An "Eval Lead" report card showing what share of the game each player spent with the better evaluation, plus peak advantage, longest run, and comeback counts.

**What it is & why it exists (plain English):** This card answers "who was ahead, and for how long?". It splits the game by who held the evaluation advantage at each move and presents the share for each side, along with their best peak win chance, the longest stretch they stayed ahead, and how many times they came back from behind. It is a narrative of momentum across the game.

**How it works, step by step:** It reads `gameEvalAtom` and player data, then uses `useMemo` to call `computeEvalLead(gameEval.positions)` (or `null`). If null, renders nothing. Otherwise it renders a `ReportSection` titled "Eval Lead" with an info tooltip, containing a `SplitShareBar` (white vs. black lead share) and two `PlayerSide` blocks (one left-aligned, one right-aligned) each showing the player's avatar, name, share percentage, and three `StatChip`s (Peak, Longest, Comebacks), with a caption explaining the metric.

**Components, functions & exports:**

- `StatChip({ label, value, color? })` (internal) — a compact metric display.
- `PlayerSide({ name, share, side, peak, longestRun, comebacks, align })` (internal) — one player's lead summary, mirrored left/right.
- `EvalLeadPanel` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** `null` if no lead data, else the Eval Lead `ReportSection`.

**Connections:** Imports `gameAtom`/`gameEvalAtom` from `../states`, `usePlayersData`, `computeEvalLead` from `@/lib/evalLead`, [`ReportSection`](#srcsectionsanalysispanelreportsectiontsx), [`SplitShareBar`](#srcsectionsanalysispanelsplitsharebartsx), and `REPORT_COLORS`. Rendered by [`ReportTabPanel`](#srcsectionsanalysispanelreporttabpaneltsx) and [`ReportViewerPanel`](#srcsectionsanalysispanelreportviewerpaneltsx).

---

## `src/sections/analysis/panel/FollowBestLineButton.tsx`

**In one sentence:** A single button that plays out the engine's best line from the current position onto the board.

**What it is & why it exists (plain English):** When the engine recommends a sequence of best moves, the user often wants to see how it would play out without clicking each move individually. This button does that in one click, applying the entire best line to the board.

**How it works, step by step:** It reads `currentPositionAtom` and `boardAtom`, and gets `addMoves` from `useChessActions(boardAtom)`. It takes the best line's move list (`position.eval.lines[0].pv`). The button is disabled when there is no best line or the game is over. Clicking it calls `addMoves(bestLine)` to play the whole sequence.

**Components, functions & exports:**

- `FollowBestLineButton` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** a full-width "Follow Best Line" button, disabled when no line is available or the game is over.

**Connections:** Imports `boardAtom`/`currentPositionAtom` from `../states`, `useChessActions`, `usePalette`, and the `accentContainedButtonSx` style. Rendered inside [`AnalysisTabPanel`](#srcsectionsanalysispanelanalysistabpaneltsx).

---

## `src/sections/analysis/panel/GameMovesCard.tsx`

**In one sentence:** A card with a header showing both players (and the result) and a scrollable, clickable list of all the game's moves.

**What it is & why it exists (plain English):** This is the move list that lets you see the whole game and jump to any move. The header shows White vs. Black (with ratings if available) and the game result; the body is the scrollable list of moves with their quality icons.

**How it works, step by step:** It reads `gameAtom`, gets player data via `usePlayersData(gameAtom)`, and reads the game's result header. If the game has no moves, it renders nothing. Otherwise it renders a bordered card: a three-column header (white name, result chip, black name) and a scrollable body (id `moves-panel`, which the move items use for auto-scroll targeting) containing the `MovesPanel` component that actually lists the moves.

**Components, functions & exports:**

- `GameMovesCard` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** `null` if no moves, otherwise the player/result header plus the scrollable `MovesPanel`.

**Connections:** Imports `gameAtom` from `../states`, `usePlayersData`, `usePalette`, and [`MovesPanel`](#srcsectionsanalysispanelbodyclassificationtabmovespanelindextsx) from `../panelBody/classificationTab/movesPanel`. Rendered inside [`AnalysisTabPanel`](#srcsectionsanalysispanelanalysistabpaneltsx).

---

## `src/sections/analysis/panel/MoveAnnotations.tsx`

**In one sentence:** A coach-only panel for reading and writing text notes attached to the specific move currently on the board, synced to the server.

**What it is & why it exists (plain English):** VoltChess supports coaching: a coach can leave written comments on particular moves of a student's game. This component shows the notes for the move you are currently viewing and lets coaches/admins add or delete notes. It only appears for users with the Coach or Admin role and only when authentication is enabled.

**How it works, step by step:** It uses the auth context to get the current user and checks the role. It reads `boardAtom`/`gameAtom`/`gameEvalAtom`, derives the current move index and FEN, and resolves the active server game id (from a prop or the URL). It fetches existing annotations with React Query (`fetchAnnotations`), enabled only when authentication, login, a game id, and section access all hold, then filters them to the current move. It defines a create mutation (which first syncs the analysis to the server if the game is not yet saved, via `syncAnalysisResult`, then calls `createAnnotation`) and a delete mutation (`deleteAnnotation`), both invalidating the query on success. It early-returns `null` if auth is disabled/loading or the user lacks access; it shows a "sync this game first" hint if there is no game id and no eval. Otherwise it renders existing notes (with delete buttons) and a text field plus "Add note" button.

**Components, functions & exports:**

- `MoveAnnotations` (default export) — the component.
  - **Props/params (`Props`):** `serverGameId?: string` — an explicit game id to attach notes to.
  - **Renders/returns:** `null` when not permitted; otherwise the notes list and the add-note form (or a hint to sync first).

**Connections:** Imports `boardAtom`/`gameAtom`/`gameEvalAtom` from `@/sections/analysis/states`; auth via `useAuth`; the `ENABLE_AUTHENTICATION` flag; annotation API functions; `useGameDatabase`; `syncAnalysisResult`; the `UserRole` type; React Query; and `usePalette`. Rendered (inside a "Coach notes" `ReportSection`) by [`ReportTabPanel`](#srcsectionsanalysispanelreporttabpaneltsx) and [`ReportViewerPanel`](#srcsectionsanalysispanelreportviewerpaneltsx) when the user is a coach/admin.

---

## `src/sections/analysis/panel/PlayerStatsPanel.tsx`

**In one sentence:** A tiny composer that stacks the Accuracy overview above the Elo overview as one report block.

**What it is & why it exists (plain English):** Accuracy and estimated Elo naturally belong together as a player-stats summary. Rather than wiring them separately into each report, this component bundles them into one reusable block.

**How it works, step by step:** It renders a vertical flex `Box` containing `AccuracyOverview` then `EloOverview`. It contains no logic of its own — each child decides whether to render based on the report data.

**Components, functions & exports:**

- `PlayerStatsPanel` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** a column with `AccuracyOverview` and `EloOverview`.

**Connections:** Imports [`AccuracyOverview`](#srcsectionsanalysispanelaccuracyoverviewtsx) and [`EloOverview`](#srcsectionsanalysispanelelooverviewtsx). Rendered inside the "Accuracy & ELO" `ReportSection` of [`ReportTabPanel`](#srcsectionsanalysispanelreporttabpaneltsx) and [`ReportViewerPanel`](#srcsectionsanalysispanelreportviewerpaneltsx).

---

## `src/sections/analysis/panel/reportColors.ts`

**In one sentence:** A fixed color palette for the report sections that deliberately ignores the user's theme so report colors (good/bad, player sides, phases) stay consistent.

**What it is & why it exists (plain English):** The app lets users pick color themes, but the analytical report relies on meaningful, stable colors — green for good, red for bad, blue for White, green for Black, etc. If those changed with the theme, charts could become confusing or unreadable. This file hard-codes those report colors so they never shift.

**How it works, step by step:** It exports a frozen object `REPORT_COLORS` with named hex colors (good, bad, opening, middle, endgame, control, peak, recovery, worst, neutral, text/textMuted, white/black player colors and their darker variants, avatar text, row backgrounds/borders, and track). It also exports `PHASE_COLORS`, which maps the three game phases (opening/middlegame/endgame) to a subset of those colors.

**Components, functions & exports:**

- `REPORT_COLORS` — the fixed palette object (`as const`).
- `PHASE_COLORS` — phase-to-color mapping (`as const`).

**Connections:** Imports nothing. Imported by [`ClassificationGoodBad`](#srcsectionsanalysispanelclassificationgoodbadtsx), [`CriticalAnalysis`](#srcsectionsanalysispanelcriticalanalysistsx), [`EvalLeadPanel`](#srcsectionsanalysispanelevalleadpaneltsx), and [`SplitShareBar`](#srcsectionsanalysispanelsplitsharebartsx).

---

## `src/sections/analysis/panel/ReportSection.tsx`

**In one sentence:** A reusable framed "card" with a colored dot, a title, optional header extras, and a content body — used to give every report block a consistent look.

**What it is & why it exists (plain English):** The report is a stack of distinct sections (graph, accuracy, dominance, etc.). To make them all look uniform, this component provides the shared card chrome — a header bar with a colored dot and title, and a padded body — so each section only worries about its own contents.

**How it works, step by step:** It renders a bordered `Box`; if a `tourId` is given it tags the element for the onboarding tour. The header is a flex row with a colored dot (the given `dotColor` or the theme accent), the title text, and any `headerExtra` (such as an info tooltip button). The body renders `children`, padded unless `noPadding` is set.

**Components, functions & exports:**

- `ReportSection` (default export) — the component.
  - **Props/params (`Props`):** `title` (string), `dotColor?`, `children`, `tourId?`, `noPadding?` (default `false`), `headerExtra?`.
  - **Renders/returns:** the framed card with header and body.

**Connections:** Imports only MUI and `usePalette`. Used throughout the report: [`ReportTabPanel`](#srcsectionsanalysispanelreporttabpaneltsx), [`ReportViewerPanel`](#srcsectionsanalysispanelreportviewerpaneltsx), [`EvalLeadPanel`](#srcsectionsanalysispanelevalleadpaneltsx), and [`CriticalAnalysis`](#srcsectionsanalysispanelcriticalanalysistsx).

---

## `src/sections/analysis/panel/ReportTabPanel.tsx`

**In one sentence:** The full interactive "Report" tab for the `/analysis` page — it handles loading a game, showing progress/empty states, and rendering all report sections once a report exists.

**What it is & why it exists (plain English):** This is the centerpiece of the analysis screen's right panel. Depending on the situation it shows very different things: if no game is loaded, it shows a game-loader; if a game is loaded but not analyzed, it shows an empty state and possibly a re-analyze button; while analyzing, it shows progress; and once a report exists, it shows the evaluation graph, accuracy/Elo, the good/bad classification breakdown, the eval-lead and position-dominance cards, and (for coaches) move notes. It is essentially a state machine that picks the right view.

**How it works, step by step:** It reads `gameAtom`, `gameEvalAtom`, and `evaluationProgressAtom`, and pulls analysis helpers from `useAnalyzeGame` (re-analyze function, engine readiness, whether this is a server game). It sets up chess actions for both `gameAtom` and `boardAtom` and a setter for the eval. It defines `resetAndSetGamePgn` (reset board, clear eval, set new game PGN) and `loadGame` (used by the inline loader: set the PGN, start a fresh analysis session, navigate to `/analysis`). It then derives flags: `hasMoves`, `gameLoaded` (via `isGameLoaded`), `isAnalyzing`, `needsReanalysis` (moves exist, no eval, not analyzing, not a server game), `showInlineLoader` (no eval and not analyzing), and `fillPanel` (loader shown and no game). 

Rendering logic, top to bottom: always render `EvaluationProgress`; if the inline loader should show and no game is loaded, render `LoadGameInlinePanel` (filling the panel); if the loader should show and a game *is* loaded, render `AnalysisEmptyState`. When a report exists, it renders the report sections in order — Evaluation graph, Accuracy & ELO, classification breakdown, Eval Lead, Critical Analysis (Position Dominance), and Coach notes (only for coaches/admins). If there is no eval, not analyzing, but a game is loaded, it still shows the evaluation-graph section (placeholder). Finally, if `needsReanalysis`, it renders a "Re-analyze this game" button (disabled until the engine is ready).

**Components, functions & exports:**

- `isGameLoaded(game)` (internal helper) — returns `true` if the game has a real White header or any moves.
- `ReportTabPanel` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** the appropriate report view for the current state (loader / empty / progress / full report), wrapped in a flex column that fills the panel only when the loader needs full height.
  - **Steps:** (1) read atoms and analysis helpers; (2) define `resetAndSetGamePgn`/`loadGame`; (3) compute state flags; (4) conditionally render progress, loader, empty state, report sections, and re-analyze button.

**Connections:** Imports `boardAtom`/`evaluationProgressAtom`/`gameAtom`/`gameEvalAtom` from `../states`; sibling components [`EvaluationProgress`](#srcsectionsanalysisevaluationprogresstsx), [`EvaluationGraphSection`](#srcsectionsanalysisevaluationgraphsectiontsx), [`AnalysisEmptyState`](#srcsectionsanalysisanalysisemptystatetsx); panel components [`PlayerStatsPanel`](#srcsectionsanalysispanelplayerstatspaneltsx), [`ClassificationGoodBad`](#srcsectionsanalysispanelclassificationgoodbadtsx), [`EvalLeadPanel`](#srcsectionsanalysispanelevalleadpaneltsx), [`CriticalAnalysis`](#srcsectionsanalysispanelcriticalanalysistsx), [`ReportSection`](#srcsectionsanalysispanelreportsectiontsx), [`MoveAnnotations`](#srcsectionsanalysispanelmoveannotationstsx); the `LoadGameInlinePanel`; hooks `useChessActions`, `useRouter`, `prepareNewAnalysisSession`, `useAnalyzeGame`, `useAuth`; and the `UserRole` type. It is supplied as the "Report" tab content in `src/pages/analysis.tsx`.

---

## `src/sections/analysis/panel/ReportViewerPanel.tsx`

**In one sentence:** The read-only "Report" panel for the `/review` page — it shows the saved report or a loading state, without any in-browser analysis or re-analyze option.

**What it is & why it exists (plain English):** The review page is for games that already have a saved analysis on the server, so it does not need loaders, progress bars, or re-analyze buttons — just a clean, read-only display. This component is the simplified twin of `ReportTabPanel` for that purpose. If the saved eval has not arrived yet, it shows a spinner with an option to switch to in-browser analysis instead.

**How it works, step by step:** It reads `gameAtom` and `gameEvalAtom`, gets the router and the user role. If there is no eval, it renders a loading card (spinner plus "Loading report…/game…" text), and — when a `gameId` exists and the game has moves — an "Analyze in browser instead" button that navigates to `/analysis?gameId=...`. Once the eval exists, it renders the same report sections as the analysis report: Evaluation graph, Accuracy & ELO, classification breakdown, Eval Lead, Critical Analysis, and Coach notes (for coaches/admins).

**Components, functions & exports:**

- `ReportViewerPanel` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** a loading card when there is no eval; otherwise the read-only report sections.

**Connections:** Imports `gameAtom`/`gameEvalAtom` from `../states`; sibling [`EvaluationGraphSection`](#srcsectionsanalysisevaluationgraphsectiontsx); panel components [`PlayerStatsPanel`](#srcsectionsanalysispanelplayerstatspaneltsx), [`ClassificationGoodBad`](#srcsectionsanalysispanelclassificationgoodbadtsx), [`EvalLeadPanel`](#srcsectionsanalysispanelevalleadpaneltsx), [`CriticalAnalysis`](#srcsectionsanalysispanelcriticalanalysistsx), [`ReportSection`](#srcsectionsanalysispanelreportsectiontsx), [`MoveAnnotations`](#srcsectionsanalysispanelmoveannotationstsx); `useAuth`, `useRouter`, and `UserRole`. It is supplied as the "Report" tab content in `src/pages/review.tsx`.

---

## `src/sections/analysis/panel/SettingsTabPanel.tsx`

**In one sentence:** The "Settings" tab where users load a game, view the classification name legend, pick a color theme, toggle board options, and open engine settings.

**What it is & why it exists (plain English):** The analysis screen needs a place for preferences and controls that do not belong in the report. This tab gathers them: a game loader, a legend explaining what each move-quality name means, a color-theme picker, board toggles (best-move arrow, move icons, flip board), and a shortcut to engine settings.

**How it works, step by step:** It reads/writes the relevant atoms: `colorThemeAtom`, `showBestMoveArrowAtom`, `showPlayerMoveIconAtom`, `boardOrientationAtom`, plus the engine name/depth. It renders a stack of `Section`s: **Game** (the `LoadGame` control), **Classification names** (two columns of `ClassificationItem`s for good and bad qualities, with a "stored locally" note), **Appearance** (a grid of `ThemeOption` swatches built from `COLOR_THEME_IDS`), **Board** (two `ToggleRow`s and a "Flip board" button that inverts `boardOrientationAtom`), and **Engine** (current engine/depth display and an "Engine settings" button). It keeps local state for whether the engine dialog is open and renders `EngineSettingsDialog`.

**Components, functions & exports:**

- `Section({ title, children })` (internal) — a titled settings card.
- `ToggleRow({ label, checked, onChange })` (internal) — a labeled on/off switch row.
- `ClassificationItem({ classification })` (internal) — one legend row (icon + friendly label).
- `ThemeOption({ themeId, selected, onSelect })` (internal) — a clickable color-theme swatch.
- `SettingsTabPanel` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** the full settings stack plus the engine dialog.

**Connections:** Imports `boardOrientationAtom`/`engineDepthAtom`/`engineNameAtom`/`showBestMoveArrowAtom`/`showPlayerMoveIconAtom` from `../states`; [`LoadGame`](#srcsectionsanalysispanelheaderloadgametsx) from `../panelHeader/loadGame`; `EngineSettingsDialog`; `colorThemeAtom` and theme metadata; `ENGINE_LABELS`; the `MoveClassification` enum; and the classification lists/labels from [`./classificationLabels`](#srcsectionsanalysispanelclassificationlabelsts). Supplied as the "Settings" tab content in `src/pages/analysis.tsx`.

---

## `src/sections/analysis/panel/SplitShareBar.tsx`

**In one sentence:** A small two-segment horizontal bar that visually splits a percentage between White (left) and Black (right).

**What it is & why it exists (plain English):** Several report cards need to show "X% vs Y%" as a single bar — for example, how much of the game each player led. This reusable bar draws that split using the fixed report colors, clamping values so they never overflow.

**How it works, step by step:** It takes `leftShare` and `rightShare` (and an optional `height`), clamps each between 0 and 100, and renders a rounded track containing a white-player-colored segment sized to `left%` and a black-player-colored segment sized to `right%`, each given a small minimum width when non-zero so tiny shares stay visible.

**Components, functions & exports:**

- `SplitShareBar` (default export) — the component.
  - **Props/params (`Props`):** `leftShare` (number), `rightShare` (number), `height?` (number, default `10`).
  - **Renders/returns:** the two-segment proportion bar.

**Connections:** Imports `REPORT_COLORS` from [`./reportColors`](#srcsectionsanalysispanelreportcolorsts). Used by [`EvalLeadPanel`](#srcsectionsanalysispanelevalleadpaneltsx).

---

## `src/sections/analysis/panelHeader/analyzeButton.tsx`

**In one sentence:** An invisible controller that automatically starts in-browser Stockfish analysis for a newly loaded game (and runs live evaluation), guarding against infinite re-analysis loops.

**What it is & why it exists (plain English):** Despite its name, this renders no button. It is the automatic trigger that kicks off whole-game analysis as soon as a game is loaded and the engine is ready. It also runs the live-position evaluation. Critically, it remembers which game (by PGN) it already analyzed, so a failed or aborted run does not immediately re-trigger and spawn endless engine workers.

**How it works, step by step:** It reads `engineNameAtom`, gets the engine via `useEngine`, and calls `useCurrentPosition(engine)` for live evaluation. It gets the progress setter and `gameAtom`, and pulls `analyzeGame`, `readyToAnalyse`, and `gameEval` from `useAnalyzeGame`. It keeps a `useRef` (`autoAnalyzedPgnRef`) of the last auto-analyzed PGN. One effect resets progress to 0 whenever the engine changes. A second effect: returns early if a report already exists or the engine is not ready; otherwise reads the current PGN, and if it is non-empty and different from the last analyzed PGN, records it and calls `analyzeGame()` (logging start/completion/failure). It returns `null`.

**Components, functions & exports:**

- `AnalyzeButton` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** `null`; its effects auto-start analysis and run live evaluation.

**Connections:** Imports `engineNameAtom`/`evaluationProgressAtom`/`gameAtom` from `../states`; `useAnalyzeGame`; `useEngine`; and [`useCurrentPosition`](#srcsectionsanalysishooksusecurrentpositionts). Rendered (invisibly) by `src/pages/analysis.tsx`.

---

## `src/sections/analysis/panelHeader/loadGame.tsx`

**In one sentence:** A small control row with a "Load game" button (and, when applicable, a "Re-analyze game" button) used inside the Settings tab.

**What it is & why it exists (plain English):** Users need a quick way to load a different game into the analyzer. This component provides that button; once a game is loaded but not yet analyzed, it also offers a re-analyze button. It is the compact, in-settings version of game loading.

**How it works, step by step:** It reads `gameAtom`, sets up chess actions for `gameAtom` and `boardAtom`, and a setter for the eval, plus `reanalyzeGame`/`gameEval`/`evaluationProgress`/`engineReady` from `useAnalyzeGame`. `resetAndSetGamePgn` resets the board, clears the eval, and sets the new game PGN. It computes `isGameLoaded` and `needsReanalysis` (loaded, no eval, not currently analyzing). It renders a `LoadGameButton` whose label switches between "Load game" and "Load new game"; loading a game resets state, starts a fresh analysis session, and navigates to `/analysis`. When re-analysis is needed it also renders a "Re-analyze game" button (disabled while the engine loads or analysis runs).

**Components, functions & exports:**

- `LoadGame` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** the load (and optional re-analyze) button row.

**Connections:** Imports `boardAtom`/`gameAtom`/`gameEvalAtom` from `../states`; the `LoadGameButton` from `../../loadGame/loadGameButton`; `useChessActions`, `useRouter`, `useAnalyzeGame`, and `prepareNewAnalysisSession`. Rendered inside the "Game" section of [`SettingsTabPanel`](#srcsectionsanalysispanelsettingstabpaneltsx).

---

## `src/sections/analysis/panelBody/classificationTab/movesPanel/index.tsx`

**In one sentence:** Builds the move list data (pairs of White/Black moves with their classifications) and renders it as a column of move lines.

**What it is & why it exists (plain English):** The move list needs the game's moves grouped into numbered pairs (White's move and Black's reply on each row), each tagged with its quality classification. This component computes that structure from the game data and hands each row to a `MovesLine` for display.

**How it works, step by step:** It reads `gameAtom`, `boardAtom`, and `gameEvalAtom`. Using `useMemo`, it picks the move history (the game's history if present, otherwise the board's), and if empty returns `undefined`. It then loops two moves at a time, building rows of `{ san, moveClassification }` objects — pulling the classification from `gameEval.positions[i+1]`/`[i+2]` (offset by one because index 0 is the start position) only when the full game history is available. If there are no rows, it renders nothing; otherwise it renders an MUI grid mapping each row to a `MovesLine`.

**Components, functions & exports:**

- `MovesPanel` (default export) — the component.
  - **Props/params:** none.
  - **Renders/returns:** `null` if no moves, otherwise a scrollable grid of `MovesLine`s.
  - **Steps:** (1) read atoms; (2) `useMemo` to build `gameMoves` pairs with classifications; (3) render `MovesLine` per row.

**Connections:** Imports `boardAtom`/`gameAtom`/`gameEvalAtom` from `../../../states`, the `MoveClassification` enum, and [`MovesLine`](#srcsectionsanalysispanelbodyclassificationtabmovespanelmoveslinetsx). Rendered inside [`GameMovesCard`](#srcsectionsanalysispanelgamemovescardtsx).

---

## `src/sections/analysis/panelBody/classificationTab/movesPanel/moveItem.tsx`

**In one sentence:** Renders a single clickable move (with optional quality icon), highlights it when it is the current move, and auto-scrolls the move list to keep it visible.

**What it is & why it exists (plain English):** Each move in the list is its own small interactive element. This component draws one move in proper notation, shows its quality icon for notable classifications, highlights the move you are currently viewing, scrolls the list so the current move stays on screen, and lets you click to jump the board to that move.

**How it works, step by step:** It reads `gameAtom`, `boardAtom`, and `currentPositionAtom`, and gets `goToMove` from `useChessActions(boardAtom)`. It determines its icon color via `getMoveColor` (which returns nothing for ignored classifications like Okay/Excellent/Forced). It computes `isCurrentMove` by comparing `position.currentMoveIdx` to its own `moveIdx`. A `useEffect` scrolls the `moves-panel` container so the current move is centered when it changes — adjusting `scrollTop` only on the panel, not the whole page. Clicking calls `handleClick`, which (unless it is already the current move) jumps via `goToMove`, choosing the game or board object appropriately. It renders an optional quality icon image and the move in `PrettyMoveSan`, with accent highlight styling when current.

**Components, functions & exports:**

- `MoveItem` (default export) — the component.
  - **Props/params (`Props`):** `san` (the move text), `moveClassification?`, `moveIdx` (its index in the position list), `moveColor` (`"w"`/`"b"`).
  - **Renders/returns:** one move cell, highlighted and auto-scrolled when current.
- `getMoveColor(moveClassification?)` (internal helper) — returns the icon color, or `undefined` for ignored classifications.
- `moveClassificationsToIgnore` (internal constant) — classifications that get no icon: Okay, Excellent, Forced.

**Connections:** Imports `boardAtom`/`currentPositionAtom`/`gameAtom` from `../../../states`, the `MoveClassification` enum, `useChessActions`, `CLASSIFICATION_COLORS`, `PrettyMoveSan`, and `usePalette`. Rendered by [`MovesLine`](#srcsectionsanalysispanelbodyclassificationtabmovespanelmoveslinetsx).

---

## `src/sections/analysis/panelBody/classificationTab/movesPanel/movesLine.tsx`

**In one sentence:** Renders one numbered row of the move list: the move number, White's move, and Black's reply (or a blank spacer if Black has not moved).

**What it is & why it exists (plain English):** Chess move lists are organized by move number, with White's and Black's moves on the same line ("1. e4 e5"). This component draws exactly one such line, delegating each half-move to a `MoveItem`.

**How it works, step by step:** It takes a `moves` array (one or two half-moves) and a `moveNb`. It renders the move number, then a `MoveItem` for White's move with computed index `(moveNb - 1) * 2 + 1`, then either a `MoveItem` for Black's move (index `+2`) or an empty spacer box if Black has no move yet. The `moveColor` is set to `"w"`/`"b"` accordingly.

**Components, functions & exports:**

- `MovesLine` (default export) — the component.
  - **Props/params (`Props`):** `moves` (array of `{ san, moveClassification? }`), `moveNb` (the 1-based move number).
  - **Renders/returns:** one move-number row with up to two `MoveItem`s.

**Connections:** Imports the `MoveClassification` enum and [`MoveItem`](#srcsectionsanalysispanelbodyclassificationtabmovespanelmoveitemtsx). Rendered by [`MovesPanel`](#srcsectionsanalysispanelbodyclassificationtabmovespanelindextsx).

---

## `src/sections/analysis/panelBody/graphTab/index.tsx`

**In one sentence:** Draws the evaluation line-chart (using Recharts) with clickable points, quality dots on notable moves, and a marker for the current position.

**What it is & why it exists (plain English):** This is the actual evaluation graph — the squiggly area chart showing who was winning across the whole game. The vertical axis runs from "Black winning" at the bottom to "White winning" at the top; the horizontal axis is the move number. Standout moves (brilliancies, blunders, etc.) get colored dots, you can click anywhere on the chart to jump the board to that move, and a vertical line marks where you currently are.

**How it works, step by step:** It reads `gameEvalAtom`, `currentPositionAtom`, `gameAtom`, and `goToMove`. With `useMemo`, it converts each position into chart data via `formatEvalToChartData`, which maps centipawn/mate evaluations onto a 0–20 vertical scale (10 = equal, 20 = White mating, 0 = Black mating; centipawns are clamped to ±10 pawns then offset by 10). It computes `bestDotIndices` — a random ~15% sample of "Best" moves to dot (so the chart is not cluttered with dots on every good move). `renderDot` decides per point whether to draw a `CustomDot`: always for Splendid/Perfect/Blunder/Mistake, and for the sampled subset of Best moves; otherwise an empty SVG. The current move's dot color comes from its classification (or grey). If there is no eval, it renders nothing. Otherwise it renders a Recharts `AreaChart` inside a `ResponsiveContainer`: a hidden X axis, a Y axis with ticks at −20/0/+20, a tooltip, the filled area with custom dots, a reference line at the equal level (y=10), and a reference line marking the current move index (colored by the current move's quality). Clicking the chart reads the clicked point's payload and calls `goToMove`.

**Components, functions & exports:**

- `GraphTab` (default export) — the component.
  - **Props/params:** MUI `Grid2Props` (forwarded to the container; `hidden`/`sx` control visibility/styling).
  - **Renders/returns:** `null` if no eval, otherwise the Recharts evaluation chart.
  - **Steps:** (1) build `chartData`; (2) compute `bestDotIndices`; (3) define `renderDot`; (4) render the area chart with axes, tooltip, dots, and reference lines; (5) handle clicks to jump moves.
- `formatEvalToChartData(position, index)` (internal helper) — converts one position eval into a `ChartItemData` point on the 0–20 scale.

**Connections:** Imports `boardAtom`/`currentPositionAtom`/`gameAtom`/`gameEvalAtom` from `../../states`; Recharts primitives; [`CustomTooltip`](#srcsectionsanalysispanelbodygraphtabtooltiptsx); the [`ChartItemData`](#srcsectionsanalysispanelbodygraphtabtypests) type; `CLASSIFICATION_COLORS`; [`CustomDot`](#srcsectionsanalysispanelbodygraphtabdottsx); the `MoveClassification` enum; `useChessActions`; and `usePalette`. It is wrapped and sized by [`EvaluationGraphSection`](#srcsectionsanalysisevaluationgraphsectiontsx).

---

## `src/sections/analysis/panelBody/graphTab/dot.tsx`

**In one sentence:** Renders a single colored circle dot on the evaluation chart, colored by the move's classification.

**What it is & why it exists (plain English):** The evaluation graph marks notable moves with colored dots (e.g., red for a blunder, gold for a brilliancy). This tiny component draws one such dot at the chart coordinates Recharts provides, using the classification's color.

**How it works, step by step:** It receives Recharts dot props (`cx`, `cy`, `r`) plus the data `payload`. It looks up the color from `CLASSIFICATION_COLORS` by the payload's classification (defaulting to grey), and renders an SVG `circle` at that position with that color for both stroke and fill.

**Components, functions & exports:**

- `CustomDot` (default export) — the component.
  - **Props/params:** Recharts `DotProps` extended with optional `payload: ChartItemData`.
  - **Renders/returns:** an SVG `circle` colored by classification.

**Connections:** Imports the [`ChartItemData`](#srcsectionsanalysispanelbodygraphtabtypests) type and `CLASSIFICATION_COLORS`. Used by [`graphTab/index.tsx`](#srcsectionsanalysispanelbodygraphtabindextsx) (both for static dots and as the active/hover dot).

---

## `src/sections/analysis/panelBody/graphTab/tooltip.tsx`

**In one sentence:** Renders the small popup shown when hovering a point on the evaluation chart, displaying that position's evaluation label.

**What it is & why it exists (plain English):** When you hover over the evaluation graph, you want to know the exact evaluation at that move. This component renders the little box that appears, showing the human-readable evaluation (like "+1.5" or "M2") for the hovered point.

**How it works, step by step:** It receives Recharts tooltip props. If the tooltip is not active or there is no data, it renders nothing. Otherwise it reads the hovered point's payload, runs it through `getLineEvalLabel` to get a readable string, and renders a small light-gray bordered box containing that label.

**Components, functions & exports:**

- `CustomTooltip` (default export) — the component.
  - **Props/params:** Recharts `TooltipProps<number, number>` (`active`, `payload`).
  - **Renders/returns:** `null` when inactive, otherwise a small label box with the evaluation.

**Connections:** Imports the [`ChartItemData`](#srcsectionsanalysispanelbodygraphtabtypests) type and `getLineEvalLabel` from `@/lib/chess`. Used by [`graphTab/index.tsx`](#srcsectionsanalysispanelbodygraphtabindextsx).

---

## `src/sections/analysis/panelBody/graphTab/types.ts`

**In one sentence:** Defines the `ChartItemData` type — the shape of a single data point on the evaluation chart.

**What it is & why it exists (plain English):** TypeScript types describe the shape of data so the rest of the code can use it safely. This file defines what one point on the evaluation graph looks like, which the chart, dots, and tooltip all rely on to stay consistent.

**How it works, step by step:** It declares an interface with the fields a chart point needs. There is no runtime logic.

**Components, functions & exports:**

- `ChartItemData` (exported interface) — fields: `moveNb` (the move number / x-position), `value` (the plotted 0–20 height), `cp?` (centipawn evaluation, optional), `mate?` (moves-to-mate, optional), and `moveClassification?` (the move's quality, optional, used to color dots).

**Connections:** Imports the `MoveClassification` enum. Imported by [`graphTab/index.tsx`](#srcsectionsanalysispanelbodygraphtabindextsx), [`dot.tsx`](#srcsectionsanalysispanelbodygraphtabdottsx), and [`tooltip.tsx`](#srcsectionsanalysispanelbodygraphtabtooltiptsx).

---
