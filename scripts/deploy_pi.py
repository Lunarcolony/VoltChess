"""
Deploy VoltChess backend to the Raspberry Pi over SSH.

Usage:
  python scripts/deploy_pi.py                  # prompts for SSH password
  python scripts/deploy_pi.py <password>       # password on CLI (less safe)
  python scripts/deploy_pi.py --update-config  # also write api-config.json files

Requires: pip install paramiko
"""
from __future__ import annotations

import argparse
import getpass
import io
import json
import re
import sys
import tarfile
import time
from pathlib import Path

import paramiko

HOST = "192.168.8.132"
USER = "jithesh"
REMOTE = "/home/jithesh/VoltChess"
REPO_ROOT = Path(__file__).resolve().parent.parent
LOCAL_BACKEND = REPO_ROOT / "backend"
DEPLOY_SITE = REPO_ROOT.parent / "voltchess.me"
SKIP_IN_TAR = {".env", ".venv", "db.sqlite3", "__pycache__", "staticfiles"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Deploy VoltChess backend to Raspberry Pi")
    parser.add_argument(
        "password",
        nargs="?",
        help="Pi SSH password (omit to be prompted securely)",
    )
    parser.add_argument(
        "--no-update-config",
        action="store_true",
        help="Do not update api-config.json after deploy",
    )
    return parser.parse_args()


def connect(password: str) -> paramiko.SSHClient:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=password, timeout=30)
    return client


def upload_backend(client: paramiko.SSHClient) -> None:
    _, stdout, _ = client.exec_command(f"mkdir -p {REMOTE}")
    stdout.channel.recv_exit_status()

    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for path in LOCAL_BACKEND.rglob("*"):
            if any(part in SKIP_IN_TAR for part in path.parts):
                continue
            if path.is_file():
                arc = Path("backend") / path.relative_to(LOCAL_BACKEND)
                tar.add(path, arcname=str(arc).replace("\\", "/"))
    buf.seek(0)

    sftp = client.open_sftp()
    with sftp.file(f"{REMOTE}/backend.tar.gz", "wb") as remote_file:
        remote_file.write(buf.read())
    sftp.close()
    print("Uploaded backend tarball")


def run_remote_setup(client: paramiko.SSHClient) -> int:
    cmd = (
        f"cd {REMOTE} && "
        "test -f backend/.env && cp backend/.env /tmp/voltchess.env.bak || true && "
        "test -f backend/db.sqlite3 && cp backend/db.sqlite3 /tmp/voltchess.db.bak || true && "
        "rm -rf backend && tar xzf backend.tar.gz && rm backend.tar.gz && "
        "test -f /tmp/voltchess.env.bak && cp /tmp/voltchess.env.bak backend/.env || true && "
        "test -f /tmp/voltchess.db.bak && cp /tmp/voltchess.db.bak backend/db.sqlite3 || true && "
        "find backend -name '*.sh' -exec sed -i 's/\\r$//' {} + && "
        "sed -i 's/\\r$//' backend/.env.example && "
        "bash backend/scripts/setup-pi.sh && "
        "bash backend/scripts/ensure-autostart.sh && "
        "sudo systemctl restart voltchess-api voltchess-tunnel"
    )
    _, stdout, _ = client.exec_command(cmd, get_pty=True, timeout=600)
    for line in stdout:
        sys.stdout.buffer.write(line.encode("utf-8", errors="replace"))
        sys.stdout.buffer.flush()
    return stdout.channel.recv_exit_status()


def read_tunnel_url(client: paramiko.SSHClient) -> str:
    for attempt in range(12):
        _, stdout, _ = client.exec_command(
            "cat /home/jithesh/VoltChess/backend/PUBLIC_API_URL.txt 2>/dev/null || echo NONE"
        )
        url = stdout.read().decode().strip()
        if url.startswith("https://"):
            return url
        time.sleep(5)
    return ""


def curl_status(client: paramiko.SSHClient, url: str, path: str) -> str:
    _, stdout, _ = client.exec_command(
        f'curl -sf -o /dev/null -w "%{{http_code}}" "{url}{path}" 2>/dev/null || echo 000'
    )
    return stdout.read().decode().strip()


def wait_for_tunnel(client: paramiko.SSHClient, url: str) -> bool:
    print("Waiting for tunnel to become reachable...")
    for _ in range(18):
        code = curl_status(client, url, "/api/health/")
        if code == "200":
            return True
        time.sleep(5)
    return False


def write_api_config(url: str) -> None:
    payload = json.dumps({"apiUrl": url}, indent=2) + "\n"

    local_config = REPO_ROOT / "public" / "api-config.json"
    local_config.write_text(payload, encoding="utf-8")
    print(f"  {local_config}")

    if DEPLOY_SITE.is_dir():
        site_config = DEPLOY_SITE / "api-config.json"
        site_config.write_text(payload, encoding="utf-8")
        print(f"  {site_config}")
    else:
        print(f"  (skipped {DEPLOY_SITE} — folder not found)")


def main() -> int:
    args = parse_args()
    update_config = not args.no_update_config

    password = args.password or getpass.getpass(f"Pi SSH password ({USER}@{HOST}): ")
    if not password:
        print("Password required.")
        return 1

    print()
    print("VoltChess — deploy backend to Raspberry Pi")
    print("===========================================")
    print(f"  Host:   {USER}@{HOST}")
    print(f"  Remote: {REMOTE}")
    print()

    client = connect(password)
    print("SSH connected")
    print()

    try:
        print("[1/4] Uploading backend...")
        upload_backend(client)
        print()

        print("[2/4] Running setup (migrate, services, tunnel)...")
        code = run_remote_setup(client)
        if code != 0:
            print(f"Remote setup failed (exit {code})")
            return code
        print()

        print("[3/4] Reading tunnel URL...")
        tunnel = read_tunnel_url(client)
        if not tunnel:
            print("ERROR: Could not read PUBLIC_API_URL.txt from the Pi.")
            return 1
        print(f"  {tunnel}")
        print()

        print("[4/4] Verifying API...")
        if not wait_for_tunnel(client, tunnel):
            print("WARNING: Tunnel health check did not return 200 yet.")
            print("         Wait a minute and run: sync-pi-tunnel-url.bat")
        else:
            for path in ("/api/coach/dashboard/", "/api/classroom/mine/"):
                status = curl_status(client, tunnel, path)
                print(f"  {path} -> HTTP {status} (401 = OK, route exists)")

        if update_config:
            print()
            print("Updating api-config.json...")
            write_api_config(tunnel)

        print()
        print("Deploy complete.")
        print()
        print("Next steps:")
        print("  1. If you changed the tunnel URL, push api-config.json to voltchess.me")
        print("     (or run sync-pi-tunnel-url.bat push after npm run build)")
        print("  2. Hard-refresh https://www.voltchess.me")
        print()
        return 0
    finally:
        client.close()


if __name__ == "__main__":
    raise SystemExit(main())
