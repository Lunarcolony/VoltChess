"""
VoltChess deploy — Pi backend + frontend build + voltchess.me.

Production API: https://api.voltchess.me (named Cloudflare tunnel).

Usage (or run deploy.bat from repo root):
  python scripts/deploy.py                    # full deploy + push
  python scripts/deploy.py <password>         # full deploy + push
  python scripts/deploy.py --no-push          # full deploy, local copy only
  python scripts/deploy.py --backend-only     # Pi backend only
  python scripts/deploy.py --frontend-only    # build + push frontend (no Pi SSH)

Requires: pip install paramiko, Node.js
"""
from __future__ import annotations

import argparse
import getpass
import importlib.util
import io
import json
import re
import shutil
import subprocess
import sys
import tarfile
import time
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEPLOY_SITE = REPO_ROOT.parent / "voltchess.me"
LOCAL_BACKEND = REPO_ROOT / "backend"

HOST = "192.168.8.132"
USER = "jithesh"
REMOTE = "/home/jithesh/VoltChess"
PRODUCTION_API_URL = "https://api.voltchess.me"

SKIP_IN_TAR = {".env", ".venv", "db.sqlite3", "__pycache__", "staticfiles"}
CURL_LOCAL = "curl -sf --connect-timeout 3 --max-time 8 http://127.0.0.1:8000/api/health/"


def ensure_paramiko():
    if importlib.util.find_spec("paramiko") is None:
        print("ERROR: paramiko is not installed.")
        print("  python -m pip install paramiko")
        raise SystemExit(1)
    import paramiko  # noqa: F401

    return __import__("paramiko")


def ensure_node_toolchain() -> None:
    for tool in ("node", "npm"):
        if shutil.which(tool) is None:
            print(f"ERROR: {tool} not found on PATH.")
            print("  Install Node.js from https://nodejs.org/ and retry.")
            raise SystemExit(1)


def run_command(cmd: str | list[str], *, cwd: Path, label: str) -> None:
    print(f"  {label}...")
    try:
        if isinstance(cmd, str):
            subprocess.run(cmd, cwd=cwd, check=True, shell=True)
        else:
            subprocess.run(cmd, cwd=cwd, check=True)
    except subprocess.CalledProcessError as exc:
        print()
        print(f"ERROR: {label} failed (exit {exc.returncode}).")
        if "tsc" in label.lower() or "build" in label.lower():
            print("  Fix TypeScript/build errors above, then rerun deploy.")
        raise SystemExit(exc.returncode) from exc


def verify_typescript() -> None:
    ensure_node_toolchain()
    run_command("npx tsc --noEmit", cwd=REPO_ROOT, label="TypeScript check (npx tsc --noEmit)")


def build_frontend() -> None:
    ensure_node_toolchain()
    verify_typescript()
    run_command("npm run build", cwd=REPO_ROOT, label="Production build (npm run build)")


def copy_build_to_site() -> None:
    if not DEPLOY_SITE.is_dir():
        print(f"ERROR: Deploy repo not found: {DEPLOY_SITE}")
        print("  Expected voltchess.me next to the VoltChess folder.")
        raise SystemExit(1)

    dist = REPO_ROOT / "dist"
    if not dist.is_dir():
        print(f"ERROR: Build output missing: {dist}")
        raise SystemExit(1)

    for item in dist.iterdir():
        dest = DEPLOY_SITE / item.name
        if item.is_dir():
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(item, dest)
        else:
            shutil.copy2(item, dest)
        print(f"  {item}")
        print(f"  -> {dest}")

    api_config = REPO_ROOT / "public" / "api-config.json"
    if api_config.is_file():
        shutil.copy2(api_config, DEPLOY_SITE / "api-config.json")
        print(f"  {api_config}")
        print(f"  -> {DEPLOY_SITE / 'api-config.json'}")

    vercel_config = REPO_ROOT / "vercel.json"
    if vercel_config.is_file():
        shutil.copy2(vercel_config, DEPLOY_SITE / "vercel.json")
        print(f"  {vercel_config}")
        print(f"  -> {DEPLOY_SITE / 'vercel.json'}")


