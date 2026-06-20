# VoltChess

Free chess analysis powered by Stockfish — upload a PGN, review blunders, and improve your game. No sign-up required.

**Live:** [voltchess.me](https://voltchess.me)

## Features

- Stockfish engine analysis (multiple versions, including lite builds)
- Move classification, accuracy scores, and evaluation graph
- PGN upload, Chess.com / Lichess import
- Tactical puzzles
- Interactive onboarding tour
- Dark UI with selectable color themes

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
