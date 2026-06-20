#!/usr/bin/env bash
# Ensure VoltChess API + HTTPS tunnel start automatically on every Pi boot.
# Run once on the Pi: bash backend/scripts/ensure-autostart.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$BACKEND_DIR/.env"
VENV="$BACKEND_DIR/.venv"
PI_USER="${SUDO_USER:-$USER}"
CLOUDFLARED="/usr/local/bin/cloudflared"

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

chmod +x "$SCRIPT_DIR/start-tunnel.sh" "$SCRIPT_DIR/start-tunnel-cloudflare.sh" "$SCRIPT_DIR/start-tunnel-fallback.sh" "$SCRIPT_DIR/setup-tunnel.sh" "$SCRIPT_DIR/recover-tunnel.sh" 2>/dev/null || true

GUNICORN_BIND="0.0.0.0:8000"
GUNICORN_WORKERS="2"
USE_SQLITE="false"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source <(grep -E '^(GUNICORN_|USE_SQLITE=)' "$ENV_FILE" | sed 's/\r$//') || true
fi
if [[ "${USE_SQLITE}" == "true" ]]; then
  GUNICORN_WORKERS=1
fi

echo "==> Installing boot services (no login required after reboot)"

sudo tee /etc/systemd/system/voltchess-api.service >/dev/null <<EOF
[Unit]
Description=VoltChess Django API (Gunicorn)
After=network-online.target
Wants=network-online.target
StartLimitIntervalSec=0

[Service]
Type=simple
User=$PI_USER
Group=$PI_USER
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=-$ENV_FILE
ExecStart=$VENV/bin/gunicorn voltchess_api.wsgi:application \\
  --bind ${GUNICORN_BIND} \\
  --workers ${GUNICORN_WORKERS} \\
  --timeout 120 \\
  --access-logfile - \\
  --error-logfile -
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target voltchess.target
EOF

sudo tee /etc/systemd/system/voltchess-tunnel.service >/dev/null <<EOF
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
Documentation=file://${BACKEND_DIR}/DEPLOY_PI.md
After=network-online.target
Wants=voltchess-api.service voltchess-tunnel.service

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable voltchess.target voltchess-api voltchess-tunnel
sudo systemctl restart voltchess-api
sleep 3
sudo systemctl restart voltchess-tunnel

echo ""
echo "==> Boot autostart enabled"
echo "    voltchess-api     : sudo systemctl status voltchess-api"
echo "    voltchess-tunnel  : sudo systemctl status voltchess-tunnel"
echo "    Public URL file   : $BACKEND_DIR/PUBLIC_API_URL.txt"
echo ""
echo "After every reboot both services start automatically."
echo "If voltchess.me stops working, the tunnel URL may have changed — check:"
echo "  cat $BACKEND_DIR/PUBLIC_API_URL.txt"
