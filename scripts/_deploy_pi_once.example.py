# Copy to scripts/_deploy_pi_once.py locally — this file is gitignored.
# Usage:
#   export PI_SSH_HOST=pi@192.168.x.x
#   export PI_SSH_PASSWORD=...   # or use SSH keys
#   python scripts/_deploy_pi_once.py

"""One-off Pi deploy helper — configure via environment variables, not committed secrets."""
import io
import os
import sys
import tarfile
from pathlib import Path

import paramiko

HOST = os.environ.get("PI_SSH_HOST", "")
USER = os.environ.get("PI_SSH_USER", "")
PASS = os.environ.get("PI_SSH_PASSWORD", "")
REMOTE = os.environ.get("PI_REMOTE_DIR", "~/VoltChess")
LOCAL_BACKEND = Path(__file__).resolve().parent.parent / "backend"

if not HOST or not USER:
    print("Set PI_SSH_HOST (user@host) and PI_SSH_USER if host has no user prefix.")
    sys.exit(1)

if "@" in HOST:
    USER, HOST = HOST.split("@", 1)

if not PASS and not os.environ.get("PI_SSH_KEY"):
    print("Set PI_SSH_PASSWORD or configure SSH keys.")
    sys.exit(1)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
connect_kwargs: dict = {"hostname": HOST, "username": USER, "timeout": 30}
if PASS:
    connect_kwargs["password"] = PASS
if os.environ.get("PI_SSH_KEY"):
    connect_kwargs["key_filename"] = os.environ["PI_SSH_KEY"]
client.connect(**connect_kwargs)
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
    f"cat {REMOTE}/backend/PUBLIC_API_URL.txt 2>/dev/null || echo NONE"
)
tunnel_url = stdout.read().decode().strip()
print("Tunnel URL:", tunnel_url)

if tunnel_url and tunnel_url != "NONE":
    stdin, stdout, stderr = client.exec_command(
        f'curl -s -o /dev/null -w "%{{http_code}}" {tunnel_url}/api/health/'
    )
    print("Tunnel health:", stdout.read().decode())

client.close()
