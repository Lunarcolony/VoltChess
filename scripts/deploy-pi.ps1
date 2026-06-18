# Deploy VoltChess backend to Raspberry Pi (run from repo root on your PC)
# Usage:
#   $env:PI_SSH_HOST = "pi@192.168.x.x"   # your Pi SSH target — never commit this
#   .\scripts\deploy-pi.ps1
#
# Prefer SSH key auth. You will be prompted for a password only if keys are not configured.

if (-not $env:PI_SSH_HOST) {
  Write-Error "Set PI_SSH_HOST first, e.g. `$env:PI_SSH_HOST = 'pi@192.168.x.x'"
  exit 1
}

$PiHost = $env:PI_SSH_HOST
$RemoteDir = if ($env:PI_REMOTE_DIR) { $env:PI_REMOTE_DIR } else { "~/VoltChess" }

Write-Host "==> Syncing backend to ${PiHost}:${RemoteDir}"
ssh $PiHost "mkdir -p $RemoteDir"
scp -r backend "${PiHost}:${RemoteDir}/"

Write-Host "==> Running setup on Pi (may take a few minutes)..."
ssh $PiHost "cd $RemoteDir && bash backend/scripts/setup-pi.sh"

Write-Host ""
Write-Host "Done."
Write-Host "  LAN testing: set VITE_API_URL=http://<pi-lan-ip>:8000 in local .env only (do not commit)."
Write-Host "  Production:  set VITE_API_URL=https://<your-tunnel-or-api-domain> in Vercel env vars."
Write-Host "  See backend/DEPLOY_PI.md for Cloudflare Tunnel setup."
