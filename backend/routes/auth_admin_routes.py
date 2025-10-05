import os
from flask import Blueprint, request, jsonify, make_response
from backend.extensions import limiter
from database.controller import SessionLocal
from database.models import AdminUser
from backend.services.auth_admin_service import (
    verify_password,
    hash_password,
    issue_access_token,
    verify_access_token,
    issue_refresh_token,
    verify_refresh_token,
    cookie_flags,
)


auth_admin_bp = Blueprint("auth_admin", __name__)

# Limiter instance will be created on first import; uses IP address by default
# Rate limit error handler (generic)
@auth_admin_bp.app_errorhandler(429)
def _ratelimit_handler(e):  # noqa: D401
    return jsonify({"error": "too_many_requests"}), 429


@auth_admin_bp.route("/auth/admin/login", methods=["POST"])
@limiter.limit("10 per minute")
def admin_login():
    data = request.get_json(silent=True) or {}
    codigo = (data.get("codigo") or data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    if not codigo or not password:
        # Generic to avoid user enumeration
        return jsonify({"error": "invalid_credentials"}), 401
    with SessionLocal() as db:
        adm = db.query(AdminUser).filter(AdminUser.codigo == codigo).first()
        if not adm or not adm.is_active:
            return jsonify({"error": "invalid_credentials"}), 401
        if not verify_password(password, adm.password_hash):
            return jsonify({"error": "invalid_credentials"}), 401
        access = issue_access_token(adm)
        refresh = issue_refresh_token(adm)
        resp = make_response(jsonify({
            "access_token": access,
            "token_type": "Bearer",
            "admin": {"id": adm.id, "codigo": adm.codigo}
        }))
        set_kwargs, _ = cookie_flags()
        resp.set_cookie("admin_refresh", refresh, **set_kwargs)
        return resp


@auth_admin_bp.route("/auth/admin/me", methods=["GET"])
def admin_me():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return jsonify({"error": "unauthorized"}), 401
    payload = verify_access_token(auth.split(" ", 1)[1])
    if not payload or payload.get("role") != "admin":
        return jsonify({"error": "unauthorized"}), 401
    with SessionLocal() as db:
        adm = db.get(AdminUser, int(payload["sub"]))
        if not adm or not adm.is_active:
            return jsonify({"error": "unauthorized"}), 401
        return jsonify({"id": adm.id, "codigo": adm.codigo, "role": "admin"})


@auth_admin_bp.route("/auth/admin/logout", methods=["POST"])  # stateless JWT; client just drops token
def admin_logout():
    resp = make_response(jsonify({"message": "ok"}))
    _, del_kwargs = cookie_flags()
    resp.set_cookie("admin_refresh", "", **del_kwargs)
    return resp


@auth_admin_bp.route("/auth/admin/refresh", methods=["POST"])
def admin_refresh():
    """Issue a new access token if a valid refresh cookie is present."""
    token = request.cookies.get("admin_refresh")
    if not token:
        return jsonify({"error": "unauthorized"}), 401
    payload = verify_refresh_token(token)
    if not payload:
        return jsonify({"error": "unauthorized"}), 401
    with SessionLocal() as db:
        adm = db.get(AdminUser, int(payload["sub"]))
        if not adm or not adm.is_active:
            return jsonify({"error": "unauthorized"}), 401
        new_access = issue_access_token(adm)
        # Optionally rotate refresh token
        rotate = os.environ.get("JWT_REFRESH_ROTATE", "1") == "1"
        resp = make_response(jsonify({"access_token": new_access, "token_type": "Bearer"}))
        if rotate:
            new_refresh = issue_refresh_token(adm)
            set_kwargs, _ = cookie_flags()
            resp.set_cookie("admin_refresh", new_refresh, **set_kwargs)
        return resp
