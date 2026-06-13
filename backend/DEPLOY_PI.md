# VoltChess API on Raspberry Pi

Django REST API for auth, academies, games, assignments, and annotations. The Vite frontend on Vercel talks to this API over HTTPS.

## Quick setup (on the Pi)

From your dev machine, copy the repo to the Pi (or `git clone` on the Pi), then SSH in and run:

```bash
cd ~/VoltChess   # or wherever the repo lives
bash backend/scripts/setup-pi.sh
```

The script:

- Creates `backend/.env` (SQLite by default, binds Gunicorn to `0.0.0.0:8000`)
- Installs Python deps in `backend/.venv`
- Runs migrations and seeds demo users (`coach` / `student`, password `demo1234`)
- Installs `voltchess-api` + `voltchess-tunnel` systemd services
- **Enables boot autostart** — both start automatically on every power-on (no SSH/login needed)

## Automatic start on boot (no human input)

After `setup-pi.sh`, these services are **enabled** and start when the Pi powers on:

| Service | What it does |
|---------|----------------|
| `voltchess-api` | Django API on port 8000 |
| `voltchess-tunnel` | HTTPS Cloudflare tunnel for voltchess.me |
| `voltchess.target` | Starts both together |

You do **not** need to SSH in or run any commands after a reboot.

```bash
# Check status anytime (optional)
sudo systemctl status voltchess-api voltchess-tunnel

# Re-apply boot config after pulling updates
bash backend/scripts/ensure-autostart.sh
```

**Note:** The free Cloudflare *quick* tunnel URL can change after a reboot. If voltchess.me login breaks, check the new URL:

```bash
cat ~/VoltChess/backend/PUBLIC_API_URL.txt
```

Then update `src/config/apiUrl.ts` and `vercel.json`, or set up a **named** Cloudflare tunnel for a permanent URL (see Production section below).

Verify:

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/me/
# Expect 401 (unauthenticated) — API is up
```

## Connect the Vercel frontend

### Same Wi‑Fi / LAN (testing only)

In Vercel → Project → Settings → Environment Variables:

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `http://192.168.8.132:8000` |

Redeploy. **Note:** Browsers on the same network can reach the Pi; users on the public internet cannot use a private LAN IP.

### Production (voltchess.me → Pi)

Use **Cloudflare Tunnel** (recommended — no router port forwarding):

1. On the Pi: [Install cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
2. Create a tunnel in Cloudflare Zero Trust → route `api.yourdomain.com` → `http://localhost:8000`
3. Set `VITE_API_URL=https://api.yourdomain.com` on Vercel
4. Add that host to `DJANGO_ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` in `backend/.env`, then:

   ```bash
   sudo systemctl restart voltchess-api
   ```

## Environment variables (`backend/.env`)

See `backend/.env.example`. Important:

- `GUNICORN_BIND=0.0.0.0:8000` — listen on all interfaces (LAN + tunnel)
- `DJANGO_ALLOWED_HOSTS` — Pi IP, tunnel hostname, `localhost`
- `CORS_ALLOWED_ORIGINS` — `https://voltchess.me`, local dev URLs
- `USE_SQLITE=true` — fine for testing; use Postgres for heavier load

## Manual commands

```bash
cd backend
source .venv/bin/activate
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 0.0.0.0:8000   # dev only

sudo systemctl status voltchess-api
sudo systemctl restart voltchess-api
sudo journalctl -u voltchess-api -f
```

## API endpoints (match frontend)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/token/` | Login (JWT access + refresh) |
| POST | `/api/token/refresh/` | Refresh access token |
| POST | `/api/register/` | Register |
| GET | `/api/me/` | Current user |
| … | `/api/games/`, `/api/academies/`, etc. | Academy platform |