def update_source_files(url: str = PRODUCTION_API_URL) -> None:
    api_config = REPO_ROOT / "public" / "api-config.json"
    api_config.write_text(json.dumps({"apiUrl": url}, indent=2) + "\n", encoding="utf-8")
    print(f"  {api_config}")

    api_url_ts = REPO_ROOT / "src" / "config" / "apiUrl.ts"
    if api_url_ts.is_file():
        text = api_url_ts.read_text(encoding="utf-8")
        text = re.sub(
            r'export const PRODUCTION_API_URL\s*=\s*\n\s*"[^"]*";',
            f'export const PRODUCTION_API_URL =\n  "{url}";',
            text,
        )
        api_url_ts.write_text(text, encoding="utf-8")
        print(f"  {api_url_ts}")

    vercel = REPO_ROOT / "vercel.json"
    if vercel.exists():
        vtext = vercel.read_text(encoding="utf-8")
        vtext = re.sub(r'"VITE_API_URL":\s*"[^"]*"', f'"VITE_API_URL": "{url}"', vtext)
        vercel.write_text(vtext, encoding="utf-8")
        print(f"  {vercel}")

    if DEPLOY_SITE.is_dir():
        site_config = DEPLOY_SITE / "api-config.json"
        site_config.write_text(json.dumps({"apiUrl": url}, indent=2) + "\n", encoding="utf-8")
        print(f"  {site_config}")


def check_tunnel_dns(hostname: str = "api.voltchess.me") -> str | None:
    """Return a warning if hostname resolves to unreachable tunnel-only fd10: IPv6."""
    try:
        proc = subprocess.run(
            ["nslookup", hostname, "8.8.8.8"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        text = (proc.stdout or "") + (proc.stderr or "")
        has_fd10 = "fd10:" in text.lower()
        has_public_v4 = any(p in text for p in ("104.", "172.", "198.", "141."))
        if has_fd10 and not has_public_v4:
            return (
                f"DNS for {hostname} resolves IPv6-only fd10:… (Namecheap CNAME to cfargotunnel.com). "
                "Move nameservers to Cloudflare and add a Proxied CNAME — see backend/PI_CONTINUOUS_ANALYSIS.md"
            )
    except (OSError, subprocess.TimeoutExpired):
        pass
    return None


def check_public_health(url: str = PRODUCTION_API_URL, *, attempts: int = 6, delay_s: float = 5.0) -> bool:
    health_url = f"{url.rstrip('/')}/api/health/"
    host = url.removeprefix("https://").removeprefix("http://").split("/")[0]
    dns_warning = check_tunnel_dns(host)
    if dns_warning:
        print(f"  DNS issue: {dns_warning}")

    for attempt in range(1, attempts + 1):
        print(f"  Public API check {attempt}/{attempts}...", end=" ", flush=True)
        try:
            with urllib.request.urlopen(health_url, timeout=10) as res:
                body = res.read().decode().strip()
                print(f"OK ({body})")
                return True
        except Exception as exc:
            print(f"not ready ({exc.__class__.__name__})")
        if attempt < attempts:
            time.sleep(delay_s)
    return False


def push_deploy_repo(url: str = PRODUCTION_API_URL) -> None:
    print("Pushing voltchess.me to GitHub...")
    subprocess.run(["git", "add", "-A"], cwd=DEPLOY_SITE, check=True)
    status = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=DEPLOY_SITE,
        check=True,
        capture_output=True,
        text=True,
    )
    if not status.stdout.strip():
        print("No git changes to push.")
        return

    subprocess.run(
        ["git", "commit", "-m", f"Deploy VoltChess (API: {url})"],
        cwd=DEPLOY_SITE,
        check=True,
    )
    subprocess.run(["git", "push", "origin", "main"], cwd=DEPLOY_SITE, check=True)
    print("Pushed to github.com/Lunarcolony/voltchess.me — Vercel will redeploy.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Deploy VoltChess")
    parser.add_argument("password", nargs="?", help="Pi SSH password")
    parser.add_argument("--backend-only", action="store_true", help="Pi backend only")
    parser.add_argument("--frontend-only", action="store_true", help="Frontend only (no Pi SSH)")
    parser.add_argument("--no-push", action="store_true", help="Skip git push")
    parser.add_argument("--no-build", action="store_true", help="Update api-config only")
    return parser.parse_args()


def connect(paramiko, password: str):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=password, timeout=30)
    return client


