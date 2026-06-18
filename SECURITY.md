# Security notes

## What must never be committed

- Raspberry Pi **LAN IP addresses** (e.g. `192.168.x.x`)
- **SSH usernames**, home directory paths, or passwords
- Live **Cloudflare quick-tunnel URLs** (`*.trycloudflare.com`) — set these in Vercel env vars instead
- `backend/.env`, `backend/db.sqlite3`, `backend/PUBLIC_API_URL.txt`
- IDE metadata (`.vs/`, `.idea/`)

## Configuring the API securely

| Environment | How to connect |
|-------------|----------------|
| **Vercel / voltchess.me** | Set `VITE_API_URL=https://your-api-domain` in Vercel → Environment Variables |
| **Local dev** | Leave `VITE_API_URL` unset; set `API_PROXY_TARGET=http://127.0.0.1:8000` in `.env` for the Vite proxy |
| **Pi deploy** | Set `PI_SSH_HOST=pi@192.168.x.x` in your shell when running `scripts/deploy-pi.ps1` |

Optional runtime override without redeploy: host `public/api-config.json` with `"apiUrl": "https://..."` on your CDN — use `public/api-config.example.json` as a template.

## Pi backend hardening

1. Run `backend/scripts/setup-pi.sh` — it generates a random `DJANGO_SECRET_KEY`.
2. Set `DJANGO_DEBUG=false` in `backend/.env` on the Pi.
3. Prefer a **named Cloudflare tunnel** with a stable hostname over free quick tunnels.
4. Change demo passwords (`coach` / `student`) before exposing the API publicly.
5. Restrict `DJANGO_ALLOWED_HOSTS` to your tunnel hostname and LAN IP instead of `*` when possible.

## If secrets were already pushed to GitHub

Old commits may still contain LAN IPs or tunnel URLs. After merging these fixes:

1. **Rotate** your Cloudflare tunnel (new URL) and update Vercel `VITE_API_URL`.
2. Consider changing your Pi SSH password if deploy scripts with credentials were committed.
3. To purge history, use [git filter-repo](https://github.com/newren/git-filter-repo) or GitHub secret scanning — force-pushing rewritten history affects all collaborators.

## Reporting issues

Do not open public issues with IP addresses, tunnel URLs, or credentials.
