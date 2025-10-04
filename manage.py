"""Management utility to simplify common tasks.

Usage (PowerShell examples):
  python manage.py run-public          # starts public app (port 5000)
  python manage.py run-admin           # starts admin app (port 5001)
  python manage.py seed-dynamic        # runs legacy -> dynamic seed
  python manage.py run-admin --no-dynamic  # run admin without dynamic endpoints

Options:
  --host 0.0.0.0  (default 127.0.0.1)
  --port <port>

This is lightweight; for more complex setups consider Flask CLI integration.
"""
from __future__ import annotations

import argparse
import os
import sys
import subprocess
from pathlib import Path
from importlib import import_module
from shutil import which


def parse_args():
    parser = argparse.ArgumentParser(description="Project management helper")
    sub = parser.add_subparsers(dest="command", required=True)

    def add_common(p):
        p.add_argument("--host", default="127.0.0.1")
        p.add_argument("--port", type=int)
        p.add_argument("--no-dynamic", action="store_true", help="Disable dynamic questionnaires flag for this run")

    p_pub = sub.add_parser("run-public", help="Run public app (app.py)")
    add_common(p_pub)

    p_adm = sub.add_parser("run-admin", help="Run admin app (admin_app.py)")
    add_common(p_adm)
    p_adm.add_argument("--debug", action="store_true")

    p_adm_full = sub.add_parser("run-admin-full", help="Run admin app + frontend (React) concurrently")
    add_common(p_adm_full)
    p_adm_full.add_argument("--debug", action="store_true")
    p_adm_full.add_argument("--frontend-port", type=int, default=3000, help="Port for React dev server (default 3000)")
    p_adm_full.add_argument("--frontend-path", default="frontend", help="Relative path to frontend folder")
    p_adm_full.add_argument("--silent-frontend", action="store_true", help="Do not attach frontend output (fire & forget)")
    p_adm_full.add_argument("--node-cmd", default="npm", help="Frontend start command (npm|yarn|pnpm or path to executable)")

    p_pub_full = sub.add_parser("run-public-full", help="Run public app + frontend (React) concurrently")
    add_common(p_pub_full)
    p_pub_full.add_argument("--debug", action="store_true")
    p_pub_full.add_argument("--frontend-port", type=int, default=3000, help="Port for React dev server (default 3000)")
    p_pub_full.add_argument("--frontend-path", default="frontend", help="Relative path to frontend folder")
    p_pub_full.add_argument("--silent-frontend", action="store_true", help="Do not attach frontend output (fire & forget)")
    p_pub_full.add_argument("--node-cmd", default="npm", help="Frontend start command (npm|yarn|pnpm or path to executable)")

    sub.add_parser("seed-dynamic", help="Seed legacy questionnaire into dynamic tables")

    return parser.parse_args()


def set_flag(enabled: bool):
    if enabled:
        os.environ["ENABLE_DYNAMIC_QUESTIONNAIRES"] = "1"
    else:
        os.environ.pop("ENABLE_DYNAMIC_QUESTIONNAIRES", None)


def run_public(host: str, port: int | None, dynamic: bool):
    set_flag(dynamic)
    # Use legacy root app entrypoint
    from app import create_app  # type: ignore
    app = create_app()
    app.run(host=host, port=port or 5000, debug=False)


def run_admin(host: str, port: int | None, dynamic: bool, debug: bool):
    set_flag(dynamic)
    # Ensure an admin access key exists for protection; if not, generate one and print it.
    if not os.environ.get("ADMIN_ACCESS_KEY"):
        import secrets, string
        alphabet = string.ascii_letters + string.digits + "!@#%^&*()_-+=[]{}:;,.?/<>|~"
        generated = ''.join(secrets.choice(alphabet) for _ in range(48))
        os.environ["ADMIN_ACCESS_KEY"] = generated
        masked = generated[:2] + "*" * (len(generated)-4) + generated[-2:]
        print(f"[run-admin] ADMIN_ACCESS_KEY generated for this session (len={len(generated)}): {masked}")
    # Use legacy admin_app module
    mod = import_module("admin_app")
    app = mod.create_admin_app()
    app.run(host=host, port=port or 5001, debug=debug)


def _resolve_frontend_command(cmd: str) -> list[str]:
    """Resolve a frontend start command.
    Accepts npm|yarn|pnpm or an absolute/relative path. Returns argv list.
    On Windows with npm in PATH, 'npm' should resolve. If not found, raises.
    """
    base = cmd.strip()
    # Allow passing full command with args e.g. "npm run start"; split manually
    parts = base.split()
    exe = parts[0]
    # Prefer absolute path if provided
    resolved_path = None
    if Path(exe).exists():
        resolved_path = Path(exe)
    else:
        w = which(exe)
        if w:
            resolved_path = Path(w)
        else:
            # Windows-specific fallback for npm
            if os.name == 'nt' and exe.lower() in {"npm", "npm.cmd"}:
                candidates = []
                program_files = os.environ.get("ProgramFiles", r"C:\\Program Files")
                candidates.append(Path(program_files) / "nodejs" / "npm.cmd")
                # Also try a common 32-bit path
                program_files_x86 = os.environ.get("ProgramFiles(x86)")
                if program_files_x86:
                    candidates.append(Path(program_files_x86) / "nodejs" / "npm.cmd")
                for c in candidates:
                    if c.exists():
                        resolved_path = c
                        break
    if resolved_path is None:
        raise FileNotFoundError(
            f"Frontend start tool '{exe}' not found. Provide --node-cmd path (e.g. C:/Program Files/nodejs/npm.cmd)"
        )
    # Replace executable with resolved absolute path to avoid PATH issues
    parts[0] = str(resolved_path)
    return parts


