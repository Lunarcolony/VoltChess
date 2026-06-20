#!/usr/bin/env bash
# Cloudflare quick tunnel (default). Retries with backoff on HTTP 429.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
URL_FILE="$BACKEND_DIR/PUBLIC_API_URL.txt"
LOG_FILE="$BACKEND_DIR/tunnel.log"
CLOUDFLARED="${CLOUDFLARED:-/usr/local/bin/cloudflared}"

mkdir -p "$BACKEND_DIR"

capture_url() {
  grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$LOG_FILE" 2>/dev/null | tail -1 || true
}

url_watcher() {
  local last=""
  for _ in $(seq 1 3600); do
    url="$(capture_url)"
    if [[ -n "$url" && "$url" != "$last" ]]; then
      echo "$url" >"$URL_FILE"
      echo "Updated PUBLIC_API_URL.txt: $url" >>"$LOG_FILE"
      last="$url"
    fi
    sleep 2
  done
}

echo "=== cloudflare tunnel start $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" >>"$LOG_FILE"

url_watcher &
WATCHER_PID=$!
trap 'kill "$WATCHER_PID" 2>/dev/null || true' EXIT

BACKOFF="${TUNNEL_INITIAL_BACKOFF:-45}"
MAX_BACKOFF="${TUNNEL_MAX_BACKOFF:-300}"
RATE_LIMIT_HITS=0

while true; do
  if "$CLOUDFLARED" tunnel --url http://127.0.0.1:8000 --no-autoupdate >>"$LOG_FILE" 2>&1; then
    BACKOFF="${TUNNEL_INITIAL_BACKOFF:-45}"
    RATE_LIMIT_HITS=0
    echo "cloudflared exited cleanly; restarting in 5s" >>"$LOG_FILE"
    sleep 5
    continue
  fi

  if tail -5 "$LOG_FILE" | grep -qE '429 Too Many Requests|error code: 1015'; then
    RATE_LIMIT_HITS=$((RATE_LIMIT_HITS + 1))
    if (( RATE_LIMIT_HITS >= 2 )); then
      echo "cloudflared rate-limited repeatedly; switching to localhost.run fallback" >>"$LOG_FILE"
      kill "$WATCHER_PID" 2>/dev/null || true
      exec "$SCRIPT_DIR/start-tunnel-fallback.sh"
    fi
  fi

  echo "cloudflared failed (see log); retrying in ${BACKOFF}s" >>"$LOG_FILE"
  sleep "$BACKOFF"
  if (( BACKOFF < MAX_BACKOFF )); then
    BACKOFF=$(( BACKOFF * 2 ))
    if (( BACKOFF > MAX_BACKOFF )); then
      BACKOFF=$MAX_BACKOFF
    fi
  fi
done