def ssh_run(client, cmd: str, *, timeout: int = 30) -> tuple[int, str]:
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = (stdout.read() + stderr.read()).decode("utf-8", errors="replace").strip()
    return stdout.channel.recv_exit_status(), out


def upload_backend(client) -> None:
    ssh_run(client, f"mkdir -p {REMOTE}", timeout=15)

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
    print("  Uploaded backend tarball")


def run_remote_setup(client) -> int:
    cmd = (
        f"cd {REMOTE} && "
        "test -f backend/.env && cp backend/.env /tmp/voltchess.env.bak || true && "
        "test -f backend/db.sqlite3 && cp backend/db.sqlite3 /tmp/voltchess.db.bak || true && "
        "test -f backend/.env.secret_backup && cp backend/.env.secret_backup /tmp/voltchess.secret.bak || true && "
        "test -d backend/.venv && cp -a backend/.venv /tmp/voltchess.venv.bak || true && "
        "sudo systemctl stop voltchess-api 2>/dev/null || true && "
        "rm -rf backend backend.next 2>/dev/null || true && "
        "mkdir -p backend.next && tar xzf backend.tar.gz -C backend.next --strip-components=1 && "
        "rm -f backend.tar.gz && "
        "mv backend.next backend && "
        "test -f /tmp/voltchess.env.bak && cp /tmp/voltchess.env.bak backend/.env || true && "
        "test -f /tmp/voltchess.db.bak && cp /tmp/voltchess.db.bak backend/db.sqlite3 || true && "
        "test -f /tmp/voltchess.secret.bak && cp /tmp/voltchess.secret.bak backend/.env.secret_backup || true && "
        "test -d /tmp/voltchess.venv.bak && cp -a /tmp/voltchess.venv.bak backend/.venv || true && "
        "find backend -name '*.sh' -exec sed -i 's/\\r$//' {} + && "
        "test -f backend/.env.example && sed -i 's/\\r$//' backend/.env.example || true && "
        "bash backend/scripts/setup-pi.sh && "
        "bash backend/scripts/setup-production.sh"
    )
    _, stdout, _ = client.exec_command(cmd, get_pty=True, timeout=600)
    for line in stdout:
        sys.stdout.buffer.write(line.encode("utf-8", errors="replace"))
        sys.stdout.buffer.flush()
    return stdout.channel.recv_exit_status()


def wait_for_local_api(client, *, attempts: int = 12) -> bool:
    print("  Checking API on Pi (localhost:8000)...")
    for attempt in range(1, attempts + 1):
        code, out = ssh_run(client, CURL_LOCAL, timeout=12)
        if code == 0 and out:
            print(f"  Local API ready (attempt {attempt}): {out}")
            return True
        print(f"  Waiting for local API... ({attempt}/{attempts})")
        time.sleep(3)
    return False


