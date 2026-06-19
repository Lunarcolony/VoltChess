#!/usr/bin/env bash
# Expose Django API over HTTPS via Cloudflare Quick Tunnel (no account required).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
URL_FILE="$BACKEND_DIR/PUBLIC_API_URL.txt"
ENV_FILE="$BACKEND_DIR/.env"
SERVICE_NAME="voltchess-tunnel"
CLOUDFLARED="/usr/local/bin/cloudflared"

echo "==> Cloudflare HTTPS tunnel for VoltChess API"

if [[ ! -x "$CLOUDFLARED" ]]; then
  echo "==> Installing cloudflared..."
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

PI_USER="${SUDO_USER:-$USER}"

chmod +x "$SCRIPT_DIR/start-tunnel.sh"

sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" >/dev/null <<EOF
[Unit]
Description=VoltChess API HTTPS tunnel (Cloudflare)
After=network-online.target voltchess-api.service
Requires=voltchess-api.service
Wants=network-online.target
StartLimitIntervalSec=0

[Service]
Type=simple
User=$PI_USER
Group=$PI_USER
WorkingDirectory=$BACKEND_DIR
ExecStart=$BACKEND_DIR/scripts/start-tunnel.sh
Restart=always
RestartSec=60

[Install]
WantedBy=multi-user.target voltchess.target
EOF

sudo tee /etc/systemd/system/voltchess.target >/dev/null <<EOF
[Unit]
Description=VoltChess Backend (API + HTTPS tunnel)
After=network-online.target
Wants=voltchess-api.service voltchess-tunnel.service

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable voltchess.target "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

echo "==> Waiting for tunnel URL..."
TUNNEL_URL=""
for _ in $(seq 1 45); do
  TUNNEL_URL="$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$BACKEND_DIR/tunnel.log" 2>/dev/null | tail -1 || true)"
  if [[ -z "$TUNNEL_URL" ]]; then
    TUNNEL_URL="$(sudo journalctl -u "$SERVICE_NAME" --no-pager -n 80 2>/dev/null \
      | grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | tail -1 || true)"
  fi
  if [[ -n "$TUNNEL_URL" ]]; then
    sleep 5
    if curl -sf "${TUNNEL_URL}/api/health/" >/dev/null 2>&1; then
      break
    fi
  fi
  sleep 2
done

if [[ -z "$TUNNEL_URL" ]]; then
  echo "ERROR: Could not detect tunnel URL. Check: sudo journalctl -u $SERVICE_NAME -f"
  exit 1
fi

echo "$TUNNEL_URL" > "$URL_FILE"
echo "==> Public HTTPS API: $TUNNEL_URL"
echo "    Saved to $URL_FILE"

if [[ -f "$ENV_FILE" ]]; then
  sed -i 's/\r$//' "$ENV_FILE" 2>/dev/null || true
  if grep -q '^DJANGO_ALLOWED_HOSTS=' "$ENV_FILE"; then
    sed -i 's/^DJANGO_ALLOWED_HOSTS=.*/DJANGO_ALLOWED_HOSTS=*/' "$ENV_FILE"
  else
    echo 'DJANGO_ALLOWED_HOSTS=*' >> "$ENV_FILE"
  fi
  if ! grep -q 'trycloudflare' "$ENV_FILE" 2>/dev/null; then
    if grep -q '^CORS_ALLOWED_ORIGINS=' "$ENV_FILE"; then
      sed -i 's|^CORS_ALLOWED_ORIGINS=\(.*\)|CORS_ALLOWED_ORIGINS=\1,https://voltchess.me,https://www.voltchess.me|' "$ENV_FILE"
    fi
  fi
  sudo systemctl restart voltchess-api 2>/dev/null || true
fi

echo ""
echo "Set on Vercel → Environment Variables:"
echo "  VITE_API_URL=$TUNNEL_URL"
echo ""
echo "Test: curl -s $TUNNEL_URL/api/health/"
