"""Upload tunnel scripts, force localhost.run fallback, recover."""
import sys
from pathlib import Path
import paramiko

HOST, USER = "192.168.8.132", "jithesh"
PASS = sys.argv[1] if len(sys.argv) > 1 else ""
REMOTE = "/home/jithesh/VoltChess/backend"
SCRIPTS = REMOTE + "/scripts"
REPO = Path(__file__).resolve().parent.parent

names = [
    "start-tunnel.sh",
    "start-tunnel-cloudflare.sh",
    "start-tunnel-fallback.sh",
    "recover-tunnel.sh",
    "ensure-autostart.sh",
]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=30)

sftp = client.open_sftp()
for name in names:
    local = REPO / "backend" / "scripts" / name
    remote = f"{SCRIPTS}/{name}"
    sftp.put(str(local), remote)
    client.exec_command(f"chmod +x {remote} && sed -i 's/\\r$//' {remote}")
sftp.close()

client.exec_command(f"echo localhost-run > {REMOTE}/.tunnel_mode")
print("Forced localhost-run fallback mode")

_, stdout, _ = client.exec_command(f"bash {SCRIPTS}/recover-tunnel.sh", get_pty=True, timeout=420)
for line in stdout:
    sys.stdout.buffer.write(line.encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()
code = stdout.channel.recv_exit_status()

_, o, _ = client.exec_command(f"cat {REMOTE}/PUBLIC_API_URL.txt 2>/dev/null")
url = o.read().decode().strip()
print(f"\nURL: {url or 'NONE'} exit={code}")
client.close()
sys.exit(0 if url.startswith("https://") else 1)