def verify_pi_services(client) -> None:
    _, api_state = ssh_run(client, "systemctl is-active voltchess-api 2>/dev/null || echo inactive")
    _, cf_state = ssh_run(client, "systemctl is-active cloudflared 2>/dev/null || echo inactive")
    _, sync_state = ssh_run(client, "systemctl is-active voltchess-sync.timer 2>/dev/null || echo inactive")
    print(f"  voltchess-api:       {api_state.splitlines()[-1].strip()}")
    print(f"  cloudflared:         {cf_state.splitlines()[-1].strip()}")
    print(f"  voltchess-sync.timer:{sync_state.splitlines()[-1].strip()}")

    if cf_state.splitlines()[-1].strip() == "active":
        return

    _, has_token = ssh_run(
        client,
        f"grep -q '^CLOUDFLARE_TUNNEL_TOKEN=' {REMOTE}/backend/.env 2>/dev/null && echo yes || echo no",
    )
    if has_token.strip() == "yes":
        print("  WARNING: cloudflared not active but CLOUDFLARE_TUNNEL_TOKEN is set.")
        print("  On Pi: bash backend/scripts/setup-named-tunnel.sh")
    else:
        print("  WARNING: Named tunnel not running. Add CLOUDFLARE_TUNNEL_TOKEN to backend/.env")


def try_public_health() -> None:
    print(f"[4/5] Public API check ({PRODUCTION_API_URL})...")
    if check_public_health():
        print("  Public API reachable.")
    else:
        print("  WARNING: Public API not reachable from this PC (DNS or tunnel may still be propagating).")
        print(f"  Frontend will use {PRODUCTION_API_URL} regardless.")
    print()


def deploy_backend(client) -> None:
    print("[1/5] Uploading backend to Pi...")
    upload_backend(client)
    print()

    print("[2/5] Running setup on Pi (migrate, production hardening, named tunnel)...")
    code = run_remote_setup(client)
    if code != 0:
        print(f"ERROR: Remote setup failed (exit {code})")
        raise SystemExit(code)
    print()

    print("[3/5] Verifying Pi services...")
    if not wait_for_local_api(client):
        print("ERROR: Local API on Pi did not respond.")
        print(f"  Check: ssh {USER}@{HOST} 'sudo systemctl status voltchess-api'")
        raise SystemExit(1)
    verify_pi_services(client)
    print()
    try_public_health()


def deploy_frontend(*, push: bool, build: bool) -> None:
    print("[5/5] Updating config and deploying frontend...")
    update_source_files()
    print()

    if not build:
        print("Skipped frontend build (--no-build).")
        return

    build_frontend()
    print()
    copy_build_to_site()
    print()

    if push:
        push_deploy_repo()
    else:
        print("Skipped git push (--no-push).")


def main() -> int:
    paramiko = ensure_paramiko()
    args = parse_args()

    if args.backend_only and args.frontend_only:
        print("ERROR: Use only one of --backend-only or --frontend-only.")
        return 1

    if args.frontend_only:
        print()
        print("VoltChess — frontend sync")
        print("=========================")
        print(f"  API URL:  {PRODUCTION_API_URL}")
        print(f"  Push:     {'yes' if not args.no_push else 'no'}")
        print()
        try_public_health()
        deploy_frontend(push=not args.no_push, build=not args.no_build)
        print()
        print("Done. Live site: https://voltchess.me")
        return 0

    password = args.password or getpass.getpass(f"Pi SSH password ({USER}@{HOST}): ")
    if not password:
        print("Password required.")
        return 1

    do_frontend = not args.backend_only and not args.no_build
    push = not args.no_push and do_frontend

    print()
    print("VoltChess — deploy")
    print("==================")
    print(f"  Pi:       {USER}@{HOST}")
    print(f"  API URL:  {PRODUCTION_API_URL}")
    print(f"  Mode:     {'backend only' if args.backend_only else 'full (backend + frontend)'}")
    print(f"  Push:     {'yes' if push else 'no'}")
    print()

    client = connect(paramiko, password)
    print("SSH connected\n")

    try:
        deploy_backend(client)

        if do_frontend:
            deploy_frontend(push=push, build=True)
        else:
            update_source_files()
            print("Backend deploy complete.")

        print()
        print("Done.")
        print(f"  API:       {PRODUCTION_API_URL}")
        print("  Live site: https://voltchess.me")
        return 0
    finally:
        client.close()


if __name__ == "__main__":
    raise SystemExit(main())
