#!/usr/bin/env bash
# Pick tunnel transport: cloudflare quick tunnel, or localhost.run fallback after rate limits.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$BACKEND_DIR/tunnel.log"
MODE_FILE="$BACKEND_DIR/.tunnel_mode"
MODE="${VOLTCHES_TUNNEL_MODE:-auto}"

if [[ -f "$MODE_FILE" ]]; then
  MODE="$(tr -d '\r\n' <"$MODE_FILE")"
fi

if [[ "$MODE" == "localhost-run" ]]; then
  exec "$SCRIPT_DIR/start-tunnel-fallback.sh"
fi

if [[ "$MODE" == "cloudflare" ]]; then
  exec "$SCRIPT_DIR/start-tunnel-cloudflare.sh"
fi

# auto: use fallback if Cloudflare recently returned 429
if [[ -f "$LOG_FILE" ]] && tail -40 "$LOG_FILE" | grep -qE '429 Too Many Requests|error code: 1015'; then
  echo "auto: Cloudflare rate-limited — using localhost.run fallback" >>"$LOG_FILE"
  echo "localhost-run" >"$MODE_FILE"
  exec "$SCRIPT_DIR/start-tunnel-fallback.sh"
fi

exec "$SCRIPT_DIR/start-tunnel-cloudflare.sh"
