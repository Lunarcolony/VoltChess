"""Shared helpers for VoltChess deploy pipeline."""
from __future__ import annotations

import importlib.util
import json
import re
import shutil
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEPLOY_SITE = REPO_ROOT.parent / "voltchess.me"

HOST = "192.168.8.132"
USER = "jithesh"
REMOTE = "/home/jithesh/VoltChess"
REMOTE_URL_FILE = f"{REMOTE}/backend/PUBLIC_API_URL.txt"


def ensure_paramiko() -> None:
    if importlib.util.find_spec("paramiko") is None:
        print("ERROR: paramiko is not installed.")
        print("  python -m pip install paramiko")
        raise SystemExit(1)


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


def verify_typescript(dev_root: Path = REPO_ROOT) -> None:
    ensure_node_toolchain()
    run_command(
        "npx tsc --noEmit",
        cwd=dev_root,
        label="TypeScript check (npx tsc --noEmit)",
    )


def build_frontend(dev_root: Path = REPO_ROOT) -> None:
    ensure_node_toolchain()
    verify_typescript(dev_root)
    run_command("npm run build", cwd=dev_root, label="Production build (npm run build)")


def copy_build_to_site(
    dev_root: Path = REPO_ROOT,
    deploy_root: Path = DEPLOY_SITE,
) -> None:
    if not deploy_root.is_dir():
        print(f"ERROR: Deploy repo not found: {deploy_root}")
        print("  Expected voltchess.me next to the VoltChess folder.")
        raise SystemExit(1)

    dist_index = dev_root / "dist" / "index.html"
    if not dist_index.is_file():
        print(f"ERROR: Build output missing: {dist_index}")
        raise SystemExit(1)

    deploy_index = deploy_root / "index.html"
    shutil.copy2(dist_index, deploy_index)
    print(f"  {dist_index}")
    print(f"  -> {deploy_index}")

    api_config = dev_root / "public" / "api-config.json"
    if api_config.is_file():
        shutil.copy2(api_config, deploy_root / "api-config.json")
        print(f"  {api_config}")
        print(f"  -> {deploy_root / 'api-config.json'}")


def update_source_files(url: str, dev_root: Path = REPO_ROOT) -> None:
    api_config = dev_root / "public" / "api-config.json"
    api_config.write_text(
        json.dumps({"apiUrl": url}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"  {api_config}")

    api_url_ts = dev_root / "src" / "config" / "apiUrl.ts"
    if api_url_ts.is_file():
        text = api_url_ts.read_text(encoding="utf-8")
        text = re.sub(
            r'export const PRODUCTION_API_URL\s*=\s*\n\s*"[^"]*";',
            f'export const PRODUCTION_API_URL =\n  "{url}";',
            text,
        )
        api_url_ts.write_text(text, encoding="utf-8")
        print(f"  {api_url_ts}")

    vercel = dev_root / "vercel.json"
    if vercel.exists():
        vtext = vercel.read_text(encoding="utf-8")
        vtext = re.sub(
            r'"VITE_API_URL":\s*"[^"]*"',
            f'"VITE_API_URL": "{url}"',
            vtext,
        )
        vercel.write_text(vtext, encoding="utf-8")
        print(f"  {vercel}")

    if DEPLOY_SITE.is_dir():
        site_config = DEPLOY_SITE / "api-config.json"
        site_config.write_text(
            json.dumps({"apiUrl": url}, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"  {site_config}")


def check_public_health(url: str, *, attempts: int = 4, delay_s: float = 3.0) -> bool:
    """Health check from this PC (not via SSH). Fast timeouts, visible progress."""
    import time

    health_url = f"{url.rstrip('/')}/api/health/"
    for attempt in range(1, attempts + 1):
        print(f"  Public tunnel check {attempt}/{attempts}...", end=" ", flush=True)
        try:
            with urllib.request.urlopen(health_url, timeout=8) as res:
                body = res.read().decode().strip()
                print(f"OK ({body})")
                return True
        except Exception as exc:
            print(f"not ready ({exc.__class__.__name__})")
        if attempt < attempts:
            time.sleep(delay_s)
    return False


def push_deploy_repo(
    url: str,
    *,
    deploy_root: Path = DEPLOY_SITE,
    commit_message: str | None = None,
) -> None:
    print("Pushing voltchess.me to GitHub...")
    subprocess.run(["git", "add", "index.html", "api-config.json"], cwd=deploy_root, check=True)
    status = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=deploy_root,
        check=True,
        capture_output=True,
        text=True,
    )
    if not status.stdout.strip():
        print("No git changes to push.")
        return

    message = commit_message or f"Deploy VoltChess ({url})"
    subprocess.run(["git", "commit", "-m", message], cwd=deploy_root, check=True)
    subprocess.run(["git", "push", "origin", "main"], cwd=deploy_root, check=True)
    print("Pushed to github.com/Lunarcolony/voltchess.me — Vercel will redeploy.")
