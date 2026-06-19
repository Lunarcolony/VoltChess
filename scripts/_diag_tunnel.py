"""Diagnose Pi tunnel - write output to file."""
import paramiko
import sys

HOST, USER = "192.168.8.132", "jithesh"
PASS = sys.argv[1] if len(sys.argv) > 1 else ""

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=20)

cmds = [
    "systemctl is-active voltchess-api voltchess-tunnel",
    "systemctl show voltchess-tunnel -p ActiveState,SubState,Result,ExecMainStatus --no-pager",
    "journalctl -u voltchess-tunnel --no-pager -n 50",
    "tail -40 /home/jithesh/VoltChess/backend/tunnel.log 2>/dev/null || echo NO_LOG",
    "cat /home/jithesh/VoltChess/backend/PUBLIC_API_URL.txt 2>/dev/null || echo NO_URL",
    "test -x /usr/local/bin/cloudflared && /usr/local/bin/cloudflared --version || echo NO_CF",
    "ss -tlnp | grep 8000 || netstat -tlnp 2>/dev/null | grep 8000 || echo NO_8000",
]

lines = []
for cmd in cmds:
    lines.append(f"=== {cmd} ===")
    _, stdout, stderr = client.exec_command(cmd, timeout=45)
    out = (stdout.read() + stderr.read()).decode("utf-8", errors="replace")
    lines.append(out.strip())
    lines.append("")

client.close()

out_path = __file__.replace("_diag_tunnel.py", "_diag_tunnel_out.txt")
with open(out_path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print(out_path)
