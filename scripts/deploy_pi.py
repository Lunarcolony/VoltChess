"""Backward-compatible wrapper — use deploy_all.py instead."""
from __future__ import annotations

import sys

from deploy_all import main


def _translate_argv(argv: list[str]) -> list[str]:
    out = [argv[0]]
    password = None
    backend_only = True
    push = False

    for arg in argv[1:]:
        if arg == "--with-frontend":
            backend_only = False
        elif arg == "--push":
            push = True
            backend_only = False
        elif arg == "--no-update-config":
            continue
        elif arg.startswith("-"):
            out.append(arg)
        else:
            password = arg

    if password:
        out.append(password)
    if backend_only:
        out.append("--backend-only")
    elif not push:
        out.append("--no-push")
    return out


if __name__ == "__main__":
    sys.argv = _translate_argv(sys.argv)
    raise SystemExit(main())
