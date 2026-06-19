#!/usr/bin/env bash
# Fallback public HTTPS tunnel when Cloudflare quick tunnel is rate-limited (HTTP 429).
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
URL_FILE="$BACKEND_DIR/PUBLIC_API_URL.txt"
LOG_FILE="$BACKEND_DIR/tunnel.log"

save_url_from_line() {
  local line="$1"
  local url
  url="$(echo "$line" | grep -oE 'https://[a-zA-Z0-9.-]+\.(lhr\.life|localhost\.run)' | head -1)"
  if [[ -n "$url" ]]; then
    echo "$url" >"$URL_FILE"
    echo "Saved tunnel URL: $url" >>"$LOG_FILE"
  fi
}

echo "=== localhost.run tunnel start $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" >>"$LOG_FILE"

while true; do
  ssh -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=30 \
    -o ExitOnForwardFailure=yes \
    -R 80:127.0.0.1:8000 \
    nokey@localhost.run 2>&1 | while IFS= read -r line; do
      echo "$line" >>"$LOG_FILE"
      save_url_from_line "$line"
    done
  echo "localhost.run disconnected; retrying in 45s" >>"$LOG_FILE"
  sleep 45
done