def run_admin_full(host: str, port: int | None, dynamic: bool, debug: bool, frontend_port: int, frontend_path: str, silent: bool, node_cmd: str):
    set_flag(dynamic)
    # Prepare environment for frontend
    env = os.environ.copy()
    env.setdefault("REACT_APP_ENABLE_ADMIN", "1")
    env.setdefault("REACT_APP_ADMIN_API_BASE", f"http://{host}:{port or 5001}/api")
    env.setdefault("PORT", str(frontend_port))  # CRA respects PORT
    # Admin access key: generate a hard-to-guess default per process if not provided, and share with frontend
    default_key = env.get("ADMIN_ACCESS_KEY")
    if not default_key:
        # Complex, no visible pattern; different on each run unless user sets it explicitly
        import secrets, string
        alphabet = string.ascii_letters + string.digits + "!@#%^&*()_-+=[]{}:;,.?/<>|~"
        default_key = ''.join(secrets.choice(alphabet) for _ in range(48))
        env["ADMIN_ACCESS_KEY"] = default_key
    # Ensure backend process (this process) sees the key before starting the app
    os.environ["ADMIN_ACCESS_KEY"] = default_key
    # Ensure frontend dev server also receives the key so it can send the header
    env.setdefault("REACT_APP_ADMIN_ACCESS_KEY", default_key)
    print(f"[run-admin-full] Admin access key prepared (len={len(default_key)}) and injected to backend/frontend.")
    # Launch frontend
    front_dir = Path(frontend_path).resolve()
    if not front_dir.exists():
        print(f"[run-admin-full] Frontend path not found: {front_dir}", file=sys.stderr)
        sys.exit(2)
    try:
        tool_parts = _resolve_frontend_command(node_cmd)
    except FileNotFoundError as e:
        print(f"[run-admin-full] {e}", file=sys.stderr)
        sys.exit(3)
    # If user just specified tool without args, append default start
    if len(tool_parts) == 1:
        tool_parts += ["run", "start"] if tool_parts[0] in {"yarn", "pnpm"} else ["start"]
    print(f"[run-admin-full] Starting frontend in {front_dir} using: {' '.join(tool_parts)} ...")
    if silent:
        subprocess.Popen(tool_parts, cwd=str(front_dir), env=env)
    else:
        subprocess.Popen(tool_parts, cwd=str(front_dir), env=env, stdout=sys.stdout, stderr=sys.stderr)
    # Now run admin backend
    print("[run-admin-full] Starting admin backend ...")
    run_admin(host, port, dynamic, debug)


def run_public_full(host: str, port: int | None, dynamic: bool, debug: bool, frontend_port: int, frontend_path: str, silent: bool, node_cmd: str):
    """Start frontend and the public backend together for end-users.
    - Admin UI disabled in frontend.
    - Dynamic questionnaires enabled by default unless --no-dynamic.
    """
    set_flag(dynamic)
    env = os.environ.copy()
    env.setdefault("REACT_APP_ENABLE_ADMIN", "0")
    # Frontend default API base points to http://127.0.0.1:5000/api when local, so no need to override.
    env.setdefault("PORT", str(frontend_port))

    front_dir = Path(frontend_path).resolve()
    if not front_dir.exists():
        print(f"[run-public-full] Frontend path not found: {front_dir}", file=sys.stderr)
        sys.exit(2)
    try:
        tool_parts = _resolve_frontend_command(node_cmd)
    except FileNotFoundError as e:
        print(f"[run-public-full] {e}", file=sys.stderr)
        sys.exit(3)
    if len(tool_parts) == 1:
        tool_parts += ["run", "start"] if tool_parts[0] in {"yarn", "pnpm"} else ["start"]
    print(f"[run-public-full] Starting frontend in {front_dir} using: {' '.join(tool_parts)} ...")
    if silent:
        subprocess.Popen(tool_parts, cwd=str(front_dir), env=env)
    else:
        subprocess.Popen(tool_parts, cwd=str(front_dir), env=env, stdout=sys.stdout, stderr=sys.stderr)
    print("[run-public-full] Starting public backend ...")
    run_public(host, port, dynamic)


def seed_dynamic():
    set_flag(True)
    import seed_dynamic_from_legacy  # noqa: F401  (imports & runs main)


def main():
    args = parse_args()
    if args.command == "run-public":
        run_public(args.host, args.port, not args.no_dynamic)
    elif args.command == "run-admin":
        run_admin(args.host, args.port, not args.no_dynamic, args.debug)
    elif args.command == "run-admin-full":
        run_admin_full(args.host, args.port, not args.no_dynamic, args.debug, args.frontend_port, args.frontend_path, args.silent_frontend, args.node_cmd)
    elif args.command == "run-public-full":
        run_public_full(args.host, args.port, not args.no_dynamic, args.debug, args.frontend_port, args.frontend_path, args.silent_frontend, args.node_cmd)
    elif args.command == "seed-dynamic":
        seed_dynamic()
    else:
        print("Unknown command")
        return 1
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
