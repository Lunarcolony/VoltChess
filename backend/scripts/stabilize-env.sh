#!/usr/bin/env bash
# Keep DJANGO_SECRET_KEY stable across deploys (never regenerate on setup-pi.sh).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$BACKEND_DIR/.env"
BACKUP="$BACKEND_DIR/.env.secret_backup"
API_HOST="${VOLTCHES_API_HOST:-api.voltchess.me}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found"
  exit 1
fi

sed -i 's/\r$//' "$ENV_FILE" 2>/dev/null || true

if [[ -f "$BACKUP" ]]; then
  saved_key="$(grep '^DJANGO_SECRET_KEY=' "$BACKUP" | cut -d= -f2- || true)"
  if [[ -n "$saved_key" ]]; then
    if grep -q '^DJANGO_SECRET_KEY=' "$ENV_FILE"; then
      sed -i "s|^DJANGO_SECRET_KEY=.*|DJANGO_SECRET_KEY=${saved_key}|" "$ENV_FILE"
    else
      echo "DJANGO_SECRET_KEY=${saved_key}" >>"$ENV_FILE"
    fi
    echo "Restored DJANGO_SECRET_KEY from backup (sessions stay valid)."
  fi
else
  grep '^DJANGO_SECRET_KEY=' "$ENV_FILE" >"$BACKUP" || true
  chmod 600 "$BACKUP" 2>/dev/null || true
  echo "Saved DJANGO_SECRET_KEY backup to $BACKUP"
fi

# Allowed hosts + CORS for stable API hostname
if grep -q '^DJANGO_ALLOWED_HOSTS=' "$ENV_FILE"; then
  if ! grep '^DJANGO_ALLOWED_HOSTS=' "$ENV_FILE" | grep -q "$API_HOST"; then
    sed -i "s|^DJANGO_ALLOWED_HOSTS=\(.*\)|DJANGO_ALLOWED_HOSTS=\1,${API_HOST}|" "$ENV_FILE"
  fi
else
  echo "DJANGO_ALLOWED_HOSTS=*,${API_HOST}" >>"$ENV_FILE"
fi

dedupe_cors() {
  local raw="$1"
  local IFS=,
  local -a parts=()
  local -A seen=()
  local p
  for p in $raw; do
    p="${p// /}"
    [[ -z "$p" ]] && continue
    [[ -n "${seen[$p]:-}" ]] && continue
    seen[$p]=1
    parts+=("$p")
  done
  (IFS=,; echo "${parts[*]}")
}

if grep -q '^CORS_ALLOWED_ORIGINS=' "$ENV_FILE"; then
  current="$(grep '^CORS_ALLOWED_ORIGINS=' "$ENV_FILE" | cut -d= -f2-)"
  for origin in "https://${API_HOST}" "https://voltchess.me" "https://www.voltchess.me"; do
    if [[ "$current" != *"$origin"* ]]; then
      current="${current},${origin}"
    fi
  done
  cleaned="$(dedupe_cors "$current")"
  sed -i "s|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=${cleaned}|" "$ENV_FILE"
else
  echo "CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://voltchess.me,https://www.voltchess.me,https://${API_HOST}" >>"$ENV_FILE"
fi

echo "==> Environment stabilized for ${API_HOST}"
grep -E '^(DJANGO_ALLOWED_HOSTS|CORS_ALLOWED_ORIGINS)=' "$ENV_FILE"
