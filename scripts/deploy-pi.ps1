# Deploy VoltChess backend to Raspberry Pi (run from repo root on your PC)
# Usage: .\scripts\deploy-pi.ps1
# You will be prompted for the Pi SSH password unless key-based auth is configured.

$PiHost = "jithesh@192.168.8.132"
$RemoteDir = "~/VoltChess"

Write-Host "==> Syncing backend to $PiHost:$RemoteDir"
ssh $PiHost "mkdir -p $RemoteDir"
scp -r backend "${PiHost}:${RemoteDir}/"

Write-Host "==> Running setup on Pi (may take a few minutes)..."
ssh $PiHost "cd $RemoteDir && bash backend/scripts/setup-pi.sh"

Write-Host ""
Write-Host "Done. Set VITE_API_URL=http://192.168.8.132:8000 on Vercel and redeploy."
Write-Host "For public internet access, see backend/DEPLOY_PI.md (Cloudflare Tunnel)."
