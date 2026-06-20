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

Fix it with a **named Cloudflare tunnel** (stable hostname), e.g. `api.voltchess.me`.

### Important: Namecheap CNAME alone is not enough

A CNAME at Namecheap pointing `api` → `<tunnel-id>.cfargotunnel.com` makes the
tunnel show **HEALTHY** in Zero Trust, but the public API stays broken:

```text
nslookup api.voltchess.me 8.8.8.8
→ CNAME …cfargotunnel.com
→ AAAA fd10:aec2:5dae::   (private IPv6 only — not reachable on the internet)
```

Clients (browsers, curl, the Pi itself) cannot connect. Gunicorn never sees public
traffic; Cloudflare returns 503 or connections time out.

**Fix:** serve `api.voltchess.me` DNS from Cloudflare with **Proxied** (orange
cloud) enabled so Cloudflare returns public `A`/`AAAA` records (e.g. `104.x`,
`172.x`) and routes HTTPS to your tunnel.

### Option A — Move voltchess.me DNS to Cloudflare (recommended)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Add site** → `voltchess.me` (Free plan).
2. Copy the two Cloudflare nameservers (e.g. `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`).
3. **Namecheap** → Domain List → voltchess.me → **Manage** → Nameservers → **Custom DNS** → paste Cloudflare NS → Save.
4. Wait for the zone to become **Active** in Cloudflare (minutes to a few hours).
5. **Cloudflare DNS** → import or recreate existing records (keep `voltchess.me` → Vercel/GitHub Pages as today).
6. Add tunnel record (Proxied / orange cloud):
   | Type  | Name | Target                              | Proxy |
   |-------|------|-------------------------------------|-------|
   | CNAME | api  | `<tunnel-id>.cfargotunnel.com`      | ON    |
7. **Remove** the old `api` CNAME from Namecheap (Cloudflare is authoritative now).
8. [Zero Trust](https://one.dash.cloudflare.com) → **Networks** → **Tunnels** → your tunnel → **Public Hostname**:
   - `api.voltchess.me` → `http://127.0.0.1:8000`
9. On the Pi (token already in `backend/.env`):
   ```bash
   bash backend/scripts/setup-named-tunnel.sh
   sudo systemctl restart cloudflared voltchess-api
   ```
10. Verify DNS returns public IPv4:
    ```bash
    nslookup api.voltchess.me 8.8.8.8
    # Expect A records like 104.x.x.x / 172.x.x.x — NOT fd10:…
    curl https://api.voltchess.me/api/health/
    # → {"status":"ok","service":"voltchess-api"}
    ```

### Option B — CLI tunnel route (also requires Cloudflare DNS)

Same as Option A steps 1–4 (nameservers on Cloudflare), then:

```bash
cloudflared tunnel login
cloudflared tunnel create voltchess
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

### Pi-side checks (after DNS is fixed)

These do **not** replace Cloudflare DNS; they only help the Pi reach the internet reliably:

```bash
# Use public resolvers instead of router DNS (192.168.8.1)
sudo nmcli connection modify 'JSnet-5Ghz' ipv4.dns '8.8.8.8 1.1.1.1'
sudo nmcli connection modify 'JSnet-5Ghz' ipv4.ignore-auto-dns yes
sudo nmcli connection up 'JSnet-5Ghz'

# Local API + tunnel
curl http://127.0.0.1:8000/api/health/
systemctl is-active cloudflared voltchess-api
journalctl -u cloudflared -n 30 --no-pager
journalctl -u voltchess-api -n 30 --no-pager
```

## 3. Keep the JWT signing key stable

If `DJANGO_SECRET_KEY` changes between deploys/restarts, every issued JWT becomes
invalid and users are forced to sign in again. Set a fixed `DJANGO_SECRET_KEY` in
`backend/.env` and never regenerate it.
