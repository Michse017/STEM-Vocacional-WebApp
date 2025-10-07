from __future__ import annotations

import argparse
import os
import sys
import subprocess
from pathlib import Path
from importlib import import_module
from shutil import which

# Cargar .env para que los comandos hereden variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass


def parse_args():
    parser = argparse.ArgumentParser(description="Project management helper")
    sub = parser.add_subparsers(dest="command", required=True)

    def add_common(p):
        p.add_argument("--host", default="127.0.0.1")
        p.add_argument("--port", type=int)
        p.add_argument("--no-dynamic", action="store_true", help="Disable dynamic questionnaires flag for this run")

    p_pub = sub.add_parser("run-public", help="Run public app (app.py)")
    add_common(p_pub)

    # Deprecated admin-only launchers (single app now). Use run-admin-ui to only start frontend with admin enabled.
    p_adm_ui = sub.add_parser("run-admin-ui", help="Start only the frontend with admin enabled (backend must be running on 5000)")
    p_adm_ui.add_argument("--frontend-port", type=int, default=3000)
    p_adm_ui.add_argument("--frontend-path", default="frontend")
    p_adm_ui.add_argument("--silent-frontend", action="store_true")
    p_adm_ui.add_argument("--node-cmd", default="npm")

    p_pub_full = sub.add_parser("run-public-full", help="Run public app + frontend (React) concurrently")
    add_common(p_pub_full)
    p_pub_full.add_argument("--debug", action="store_true")
    p_pub_full.add_argument("--frontend-port", type=int, default=3000, help="Port for React dev server (default 3000)")
    p_pub_full.add_argument("--frontend-path", default="frontend", help="Relative path to frontend folder")
    p_pub_full.add_argument("--silent-frontend", action="store_true", help="Do not attach frontend output (fire & forget)")
    p_pub_full.add_argument("--node-cmd", default="npm", help="Frontend start command (npm|yarn|pnpm or path to executable)")

    sub.add_parser("seed-dynamic", help="Seed legacy questionnaire into dynamic tables")

    p_add_admin = sub.add_parser("add-admin", help="Create or update an admin user")
    p_add_admin.add_argument("codigo", help="Unique admin code/username")
    p_add_admin.add_argument("--password", help="Password (omit to prompt securely)")

    p_list_admins = sub.add_parser("list-admins", help="List admin users (codigo, active)")

    # DB maintenance: drop legacy usuarios.finalizado
    sub.add_parser("drop-legacy-finalizado", help="Drop legacy 'finalizado' column from usuarios table (migrated to dynamic assignments)")

    # DB maintenance: ensure auth columns on usuarios
    sub.add_parser("ensure-user-schema", help="Ensure usuarios has username/password_hash/timestamps and remove legacy fields")

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


def run_admin_ui(frontend_port: int, frontend_path: str, silent: bool, node_cmd: str):
    env = os.environ.copy()
    env.setdefault("REACT_APP_ENABLE_ADMIN", "1")
    env.setdefault("REACT_APP_ADMIN_API_BASE", f"http://127.0.0.1:5000/api")
    front_dir = Path(frontend_path).resolve()
    if not front_dir.exists():
        print(f"[run-admin-ui] Frontend path not found: {front_dir}", file=sys.stderr)
        sys.exit(2)
    try:
        tool_parts = _resolve_frontend_command(node_cmd)
    except FileNotFoundError as e:
        print(f"[run-admin-ui] {e}", file=sys.stderr)
        sys.exit(3)
    if len(tool_parts) == 1:
        tool_parts += ["run", "start"] if tool_parts[0] in {"yarn", "pnpm"} else ["start"]
    env.setdefault("PORT", str(frontend_port))
    print(f"[run-admin-ui] Starting frontend in {front_dir} using: {' '.join(tool_parts)} ...")
    if silent:
        subprocess.Popen(tool_parts, cwd=str(front_dir), env=env)
    else:
        subprocess.Popen(tool_parts, cwd=str(front_dir), env=env, stdout=sys.stdout, stderr=sys.stderr)


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
    # Windows: ensure we point to an actual executable (.cmd/.exe) for npm to avoid WinError 193
    if os.name == 'nt':
        name_lower = resolved_path.name.lower()
        # If resolved to 'npm' without extension, prefer sibling npm.cmd
        if name_lower == 'npm' and resolved_path.suffix == '':
            sibling_cmd = resolved_path.with_name('npm.cmd')
            if sibling_cmd.exists():
                resolved_path = sibling_cmd
        # If still no known executable extension, try adding .cmd
        if resolved_path.suffix.lower() not in {'.cmd', '.exe', '.bat', '.com'}:
            guess_cmd = resolved_path.with_suffix('.cmd')
            if guess_cmd.exists():
                resolved_path = guess_cmd
    # Replace executable with resolved absolute path to avoid PATH issues
    parts[0] = str(resolved_path)
    return parts


    # Removed run-admin-full (single app). Use run-public to start backend and run-admin-ui for frontend only.


