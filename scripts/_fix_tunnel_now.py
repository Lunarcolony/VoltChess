"""Upload tunnel scripts and run recover-tunnel on Pi."""
from __future__ import annotations

import sys
from pathlib import Path

import paramiko

HOST, USER = "192.168.8.132", "jithesh"
PASS = sys.argv[1] if len(sys.argv) > 1 else ""
REMOTE = "/home/jithesh/VoltChess/backend/scripts"
REPO = Path(__file__).resolve().parent.parent

if not PASS:
    print("Usage: python scripts/_fix_tunnel_now.py <password>")
    raise SystemExit(1)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=30)

sftp = client.open_sftp()
for name in ("start-tunnel.sh", "recover-tunnel.sh", "ensure-autostart.sh"):
    local = REPO / "backend" / "scripts" / name
    remote = f"{REMOTE}/{name}"
    sftp.put(str(local), remote)
    client.exec_command(f"chmod +x {remote} && sed -i 's/\\r$//' {remote}")
    print(f"uploaded {name}")

sftp.close()

cmds = [
    f"bash {REMOTE}/ensure-autostart.sh",
    f"bash {REMOTE}/recover-tunnel.sh",
]
for cmd in cmds:
    print(f"\n=== {cmd} ===\n")
    _, stdout, _ = client.exec_command(cmd, get_pty=True, timeout=420)
    for line in stdout:
        sys.stdout.buffer.write(line.encode("utf-8", errors="replace"))
        sys.stdout.buffer.flush()
    code = stdout.channel.recv_exit_status()
    if code != 0:
        print(f"\nCommand failed: {code}")
        client.close()
        raise SystemExit(code)

_, out, _ = client.exec_command("cat /home/jithesh/VoltChess/backend/PUBLIC_API_URL.txt")
url = out.read().decode().strip()
print(f"\nFinal URL: {url}")
client.close()
