#!/usr/bin/env bash
# One-shot Pi production hardening (run after deploy or SSH).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
API_URL="${VOLTCHES_API_URL:-https://api.voltchess.me}"

echo "==> VoltChess Pi production setup"
bash "$SCRIPT_DIR/stabilize-env.sh"
bash "$SCRIPT_DIR/setup-sync-timer.sh"

if [[ -n "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]] || [[ -f "$HOME/.cloudflared/cert.pem" ]]; then
  bash "$SCRIPT_DIR/setup-named-tunnel.sh" || true
else
  echo ""
  echo "==> Named tunnel not configured yet (no token / cert)."
  echo "    Quick tunnel still runs via voltchess-tunnel until you add CLOUDFLARE_TUNNEL_TOKEN."
  echo "    See backend/PI_CONTINUOUS_ANALYSIS.md"
  sudo systemctl restart voltchess-api
  sudo systemctl restart voltchess-tunnel 2>/dev/null || true
fi

sudo systemctl restart voltchess-api

echo ""
echo "==> Service status"
systemctl is-active voltchess-api voltchess-tunnel cloudflared voltchess-sync.timer 2>/dev/null || true
curl -sf http://127.0.0.1:8000/api/health/ && echo ""

if [[ -f "$BACKEND_DIR/PUBLIC_API_URL.txt" ]]; then
  echo "Public URL file: $(cat "$BACKEND_DIR/PUBLIC_API_URL.txt")"
fi
