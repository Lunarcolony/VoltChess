"""Quick read-only health check on the Pi (services + local + public API)."""
import json
import sys
import urllib.error
import urllib.request

import paramiko

HOST = "192.168.8.132"
USER = "jithesh"
PASS = sys.argv[1] if len(sys.argv) > 1 else ""

if not PASS:
    print("Usage: python scripts/_pi_health_check.py <ssh-password>")
    sys.exit(1)


def run(client, cmd):
    _, stdout, stderr = client.exec_command(cmd, timeout=30)
    return (stdout.read() + stderr.read()).decode("utf-8", errors="replace").strip()


client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=20)

print("=== Services ===")
for svc in ("voltchess-api", "voltchess-tunnel"):
    print(f"{svc}: {run(client, f'systemctl is-active {svc}')}")

print("\n=== Local API ===")
print("health:", run(client, "curl -s http://127.0.0.1:8000/api/health/"))
for path in ("/api/coach/dashboard/", "/api/classroom/mine/"):
    code = run(
        client,
        f"curl -s -o /dev/null -w '%{{http_code}}' http://127.0.0.1:8000{path}",
    )
    print(f"{path} -> {code}")

tunnel = run(client, "cat /home/jithesh/VoltChess/backend/PUBLIC_API_URL.txt 2>/dev/null")
client.close()

print("\n=== Tunnel URL ===")
print(tunnel or "NONE")

if not tunnel.startswith("https://"):
    print("\nPublic checks skipped (no tunnel URL).")
    sys.exit(1)

base = tunnel.strip()
print("\n=== Public tunnel ===")
try:
    health = urllib.request.urlopen(base + "/api/health/", timeout=15).read().decode()
    print("health:", health)
except Exception as exc:
    print("health FAILED:", exc)
    sys.exit(1)

for path in ("/api/coach/dashboard/", "/api/classroom/mine/"):
    try:
        urllib.request.urlopen(base + path, timeout=15)
        print(f"{path} -> unexpected 2xx")
    except urllib.error.HTTPError as exc:
        print(f"{path} -> {exc.code}")
    except Exception as exc:
        print(f"{path} FAILED:", exc)

try:
    req = urllib.request.Request(
        base + "/api/token/",
        data=json.dumps({"username": "coach", "password": "demo1234"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    token = json.loads(urllib.request.urlopen(req, timeout=15).read())
    headers = {"Authorization": "Bearer " + token["access"]}
    dash = json.loads(
        urllib.request.urlopen(
            urllib.request.Request(base + "/api/coach/dashboard/", headers=headers),
            timeout=15,
        ).read()
    )
    print(
        "coach login + dashboard: OK, students=",
        dash["summary"]["students"],
    )
    cls = json.loads(
        urllib.request.urlopen(
            urllib.request.Request(base + "/api/classroom/mine/", headers=headers),
            timeout=15,
        ).read()
    )
    print("classroom: OK, code=", cls.get("join_code"))
except Exception as exc:
    print("auth test FAILED:", exc)
    sys.exit(1)

print("\nAll checks passed.")
