import os
import datetime as dt
from functools import wraps
from typing import Optional, Tuple

import jwt  # PyJWT
try:
    from passlib.context import CryptContext  # type: ignore
except Exception:  # pragma: no cover - fallback when passlib not available in analysis
    CryptContext = None  # type: ignore
from werkzeug.security import generate_password_hash as wz_gen_hash, check_password_hash as wz_check_hash
from flask import request, jsonify, current_app

from database.controller import SessionLocal
from database.models import AdminUser


pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto") if CryptContext else None


def hash_password(password: str) -> str:
    if pwd_ctx:
        return pwd_ctx.hash(password)
    # Fallback to werkzeug pbkdf2:sha256
    return wz_gen_hash(password, method="pbkdf2:sha256")


def verify_password(password: str, password_hash: str) -> bool:
    """Verifica contraseñas generadas con passlib(bcrypt) o con el hash legacy de Werkzeug (pbkdf2:sha256).

    - Si passlib está disponible, se intenta primero (para hashes bcrypt nuevos).
    - Si falla o el esquema es desconocido, se intenta con werkzeug.check_password_hash (para pbkdf2).
    """
    # 1) Intentar con passlib (bcrypt)
    if pwd_ctx:
        try:
            if pwd_ctx.verify(password, password_hash):
                return True
        except Exception:
            # esquema desconocido para passlib -> continuar a fallback
            pass
    # 2) Fallback: werkzeug pbkdf2:sha256 (hashes legacy)
    try:
        return wz_check_hash(password_hash, password)
    except Exception:
        return False


def _signing_secret() -> str:
    # Prefer per-instance secret to force logout on server restart
    try:
        sec = current_app.config.get('JWT_SIGNING_SECRET')
        if sec:
            return sec
    except Exception:
        pass
    return os.environ.get("SECRET_KEY", "dev_super_secret_key_change_for_prod")


def issue_access_token(admin: AdminUser, minutes: int = None) -> str:
    secret = _signing_secret()
    exp_minutes = minutes or int(os.environ.get("JWT_EXPIRES_MIN", "30"))
    now = dt.datetime.utcnow()
    payload = {
        "sub": str(admin.id),
        "codigo": admin.codigo,
        "role": "admin",
        "iat": now,
        "exp": now + dt.timedelta(minutes=exp_minutes),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def verify_access_token(token: str) -> Optional[dict]:
    secret = _signing_secret()
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])  # type: ignore[no-any-return]
    except Exception:
        return None


def issue_refresh_token(admin: AdminUser, days: int = None) -> str:
    """Longer-lived refresh token.
    WARNING: Store and transmit ONLY via HttpOnly cookie.
    """
    secret = _signing_secret()
    exp_days = days or int(os.environ.get("JWT_REFRESH_DAYS", "7"))
    now = dt.datetime.utcnow()
    payload = {
        "sub": str(admin.id),
        "codigo": admin.codigo,
        "role": "admin",
        "typ": "refresh",
        "iat": now,
        "exp": now + dt.timedelta(days=exp_days),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def verify_refresh_token(token: str) -> Optional[dict]:
    secret = _signing_secret()
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])  # type: ignore
        if payload.get("typ") != "refresh" or payload.get("role") != "admin":
            return None
        return payload
    except Exception:
        return None


def cookie_flags() -> Tuple[dict, dict]:
    """Return kwargs for setting and deleting the refresh cookie depending on environment."""
    prod = os.environ.get('FLASK_ENV') == 'production'
    # SameSite=Lax is good for same-site navigation; Secure only in prod over HTTPS
    common = dict(
        httponly=True,
        samesite='Lax',
        secure=prod,
        path='/',
    )
    return common, {**common, 'expires': 0}


def require_admin(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # First, check JWT Authorization header
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1]
            payload = verify_access_token(token)
            if payload and payload.get("role") == "admin":
                # Ensure the admin is still active
                with SessionLocal() as db:
                    adm = db.get(AdminUser, int(payload["sub"]))
                    if adm and adm.is_active:
                        return fn(*args, **kwargs)
        # Optional fallback via shared header during transition
        if os.environ.get("ADMIN_HEADER_FALLBACK", "0") == "1":
            configured_key = os.environ.get("ADMIN_ACCESS_KEY")
            provided = request.headers.get("X-Admin-Access", "")
            if configured_key and provided == configured_key:
                return fn(*args, **kwargs)
        return jsonify({"error": "unauthorized"}), 401
    return wrapper
