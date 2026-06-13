#!/usr/bin/env bash
# Starts cloudflared and saves the public HTTPS URL for voltchess.me
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
URL_FILE="$BACKEND_DIR/PUBLIC_API_URL.txt"
LOG_FILE="$BACKEND_DIR/tunnel.log"
CLOUDFLARED="${CLOUDFLARED:-/usr/local/bin/cloudflared}"

: > "$LOG_FILE"

capture_url() {
  grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$LOG_FILE" 2>/dev/null | tail -1 || true
}

# Background: watch log and persist URL when cloudflared prints it
(
  for _ in $(seq 1 90); do
    url="$(capture_url)"
    if [[ -n "$url" ]]; then
      echo "$url" > "$URL_FILE"
      exit 0
    fi
    sleep 2
  done
) &

exec "$CLOUDFLARED" tunnel --url http://127.0.0.1:8000 --no-autoupdate >>"$LOG_FILE" 2>&1
