# Raspberry Pi: continuous sync + analysis distribution

How analysis is meant to be distributed:

- **Browser is authoritative** for full reports. When a student is signed in on
  the website, their browser runs Stockfish on pending games and uploads the
  finished report (evaluation + per-move classifications + accuracy) to the Pi
  via `POST /api/sync/games/<id>/complete/`. The Pi just stores it.
- **The Pi runs sync constantly** so newly-played games are imported and ready
  for the browser to analyze.
- Optional **server-side Stockfish** on the Pi can analyze games when no student
  browser is online. Note it is single-PV, so its reports have no move
  classifications — prefer browser analysis for complete reports.

## 1. Run sync continuously (systemd timer)

Create `/etc/systemd/system/voltchess-sync.service`:

```ini
[Unit]
Description=VoltChess platform sync + analysis queue
After=network-online.target

[Service]
Type=oneshot
WorkingDirectory=/home/pi/VoltChess/backend
# Import newly played games. Add --analyze to also run server-side Stockfish
# (incomplete reports; browser analysis is preferred).
ExecStart=/home/pi/VoltChess/backend/.venv/bin/python manage.py run_platform_sync
EnvironmentFile=/home/pi/VoltChess/backend/.env
```

Create `/etc/systemd/system/voltchess-sync.timer`:

```ini
[Unit]
Description=Run VoltChess sync every minute

[Timer]
OnBootSec=30
OnUnitActiveSec=60
AccuracySec=10

[Install]
WantedBy=timers.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now voltchess-sync.timer
systemctl list-timers voltchess-sync.timer   # verify it's scheduled
journalctl -u voltchess-sync.service -f       # watch runs
```

## 2. Use a STABLE tunnel hostname (fixes "works locally, broken on the web")

The frontend reads the backend URL from `dist/api-config.json`. If you use a
quick `trycloudflare.com` tunnel, that hostname **changes every time the tunnel
restarts**, so the deployed site points at a dead URL until you rebuild and
redeploy — which looks like "nothing works / I get logged out" on the web.

Fix it with a **named Cloudflare tunnel** (stable hostname), e.g. `api.voltchess.me`:

```bash
cloudflared tunnel login
cloudflared tunnel create voltchess
# Map a stable hostname to the local backend:
cloudflared tunnel route dns voltchess api.voltchess.me
# ~/.cloudflared/config.yml:
#   tunnel: <tunnel-id>
#   credentials-file: /home/pi/.cloudflared/<tunnel-id>.json
#   ingress:
#     - hostname: api.voltchess.me
#       service: http://127.0.0.1:8000
#     - service: http_status:404
sudo cloudflared service install   # run it as a service so it survives reboots
```

Then set the frontend `api-config.json` (or `VITE_API_URL`) to
`https://api.voltchess.me` **once** — it never needs to change again.

## 3. Keep the JWT signing key stable

If `DJANGO_SECRET_KEY` changes between deploys/restarts, every issued JWT becomes
invalid and users are forced to sign in again. Set a fixed `DJANGO_SECRET_KEY` in
`backend/.env` and never regenerate it.
