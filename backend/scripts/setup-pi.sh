#!/usr/bin/env bash
# VoltChess Django API — Raspberry Pi one-shot setup
# Run on the Pi: bash backend/scripts/setup-pi.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$BACKEND_DIR/.." && pwd)"
ENV_FILE="$BACKEND_DIR/.env"
SERVICE_NAME="voltchess-api"
PI_USER="${SUDO_USER:-$USER}"
PI_HOME="$(eval echo "~$PI_USER")"

echo "==> VoltChess backend setup (Pi)"
echo "    Backend: $BACKEND_DIR"

if ! command -v python3 >/dev/null 2>&1; then
  echo "==> Installing Python 3..."
  sudo apt-get update -qq
  sudo apt-get install -y python3 python3-venv python3-pip
fi

if ! command -v stockfish >/dev/null 2>&1; then
  echo "==> Installing Stockfish (server-side analysis fallback)..."
  sudo apt-get install -y stockfish 2>/dev/null || true
fi
STOCKFISH_BIN="$(command -v stockfish 2>/dev/null || true)"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "==> Creating $ENV_FILE from .env.example"
  cp "$BACKEND_DIR/.env.example" "$ENV_FILE"
  sed -i 's/\r$//' "$ENV_FILE" 2>/dev/null || sed -i '' 's/\r$//' "$ENV_FILE" 2>/dev/null || true
  LAN_IP="$(hostname -I | awk '{print $1}')"
  if [[ -n "$LAN_IP" ]] && grep -q "PI_LAN_IP_PLACEHOLDER" "$ENV_FILE" 2>/dev/null; then
    sed -i "s/PI_LAN_IP_PLACEHOLDER/$LAN_IP/g" "$ENV_FILE" 2>/dev/null || \
      sed -i '' "s/PI_LAN_IP_PLACEHOLDER/$LAN_IP/g" "$ENV_FILE" 2>/dev/null || true
    echo "    Set DJANGO_ALLOWED_HOSTS LAN IP to $LAN_IP"
  fi
  SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')"
  if grep -q "change-me-to-a-long-random-string" "$ENV_FILE"; then
    sed -i "s/change-me-to-a-long-random-string/$SECRET/g" "$ENV_FILE" 2>/dev/null || \
      sed -i '' "s/change-me-to-a-long-random-string/$SECRET/g" "$ENV_FILE" 2>/dev/null || true
  fi
  echo "    Edit $ENV_FILE if you need Postgres or a public API domain."
else
  echo "==> Using existing $ENV_FILE"
fi
sed -i 's/\r$//' "$ENV_FILE" 2>/dev/null || sed -i '' 's/\r$//' "$ENV_FILE" 2>/dev/null || true

echo "==> Python virtualenv"
VENV="$BACKEND_DIR/.venv"
python3 -m venv "$VENV"
# shellcheck source=/dev/null
source "$VENV/bin/activate"
pip install --upgrade pip
pip install -r "$BACKEND_DIR/requirements.txt"

echo "==> Django migrate"
cd "$BACKEND_DIR"
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a
# .env may have Windows CRLF line endings after deploy from a PC
USE_SQLITE="${USE_SQLITE//$'\r'/}"
GUNICORN_WORKERS="${GUNICORN_WORKERS//$'\r'/}"
python manage.py migrate --noinput
python manage.py collectstatic --noinput 2>/dev/null || true

if [[ "${USE_SQLITE:-false}" == "true" ]]; then
  python - <<'PY'
import sqlite3
from pathlib import Path

db = Path("db.sqlite3")
if db.is_file():
    con = sqlite3.connect(db, timeout=30)
    con.execute("pragma journal_mode=WAL")
    con.execute("pragma synchronous=NORMAL")
    con.close()
    print("    SQLite WAL mode enabled")
PY
fi

if [[ -n "$STOCKFISH_BIN" ]]; then
  if grep -q '^STOCKFISH_PATH=' "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^STOCKFISH_PATH=.*|STOCKFISH_PATH=${STOCKFISH_BIN}|" "$ENV_FILE"
  else
    echo "STOCKFISH_PATH=${STOCKFISH_BIN}" >>"$ENV_FILE"
  fi
  echo "    Stockfish: $STOCKFISH_BIN"
fi

echo "==> Demo users (coach / student, password demo1234)"
python manage.py seed_demo || true

GUNICORN_BIND="${GUNICORN_BIND:-0.0.0.0:8000}"
if [[ "${USE_SQLITE:-false}" == "true" ]]; then
  GUNICORN_WORKERS=1
  echo "    SQLite mode: gunicorn workers=1 (avoids DB lock contention)"
else
  GUNICORN_WORKERS="${GUNICORN_WORKERS:-2}"
fi

sudo tee /etc/systemd/system/voltchess.target >/dev/null <<'EOF'
[Unit]
Description=VoltChess Backend (API + HTTPS tunnel)
After=network-online.target
Wants=voltchess-api.service voltchess-tunnel.service

[Install]
WantedBy=multi-user.target
EOF

echo "==> Installing systemd service ($SERVICE_NAME)"
sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" >/dev/null <<EOF
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

sudo systemctl daemon-reload
sudo systemctl enable voltchess.target "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

LAN_IP="$(hostname -I | awk '{print $1}')"
echo ""
echo "=============================================="
echo " VoltChess API is running"
echo "=============================================="
echo " LAN URL:  http://${LAN_IP}:8000"
echo " Health:   curl http://${LAN_IP}:8000/api/me/  (401 without token = OK)"
echo " Login:    POST http://${LAN_IP}:8000/api/token/"
echo " Demo:     coach / demo1234  |  student / demo1234"
echo ""
echo " Set on Vercel (or local .env):"
echo "   VITE_API_URL=http://${LAN_IP}:8000"
echo ""
echo " For voltchess.me (public internet), expose the Pi with"
echo " Cloudflare Tunnel — see backend/DEPLOY_PI.md"
echo ""
echo " Service: sudo systemctl status $SERVICE_NAME"
echo " Logs:    sudo journalctl -u $SERVICE_NAME -f"
echo "=============================================="

echo ""
echo "==> HTTPS tunnel + boot autostart..."
bash "$SCRIPT_DIR/setup-tunnel.sh" || echo "WARN: Tunnel setup failed"
bash "$SCRIPT_DIR/ensure-autostart.sh"
