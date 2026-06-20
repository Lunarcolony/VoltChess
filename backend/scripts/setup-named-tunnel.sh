#!/usr/bin/env bash
# Stable Cloudflare named tunnel → https://api.voltchess.me (no more ephemeral trycloudflare URLs).
#
# Option A (recommended): Cloudflare Zero Trust dashboard
#   1. https://one.dash.cloudflare.com → Networks → Tunnels → Create tunnel
#   2. Public hostname: api.voltchess.me → http://127.0.0.1:8000
#   3. Copy the tunnel token → add to backend/.env:
#        CLOUDFLARE_TUNNEL_TOKEN=eyJ...
#   4. DNS must be on Cloudflare (nameservers) with Proxied CNAME api → <tunnel-id>.cfargotunnel.com
#      A Namecheap-only CNAME resolves to fd10:… (IPv6-only, unreachable) — see PI_CONTINUOUS_ANALYSIS.md
#   5. Re-run: bash backend/scripts/setup-named-tunnel.sh
#
# Option B: CLI (domain must be on Cloudflare DNS)
#   cloudflared tunnel login
#   bash backend/scripts/setup-named-tunnel.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$BACKEND_DIR/.env"
PI_USER="${SUDO_USER:-$USER}"
PI_HOME="$(eval echo "~$PI_USER")"
CLOUDFLARED="${CLOUDFLARED:-/usr/local/bin/cloudflared}"
TUNNEL_NAME="${VOLTCHES_TUNNEL_NAME:-voltchess}"
API_HOST="${VOLTCHES_API_HOST:-api.voltchess.me}"
API_URL="https://${API_HOST}"
CF_DIR="$PI_HOME/.cloudflared"
CONFIG="$CF_DIR/config.yml"

# shellcheck disable=SC1090
source "$ENV_FILE" 2>/dev/null || true

if [[ ! -x "$CLOUDFLARED" ]]; then
  ARCH="$(uname -m)"
  case "$ARCH" in
    aarch64|arm64) CF_ARCH="arm64" ;;
    armv7l|armhf) CF_ARCH="arm" ;;
    x86_64) CF_ARCH="amd64" ;;
    *) echo "Unsupported arch: $ARCH"; exit 1 ;;
  esac
  sudo curl -fsSL \
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}" \
    -o "$CLOUDFLARED"
  sudo chmod +x "$CLOUDFLARED"
fi

mkdir -p "$CF_DIR"

install_token_tunnel() {
  local token="$1"
  echo "==> Installing named tunnel from CLOUDFLARE_TUNNEL_TOKEN..."
  sudo systemctl stop voltchess-tunnel 2>/dev/null || true
  sudo systemctl disable voltchess-tunnel 2>/dev/null || true
  sudo cloudflared service uninstall 2>/dev/null || true
  sudo "$CLOUDFLARED" service install "$token"
  sudo systemctl enable --now cloudflared
  echo "$API_URL" >"$BACKEND_DIR/PUBLIC_API_URL.txt"
  echo "==> Named tunnel service: cloudflared"
  echo "==> Stable API URL: $API_URL"
}

