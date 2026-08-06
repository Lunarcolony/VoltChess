# VoltChess

**VoltChess** is free Stockfish chess game analysis for Chess.com and Lichess — open source on GitHub.

| | |
|---|---|
| **Live app** | [voltchess.vercel.app](https://voltchess.vercel.app) |
| **Source (this repo)** | [github.com/Lunarcolony/VoltChess](https://github.com/Lunarcolony/VoltChess) |
| **Domain notice** | [voltchess.me expired — we moved](https://voltchess.vercel.app/moved) |

> **VoltChess moved.** `voltchess.me` expired — the free analyzer is now at **https://voltchess.vercel.app** (same app, no sign-up). Please update bookmarks.

Upload a PGN, review blunders, and improve your game. No sign-up required.

## Features

- Unlimited Stockfish game review (Chess.com, Lichess, PGN, FEN)
- Move classification, accuracy scores, eval graph, best-move arrows
- Next-move calculator, board editor, and Elo calculator (`/tools`)
- Interactive opening trainer with repertoire drills
- Elo-rated puzzles (local bank + Lichess daily)
- AI training coach that builds a plan from your recent games
- Play vs engine
- Browser extension: one-click Analyze on Chess.com (`extension/`)
- Dark UI with selectable color themes

## Browser extension

Chess It Up–style Chrome/Edge extension lives in [`extension/`](extension/). Load it unpacked from `chrome://extensions` (Developer mode). It adds **Analyze** buttons on Chess.com game history and opens VoltChess with the game loaded.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # output: dist/
```

Optional environment variables (`.env`):

| Variable | Description |
|----------|-------------|
| `VITE_ENABLE_AUTHENTICATION` | `true` / `false` — enable JWT login |
| `VITE_API_URL` | Backend API base URL |

## License & attribution

VoltChess is based on [Chesskit](https://github.com/GuillaumeSD/Chesskit) and is licensed under the [GNU Affero General Public License v3.0](LICENCE).

- **Source code:** AGPL-3.0 — see [LICENCE](LICENCE) for the full license text.
- **Third-party assets** (chess piece sets, sounds, and other exceptions): see [COPYING.md](COPYING.md).
- **Default piece set:** [maestro](public/piece/maestro) by sadsnake1 — [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

If you run a modified version as a network service, AGPL requires you to offer corresponding source to users interacting with it over the network.

## Documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — high-level architecture and a condensed per-file map.
- [`docs/`](docs/README.md) — the **complete code guide**: a plain-English, ~1-page-per-file reference covering every file in the project (start at [`docs/README.md`](docs/README.md)).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
