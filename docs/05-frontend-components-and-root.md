# VoltChess Frontend — Shared Components & App-Entry Files

This document is an exhaustive, beginner-friendly tour of two parts of the VoltChess web app: the **shared UI components** that live in `src/components/` (plus its `board/` and `prettyMoveSan/` subfolders), and the **app-entry / root files** that live directly inside `src/` (`App.tsx`, `main.tsx`, `api.tsx`, `sentry.client.config.ts`, and `vite-env.d.ts`). The aim is that even someone who has never written front-end code can read any single section and understand precisely what that file does, why it exists, and how it connects to the rest of the app.

## A short plain-English primer (read this first)

If you have never built a website before, these few words come up on almost every page below. Here is what they mean in everyday language:

- **A React "component"**: a reusable piece of the user interface — a button, a dialog box, a chessboard, a loading spinner. The whole VoltChess screen is built by nesting many components inside one another, like LEGO bricks. A component is just a function that returns a description of what should appear on screen. **React** is the popular library that turns those descriptions into the actual pixels you see, and re-draws them automatically whenever the underlying data changes.
- **"Props"** (short for *properties*): the **inputs you pass into a component**, exactly like the arguments you pass into a function. For example, the logout dialog takes a `username` prop so it can say "sign out of *Alice's* account". Props flow *downwards*: a parent component hands props to its children. A child cannot change its own props — it just reads them and renders accordingly. Many props are callbacks (functions like `onConfirm`) that let a child tell its parent "the user clicked me".
- **A "route guard"**: a special component that wraps a page and **decides whether you are allowed to see it**. Before the real page renders, the guard checks something — "Are you logged in?" (`RequireAuth`), "Are you a coach?" (`RoleRoute`), "Are you *already* logged in and therefore should not see the login screen?" (`GuestRoute`). If the answer is no, the guard quietly sends you somewhere else (usually the login page or your own dashboard) instead of showing the page.
- **The app-entry files**: every web app needs a starting point. `main.tsx` is the **ignition switch** — the very first code that runs in the browser; it wires up the global helpers (routing, data-fetching, authentication, theming) and then "renders" the app into the empty HTML page. `App.tsx` is the **table of contents** — it lists every page (route) in the app and says which URL shows which page, and which guard protects it.
- **Other jargon you will meet**: **MUI** (Material UI) is the ready-made component toolkit VoltChess uses for buttons, dialogs, grids, and so on — anything imported from `@mui/material`. **Jotai** holds shared data in "atoms" (labeled boxes any component can read/write). **TanStack Query** (a.k.a. React Query) fetches and caches data from the server. **PGN** is the text format for a whole recorded chess game; **FEN** is a snapshot of one board position. **JWT** is the digital "wristband" the server gives you when you log in, proving who you are on later requests.

With that vocabulary in hand, the rest of the document walks through every file, one at a time.

## Table of contents

