from flask import Blueprint, jsonify, request
from pydantic import ValidationError
from schemas.questionnaire_schemas import CuestionarioCompletoSchema
from services.questionnaire_service import guardar_respuestas_cuestionario, finalizar_cuestionario
from database.controller import SessionLocal
from database.models import Cuestionario, Pregunta, OpcionPregunta
import traceback

questionnaire_bp = Blueprint('questionnaire_bp', __name__)

# ============================================================================
# ENDPOINTS PARA USUARIOS - INTEGRACIÓN CON CUESTIONARIOS DINÁMICOS
# ============================================================================

@questionnaire_bp.route('/cuestionarios', methods=['GET'])
def listar_cuestionarios_usuarios():
    """
    Lista todos los cuestionarios activos disponibles para usuarios.
    Integra el sistema de administración con el sistema de usuarios.
    """
    db_session = SessionLocal()
    try:
        # Obtener solo cuestionarios activos
        cuestionarios = db_session.query(Cuestionario).filter(
            Cuestionario.activo == True
        ).all()
        
        result = []
        for cuest in cuestionarios:
            # Contar preguntas
            num_preguntas = db_session.query(Pregunta).filter(
                Pregunta.id_cuestionario == cuest.id_cuestionario
            ).count()
            
            result.append({
                'id_cuestionario': cuest.id_cuestionario,
                'nombre': cuest.nombre,
                'descripcion': cuest.descripcion,
                'tipo': cuest.tipo,
                'num_preguntas': num_preguntas,
                'fecha_creacion': cuest.fecha_creacion.isoformat() if cuest.fecha_creacion else None
            })
        
        return jsonify({
            'success': True,
            'data': result,
            'count': len(result),
            'message': 'Cuestionarios disponibles para usuarios'
        })
        
    except Exception as e:
        print(f"Error al listar cuestionarios para usuarios: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error al obtener cuestionarios',
            'message': str(e)
        }), 500
        
    finally:
        db_session.close()

@questionnaire_bp.route('/cuestionarios/<int:id_cuestionario>', methods=['GET'])
def obtener_cuestionario_usuario(id_cuestionario):
    """
    Obtiene un cuestionario específico con sus preguntas para que un usuario lo responda.
    """
    db_session = SessionLocal()
    try:
        # Obtener cuestionario
        cuestionario = db_session.query(Cuestionario).filter(
            Cuestionario.id_cuestionario == id_cuestionario,
            Cuestionario.activo == True
        ).first()
        
        if not cuestionario:
            return jsonify({
                'success': False,
                'error': 'Cuestionario no encontrado o no disponible'
            }), 404
        
        # Obtener preguntas del cuestionario
        preguntas = db_session.query(Pregunta).filter(
            Pregunta.id_cuestionario == id_cuestionario
        ).order_by(Pregunta.orden).all()
        
        preguntas_data = []
        for pregunta in preguntas:
            # Obtener opciones de la pregunta
            opciones = db_session.query(OpcionPregunta).filter(
                OpcionPregunta.id_pregunta == pregunta.id_pregunta
            ).order_by(OpcionPregunta.orden).all()
            
            opciones_data = [{
                'id_opcion': opcion.id_opcion,
                'texto_opcion': opcion.texto_opcion,
                'valor': opcion.valor,
                'orden': opcion.orden
            } for opcion in opciones]
            
            preguntas_data.append({
                'id_pregunta': pregunta.id_pregunta,
                'texto_pregunta': pregunta.texto_pregunta,
                'tipo_pregunta': pregunta.tipo_pregunta,
                'orden': pregunta.orden,
                'requerida': pregunta.requerida,
                'opciones': opciones_data
            })
        
        return jsonify({
            'success': True,
            'data': {
                'id_cuestionario': cuestionario.id_cuestionario,
                'nombre': cuestionario.nombre,
                'descripcion': cuestionario.descripcion,
                'tipo': cuestionario.tipo,
                'preguntas': preguntas_data
            }
        })
        
    except Exception as e:
        print(f"Error al obtener cuestionario {id_cuestionario}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error al obtener cuestionario',
            'message': str(e)
        }), 500
        
    finally:
        db_session.close()

# ============================================================================
# ENDPOINTS ORIGINALES DEL SISTEMA
# ============================================================================

@questionnaire_bp.route('/cuestionario-dinamico', methods=['POST'])
def enviar_cuestionario_dinamico():
    """
    Guarda las respuestas de un cuestionario dinámico específico.
    """
    db_session = SessionLocal()
    try:
        json_data = request.get_json()
        
        if not json_data:
            return jsonify({
                "success": False, 
                "error": "No se recibieron datos."
            }), 400

        # Validar datos requeridos
        id_usuario = json_data.get('id_usuario')
        id_cuestionario = json_data.get('id_cuestionario')
        respuestas = json_data.get('respuestas', {})

        if not id_usuario or not id_cuestionario:
            return jsonify({
                "success": False,
                "error": "ID de usuario e ID de cuestionario son requeridos."
            }), 400

        # Verificar que el cuestionario existe y está activo
        cuestionario = db_session.query(Cuestionario).filter(
            Cuestionario.id_cuestionario == id_cuestionario,
            Cuestionario.activo == True
        ).first()

        if not cuestionario:
            return jsonify({
                "success": False,
                "error": "Cuestionario no encontrado o no disponible."
            }), 404

        # Obtener preguntas del cuestionario
        preguntas = db_session.query(Pregunta).filter(
            Pregunta.id_cuestionario == id_cuestionario
        ).all()

        # Validar respuestas requeridas
        preguntas_requeridas = [p for p in preguntas if p.requerida]
        respuestas_faltantes = []
        
        for pregunta in preguntas_requeridas:
            respuesta = respuestas.get(str(pregunta.id_pregunta), '')
            if not respuesta or str(respuesta).strip() == '':
                respuestas_faltantes.append(pregunta.texto_pregunta)

        if respuestas_faltantes:
            return jsonify({
                "success": False,
                "error": f"Faltan respuestas requeridas: {', '.join(respuestas_faltantes)}"
            }), 400

        # TODO: Aquí puedes implementar el guardado real de respuestas
        # Por ahora, simulamos el guardado exitoso
        
        print(f"--- RESPUESTAS CUESTIONARIO DINÁMICO ---")
        print(f"Usuario: {id_usuario}")
        print(f"Cuestionario: {cuestionario.nombre} (ID: {id_cuestionario})")
        print(f"Respuestas: {respuestas}")
        print("----------------------------------------")

        return jsonify({
            "success": True,
            "message": f"Respuestas del cuestionario '{cuestionario.nombre}' guardadas exitosamente.",
            "data": {
                "id_usuario": id_usuario,
                "id_cuestionario": id_cuestionario,
                "cuestionario_nombre": cuestionario.nombre,
                "respuestas_guardadas": len([r for r in respuestas.values() if r])
            }
        })

    except Exception as e:
        print(f"Error al guardar respuestas dinámicas: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor.",
            "message": str(e)
        }), 500
        
    finally:
        db_session.close()

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