def run_public_full(host: str, port: int | None, dynamic: bool, debug: bool, frontend_port: int, frontend_path: str, silent: bool, node_cmd: str):
    """Start backend first, wait until healthy, then start the React dev server.
    - Ensures API is up before frontend opens the browser.
    - Admin UI disabled in frontend.
    - Dynamic questionnaires enabled by default unless --no-dynamic.
    """
    set_flag(dynamic)
    # 1) Start backend in a child process
    backend_host = host
    backend_port = port or 5000
    print("[run-public-full] Starting public backend ...")
    backend_proc = subprocess.Popen([
        sys.executable,
        "-c",
        (
            "import os; os.environ.setdefault('ENABLE_DYNAMIC_QUESTIONNAIRES','1');"
            "from app import create_app; app=create_app();"
            f"app.run(host='{backend_host}', port={backend_port}, debug=False)"
        ),
    ])

    # 2) Wait for health endpoint to respond
    import time, urllib.request
    health_url = f"http://127.0.0.1:{backend_port}/api/health"
    for i in range(60):
        try:
            with urllib.request.urlopen(health_url, timeout=1) as r:
                if r.status == 200:
                    print(f"[run-public-full] Backend healthy at {health_url}")
                    break
        except Exception:
            time.sleep(0.5)
    else:
        print("[run-public-full] Warning: backend did not report healthy, continuing anyway...", file=sys.stderr)

    # 3) Start frontend
    env = os.environ.copy()
    # App unificada: habilitar Admin UI por defecto
    env.setdefault("REACT_APP_ENABLE_ADMIN", "1")
    env.setdefault("PORT", str(frontend_port))
    front_dir = Path(frontend_path).resolve()
    if not front_dir.exists():
        print(f"[run-public-full] Frontend path not found: {front_dir}", file=sys.stderr)
        backend_proc.terminate()
        sys.exit(2)
    try:
        tool_parts = _resolve_frontend_command(node_cmd)
    except FileNotFoundError as e:
        print(f"[run-public-full] {e}", file=sys.stderr)
        backend_proc.terminate()
        sys.exit(3)
    if len(tool_parts) == 1:
        tool_parts += ["run", "start"] if tool_parts[0] in {"yarn", "pnpm"} else ["start"]
    print(f"[run-public-full] Starting frontend in {front_dir} using: {' '.join(tool_parts)} ...")
    if silent:
        subprocess.Popen(tool_parts, cwd=str(front_dir), env=env)
    else:
        subprocess.Popen(tool_parts, cwd=str(front_dir), env=env, stdout=sys.stdout, stderr=sys.stderr)

    # 4) Attach to backend loop (blocks)
    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        pass


def add_admin(codigo: str, password: str | None):
    from getpass import getpass
    from database.controller import SessionLocal
    from database.models import AdminUser
    from backend.services.auth_admin_service import hash_password
    if not password:
        pw1 = getpass("New admin password: ")
        pw2 = getpass("Confirm password: ")
        if pw1 != pw2:
            print("Passwords do not match.")
            return 2
        password = pw1
    with SessionLocal() as db:
        user = db.query(AdminUser).filter(AdminUser.codigo == codigo).first()
        if user:
            user.password_hash = hash_password(password)
            user.is_active = True
            action = "updated"
        else:
            user = AdminUser(codigo=codigo, password_hash=hash_password(password), is_active=True)
            db.add(user)
            action = "created"
        db.commit()
        print(f"Admin '{codigo}' {action} (id={user.id}).")


def list_admins():
    from database.controller import SessionLocal
    from database.models import AdminUser
    with SessionLocal() as db:
        rows = db.query(AdminUser).all()
        if not rows:
            print("No admin users found.")
        else:
            print("Admins:")
            for r in rows:
                print(f" - id={r.id}, codigo={r.codigo}, active={r.is_active}")


def drop_legacy_finalizado():
    """Drop usuarios.finalizado column (legacy) on SQL Server, handling default constraint.
    Safe to run multiple times. Requires DB permissions to alter table.
    """
    from sqlalchemy import text
    from database.controller import engine
    try:
        with engine.begin() as conn:
            # Check if column exists
            col_exists = conn.execute(text(
                """
                SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='usuarios' AND COLUMN_NAME='finalizado'
                """
            )).first()
            if not col_exists:
                print("usuarios.finalizado already absent.")
                return 0
            # Find and drop default constraint if any (SQL Server specifics)
            row = conn.execute(text(
                """
                SELECT df.name AS df_name
                FROM sys.default_constraints df
                INNER JOIN sys.columns c ON c.default_object_id = df.object_id
                INNER JOIN sys.tables t ON t.object_id = df.parent_object_id
                WHERE t.name = 'usuarios' AND c.name = 'finalizado'
                """
            )).first()
            if row and row[0]:
                df_name = row[0]
                conn.execute(text(f"ALTER TABLE usuarios DROP CONSTRAINT {df_name}"))
            # Finally drop the column
            conn.execute(text("ALTER TABLE usuarios DROP COLUMN finalizado"))
            print("Dropped usuarios.finalizado column.")
            return 0
    except Exception as e:
        print(f"Failed to drop usuarios.finalizado: {e}")
        return 2


def main():
    args = parse_args()
    if args.command == "run-public":
        run_public(args.host, args.port, not args.no_dynamic)
    elif args.command == "run-admin-ui":
        run_admin_ui(args.frontend_port, args.frontend_path, args.silent_frontend, args.node_cmd)
    elif args.command == "run-public-full":
        run_public_full(args.host, args.port, not args.no_dynamic, args.debug, args.frontend_port, args.frontend_path, args.silent_frontend, args.node_cmd)
    elif args.command == "add-admin":
        return add_admin(args.codigo, args.password)
    elif args.command == "list-admins":
        return list_admins()
    elif args.command == "drop-legacy-finalizado":
        return drop_legacy_finalizado()
    elif args.command == "ensure-user-schema":
        # Run the guard explicitly
        from database.controller import engine
        from database.models import ensure_user_schema
        ensure_user_schema(engine)
        print("ensure_user_schema executed.")
    else:
        print("Unknown command")
        return 1
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