**Shared components (`src/components/`)**
- [`src/components/ConfirmLogoutDialog.tsx`](#srccomponentsconfirmlogoutdialogtsx)
- [`src/components/ErrorBoundary.tsx`](#srccomponentserrorboundarytsx)
- [`src/components/GuestRoute.tsx`](#srccomponentsguestroutetsx)
- [`src/components/Head.tsx`](#srccomponentsheadtsx)
- [`src/components/KeyboardShortcuts.tsx`](#srccomponentskeyboardshortcutstsx)
- [`src/components/LinearProgressBar.tsx`](#srccomponentslinearprogressbartsx)
- [`src/components/Link.tsx`](#srccomponentslinktsx)
- [`src/components/Loading.tsx`](#srccomponentsloadingtsx)
- [`src/components/LocalGameMigrationPrompt.tsx`](#srccomponentslocalgamemigrationprompttsx)
- [`src/components/NavLink.tsx`](#srccomponentsnavlinktsx)
- [`src/components/PageContainer.tsx`](#srccomponentspagecontainertsx)
- [`src/components/pageTitle.tsx`](#srccomponentspagetitletsx)
- [`src/components/PlatformSyncOrchestrator.tsx`](#srccomponentsplatformsyncorchestratortsx)
- [`src/components/RequireAuth.tsx`](#srccomponentsrequireauthtsx)
- [`src/components/RoleRoute.tsx`](#srccomponentsroleroutetsx)
- [`src/components/RouteAnalytics.tsx`](#srccomponentsrouteanalyticstsx)
- [`src/components/SchemaOrg.tsx`](#srccomponentsschemaorgtsx)
- [`src/components/slider.tsx`](#srccomponentsslidertsx)
- [`src/components/ThemeProvider.tsx`](#srccomponentsthemeprovidertsx)
- [`src/components/VoltChessLogo.tsx`](#srccomponentsvoltchesslogotsx)

**Board components (`src/components/board/`)**
- [`src/components/board/index.tsx`](#srccomponentsboardindextsx)
- [`src/components/board/capturedPieces.tsx`](#srccomponentsboardcapturedpiecestsx)
- [`src/components/board/evaluationBar.tsx`](#srccomponentsboardevaluationbartsx)
- [`src/components/board/playerHeader.tsx`](#srccomponentsboardplayerheadertsx)
- [`src/components/board/squareRenderer.tsx`](#srccomponentsboardsquarerenderertsx)
- [`src/components/board/states.ts`](#srccomponentsboardstatests)

**Pretty move notation (`src/components/prettyMoveSan/`)**
- [`src/components/prettyMoveSan/index.tsx`](#srccomponentsprettymovesanindextsx)
- [`src/components/prettyMoveSan/chess-font.css`](#srccomponentsprettymovesanchess-fontcss)

**App-entry / root files (`src/`)**
- [`src/App.tsx`](#srcapptsx)
- [`src/main.tsx`](#srcmaintsx)
- [`src/api.tsx`](#srcapitsx)
- [`src/sentry.client.config.ts`](#srcsentryclientconfigts)
- [`src/vite-env.d.ts`](#srcvite-envdts)

---

## `src/components/ConfirmLogoutDialog.tsx`

**In one sentence:** A small pop-up window that asks "Sign out?" and waits for the user to confirm or cancel before actually logging them out.

**What it is & why it exists (plain English):** Logging out is an action you do not want to trigger by accident, because you would have to type your password again to get back in. This component is a *confirmation dialog* — a little box that floats over the page, dims everything behind it, and forces a yes/no decision. It exists so that clicking "Sign out" somewhere in the app opens this safety check instead of immediately ending the session.

It is a "dumb" / presentational component: it holds no logic of its own about *how* to log out. It simply displays a message and reports back which button the user pressed. The parent that uses it decides what "sign out" actually does.

**How it works, step by step:** The component builds an MUI `Dialog`. When the `open` prop is `true` the dialog is visible; when `false` it is hidden. Inside it shows a title ("Sign out?"), a body sentence, and two buttons. The body sentence is *personalised*: if a `username` was provided it reads "You'll need to sign in again to access **{username}**'s academy account.", otherwise it falls back to the generic "...to access your academy account." Pressing **Cancel** (or clicking the dimmed backdrop, which fires `onClose`) calls `onCancel`; pressing the red **Sign out** button calls `onConfirm`.

**Props, functions & exports:**

- **`ConfirmLogoutDialog` (default export, a component).** Props:
  - `open` (boolean) — whether the dialog is currently shown.
  - `username` (optional text) — used to personalise the warning sentence.
  - `onCancel` (function) — called when the user cancels or dismisses the dialog; the parent typically just closes it.
  - `onConfirm` (function) — called when the user confirms; the parent runs the real logout here.
  - **Renders:** an MUI modal dialog (`maxWidth="xs"`, full-width) with a title, one paragraph of secondary-coloured text, and a Cancel / Sign-out button pair. It returns nothing meaningful itself — its only "output" is calling `onCancel` or `onConfirm`.

**Connections:** Imports `Button`, `Dialog`, `DialogActions`, `DialogContent`, `DialogTitle`, and `Typography` from `@mui/material`. It is used wherever a logout button lives (for example the navigation/layout header), which supplies the `open` state and the two callbacks.

---

## `src/components/ErrorBoundary.tsx`

**In one sentence:** A safety net that catches unexpected crashes anywhere inside the app and shows a friendly "Something went wrong" screen instead of a blank white page.

**What it is & why it exists (plain English):** In React, if one component throws an error while drawing itself, by default the *entire* app can disappear and leave the user staring at a blank page. An **error boundary** is a special kind of component that wraps around other components and "catches" such crashes, the way a `try/catch` catches errors in ordinary code. It exists so that a bug in, say, the analysis board does not take down the whole site — instead the user sees a calm, branded error card with buttons to recover.

This is one of the few components written as a **class** rather than a function, because the React feature that catches errors (the lifecycle methods below) is only available to class components.

**How it works, step by step:** It keeps internal state with a `hasError` flag (plus the captured `error` and `errorInfo`). React calls `getDerivedStateFromError` the moment a child throws — this flips `hasError` to `true` and stores the error. React also calls `componentDidCatch`, which logs the error to the console for developers. On the next render, because `hasError` is now true, the component shows the error UI instead of its children. The error UI is a centred `Paper` card with a red alert, a playful "⚡ Oops! Chess Engine Malfunction" heading, a bullet list of likely causes, and two buttons: **🔄 Try Again** (resets `hasError` to false to attempt re-rendering the children) and **🏠 Reload Page** (reloads the whole browser tab). In development mode only (`NODE_ENV === "development"`), it additionally shows the raw error message and component stack for debugging. If everything is fine (`hasError` is false), it simply renders its `children` untouched.

**Props, functions & exports:**

- **`ErrorBoundary` (default export, a class component).** Props:
  - `children` (React nodes) — the part of the app to protect.
  - `fallback` (optional React node) — a custom screen to show on error instead of the built-in card.
  - Methods: `getDerivedStateFromError(error)` returns the new error state; `componentDidCatch(error, errorInfo)` logs and stores details; `handleReset()` clears the error so the children get another chance.
  - **Renders:** either `children` (normal case), the custom `fallback` (if provided and an error occurred), or the built-in error card.

**Connections:** Imports layout/feedback widgets (`Box`, `Typography`, `Button`, `Paper`, `Alert`, `AlertTitle`) from `@mui/material` and `Component`, `ErrorInfo`, `ReactNode` from `react`. It is used in [`App.tsx`](#srcapptsx) as the outermost wrapper around the entire routed application.

---

## `src/components/GuestRoute.tsx`

**In one sentence:** A route guard that keeps already-signed-in users *away* from "guest-only" pages like Login and Register, bouncing them to their own dashboard instead.

**What it is & why it exists (plain English):** Some pages only make sense if you are *not* logged in — there is no point showing the login form to someone who is already logged in. `GuestRoute` is the mirror image of [`RequireAuth`](#srccomponentsrequireauthtsx): instead of demanding that you be signed in, it demands that you be signed *out*. It exists so that, for example, a logged-in coach who clicks an old bookmark to `/login` is sent straight to their coach dashboard rather than being shown a redundant sign-in screen.

**How it works, step by step:** It reads the current authentication status from the `useAuth` context (`loading`, `isAuthenticated`, `user`). If authentication is globally disabled (`ENABLE_AUTHENTICATION` is false) the guard does nothing and just shows its children. While auth status is still `loading` it shows a `LoadingSpinner`. Once loaded, an effect checks: *am I authenticated?* If yes, it computes where to send the user and calls `router.replace(target)` (replace, not push, so the login page does not linger in the browser's back history). The destination is chosen carefully so it never fights with the login handler: it honours an explicit `redirectTo` prop first; otherwise it honours a deep link the user originally came from (stored in `location.state.from`, but ignored if that was `/`, `/login`, or `/register`); otherwise it falls back to `landingForRole(user.role)`, the user's role-specific home page. While a signed-in user is mid-redirect the component renders `null` (nothing) to avoid a flash of the guest page.

**Props, functions & exports:**

- **`GuestRoute` (default export, a component).** Props:
  - `children` (React nodes) — the guest-only page to show when the visitor is *not* signed in.
  - `redirectTo` (optional text) — an explicit override destination for signed-in users.
  - **Returns:** the `children` for signed-out visitors; a `LoadingSpinner` while auth loads; or `null` (while redirecting a signed-in user away).

**Connections:** Uses `useRouter` (`@/hooks/useRouter`), `useLocation` (react-router), `useAuth` (`@/contexts/AuthContext`), `landingForRole` (`@/lib/auth`), the `ENABLE_AUTHENTICATION` flag (`@/constants`), and `LoadingSpinner` from [`Loading.tsx`](#srccomponentsloadingtsx). It wraps the Login/Register pages.

---

## `src/components/Head.tsx`

**In one sentence:** An invisible helper that lets any page set the browser tab title and the `<meta>` tags (used for SEO and social-media previews) by writing them straight into the document head.

**What it is & why it exists (plain English):** Every web page has a hidden `<head>` section containing its title (shown on the browser tab) and "meta" tags (snippets that search engines and Facebook/Twitter read to build a preview card). VoltChess is a single-page app, so the head does not change on its own when you navigate. `Head` is a tiny utility that mimics the popular `react-helmet` idea: you write child elements that *look* like `<title>` and `<meta>` tags, and this component copies their values into the real document head. It exists so each page can declare its own title/description in a natural, readable way.

**How it works, step by step:** `Head` renders nothing visible (`return null`). Its work happens in an effect that runs whenever its `children` change. The effect walks through each child element: if the element's type is `"title"`, it sets `document.title` to that element's text; if the type is `"meta"`, it reads the child's `name`/`property`/`content` props, removes any existing matching meta tag from the head (to avoid duplicates), then creates a fresh `<meta>` element with those attributes and appends it to `document.head`.

**Props, functions & exports:**

- **`Head` (default export, a component).** Props:
  - `children` (React nodes) — pseudo-elements (`<title>`, `<meta>`) describing what to write into the document head.
  - Internal helper `processChildren(children)` does the parsing-and-applying described above.
  - **Renders:** `null` (it produces only side effects on the real document head).

**Connections:** Uses only `useEffect` from React. It is consumed by [`pageTitle.tsx`](#srccomponentspagetitletsx), which feeds it a standard set of title/description meta tags.

---

## `src/components/KeyboardShortcuts.tsx`

**In one sentence:** A floating keyboard icon that, combined with a help dialog, lets power users drive the app (navigate moves, flip the board, run analysis) via single key presses.

**What it is & why it exists (plain English):** Serious chess users like to fly through games with the keyboard instead of the mouse. This component does two jobs: (1) it listens globally for shortcut keys and reports them to whatever page is interested, and (2) it offers a discoverable cheat-sheet — a small lightning/keyboard button fixed in the bottom-right corner that opens a styled dialog listing every shortcut, grouped by category. It exists to make the app fast for keyboard users while keeping those shortcuts easy to discover.

**How it works, step by step:** A constant `shortcuts` array lists each shortcut (`key`, human `description`, and a `category` of "navigation", "analysis", or "game"). The component keeps one piece of state, `open`, controlling whether the help dialog is visible. An effect attaches a global `keydown` listener to the window. When a key is pressed, the listener first ignores it if the user is typing into an input, textarea, or select (so typing a question mark in a search box does not pop the help dialog). Then it switches on the key: `?` toggles the help dialog open/closed; `Escape` closes it; and a set of action keys (arrow keys, space, `f`/`F`, `a`/`A`, `h`/`H`, `r`/`R`) call the optional `onShortcut` callback with the raw key so the host page can act on it. The listener is removed on cleanup. Visually it renders a fixed `Fab` (floating action button) with a keyboard icon, plus the help `Dialog`, which loops over the three categories and shows each shortcut's description next to a colour-coded `Chip` showing the key (with a `getCategoryColor` helper mapping category → MUI colour). A "Pro tip" callout reminds the user they can press `?` anytime.

**Props, functions & exports:**

- **`KeyboardShortcuts` (named export, a component).** Props:
  - `onShortcut` (optional function `(key: string) => void`) — called with the pressed action key so the parent (for example the analysis page) can respond.
  - Internal helper `getCategoryColor(category)` maps a category to an MUI colour name.
  - **Renders:** a fixed floating button and a help dialog listing all shortcuts.

**Connections:** Imports MUI widgets (`Dialog`, `Fab`, `Chip`, etc.) and the `Icon` component from `@iconify/react`. The host page supplies `onShortcut` to wire keys to real behaviour.

---

## `src/components/LinearProgressBar.tsx`

**In one sentence:** A labelled horizontal progress bar that shows a percentage (for example move-accuracy or analysis progress) in the VoltChess accent colour.

**What it is & why it exists (plain English):** A progress bar is the familiar filling strip that communicates "how far along" something is. This is a thin wrapper around MUI's `LinearProgress` that adds a text label on the left and the numeric percentage on the right, and themes the filled portion with the app's accent colour. It exists so the rest of the app can drop in a consistent-looking progress indicator with a single line.

**How it works, step by step:** It pulls the current colour palette via the `usePalette` hook. As a guard, if `value` is exactly `0` it renders nothing (`return null`) — an empty bar would be visual clutter. Otherwise it lays out a single-row MUI `Grid` containing three things: the `label` text on the left, the `LinearProgress` bar in the middle (stretched to full width), and a rounded percentage (`{Math.round(value)}%`) on the right. The bar is styled in `determinate` mode (the fill reflects the exact value), with a rounded 5px-tall track whose unfilled colour adapts to light/dark mode and whose filled `bar` uses `palette.accent`.

**Props, functions & exports:**

- **`LinearProgressBar` (default export, a component).** Props: everything MUI's `LinearProgressProps` accepts, **plus** two required extras:
  - `value` (number) — the percentage to display (0–100); a value of `0` hides the component.
  - `label` (text) — the caption shown to the left of the bar.
  - **Renders:** a one-row grid with label, accent-coloured progress bar, and a percentage; or `null` when `value` is 0.

**Connections:** Uses `usePalette` (`@/hooks/usePalette`) for the accent colour and MUI's `Grid2`, `LinearProgress`, `Typography`, and `linearProgressClasses`.

---

## `src/components/Link.tsx`

**In one sentence:** A thin wrapper around react-router's `Link` that renames the `to` prop to the more familiar `href`, for in-app navigation that does not reload the page.

**What it is & why it exists (plain English):** In a single-page app, clicking a normal HTML `<a href>` would reload the whole site, which is slow and resets all state. React-router provides a special `Link` that changes the URL and swaps pages *without* a reload — but its destination prop is called `to`. To keep the rest of the codebase using the web-standard name `href`, this wrapper accepts `href` and forwards it to react-router's `Link` as `to`. It exists purely for naming consistency and ergonomics.

**How it works, step by step:** It receives `href`, `children`, and any other link props, then renders react-router's `RouterLink` with `to={href}` and spreads the remaining props through. Clicking it triggers client-side navigation.

**Props, functions & exports:**

- **`Link` (default export, a component).** Props:
  - `href` (text) — the in-app path to navigate to (mapped to react-router's `to`).
  - `children` (React nodes) — the clickable content.
  - plus any other react-router `LinkProps` except `to`.
  - **Renders:** a react-router `Link` element.

**Connections:** Imports `Link as RouterLink` from `react-router-dom`. It is itself wrapped by [`NavLink.tsx`](#srccomponentsnavlinktsx) and used throughout the app for navigation.

---

## `src/components/Loading.tsx`

**In one sentence:** A set of reusable "please wait" indicators — a spinner, a skeleton placeholder, a chessboard-shaped placeholder, and a dimming overlay — used while data or pages load.

**What it is & why it exists (plain English):** Whenever the app is fetching data or loading a page, it should show something rather than freezing or flashing blank. This file collects the app's standard loading visuals into one place so every screen feels consistent. There are two exported components: `LoadingSpinner` (which can morph into three different looks) and `LoadingOverlay` (which dims existing content and floats a spinner on top).

**How it works, step by step:** `LoadingSpinner` chooses what to render based on its `variant` prop. With `variant="skeleton"` it shows grey "skeleton" rectangles roughly shaped like a heading, a content block, and a line — a placeholder of a page still loading. With `variant="board"` it renders a `Paper` card containing a circular spinner, a message, and an 8×8 grid of faint skeleton squares coloured like a real chessboard — perfect for the analysis/play pages. The default `variant="spinner"` is a simple centred circular spinner with a message below. The spinner colour is the VoltChess blue (`#3b9ac6`). `LoadingOverlay` is different: it always renders its `children` and, *only when* `loading` is true, lays a semi-transparent dark layer over them with a small spinner-and-message card centred on top — useful for "saving…" states where you want the old content dimmed but still visible.

**Props, functions & exports:**

- **`LoadingSpinner` (named export, a component).** Props:
  - `size` (number, default 40) — diameter of the spinner.
  - `message` (text, default "Loading...") — caption shown under the spinner.
  - `variant` ("spinner" | "skeleton" | "board", default "spinner") — which of the three looks to render.
  - **Renders:** one of three loading visuals.
- **`LoadingOverlay` (named export, a component).** Props:
  - `loading` (boolean) — whether to show the dimming overlay.
  - `children` (React nodes) — the content to overlay.
  - `message` (text, default "Loading...") — caption in the overlay card.
  - **Renders:** the children, with a dimmed spinner overlay on top while `loading` is true.

**Connections:** Uses MUI's `Box`, `CircularProgress`, `Typography`, `Skeleton`, and `Paper`. `LoadingSpinner` is widely imported — by [`App.tsx`](#srcapptsx) (as the Suspense fallback), [`RequireAuth`](#srccomponentsrequireauthtsx), [`RoleRoute`](#srccomponentsroleroutetsx), and [`GuestRoute`](#srccomponentsguestroutetsx).

---

## `src/components/LocalGameMigrationPrompt.tsx`

**In one sentence:** A one-time pop-up that offers to upload games saved only on the current device to the user's server account after they sign in, so a coach can review them.

**What it is & why it exists (plain English):** Before signing in, a visitor can analyse and save chess games that live only in their own browser (in IndexedDB). Once they create or log into an academy account, those local games should ideally be copied up to the VoltChess server. This component watches for that exact situation and, the first time it applies, asks "Upload games from this device?". It exists to bridge the gap between anonymous local use and a synced account, and it remembers its decision so it does not nag on every visit.

**How it works, step by step:** It reads auth status (`isAuthenticated`, `loading`) from `useAuth` and the local game list (`games`, `isReady`) from `useGameDatabase(true)`. It keeps three pieces of state: `open` (is the dialog showing), `migrating` (is an upload in progress), and `result` (how many games were uploaded, or `null` if not done yet). An effect decides whether to open: it bails out if auth is disabled, still loading, the user is not signed in, the local database is not ready, or migration has already happened (`hasMigratedLocalGames()`); otherwise, if there are any local games, it opens the dialog. **Upload games** calls `handleMigrate`, which sets `migrating`, awaits `migrateLocalGamesToServer()`, stores the returned count in `result` (or `0` on error), and clears `migrating`. **Not now / Done / backdrop** calls `handleClose`, which (when not mid-upload) marks migration as handled via `markLocalGamesMigrated()` *if the user dismissed without uploading*, then closes. The dialog body changes based on `result`: before uploading it offers "Upload them to the VoltChess server so your coach can review them?" with **Not now** / **Upload games** buttons; after uploading it shows how many games were uploaded with a single **Done** button.

**Props, functions & exports:**

- **`LocalGameMigrationPrompt` (default export, a component).** Takes **no props**. Internal callbacks: `handleMigrate` (performs the upload) and `handleClose` (dismisses and records the decision).
  - **Renders:** an MUI dialog when appropriate, or `null` when `open` is false.

**Connections:** Uses `useAuth`, `useGameDatabase`, the `ENABLE_AUTHENTICATION` flag, and the migration helpers `hasMigratedLocalGames`, `migrateLocalGamesToServer`, and (lazily imported) `markLocalGamesMigrated` from `@/lib/gameSync`. It is mounted globally in [`main.tsx`](#srcmaintsx) so it can fire on any page after login.

---

## `src/components/NavLink.tsx`

**In one sentence:** A styled navigation link that combines MUI's link styling with the app's client-side [`Link`](#srccomponentslinktsx), used for menu and header navigation entries.

**What it is & why it exists (plain English):** The sidebar/header menus need links that both look like MUI links (consistent colour, no underline) *and* navigate without reloading the page. This component glues MUI's `Link` styling onto the app's routing `Link`. It also has a `fullWidth` switch so the same component can be a big block menu item or a compact inline header link (like "Sign in"). It exists so navigation entries look and behave consistently everywhere.

**How it works, step by step:** It renders MUI's `Link` but tells it to use the app's routing `Link` as its underlying element (`component={Link}`), passing the `href` straight through. Styling removes the underline and inherits the surrounding text colour. The `fullWidth` prop (default `true`) toggles layout: when true the link is a full-width `block`; when false it becomes an `inline-flex` element that does not stretch or shrink — ideal for an inline header button.

**Props, functions & exports:**

- **`NavLink` (default export, a component).** Props:
  - `href` (text) — destination path.
  - `children` (React nodes) — the link's visible content.
  - `fullWidth` (boolean, default `true`) — block (full-width) vs. compact inline layout.
  - **Renders:** an MUI-styled, client-side navigation link.

**Connections:** Imports `Link as MuiLink` from `@mui/material` and the app's [`Link`](#srccomponentslinktsx). Used by the layout/navigation menus.

---

## `src/components/PageContainer.tsx`

**In one sentence:** A standard page-header-plus-content wrapper that gives every page a consistent centered max-width, a big title, an optional subtitle, and an optional action button area.

**What it is & why it exists (plain English):** Most pages share the same top layout: a large heading, maybe a one-line subtitle, perhaps a button on the right (like "New game"), and then the page's body below — all constrained to a comfortable reading width. Rather than re-build that on every page, `PageContainer` provides it once. It exists to keep page layouts uniform and reduce repetition.

**How it works, step by step:** It renders a `Box` capped at 1200px wide and horizontally centred. Inside, a header row uses flexbox that stacks vertically on small screens and sits side-by-side on larger ones: on the left a title (`h1`) with an optional subtitle below it, and on the right the optional `action` element. Below the header it renders whatever `children` were passed (the actual page content).

**Props, functions & exports:**

- **`PageContainer` (default export, a component).** Props:
  - `title` (text) — the page's main heading.
  - `subtitle` (optional text) — a secondary line under the title.
  - `action` (optional React node) — a control (e.g. a button) shown on the right of the header.
  - `children` (React nodes) — the page body.
  - **Renders:** a centred, max-width layout with a title/subtitle/action header and the content beneath.

**Connections:** Uses MUI's `Box` and `Typography`. Imported by the various page components that want the standard layout.

---

## `src/components/pageTitle.tsx`

**In one sentence:** A convenience component that sets a page's browser-tab title and a full set of SEO/social meta tags (description, Open Graph, Twitter) in one line.

**What it is & why it exists (plain English):** Good titles and descriptions help search engines and make shared links show a nice preview card. Writing all those meta tags by hand on every page is tedious and error-prone. `PageTitle` wraps the lower-level [`Head`](#srccomponentsheadtsx) component and emits a consistent, complete set of tags from just a `title` and an optional `description`. It exists to make per-page SEO a one-liner.

**How it works, step by step:** It takes `title` and optional `description`; if no description is given it falls back to `DEFAULT_SEO.description`. It then renders a `Head` containing a `<title>` plus six `<meta>` tags: the standard `description`, the Open Graph trio (`og:title`, `og:description`, `og:type` = "website") used by Facebook/LinkedIn previews, and the two Twitter card tags (`twitter:title`, `twitter:description`). `Head` copies all of these into the real document head.

**Props, functions & exports:**

- **`PageTitle` (named export, a component).** Props:
  - `title` (text) — the tab title and the title used in social previews.
  - `description` (optional text) — the meta description; defaults to the site-wide SEO description.
  - **Renders:** a `Head` element carrying the title and meta tags (no visible UI).

**Connections:** Imports [`Head`](#srccomponentsheadtsx) and `DEFAULT_SEO` from `@/data/seo`. Used near the top of most page components.

---

## `src/components/PlatformSyncOrchestrator.tsx`

**In one sentence:** An invisible background worker that, for signed-in students, periodically pulls in their imported games and runs lightweight Stockfish analysis on them right inside the browser, one game at a time.

**What it is & why it exists (plain English):** VoltChess can import a student's games from external platforms and analyse them. Rather than relying solely on a server (or a small Raspberry-Pi "Pi" backend) to crunch every game, this component turns *any open VoltChess browser tab* belonging to a student into a tiny analysis worker. While the tab is open it quietly triggers imports, tells the server "I'm here and (not) busy", and chews through the queue of pending games using the lowest-strength engine settings. It renders nothing on screen — its whole purpose is the behind-the-scenes coordination ("orchestration"). It exists to spread analysis work onto students' devices and keep their game library up to date automatically.

**How it works, step by step:** First it figures out whether it should be active: only when authentication is enabled, the user is signed in, and their role is `Student` (`isStudent`). If not a student, every effect below early-returns and the component does nothing. The piece is built from several cooperating effects:

1. **Overview polling.** A TanStack `useQuery` (`["sync-overview"]`) fetches a summary every 10 seconds (only when `isStudent`). From it, `hasPending` is true if any games are pending or in progress. A separate diagnostic effect logs a warning if the server thinks games are "in progress" while this tab is actually idle (hinting at a stale claim or the Pi fallback running).
2. **Engine readiness.** It creates a Stockfish engine with `useEngine(SYNC_ANALYSIS_DEFAULTS.engine)` and polls `engine.getIsReady()` on an interval, storing the result in `engineReady`.
3. **Presence heartbeats.** Effects send "presence" pings (`sendSyncPresence`) every 45 seconds and immediately whenever busyness changes, reporting whether the tab is currently analysing (`analyzingRef`) or running a foreground evaluation (`evaluationProgress`). This lets the server avoid double-assigning work.
4. **Periodic import sync.** Another effect calls `triggerSync()` at most once every 15 minutes (tracked per-user in `localStorage`), and also when the tab becomes visible or focused. After a successful sync it invalidates the `sync-overview` and `my-games` query caches so the UI refreshes.
5. **The analysis worker.** The core effect runs `runWorker` on an interval (every 4s when there is pending work, every 12s otherwise). `runWorker` skips if already analysing or if the engine is not ready, then loops up to 5 times calling `analyzeGame`. `analyzeGame` fetches one pending game, tries to `claimGameAnalysis` it (so two workers do not collide), loads its PGN into a `chess.js` game, computes evaluation parameters, runs `engine.evaluateGame(...)` at the low sync-defaults depth, and on success calls `completeGameAnalysis` with the positions/accuracy/estimated-Elo/settings, then invalidates the caches. On failure it calls `releaseGameAnalysis` so another worker can retry. Throughout, it sets `analyzingRef` and posts presence so the rest of the system knows the tab is busy.

**Props, functions & exports:**

- **`PlatformSyncOrchestrator` (default export, a component).** Takes **no props**. Key internal pieces: `postPresence(busy)` (sends a presence ping), and inside the worker effect `analyzeGame()` (claims and analyses one game) and `runWorker()` (loops through pending games).
  - **Renders:** `null` — it is purely a background coordinator.

**Connections:** Heavy integration component. Uses `useAuth`, `useEngine`, Jotai's `useAtomValue` on `evaluationProgressAtom`, TanStack Query (`useQuery`/`useQueryClient`), `chess.js`, `getEvaluateGameParams` (`@/lib/chess`), the sync API functions in `@/lib/api/sync` (`claimGameAnalysis`, `completeGameAnalysis`, `fetchPendingAnalysis`, `fetchSyncOverview`, `releaseGameAnalysis`, `sendSyncPresence`, `triggerSync`), the `UserRole` enum, and `SYNC_ANALYSIS_DEFAULTS`. It is mounted globally in [`main.tsx`](#srcmaintsx).

---

## `src/components/RequireAuth.tsx`

**In one sentence:** The main route guard that blocks unauthenticated visitors from protected pages and redirects them to the login screen.

**What it is & why it exists (plain English):** Most of VoltChess (the home, analysis, database, coach, and student pages) should only be visible to signed-in users. `RequireAuth` is the gatekeeper placed around all those routes. If you are signed in, it lets the page through; if you are not, it sends you to `/login` and remembers where you were trying to go so you can be returned there after signing in. It exists so protected pages cannot be reached by simply typing the URL.

**How it works, step by step:** It uses react-router's `Outlet` pattern, meaning it guards a *group* of nested routes rather than a single child. If authentication is globally disabled (`ENABLE_AUTHENTICATION` false), it immediately renders `<Outlet />` (all protected pages become open). While auth status is `loading` it shows a `LoadingSpinner` with the message "Loading VoltChess Academy…". If loading is done and the user is **not** authenticated, it renders `<Navigate to="/login" replace state={{ from: location }} />` — redirecting to login while stashing the attempted location in `state.from` (which [`GuestRoute`](#srccomponentsguestroutetsx) later reads to send the user back). Otherwise it renders `<Outlet />`, allowing the matched protected page to display.

**Props, functions & exports:**

- **`RequireAuth` (default export, a component).** Takes **no props** (it reads everything from context and the router).
  - **Returns:** an `Outlet` (when allowed or auth disabled), a `LoadingSpinner` (while loading), or a `Navigate` redirect to `/login` (when not authenticated).

**Connections:** Uses `Navigate`, `Outlet`, and `useLocation` from react-router, `useAuth` (`@/contexts/AuthContext`), the `ENABLE_AUTHENTICATION` flag, and `LoadingSpinner` from [`Loading.tsx`](#srccomponentsloadingtsx). It wraps the protected route group in [`App.tsx`](#srcapptsx).

---

## `src/components/RoleRoute.tsx`

**In one sentence:** A finer-grained route guard that only lets users with specific roles (e.g. Coach, Admin, or Student) see a page, redirecting everyone else.

**What it is & why it exists (plain English):** Being logged in is not always enough — a student should not see the coach dashboard, and vice versa. `RoleRoute` checks the signed-in user's *role* against a list of allowed roles. It is layered *inside* [`RequireAuth`](#srccomponentsrequireauthtsx): first you must be logged in, then you must have the right role. It exists to enforce per-role access to pages.

**How it works, step by step:** It reads `user` and `loading` from `useAuth`. While `loading`, it shows a `LoadingSpinner`. Once loaded, if there is no user **or** the user's role is not in the `allowed` list, it renders `<Navigate to={fallback} replace />` (default fallback is `/`, the home page). If the role check passes, it simply renders its `children` (the protected page).

**Props, functions & exports:**

- **`RoleRoute` (default export, a component).** Props:
  - `children` (React nodes) — the page to show to permitted roles.
  - `allowed` (array of `UserRole`) — the roles that may view the page.
  - `fallback` (text, default `"/"`) — where to redirect users who lack permission.
  - **Returns:** the `children` (allowed), a `LoadingSpinner` (loading), or a `Navigate` redirect (denied).

**Connections:** Uses `Navigate` (react-router), `useAuth`, the `UserRole` enum (`@/types/user`), and `LoadingSpinner`. In [`App.tsx`](#srcapptsx) it wraps each `/coach/*` route (Coach/Admin) and the `/student` route (Student).

---

## `src/components/RouteAnalytics.tsx`

**In one sentence:** An invisible component that reports a "page view" to Vercel Analytics every time the URL changes.

**What it is & why it exists (plain English):** Single-page apps switch pages without a full browser reload, so analytics tools cannot automatically detect each "page view". This tiny component watches the current URL and manually fires a page-view event whenever it changes, so the team can see which pages get traffic. It renders nothing.

**How it works, step by step:** It reads the current location with `useLocation`. An effect runs whenever the path or query string changes, calling `track("pageview", { path: location.pathname + location.search })` from Vercel's analytics library. It returns `null`.

**Props, functions & exports:**

- **`RouteAnalytics` (default export, a component).** Takes **no props**.
  - **Renders:** `null` (side effect only — sends a page-view event on navigation).

**Connections:** Uses `useLocation` (react-router) and `track` from `@vercel/analytics`. Mounted once near the top of [`App.tsx`](#srcapptsx).

---

## `src/components/SchemaOrg.tsx`

**In one sentence:** A helper that injects machine-readable "structured data" (Schema.org JSON-LD) into the page so search engines understand VoltChess is a free chess-analysis application/service.

**What it is & why it exists (plain English):** Search engines like Google can show richer results (ratings, prices, app info) when a page includes "structured data" — a standardised JSON description of what the page is about. This file provides a component that drops such a JSON block into the page head, plus two ready-made descriptions: one saying VoltChess is a free chess software application, and one describing its game-review service. It exists to improve SEO and how VoltChess appears in search results.

**How it works, step by step:** The `SchemaOrg` component takes a `data` object and, in an effect, creates a `<script type="application/ld+json">` element, fills it with the JSON-stringified data, and appends it to `document.head`. Its cleanup function removes that script when the component unmounts or the data changes, preventing duplicates. The file also exports two constant data objects, `chessSoftwareSchema` (a `SoftwareApplication` entry with name, description, a free `Offer`, keywords, and a feature list) and `chessAnalysisServiceSchema` (a `Service` entry describing PGN review and Chess.com import), which pages can pass into `SchemaOrg`.

**Props, functions & exports:**

- **`SchemaOrg` (named export, a component).** Props:
  - `data` (an object of arbitrary keys) — the Schema.org description to inject.
  - **Renders:** `null` (it only adds/removes a script in the document head).
- **`chessSoftwareSchema` (named export, a constant object)** — the SoftwareApplication structured-data block.
- **`chessAnalysisServiceSchema` (named export, a constant object)** — the Service structured-data block.

**Connections:** Uses only `useEffect`. The exported schema objects are passed into `SchemaOrg` by SEO-focused pages (such as the home/landing page).

---

## `src/components/slider.tsx`

**In one sentence:** A reusable labelled slider control (with optional tick marks and an optional info tooltip) used to pick numeric settings like engine depth or thread count.

**What it is & why it exists (plain English):** A slider is the draggable control used to choose a number within a range. The app needs sliders in several settings panels, and they should all look and behave the same — with a label, optional evenly-spaced tick marks, and sometimes a little "ⓘ" help bubble explaining what the setting does. This component packages all of that around MUI's base slider. It exists to provide one consistent, feature-rich slider everywhere.

**How it works, step by step:** It renders a `Grid` containing a header row and the slider itself. The header shows the label; when `step` is 1 and tick marks are enabled it shows just the label, otherwise it shows `label: value` so you can read the current number. If `infoContent` is provided, it also renders an info `IconButton` that opens a `Popover` tooltip — opened on hover or click and dismissed via `ClickAwayListener` or mouse-leave (the open/close state is tracked in `anchorEl`). Below the header sits a styled `CustomSlider` (an MUI `Slider` with slightly larger thumb and smaller mark labels). If `marksFilter` is set, it generates a tick mark for every integer in the range and keeps only every *n-th* mark. Dragging the slider calls `setValue` with the new number.

**Props, functions & exports:**

- **`Slider` (default export, a component).** Props (the exported `Props` interface):
  - `value` (number) — current value.
  - `setValue` (function `(value: number) => void`) — called with the new value when dragged.
  - `min`, `max` (numbers) — the allowed range.
  - `label` (text) — the caption.
  - `size` (optional number, default grid size 11) — the MUI grid width.
  - `marksFilter` (optional number) — show every n-th integer tick mark.
  - `step` (optional number, default 1) — increment granularity.
  - `infoContent` (optional content) — text/markup for the help tooltip.
  - **Renders:** a labelled slider with optional marks and an info popover.
- **`CustomSlider`** — a styled MUI `Slider` defined at the bottom of the file (internal).

**Connections:** Uses MUI (`Slider`, `Popover`, `ClickAwayListener`, `IconButton`, `Grid2`, `Stack`, `Typography`, `styled`) and the `Icon` component from `@iconify/react`. Imported by engine/analysis settings panels.

---

## `src/components/ThemeProvider.tsx`

**In one sentence:** The app-wide theming wrapper that defines the VoltChess colour scheme/typography, supplies dark or light mode to every component, and exposes a hook to toggle between them.

**What it is & why it exists (plain English):** A "theme" is the central definition of an app's look — its colours, fonts, button shapes, and so on. MUI uses a theme so every component automatically matches. This file builds the VoltChess theme (in both dark and light variants), wraps the whole app so everything inherits it, and provides a `useTheme` hook so any component can read the current mode or flip it. It exists to give the app a single, consistent, switchable visual identity.

**How it works, step by step:** It creates a React context (`ThemeContext`) holding the current `mode` ("dark"/"light") and a `toggleTheme` function. The `useTheme` hook reads that context and throws a helpful error if used outside the provider (a guard against misuse). `createVoltChessTheme(mode)` builds an MUI theme object: a primary blue palette, mode-aware secondary/background/text colours, custom typography sizes for `h1`/`h3`/`h5`, and component overrides (rounded non-uppercase buttons, blurred bordered `Paper` surfaces). The exported `VoltChessThemeProvider` holds the `mode` in state (starting in "dark"), defines `toggleTheme` to switch it, rebuilds the theme on each render, and renders MUI's `ThemeProvider` (with `CssBaseline` for consistent baseline styling) around its `children`, all wrapped in the context provider.

**Props, functions & exports:**

- **`VoltChessThemeProvider` (named export, a component).** Props:
  - `children` (React nodes) — the app to theme.
  - **Renders:** the children wrapped in MUI's theme provider and the theme context.
- **`useTheme` (named export, a hook).** No parameters. **Returns:** `{ mode, toggleTheme }` for reading/flipping the theme; throws if used outside the provider.
- **`createVoltChessTheme(mode)`** — internal factory that returns an MUI theme for the given mode.

**Connections:** Uses MUI's `createTheme`, `ThemeProvider`, and `CssBaseline`, plus React's `createContext`/`useContext`/`useState`. It wraps the app (typically high up, around `App`) and its `useTheme` hook powers dark/light toggles in the UI.

---

## `src/components/VoltChessLogo.tsx`

**In one sentence:** A tiny component that displays the VoltChess brand logo image at a chosen size.

**What it is & why it exists (plain English):** The brand mark (a lightning bolt on chess squares) appears in several places — the header, loading screens, etc. Rather than repeat the same image tag with its alt text and sizing everywhere, this component centralises it. It exists for consistency and convenience.

**How it works, step by step:** It renders an MUI `Box` as an `<img>` pointing at `/logo.svg`, with alt text "VoltChess". The `size` prop (default 28) sets both width and height in pixels, and any extra `sx` styling passed in is merged on top.

**Props, functions & exports:**

- **`VoltChessLogo` (default export, a component).** Props:
  - `size` (optional number, default 28) — the width and height in pixels.
  - `sx` (optional MUI style object) — extra styling to merge.
  - **Renders:** the logo `<img>` at the requested size.

**Connections:** Uses MUI's `Box`, `SxProps`, and `Theme`. Imported by the header/navigation and other branded surfaces.

---

## `src/components/board/index.tsx`

**In one sentence:** The central interactive chessboard component — it draws the pieces, lets the user move them (by dragging or clicking), handles pawn promotion, shows the last-move and best-move highlights, and optionally shows the evaluation bar and player headers.

**What it is & why it exists (plain English):** This is the heart of VoltChess's on-screen chess experience. It wraps the third-party `react-chessboard` library and layers all the app's custom behaviour on top: piece images from the chosen set, click-to-move *and* drag-to-move, a promotion dialog when a pawn reaches the last rank, coloured highlights for the previous move and legal destination dots, an arrow pointing at the engine's best move, an optional evaluation bar on the side, and the two player name/clock headers above and below. It exists so every screen that shows a board (play, analysis, review, puzzles) reuses one well-behaved, fully-featured board.

**How it works, step by step:** The current game is stored in a Jotai atom (`gameAtom`, a `chess.js` instance); the component reads it with `useAtomValue` and gets a `playMove` action from `useChessActions`. It creates two local atoms — `clickedSquaresAtom` (squares the user right-clicked to mark) and `playableSquaresAtom` (legal destinations from the currently selected piece). Whenever the position (`gameFen`) changes, it clears the right-click marks.

Moving works two ways. **Dragging:** `onPieceDrop(source, target, piece)` checks the piece is playable (`isPiecePlayable` — the game is not over and `canPlay` permits that colour), then calls `playMove`. **Clicking:** `handleSquareLeftClick` implements select-then-move: the first click on your own piece selects it and lights up its legal destinations (`resetMoveClick` computes them); the second click either makes the move, or — if the target is not legal — re-selects. If the move is a pawn reaching the 8th/1st rank, it opens the promotion dialog instead of moving immediately. `onPromotionPieceSelect` then completes the move with the chosen piece (queen by default). Right-clicking a square toggles a manual highlight via `handleSquareRightClick`.

Visuals are assembled with several memoised values: `customArrows` produces the best-move arrow (only when `showBestMoveArrow` is on and the played move was not already Best/Opening/Forced/Perfect, hue-shifted to match the board tint); `SquareRenderer` is built by `getSquareRenderer` (from [`squareRenderer.tsx`](#srccomponentsboardsquarerenderertsx)) to draw highlights and move-classification icons; `customPieces` builds an image-backed renderer for each of the 12 piece codes using the selected `pieceSet`; and `customBoardStyle` applies a rounded shadow plus an optional hue-rotation (`boardHue`). All of this is fed into a `<Chessboard>` element (`chessboardEl`). Finally, layout: if `hidePlayerHeaders` is true it renders just the board (and optional eval bar) side-by-side; otherwise it renders the eval bar, a `PlayerHeader` for the top player, the board, and a `PlayerHeader` for the bottom player, oriented according to `boardOrientation`.

**Props, functions & exports:**

- **`Board` (default export, a component).** Props (the exported `Props` interface):
  - `id` (text) — a unique id for this board instance.
  - `canPlay` (optional `Color` or boolean) — who may move pieces (`true` = both, a `Color` = only that side, falsy = view-only).
  - `gameAtom` (Jotai atom of a `chess.js` game) — the live game state.
  - `boardSize` (optional number) — pixel size of the board.
  - `whitePlayer`, `blackPlayer` (`Player`) — info for the headers.
  - `boardOrientation` (optional `Color`, default White) — which side is at the bottom.
  - `currentPositionAtom` (optional atom of `CurrentPosition`) — the analysed position (for highlights/arrows/eval).
  - `showBestMoveArrow` (optional boolean) — draw the engine's best-move arrow.
  - `showPlayerMoveIconAtom` (optional atom of boolean) — show move-classification icons.
  - `showEvaluationBar` (optional boolean) — show the side eval bar.
  - `hidePlayerHeaders` (optional boolean) — omit the built-in player rows.
  - **Renders:** the interactive chessboard, optionally with eval bar and player headers.
  - Internal handlers: `onPieceDrop`, `handleSquareLeftClick`, `handleSquareRightClick`, `handlePieceDragBegin`, `handlePieceDragEnd`, `onPromotionPieceSelect`, `resetMoveClick`, `isPiecePlayable`.
- **`PIECE_CODES` (named export, a constant array)** — the 12 piece codes (`wP`…`bK`) used to build the custom piece images.

**Connections:** Uses `react-chessboard`, `chess.js`, Jotai, `useChessActions` (`@/hooks/useChessActions`), `tinycolor2`, the `Color`/`MoveClassification` enums, `CLASSIFICATION_COLORS` constants, and the sibling board files [`squareRenderer`](#srccomponentsboardsquarerenderertsx), [`evaluationBar`](#srccomponentsboardevaluationbartsx), [`playerHeader`](#srccomponentsboardplayerheadertsx), and [`states`](#srccomponentsboardstatests). It is imported by every page that shows a board.

---

## `src/components/board/capturedPieces.tsx`

**In one sentence:** Displays the little row of captured enemy pieces next to a player, along with their material advantage (e.g. "+3").

**What it is & why it exists (plain English):** In chess interfaces it is helpful to see, at a glance, which pieces each side has captured and who is "up material". This component computes that from the current board position and draws the overlapping mini piece icons plus a "+N" point advantage when applicable. It exists to give that familiar captured-pieces summary shown beside each player's name.

**How it works, step by step:** Given a board snapshot (`fen`) and a player `color`, it uses `getCapturedPieces(fen, color)` to get the list of captured piece types and counts, then turns each into a cluster of overlapping icons via the `getCapturedPiecesComponents` helper. It also computes the material difference with `getMaterialDifference(fen)`, flipping the sign for Black so a positive number always means "this player is ahead". It renders the icon clusters in a row and, if the material difference is positive, a small "+{diff}" label. Each piece icon is a `Box` with the appropriate piece SVG (from the "cardinal" set) as its background, scaled by the `PIECE_SCALE` constant and overlapped via negative spacing for a compact stacked look.

**Props, functions & exports:**

- **`CapturedPieces` (default export, a component).** Props (exported `Props`):
  - `fen` (text) — the board position to analyse.
  - `color` (`Color`) — which player's captures/advantage to show.
  - **Renders:** a row of overlapping captured-piece icons plus an optional "+N" advantage label.
- **`getCapturedPiecesComponents(pieceSymbol, pieceCount)`** — internal helper returning a stacked row of `pieceCount` icons for one piece type (or `null` if the count is zero/undefined).

**Connections:** Uses `getCapturedPieces` and `getMaterialDifference` from `@/lib/chess`, the `Color` enum, and MUI layout components. It is rendered by [`playerHeader.tsx`](#srccomponentsboardplayerheadertsx).

---

## `src/components/board/evaluationBar.tsx`

**In one sentence:** The vertical white/black bar beside the board that visually shows who is winning according to the engine, with a numeric label.

**What it is & why it exists (plain English):** Chess engines express their judgement as a number (positive = White better, negative = Black better, or "mate in N"). The evaluation bar turns that number into an intuitive picture: a tall vertical bar that is more white when White is ahead and more black when Black is ahead, with the exact score printed on whichever end is appropriate. It exists to make the engine's assessment glanceable.

**How it works, step by step:** It keeps local state `evalBar` holding a `whiteBarPercentage` (how much of the bar should be white, 0–100) and a text `label` (e.g. "0.0" or "M3"), starting balanced at 50%. It reads the analysed position from `currentPositionAtom`. An effect recomputes the bar whenever the position changes — but only once the engine has searched deep enough (it ignores the best line until its `depth` reaches 6, to avoid jumpy shallow numbers); it calls `getEvaluationBarValue(position.eval)` to get the new percentage and label. The render draws a fixed-width vertical `Grid` split into two stacked `Box`es — a top (dark when oriented for White, otherwise white) and a bottom — whose heights are derived from `whiteBarPercentage` and the `boardOrientation`, with a smooth 1-second height transition. The numeric label is shown on whichever section corresponds to the leading side, with contrasting text colour.

**Props, functions & exports:**

- **`EvaluationBar` (default export, a component).** Props:
  - `height` (number) — pixel height of the bar (matched to the board).
  - `boardOrientation` (optional `Color`) — which way the board faces, so the bar fills the correct direction.
  - `currentPositionAtom` (optional atom of `CurrentPosition`, default empty) — the analysed position to read the evaluation from.
  - **Renders:** the two-tone vertical evaluation bar with its score label.

**Connections:** Uses Jotai, `getEvaluationBarValue` from `@/lib/chess`, and the `Color`/`CurrentPosition` types. It is rendered by [`board/index.tsx`](#srccomponentsboardindextsx) when `showEvaluationBar` is on.

---

## `src/components/board/playerHeader.tsx`

**In one sentence:** The compact name/rating/avatar/clock row shown above and below the board for each player, including their captured-pieces summary.

**What it is & why it exists (plain English):** Each side of a chess game has a player, and the interface shows their avatar, name, rating, captured pieces, and (if the game has clock data) their remaining time. This component renders one such row. It exists to present per-player information consistently around the board, and it intelligently extracts and formats the clock from the game's PGN comments.

**How it works, step by step:** It reads the live game from `gameAtom` and the colour palette from `usePalette`. The interesting part is the **clock**, computed with `useMemo`: chess.js stores per-move clock annotations as PGN comments like `[%clk 0:05:03]`. If it is currently this player's turn, the relevant clock is the one attached to the position *before* their move (found by matching the previous move's FEN among the game comments); otherwise it uses the current comment. The `getClock` helper parses the `[%clk h:m:s.t]` pattern into hours/minutes/seconds/tenths (or returns undefined if absent). The render is a flex row: on the left an `Avatar` (player image or first initial) tinted by colour, then the player's `name` (truncated if long) and optional `(rating)`, with the `CapturedPieces` summary beneath; on the right, if a clock exists, a monospaced time chip showing `h:mm:ss` (and tenths only when under ~20 seconds remain).

**Props, functions & exports:**

- **`PlayerHeader` (default export, a component).** Props (exported `Props`):
  - `player` (`Player`) — name, rating, avatar.
  - `color` (`Color`) — which side this header represents.
  - `gameAtom` (Jotai atom of a `chess.js` game) — used to read the turn and clock comments.
  - **Renders:** a one-row header with avatar, name/rating, captured pieces, and an optional clock.
- **`getClock(comment)`** — internal helper parsing a `[%clk ...]` PGN comment into `{ hours, minutes, seconds, tenths }` or `undefined`.

**Connections:** Uses the `Color`/`Player` types, `usePalette`, `getPaddedNumber` (`@/lib/helpers`), Jotai, `chess.js`, and the sibling [`CapturedPieces`](#srccomponentsboardcapturedpiecestsx). It is rendered by [`board/index.tsx`](#srccomponentsboardindextsx).

---

## `src/components/board/squareRenderer.tsx`

**In one sentence:** A factory that builds the custom renderer for each board square, drawing the previous-move and right-click highlights, the legal-move dots, and the move-quality icon.

**What it is & why it exists (plain English):** `react-chessboard` lets you replace how each individual square is drawn. VoltChess uses that hook to overlay its own visual cues on top of the normal squares: a coloured tint on the squares of the last move (coloured by how good that move was), a red tint on squares you right-clicked to mark, small grey dots on squares your selected piece can legally move to, and a move-classification badge (brilliant/blunder/etc.) on the destination square. This file produces the component that does all that. It exists to centralise the per-square overlay logic the board relies on.

**How it works, step by step:** `getSquareRenderer(...)` is a factory: you give it the relevant atoms and it returns a `forwardRef` component (so react-chessboard can attach a DOM ref). Inside, for each square it reads the analysed position, the clicked squares, the playable squares, and the board hue from their atoms. It derives two optional styles with `useMemo`: a highlight style (red `rightClickSquareStyle` if the square was right-clicked; else a `previousMoveSquareStyle` tinted by the move classification if the square is the last move's from/to); and a `playableSquareStyles` dot if the square is a legal destination. It renders the square's normal `children`, then overlays the highlight and the playable dot as absolutely-positioned `<div>`s, and — if there is a move classification, the icon is enabled, and this is the destination square — an `<img>` move-classification badge in the corner. It also counter-rotates the hue (`hue-rotate(-boardHue)`) so the overlays are not tinted by the board's hue filter. The returned component is given `displayName = "SquareRenderer"`.

**Props, functions & exports:**

- **`getSquareRenderer(props)` (named export, a factory function).** Parameters (the exported `Props`):
  - `currentPositionAtom` (atom of `CurrentPosition`) — for last-move squares and classification.
  - `clickedSquaresAtom` (atom of squares) — user's right-click marks.
  - `playableSquaresAtom` (atom of squares) — legal destinations to dot.
  - `showPlayerMoveIconAtom` (optional atom of boolean, default `false`) — whether to show the classification badge.
  - **Returns:** a `forwardRef` square-renderer component compatible with react-chessboard's `customSquare` prop.
- Internal style constants: `rightClickSquareStyle`, `playableSquareStyles`, and the `previousMoveSquareStyle(moveClassification)` factory.

**Connections:** Uses Jotai, `react-chessboard` square types, the `CurrentPosition`/`MoveClassification` types, `CLASSIFICATION_COLORS` constants, and `boardHueAtom` from [`states.ts`](#srccomponentsboardstatests). It is consumed by [`board/index.tsx`](#srccomponentsboardindextsx).

---

## `src/components/board/states.ts`

**In one sentence:** Defines the two persisted Jotai atoms that remember the user's chosen piece set and board hue between visits.

**What it is & why it exists (plain English):** Some board preferences should survive a page reload — which piece artwork you like, and any colour-tint (hue) you applied to the board. This tiny file declares those two settings as Jotai atoms backed by browser `localStorage`, so they are saved automatically and restored next time. It exists as the shared home for board appearance preferences.

**How it works, step by step:** It uses Jotai's `atomWithStorage`, which behaves like a normal atom but also reads/writes a `localStorage` key. `pieceSetAtom` is stored under the key `"pieceSet"` and defaults to `"maestro"` (one of the allowed `PIECE_SETS`). `boardHueAtom` is stored under `"boardHue"` and defaults to `0` (no tint). Any component can read or change these, and the change is both reflected everywhere and saved to disk.

**Props, functions & exports:**

- **`pieceSetAtom` (named export, a persisted atom)** — the selected piece-set name (default `"maestro"`).
- **`boardHueAtom` (named export, a persisted atom)** — the board's hue-rotation in degrees (default `0`).

**Connections:** Uses `atomWithStorage` from `jotai/utils` and `PIECE_SETS` from `@/constants`. The atoms are read by [`board/index.tsx`](#srccomponentsboardindextsx) and [`squareRenderer.tsx`](#srccomponentsboardsquarerenderertsx), and written by board-settings UI.

---

## `src/components/prettyMoveSan/index.tsx`

**In one sentence:** Renders a chess move in standard notation (SAN) but replaces the piece letter (K, Q, R, B, N) with a nice chess-font glyph, e.g. showing a knight symbol instead of "N".

**What it is & why it exists (plain English):** Chess moves are usually written like "Nf3" (knight to f3) or "Qxd5" (queen takes d5). Showing the actual piece *symbol* instead of the letter looks more polished and is language-independent. This component takes a move's text and swaps the leading piece letter for the matching chess glyph, leaving pawn moves (which have no leading letter) untouched. It exists to make move lists and labels throughout the app look professional.

**How it works, step by step:** Given a move string `san` and the moving side's `color`, it checks the first character. If it is one of K/Q/R/B/N, it is a piece move: it picks the correct glyph from `unicodeMap` and renders the rest of the move as text. The glyph colour is chosen so it stays visible in both themes — in dark mode it uses the piece's real colour, in light mode it flips it (the comment-free logic: `isDarkMode ? color : opposite`). If the first character is not a piece letter (a pawn move or castling), it just renders the move text as-is. The render wraps everything in a `Box` span: an optional glyph `Typography` using the `chess-merida` font, followed by a `Typography` with the remaining move text plus any `additionalText`. Both typographies accept pass-through `typographyProps` for styling.

**Props, functions & exports:**

- **`PrettyMoveSan` (default export, a component).** Props:
  - `san` (text) — the move in standard algebraic notation.
  - `color` ("w" | "b") — the side that played the move (for glyph colour).
  - `additionalText` (optional text) — extra text appended after the move (e.g. an annotation).
  - `typographyProps` (optional) — MUI typography props applied to the glyph and text.
  - `boxProps` (optional) — MUI props for the wrapping span.
  - **Renders:** the move with a chess glyph for the piece (or plain text for pawn moves).
- **`unicodeMap`** — internal lookup of piece letter → `{ w, b }` Unicode chess glyphs.

**Connections:** Uses MUI (`Box`, `Typography`, `useTheme`) and imports the local [`chess-font.css`](#srccomponentsprettymovesanchess-fontcss) for the glyph font. Used anywhere moves are listed (move panels, analysis, etc.).

---

## `src/components/prettyMoveSan/chess-font.css`

**In one sentence:** A small stylesheet that registers the "chess-merida" custom font used to draw the piece glyphs in [`PrettyMoveSan`](#srccomponentsprettymovesanindextsx).

**What it is & why it exists (plain English):** To show crisp chess piece symbols in text, the app uses a dedicated chess font file. A browser only knows about a custom font once it is declared with an `@font-face` rule. This CSS file is that declaration. It exists so the `chess-merida` font name works wherever it is referenced.

**How it works, step by step:** It contains a single `@font-face` rule that names the font `"chess-merida"`, points its source at the TrueType file `chess_merida_unicode.ttf` (located next to the CSS), and sets `font-display: swap` so text shows immediately in a fallback font and swaps to the chess font once it loads.

**Props, functions & exports:** None — this is a CSS file, not a component. Its only "export" is the globally-registered font family `chess-merida`.

**Connections:** Imported by [`prettyMoveSan/index.tsx`](#srccomponentsprettymovesanindextsx), which applies `fontFamily: "chess-merida"` to the piece glyph.

---

## `src/App.tsx`

**In one sentence:** The app's "table of contents" — it lists every page (route), maps each URL to the right page component, and wraps them in the appropriate guards, layout, error handling, and analytics.

**What it is & why it exists (plain English):** Once the app has started, something must decide *which page* to show for the current URL. `App.tsx` is that router map. It declares each path (`/login`, `/analysis`, `/coach/students`, etc.) and which page component renders there, separates public pages from protected ones, and applies role guards where needed. It also wraps everything in the global error boundary, the page layout, and analytics. It exists as the single, readable definition of the app's navigation structure.

**How it works, step by step:** Page components are imported **lazily** with `lazy(() => import(...))` — this is *code-splitting*, meaning each page's code is only downloaded when first visited, keeping the initial load small. The `App` function returns a tree, outermost first: an `ErrorBoundary` (catches crashes), then Vercel's `<Analytics />` and the app's [`RouteAnalytics`](#srccomponentsrouteanalyticstsx) (track page views), then `Layout` (the shared shell/navigation), then a `Suspense` wrapper whose `fallback` is a skeleton `LoadingSpinner` shown while a lazy page is downloading. Inside is the `Routes` table:

- **Public routes** (no login needed): `/login`, `/register`, `/blog`, `/blog/:slug`, `/terms-and-conditions`, `/thanks`, plus a redirect from the legacy `/sign-in` to `/login`.
- **Protected routes** are nested inside a single `<Route element={<RequireAuth />}>`, so the [`RequireAuth`](#srccomponentsrequireauthtsx) guard protects them all at once: `/` (Home), `/analysis`, `/database`, `/openings`, `/play`, `/puzzles`, `/review`. The coach pages (`/coach`, `/coach/students`, `/coach/assignments`, `/coach/templates`, `/coach/messages`, `/coach/plans`, `/coach/analytics`, `/coach/students/:id`) are each additionally wrapped in a [`RoleRoute`](#srccomponentsroleroutetsx) allowing only `Coach` and `Admin`; `/student` is wrapped in a `RoleRoute` allowing only `Student`.

React-router matches the current URL to one of these routes and renders the corresponding page (downloading it first if needed).

**Props, functions & exports:**

- **`App` (default export, a component).** Takes **no props**.
  - **Renders:** the full routed application — error boundary → analytics → layout → suspense → routes.

**Connections:** Uses react-router (`Routes`, `Route`, `Navigate`), React's `Suspense`/`lazy`, the `Layout` shell (`@/sections/layout`), the guards [`ErrorBoundary`](#srccomponentserrorboundarytsx)/[`RequireAuth`](#srccomponentsrequireauthtsx)/[`RoleRoute`](#srccomponentsroleroutetsx), [`RouteAnalytics`](#srccomponentsrouteanalyticstsx), `LoadingSpinner`, Vercel `Analytics`, the `UserRole` enum, and every page under `@/pages`. `App` itself is rendered by [`main.tsx`](#srcmaintsx).

---

## `src/main.tsx`

**In one sentence:** The app's ignition switch — the first file the browser runs; it loads fonts and config, wires up all the global providers, and renders the React app into the page.

**What it is & why it exists (plain English):** Every web app needs an entry point: the first piece of code that actually attaches the app to the otherwise-empty HTML page. `main.tsx` is that bootstrap. It pulls in fonts, applies some startup defaults, fetches runtime configuration, then builds the "provider sandwich" (routing, data-fetching, authentication) around [`App`](#srcapptsx) and mounts the whole thing into the `<div id="root">` element. It exists to start everything in the right order.

**How it works, step by step:** At module load it imports the four Roboto font weights (so text renders consistently) and calls `syncEngineSettingsDefaults()` to make sure engine settings have sensible defaults. It creates a single `QueryClient` (the cache used by TanStack Query). The `bootstrap()` async function first `await loadApiConfig()` — fetching the API URL configuration *before* rendering, so the app knows where the backend lives — and then renders. The render call attaches to `document.getElementById("root")` and wraps `App` in nested providers, from outside in: `React.StrictMode` (extra development-time checks), `QueryClientProvider` (data caching), `BrowserRouter` (URL-based routing), and `AuthProvider` (login state). It also mounts two always-on background components, [`LocalGameMigrationPrompt`](#srccomponentslocalgamemigrationprompttsx) and [`PlatformSyncOrchestrator`](#srccomponentsplatformsyncorchestratortsx), alongside `App`. Finally `void bootstrap()` kicks the whole process off.

**Props, functions & exports:**

- This file exports nothing; it is the entry module executed directly by the browser/Vite.
- **`bootstrap()`** — internal async function that awaits config loading and then renders the app tree.

**Connections:** Imports Roboto fonts, React/ReactDOM, `BrowserRouter` (react-router), `QueryClient`/`QueryClientProvider` (TanStack Query), [`App`](#srcapptsx), `AuthProvider` (`@/contexts/AuthContext`), [`LocalGameMigrationPrompt`](#srccomponentslocalgamemigrationprompttsx), [`PlatformSyncOrchestrator`](#srccomponentsplatformsyncorchestratortsx), `loadApiConfig` (`@/config/apiUrl`), and `syncEngineSettingsDefaults` (`@/lib/syncEngineSettingsDefaults`).

---

## `src/api.tsx`

**In one sentence:** The shared HTTP client (built on Axios) that talks to the backend, automatically attaching the login token to requests and refreshing it when it expires.

**What it is & why it exists (plain English):** Almost every feature needs to call the VoltChess server. Rather than configure those calls everywhere, this file creates one preconfigured HTTP client that the whole app reuses. Its two clever behaviours: it automatically adds your "login wristband" (the JWT access token) to every request, and if the server says your token has expired (a `401` response), it transparently fetches a new one and retries the request so you are not logged out unnecessarily. It exists to centralise networking and keep sessions alive smoothly.

**How it works, step by step:** It creates an Axios instance with a base URL (resolved from config) and a 30-second timeout. A **request interceptor** runs before every outgoing request: it refreshes the base URL from config and, if an access token exists, sets the `Authorization: Bearer <token>` header. The exported **`refreshAccessToken`** function exchanges the stored refresh token for a new access token; it is "single-flight", meaning if several requests need a refresh at once, they all share one in-flight `refreshPromise` instead of hammering the server. Crucially, it only clears the session when the *refresh token itself* is rejected with a `401` — transient network failures keep you logged in. A **response interceptor** watches for `401` errors: if a request fails with 401, has not already been retried, and is not itself a token endpoint, it marks it retried, calls `refreshAccessToken`, and — if a new token comes back — replays the original request with the new token; otherwise it lets the error through.

**Props, functions & exports:**

- **`api` (default export, an Axios instance)** — the preconfigured HTTP client used app-wide.
- **`refreshAccessToken()` (named export, an async function).** No parameters. **Returns:** a promise resolving to a new access-token string, or `null` if there is no refresh token or the refresh failed.

**Connections:** Uses `axios`, `getApiBaseUrl`/`resolveApiBaseUrl` (`@/config/apiUrl`), and the auth-storage helpers `clearAuthStorage`/`getAccessToken`/`getRefreshToken`/`setTokens` (`@/lib/authStorage`). It is imported by virtually every feature that calls the backend, and its refresh logic is shared with the proactive refresh timer in `AuthContext`.

---

## `src/sentry.client.config.ts`

**In one sentence:** Configures Sentry, the error-monitoring service, to capture crashes and session replays in production (but not on localhost), while ignoring a known list of harmless/noisy errors.

**What it is & why it exists (plain English):** When real users hit bugs, the team wants to know — with enough detail to fix them. Sentry is a service that automatically reports errors (and can even record a replay of what the user did). This file sets Sentry up, but only in the real production site, so developers' local machines do not flood the dashboard. It also filters out a long list of expected, unactionable errors (like aborted requests or WebAssembly out-of-memory from the chess engine). It exists to give the team visibility into production problems without noise.

**How it works, step by step:** It only initialises Sentry when three conditions hold: a `VITE_SENTRY_DSN` (the project key) is configured, code is running in a browser (`window` exists), and the hostname is not `localhost`. When initialised, it sets the environment to "production", enables a session-replay integration (without masking text/inputs/media, so replays are detailed), captures 100% of traces and error replays but 0% of routine session replays, and attaches device hints (`hardwareConcurrency`, `deviceMemory`) to every report. The `ignoreErrors` array suppresses a curated list of benign messages — aborted fetches, "Failed to fetch", several WebAssembly/out-of-memory errors from the Stockfish engine, etc.

**Props, functions & exports:** None — this file runs its configuration as a side effect on import and exports nothing.

**Connections:** Uses `@sentry/react` and reads `import.meta.env.VITE_SENTRY_DSN` (declared in [`vite-env.d.ts`](#srcvite-envdts)). It is imported for its side effect during app startup.

---

## `src/vite-env.d.ts`

**In one sentence:** A TypeScript declaration file that tells the type-checker which `VITE_...` environment variables exist and what types they are.

**What it is & why it exists (plain English):** Vite (the build tool) exposes configuration values through `import.meta.env` — for example the API URL or the Sentry key. TypeScript does not know these custom variables exist unless you describe them. This file is that description: a contract listing each environment variable and whether it is text and optional. It contains no runnable code (the `.d.ts` extension means "declarations only"); it just makes the editor and compiler aware of the variables so misspellings are caught. It exists for type safety and editor autocompletion around environment configuration.

**How it works, step by step:** The first line references Vite's own client types. It then declares an `ImportMetaEnv` interface listing the app's variables: `VITE_API_URL`, `VITE_ENABLE_AUTHENTICATION`, and `VITE_SENTRY_DSN` (all optional text), plus a group of required Firebase keys (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`). It also augments the `ImportMeta` interface so `import.meta.env` is typed with that interface. The compiler now understands each variable's name and type wherever `import.meta.env.X` is used.

**Props, functions & exports:** None — it is a global type-declaration file with no exports and no runtime effect.

**Connections:** References `vite/client` types. The variables it declares are read across the app, notably `VITE_SENTRY_DSN` in [`sentry.client.config.ts`](#srcsentryclientconfigts) and others in the config/constants layer.

---

## Summary

This document covered all of VoltChess's shared UI components and the app-entry/root files: the small presentational pieces (dialogs, links, loading states, progress bars, sliders, the logo), the route guards that control access (`RequireAuth`, `RoleRoute`, `GuestRoute`), the invisible background workers and side-effect helpers (`Head`, `pageTitle`, `SchemaOrg`, `RouteAnalytics`, `LocalGameMigrationPrompt`, `PlatformSyncOrchestrator`), the theming wrapper, the full interactive chessboard and its supporting board files, the pretty move-notation renderer, and the five root files that start and configure the whole application.
