#!/usr/bin/env bash
# Stop tunnel, cool down (avoids Cloudflare 429), start fresh, wait for PUBLIC_API_URL.txt
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
URL_FILE="$BACKEND_DIR/PUBLIC_API_URL.txt"
MODE_FILE="$BACKEND_DIR/.tunnel_mode"
COOLDOWN="${TUNNEL_COOLDOWN_SEC:-90}"
WAIT_SEC="${TUNNEL_WAIT_SEC:-240}"
LOG_FILE="$BACKEND_DIR/tunnel.log"

echo "==> Stopping voltchess-tunnel..."
sudo systemctl stop voltchess-tunnel || true

if [[ -f "$LOG_FILE" ]] && tail -30 "$LOG_FILE" | grep -qE '429|1015'; then
  COOLDOWN="${TUNNEL_RATE_LIMIT_COOLDOWN_SEC:-120}"
  echo "localhost-run" >"$MODE_FILE"
  echo "==> Cloudflare rate limit detected — using localhost.run fallback after ${COOLDOWN}s..."
fi

echo "==> Cooling down ${COOLDOWN}s..."
sleep "$COOLDOWN"

echo "==> Starting voltchess-tunnel..."
sudo systemctl start voltchess-tunnel

echo "==> Waiting up to ${WAIT_SEC}s for tunnel URL..."
for ((i = 1; i <= WAIT_SEC / 5; i++)); do
  if [[ -f "$URL_FILE" ]]; then
    url="$(tr -d '\r\n' < "$URL_FILE")"
    if [[ "$url" == https://* ]]; then
      echo "==> Tunnel URL: $url"
      if curl -sf --connect-timeout 5 --max-time 10 "${url}/api/health/" >/dev/null; then
        echo "==> Public health check OK"
        exit 0
      fi
      echo "    URL saved; public health not ready yet (attempt $i)"
    fi
  fi
  sleep 5
done

echo "ERROR: Tunnel URL not ready. Check:"
echo "  journalctl -u voltchess-tunnel -n 30"
echo "  tail -20 $BACKEND_DIR/tunnel.log"
exit 1
