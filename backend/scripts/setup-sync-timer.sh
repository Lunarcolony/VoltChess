#!/usr/bin/env bash
# Install systemd timer: platform sync only (browser analyzes games in-tab).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$BACKEND_DIR/.env"
VENV="$BACKEND_DIR/.venv"
PI_USER="${SUDO_USER:-$USER}"

if [[ ! -x "$VENV/bin/python" ]]; then
  echo "ERROR: venv not found at $VENV — run setup-pi.sh first"
  exit 1
fi

sudo tee /etc/systemd/system/voltchess-sync.service >/dev/null <<EOF
[Unit]
Description=VoltChess platform sync (Chess.com / Lichess import)
After=network-online.target voltchess-api.service
Wants=network-online.target

[Service]
Type=oneshot
User=$PI_USER
Group=$PI_USER
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=-$ENV_FILE
ExecStart=$VENV/bin/python manage.py run_platform_sync --analyze --max-analyze 2
StandardOutput=journal
StandardError=journal
EOF

sudo tee /etc/systemd/system/voltchess-sync.timer >/dev/null <<EOF
[Unit]
Description=Run VoltChess platform sync every 5 minutes

[Timer]
OnBootSec=45
OnUnitActiveSec=300
AccuracySec=30
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Hybrid: browser does full reports when a tab is open; Pi Stockfish is fallback
# when the student is offline or the browser queue is stalled.
sudo systemctl disable --now voltchess-analyze.timer 2>/dev/null || true
sudo systemctl stop voltchess-analyze.service 2>/dev/null || true

sudo systemctl daemon-reload
sudo systemctl enable --now voltchess-sync.timer
echo "==> voltchess-sync.timer enabled (import + Pi fallback analysis)"
systemctl list-timers voltchess-sync.timer --no-pager
echo ""
echo "Watch sync: journalctl -u voltchess-sync.service -f"
