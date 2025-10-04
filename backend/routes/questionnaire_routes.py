from flask import Blueprint, jsonify, request
from pydantic import ValidationError
from ..schemas.questionnaire_schemas import CuestionarioCompletoSchema
from backend.services.questionnaire_service import guardar_respuestas_cuestionario, finalizar_cuestionario
from database.controller import SessionLocal
import traceback

questionnaire_bp = Blueprint('questionnaire_bp', __name__)

@questionnaire_bp.route('/cuestionario', methods=['POST'])
def submit_questionnaire():
    db_session = SessionLocal()
    try:
        json_data = request.get_json()
        
        # --- DEBUGGING: Imprimir los datos recibidos ---
        print("--- DATOS RECIBIDOS DEL FRONTEND ---")
        import json
        print(json.dumps(json_data, indent=2))
        print("------------------------------------")
        
        if not json_data:
            return jsonify({"status": "error", "message": "No se recibieron datos."}), 400

        try:
            # Validamos que los datos recibidos se ajustan al esquema.
            # Como los campos son opcionales, esto permite envíos parciales.
            cuestionario_validado = CuestionarioCompletoSchema(**json_data)
        except ValidationError as e:
            # Politica: Guardar solo datos válidos. Eliminamos los campos con errores y reintentamos.
            errors = e.errors()
            # Copia mutable
            pruned = dict(json_data)
            # El formato de loc normalmente es ("sociodemografica", "campo") o ("inteligencias_multiples", "pregunta_X")
            for err in errors:
                loc = err.get('loc', [])
                if len(loc) >= 2:
                    section, field = loc[0], loc[1]
                    if section in pruned and isinstance(pruned[section], dict):
                        pruned[section].pop(field, None)
                elif len(loc) == 1:
                    pruned.pop(loc[0], None)
            try:
                cuestionario_validado = CuestionarioCompletoSchema(**pruned)
                resultado = guardar_respuestas_cuestionario(db_session, cuestionario_validado)
                resultado['status'] = 'partial'
                resultado['validation_errors'] = errors
                return jsonify(resultado), 200
            except Exception:
                return jsonify({
                    "status": "error",
                    "message": "Los datos enviados no son válidos.",
                    "details": errors
                }), 400

        # Llamamos al nuevo servicio que solo guarda los datos válidos
        resultado = guardar_respuestas_cuestionario(db_session, cuestionario_validado)
        return jsonify(resultado), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Error interno del servidor: {str(e)}"}), 500
    finally:
        db_session.close()

@questionnaire_bp.route('/cuestionario/<int:id_usuario>/finalizar', methods=['POST'])
def finalizar(id_usuario: int):
    db_session = SessionLocal()
    try:
        # Si el frontend envía datos actuales del formulario, guardarlos antes de validar/finalizar
        json_data = request.get_json(silent=True) or {}
        if isinstance(json_data, dict) and (json_data.get('sociodemografica') or json_data.get('inteligencias_multiples')):
            try:
                payload = {
                    'id_usuario': id_usuario,
                    'sociodemografica': json_data.get('sociodemografica') or {},
                    'inteligencias_multiples': json_data.get('inteligencias_multiples') or {},
                }
                cuestionario_validado = CuestionarioCompletoSchema(**payload)
                _save_result = guardar_respuestas_cuestionario(db_session, cuestionario_validado)
                # No retornamos aquí: luego de guardar intentamos finalizar con el estado persistido
            except Exception:
                # Si falla el guardado previo, seguimos con la validación normal para reportar faltantes
                pass

        resultado = finalizar_cuestionario(db_session, id_usuario)
        code = 200 if resultado.get('status') == 'success' else 400
        return jsonify(resultado), code
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Error interno del servidor: {str(e)}"}), 500
    finally:
        db_session.close()
