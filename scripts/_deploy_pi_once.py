"""One-off Pi deploy helper — run locally, not committed with secrets."""
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
    print("Usage: python scripts/_deploy_pi_once.py <ssh-password>")
    sys.exit(1)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=30)
print("SSH connected")

stdin, stdout, stderr = client.exec_command(f"mkdir -p {REMOTE}")
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
    f"cd {REMOTE} && rm -rf backend && tar xzf backend.tar.gz && rm backend.tar.gz "
    "&& find backend -name '*.sh' -exec sed -i 's/\\r$//' {} + "
    "&& sed -i 's/\\r$//' backend/.env.example "
    "&& rm -f backend/.env "
    "&& bash backend/scripts/setup-pi.sh "
    "&& bash backend/scripts/ensure-autostart.sh"
)
stdin, stdout, stderr = client.exec_command(cmd, get_pty=True, timeout=600)
for line in stdout:
    sys.stdout.buffer.write(line.encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()
err = stderr.read().decode("utf-8", errors="replace")
if err:
    print("STDERR:", err)
code = stdout.channel.recv_exit_status()
print("Exit code:", code)

stdin, stdout, stderr = client.exec_command(
    "cat /home/jithesh/VoltChess/backend/PUBLIC_API_URL.txt 2>/dev/null || echo NONE"
)
tunnel_url = stdout.read().decode().strip()
print("Tunnel URL:", tunnel_url)

if tunnel_url and tunnel_url != "NONE":
    stdin, stdout, stderr = client.exec_command(
        f'curl -s -o /dev/null -w "%{{http_code}}" {tunnel_url}/api/health/'
    )
    print("Tunnel health:", stdout.read().decode())

    stdin, stdout, stderr = client.exec_command(
        f'curl -s -X POST {tunnel_url}/api/token/ -H "Content-Type: application/json" '
        '-d \'{"username":"coach","password":"demo1234"}\' | head -c 80'
    )
    print("Login test:", stdout.read().decode())

client.close()
