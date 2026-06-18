"""Fix Pi tunnel and verify coaching API endpoints."""
import sys
import paramiko

HOST = "192.168.8.132"
USER = "jithesh"
PASS = sys.argv[1] if len(sys.argv) > 1 else ""

if not PASS:
    print("Usage: python scripts/_fix_pi_tunnel.py <ssh-password>")
    sys.exit(1)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=30)

cmds = [
    "sudo systemctl restart voltchess-api",
    "sudo systemctl restart voltchess-tunnel",
    "sleep 8",
    "curl -s http://127.0.0.1:8000/api/health/",
    "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/api/coach/dashboard/",
    "cat /home/jithesh/VoltChess/backend/PUBLIC_API_URL.txt 2>/dev/null || echo NONE",
    "sudo journalctl -u voltchess-tunnel --no-pager -n 5",
]

for cmd in cmds:
    print(f"\n$ {cmd}")
    _, stdout, stderr = client.exec_command(cmd, timeout=60)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out:
        print(out)
    if err:
        print(err)

client.close()
