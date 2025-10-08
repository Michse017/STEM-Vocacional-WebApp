import os
from flask import Blueprint, request, jsonify
from backend.services.usuario_service import validar_usuario_por_codigo, obtener_respuestas_guardadas
from database.controller import SessionLocal
import traceback
from werkzeug.security import generate_password_hash as wz_gen_hash, check_password_hash as wz_check_hash
from sqlalchemy import select
from sqlalchemy.sql import func
from database.models import Usuario
from backend.extensions import limiter
import re

usuario_bp = Blueprint('usuario_bp', __name__)


def _debug(msg: str) -> None:
    """Print debug messages only outside production."""
    try:
        if os.environ.get('FLASK_ENV') != 'production':
            print(msg)
    except Exception:
        pass

@usuario_bp.route('/usuarios', methods=['OPTIONS'])
def options_usuarios():
    # CORS preflight handler (Flask-CORS should handle, but we respond explicitly)
    return ('', 200)

@usuario_bp.route('/usuarios', methods=['POST'])
def login_usuario():
    """
    Valida a un usuario por su código. Si no existe, lo crea.
    Devuelve los datos del usuario.
    """
    db_session = SessionLocal()
    try:
        data = request.get_json()
        _debug(f"[login_usuario] payload={data}")
        if not data or 'codigo_estudiante' not in data:
            return jsonify({"error": "El campo 'codigo_estudiante' es requerido."}), 400

        codigo = data['codigo_estudiante']
        usuario = validar_usuario_por_codigo(db_session, codigo)
        _debug(f"[login_usuario] ok codigo={codigo} -> id={usuario.id_usuario}")
        
        return jsonify({
            "id_usuario": usuario.id_usuario,
            "codigo_estudiante": usuario.codigo_estudiante,
            # finalizado (legacy) removed; dynamic progress is per-assignment
        }), 200
    except ValueError as e:
        _debug(f"[login_usuario] not found: {e}")
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        try:
            if os.environ.get('FLASK_ENV') != 'production':
                import traceback; traceback.print_exc()
                print(f"[login_usuario] exception: {e}")
        except Exception:
            pass
        return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500
    finally:
        db_session.close()

@usuario_bp.route('/usuarios/<int:id_usuario>/respuestas', methods=['GET'])
def get_respuestas_usuario(id_usuario: int):
    """
    Endpoint para obtener las respuestas guardadas de un usuario.
    """
    db_session = SessionLocal()
    try:
        respuestas = obtener_respuestas_guardadas(db_session, id_usuario)
        if respuestas:
            return jsonify(respuestas), 200
        else:
            # Si no hay respuestas, es una situación esperada.
            # El frontend sabrá que debe mostrar el cuestionario vacío.
            return jsonify({"error": "No se encontraron respuestas para este usuario."}), 404
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500
    finally:
        db_session.close()


@usuario_bp.route('/usuarios/check', methods=['POST'])
@limiter.limit("20 per minute")
def check_usuario():
    """Valida si el código existe y si requiere contraseña.

    - Si el código no existe: 404 { error: 'not_found' }
    - Si existe y password_hash es nulo: { status: 'needs_setup' }
    - Si existe y tiene password_hash: { status: 'needs_password', username: <o None> }
    """
    db = SessionLocal()
    try:
        data = request.get_json(silent=True) or {}
        code = (data.get('codigo_estudiante') or '').strip()
        if not code:
            return jsonify({"error": "codigo_estudiante_required"}), 400
        user = db.execute(select(Usuario).where(Usuario.codigo_estudiante == code)).scalar_one_or_none()
        if not user:
            return jsonify({"error": "not_found"}), 404
        if not user.password_hash:
            return jsonify({"status": "needs_setup"})
        return jsonify({"status": "needs_password", "username": user.username})
    except Exception as e:
        try: traceback.print_exc()
        except Exception: pass
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@usuario_bp.route('/usuarios/setup-credentials', methods=['POST'])
@limiter.limit("5 per minute")
def setup_credentials():
    """El usuario define username y contraseña si su código existe y aún no tiene password.
    Body: { codigo_estudiante, username, password, confirm }
    """
    db = SessionLocal()
    try:
        data = request.get_json(force=True, silent=True) or {}
        code = (data.get('codigo_estudiante') or '').strip()
        username = (data.get('username') or '').strip().lower()
        password = data.get('password') or ''
        confirm = data.get('confirm') or ''
        if not code or not username or not password:
            return jsonify({"error": "missing_fields"}), 400
        if password != confirm:
            return jsonify({"error": "password_mismatch"}), 400
        if len(username) < 3 or len(username) > 64:
            return jsonify({"error": "invalid_username"}), 400
        if len(password) < 8:
            return jsonify({"error": "weak_password"}), 400
        # Clear and simple policy: 8-64 characters, only letters and numbers
        if not re.fullmatch(r"[A-Za-z0-9]{8,64}", password or ""):
            return jsonify({"error": "invalid_password_format"}), 400

        user = db.execute(select(Usuario).where(Usuario.codigo_estudiante == code)).scalar_one_or_none()
        if not user:
            return jsonify({"error": "not_found"}), 404
        if user.password_hash:
            return jsonify({"error": "already_has_password"}), 409
        # Check username unique
        existing_username = db.execute(select(Usuario).where(Usuario.username == username)).scalar_one_or_none()
        if existing_username:
            return jsonify({"error": "username_taken"}), 409

        user.username = username
        try:
            user.password_hash = wz_gen_hash(password, method="pbkdf2:sha256")
        except Exception:
            return jsonify({"error": "password_hash_error"}), 500
        db.commit()
        return jsonify({"message": "credentials_set"})
    except Exception as e:
        try: traceback.print_exc()
        except Exception: pass
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@usuario_bp.route('/usuarios/login-password', methods=['POST'])
@limiter.limit("5 per minute")
def login_password():
    """Autentica con código + contraseña para usuarios ya configurados."""
    db = SessionLocal()
    try:
        data = request.get_json(force=True, silent=True) or {}
        code = (data.get('codigo_estudiante') or '').strip()
        password = data.get('password') or ''
        if not code or not password:
            return jsonify({"error": "missing_fields"}), 400
        user = db.execute(select(Usuario).where(Usuario.codigo_estudiante == code)).scalar_one_or_none()
        if not user:
            return jsonify({"error": "not_found"}), 404
        if not user.password_hash:
            return jsonify({"error": "no_password_set"}), 409
        if not wz_check_hash(user.password_hash, password):
            return jsonify({"error": "invalid_credentials"}), 401
        user.last_login_at = func.now()
        db.commit()
        return jsonify({"id_usuario": user.id_usuario, "codigo_estudiante": user.codigo_estudiante, "username": user.username})
    except Exception as e:
        try: traceback.print_exc()
        except Exception: pass
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()