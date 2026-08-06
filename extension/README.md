# VoltChess browser extension

Chess It Up–style one-click export from **Chess.com** into VoltChess Stockfish analysis.

## Features

- **Analyze** buttons on Chess.com game history rows
- Floating **Analyze with VoltChess** button on live/daily game pages
- Post-game modal button when Chess.com shows the game-over UI
- Opens VoltChess with the game PGN loaded — no copy/paste
- Configurable analyzer URL (production or local `npm run dev`)

## Install (Chrome / Edge / Brave)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this `extension/` folder

## Install (Firefox)

1. Open `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on…**
3. Pick `extension/manifest.json`

## Usage

1. Go to your Chess.com profile → Games / archive
2. Click **Analyze** next to a game
3. A VoltChess tab opens with the game ready for review

## Privacy

- No analytics or accounts
- Only reads public Chess.com game callback data for the game you click
- Settings stored in `chrome.storage.sync` (analyzer URL only)
