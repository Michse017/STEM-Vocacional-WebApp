from flask import Blueprint, jsonify, request
from pydantic import ValidationError
from ..schemas.questionnaire_schemas import CuestionarioCompletoSchema
from ..services.questionnaire_service import guardar_respuestas_cuestionario
from database.controller import SessionLocal
import traceback

questionnaire_bp = Blueprint('questionnaire_bp', __name__)

@questionnaire_bp.route('/cuestionario', methods=['POST'])
def submit_questionnaire():
    db_session = SessionLocal()
    try:
        json_data = request.get_json()
        if not json_data:
            return jsonify({"status": "error", "message": "No se recibieron datos."}), 400

        try:
            # Validamos que los datos recibidos se ajustan al esquema.
            # Como los campos son opcionales, esto permite envíos parciales.
            cuestionario_validado = CuestionarioCompletoSchema(**json_data)
        except ValidationError as e:
            return jsonify({
                "status": "error",
                "message": "Los datos enviados no son válidos.",
                "details": e.errors()
            }), 400

        # Llamamos al nuevo servicio que solo guarda los datos
        resultado = guardar_respuestas_cuestionario(db_session, cuestionario_validado)
        
        return jsonify(resultado), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Error interno del servidor: {str(e)}"}), 500
    finally:
        db_session.close()