install_cli_tunnel() {
  if [[ ! -f "$CF_DIR/cert.pem" ]]; then
    echo ""
    echo "Cloudflare login required. Run on the Pi (or copy cert.pem from a logged-in machine):"
    echo "  $CLOUDFLARED tunnel login"
    echo ""
    echo "Or set CLOUDFLARE_TUNNEL_TOKEN in $ENV_FILE (from Zero Trust dashboard)."
    exit 1
  fi

  echo "==> Creating tunnel '$TUNNEL_NAME'..."
  TUNNEL_ID="$("$CLOUDFLARED" tunnel list -o json 2>/dev/null | python3 -c "
import json,sys
name='$TUNNEL_NAME'
try:
  tunnels=json.load(sys.stdin)
except Exception:
  tunnels=[]
for t in tunnels:
  if t.get('name')==name:
    print(t['id']); sys.exit(0)
print('')
" 2>/dev/null || true)"

  if [[ -z "$TUNNEL_ID" ]]; then
    "$CLOUDFLARED" tunnel create "$TUNNEL_NAME"
    TUNNEL_ID="$("$CLOUDFLARED" tunnel list -o json | python3 -c "
import json,sys
for t in json.load(sys.stdin):
  if t.get('name')=='$TUNNEL_NAME':
    print(t['id']); break
")"
  fi

  CREDS="$CF_DIR/${TUNNEL_ID}.json"
  if [[ ! -f "$CREDS" ]]; then
    echo "ERROR: credentials file missing: $CREDS"
    exit 1
  fi

  echo "==> Routing DNS $API_HOST (requires zone on Cloudflare)..."
  "$CLOUDFLARED" tunnel route dns "$TUNNEL_NAME" "$API_HOST" 2>/dev/null || \
    echo "    (skip if DNS is manual — add CNAME $API_HOST → ${TUNNEL_ID}.cfargotunnel.com)"

  cat >"$CONFIG" <<EOF
tunnel: $TUNNEL_ID
credentials-file: $CREDS
ingress:
  - hostname: $API_HOST
    service: http://127.0.0.1:8000
  - service: http_status:404
EOF

  sudo tee /etc/systemd/system/cloudflared.service >/dev/null <<EOF
[Unit]
Description=Cloudflare named tunnel ($API_HOST)
After=network-online.target voltchess-api.service
Wants=network-online.target

[Service]
Type=simple
User=$PI_USER
ExecStart=$CLOUDFLARED tunnel --config $CONFIG run
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target voltchess.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl stop voltchess-tunnel 2>/dev/null || true
  sudo systemctl disable voltchess-tunnel 2>/dev/null || true
  sudo systemctl enable --now cloudflared
  echo "$API_URL" >"$BACKEND_DIR/PUBLIC_API_URL.txt"
  echo "==> Named tunnel running (cloudflared.service)"
  echo "==> Stable API URL: $API_URL"
}

if [[ -n "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]]; then
  install_token_tunnel "$CLOUDFLARE_TUNNEL_TOKEN"
else
  install_cli_tunnel
fi

# Verify public health (best effort)
check_tunnel_dns() {
  local lookup=""
  if command -v getent >/dev/null 2>&1; then
    lookup="$(getent ahosts "$API_HOST" 2>/dev/null || true)"
  elif command -v nslookup >/dev/null 2>&1; then
    lookup="$(nslookup "$API_HOST" 8.8.8.8 2>/dev/null || true)"
  elif command -v host >/dev/null 2>&1; then
    lookup="$(host "$API_HOST" 8.8.8.8 2>/dev/null || true)"
  fi
  if [[ "$lookup" == *"fd10:"* ]] && [[ "$lookup" != *"104."* ]] && [[ "$lookup" != *"172."* ]]; then
    echo ""
    echo "ERROR: ${API_HOST} resolves to unreachable fd10:… (Namecheap CNAME without Cloudflare proxy)."
    echo "  Tunnel is healthy in Zero Trust, but public HTTPS cannot work until DNS is fixed."
    echo "  Fix: move voltchess.me nameservers to Cloudflare; add Proxied CNAME api → ${TUNNEL_ID:-<tunnel-id>}.cfargotunnel.com"
    echo "  See backend/PI_CONTINUOUS_ANALYSIS.md"
    return 1
  fi
  return 0
}

if ! check_tunnel_dns; then
  exit 1
fi

for i in $(seq 1 12); do
  if curl -sf --connect-timeout 5 --max-time 10 "${API_URL}/api/health/" >/dev/null; then
    echo "==> Public health check OK: ${API_URL}/api/health/"
    exit 0
  fi
  echo "    Waiting for ${API_HOST} to respond... ($i/12)"
  sleep 5
done

echo "WARNING: ${API_HOST} not reachable yet."
echo "  Tunnel may be healthy but DNS is wrong if nslookup shows fd10:… (IPv6-only)."
echo "  Fix: move voltchess.me nameservers to Cloudflare; add Proxied CNAME api → tunnel-id.cfargotunnel.com"
echo "  See backend/PI_CONTINUOUS_ANALYSIS.md — then: curl ${API_URL}/api/health/"
exit 0
