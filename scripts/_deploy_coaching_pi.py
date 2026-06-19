"""One-off deploy: push backend to Pi and restart services."""
import io
import sys
import tarfile
from pathlib import Path

import paramiko

HOST = "192.168.8.132"
USER = "jithesh"
PASS = sys.argv[1] if len(sys.argv) > 1 else ""
REMOTE = "/home/jithesh/VoltChess"
LOCAL_BACKEND = Path(__file__).resolve().parent.parent / "backend"

if not PASS:
    print("Usage: python scripts/_deploy_coaching_pi.py <ssh-password>")
    sys.exit(1)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=30)
print("SSH connected")

_, stdout, _ = client.exec_command(f"mkdir -p {REMOTE}")
stdout.channel.recv_exit_status()

buf = io.BytesIO()
SKIP = {".env", ".venv", "db.sqlite3", "__pycache__"}
with tarfile.open(fileobj=buf, mode="w:gz") as tar:
    for path in LOCAL_BACKEND.rglob("*"):
        if any(part in SKIP for part in path.parts):
            continue
        if path.is_file():
            arc = Path("backend") / path.relative_to(LOCAL_BACKEND)
            tar.add(path, arcname=str(arc).replace("\\", "/"))
buf.seek(0)

sftp = client.open_sftp()
with sftp.file(f"{REMOTE}/backend.tar.gz", "wb") as f:
    f.write(buf.read())
sftp.close()
print("Uploaded backend tarball")

cmd = (
    f"cd {REMOTE} && "
    "test -f backend/.env && cp backend/.env /tmp/voltchess.env.bak || true && "
    "test -f backend/db.sqlite3 && cp backend/db.sqlite3 /tmp/voltchess.db.bak || true && "
    "rm -rf backend && tar xzf backend.tar.gz && rm backend.tar.gz && "
    "test -f /tmp/voltchess.env.bak && cp /tmp/voltchess.env.bak backend/.env || true && "
    "test -f /tmp/voltchess.db.bak && cp /tmp/voltchess.db.bak backend/db.sqlite3 || true && "
    "find backend -name '*.sh' -exec sed -i 's/\\r$//' {} + "
    "&& sed -i 's/\\r$//' backend/.env.example "
    "&& bash backend/scripts/setup-pi.sh "
    "&& bash backend/scripts/ensure-autostart.sh "
    "&& sudo systemctl restart voltchess-api voltchess-tunnel "
    "&& sleep 6"
)
_, stdout, _ = client.exec_command(cmd, get_pty=True, timeout=600)
for line in stdout:
    sys.stdout.buffer.write(line.encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()
code = stdout.channel.recv_exit_status()
print("Exit code:", code)

_, stdout, _ = client.exec_command(
    "cat /home/jithesh/VoltChess/backend/PUBLIC_API_URL.txt 2>/dev/null || echo NONE"
)
tunnel = stdout.read().decode().strip()
print("Tunnel URL:", tunnel)

if tunnel and tunnel != "NONE":
    _, stdout, _ = client.exec_command(
        f'curl -s -o /dev/null -w "%{{http_code}}" {tunnel}/api/health/'
    )
    print("Health:", stdout.read().decode())
    _, stdout, _ = client.exec_command(
        f'curl -s -o /dev/null -w "%{{http_code}}" {tunnel}/api/coach/dashboard/'
    )
    print("Coach dashboard (expect 401 without token):", stdout.read().decode())
    _, stdout, _ = client.exec_command(
        f'curl -s -o /dev/null -w "%{{http_code}}" {tunnel}/api/classroom/mine/'
    )
    print("Classroom mine (expect 401 without token):", stdout.read().decode())

client.close()
