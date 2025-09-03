from flask import Blueprint, request, jsonify
from ..services.usuario_service import validar_usuario_por_codigo, obtener_respuestas_guardadas
from database.controller import SessionLocal
import traceback

usuario_bp = Blueprint('usuario_bp', __name__)

@usuario_bp.route('/usuarios', methods=['POST'])
def login_usuario():
    """
    Valida a un usuario por su código. Si no existe, lo crea.
    Devuelve los datos del usuario.
    """
    db_session = SessionLocal()
    try:
        data = request.get_json()
        if not data or 'codigo_estudiante' not in data:
            return jsonify({"error": "El campo 'codigo_estudiante' es requerido."}), 400

        codigo = data['codigo_estudiante']
        usuario = validar_usuario_por_codigo(db_session, codigo)
        
        return jsonify({
            "id_usuario": usuario.id_usuario,
            "codigo_estudiante": usuario.codigo_estudiante
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
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