from sqlalchemy.orm import Session
from database import controller as db_controller
from ..schemas.questionnaire_schemas import (
    CuestionarioCompletoSchema,
    SociodemograficaSchema,
    InteligenciasMultiplesSchema,
)
from typing import Dict, Any

def guardar_respuestas_cuestionario(db_session: Session, data: CuestionarioCompletoSchema):
    """
    Servicio para guardar o actualizar las respuestas de un cuestionario.
    """
    saved_parts = []
    errors: Dict[str, Any] = {}

    # Bloquear si usuario ya finalizó
    user = db_controller.get_user_with_responses(db_session, data.id_usuario)
    if getattr(user, 'finalizado', False):
        return {"status": "error", "message": "El cuestionario ya fue finalizado. No se puede editar."}

    # Sociodemográfica: ya validada por Pydantic. Guardamos campos presentes.
    try:
        # Dump en modo JSON para convertir Enums a strings antes de guardar en BD
        sociodemografica_data = data.sociodemografica.model_dump(exclude_unset=True, mode='json')
        if sociodemografica_data:
            db_controller.upsert_sociodemografica(
                db_session, data.id_usuario, sociodemografica_data
            )
            saved_parts.append('sociodemografica')
    except Exception as e:
        errors['sociodemografica'] = str(e)

    # Inteligencias múltiples
    try:
        inteligencias_data = data.inteligencias_multiples.model_dump(exclude_unset=True, mode='json')
        if inteligencias_data:
            db_controller.upsert_inteligencias_multiples(
                db_session, data.id_usuario, inteligencias_data
            )
            saved_parts.append('inteligencias_multiples')
    except Exception as e:
        errors['inteligencias_multiples'] = str(e)

    status = "success" if saved_parts else "error"
    message = "Tus respuestas han sido guardadas correctamente." if saved_parts else "No se guardaron datos válidos."
    return {
        "status": status,
        "message": message,
        "saved_parts": saved_parts,
        "errors": errors,
    }

def obtener_respuestas_por_usuario(db_session: Session, id_usuario: int):
    """
    Obtiene las respuestas guardadas de un usuario.
    """
    usuario = db_controller.get_user_with_responses(db_session, id_usuario)
    
    if not usuario:
        return None

    # CORRECCIÓN: Convertimos los modelos Pydantic a diccionarios usando .model_dump()
    # para que puedan ser serializados a JSON correctamente.
    respuestas = {
        # mode='json' para devolver strings en lugar de Enum objects
        "sociodemografica": SociodemograficaSchema.from_orm(usuario.sociodemografica).model_dump(mode='json') if usuario.sociodemografica else {},
        "inteligencias_multiples": InteligenciasMultiplesSchema.from_orm(usuario.inteligencias_multiples).model_dump(mode='json') if usuario.inteligencias_multiples else {}
    }
    # Incluir estado de finalización
    respuestas['finalizado'] = getattr(usuario, 'finalizado', False)
    return respuestas

def validar_completitud_cuestionario(respuestas: Dict[str, Any]) -> Dict[str, Any]:
    """Revisa si todas las secciones están completas. Devuelve {ok: bool, missing: {...}}"""
    missing: Dict[str, Any] = {}
    socio = respuestas.get('sociodemografica', {})
    intel = respuestas.get('inteligencias_multiples', {})

    # Campos obligatorios para finalizar:
    required_socio = [
        'fecha_nacimiento', 'sexo', 'fecha_graduacion_bachillerato',
        'nivel_educativo_madre', 'nivel_educativo_padre', 'ocupacion_padre', 'ocupacion_madre',
        'miembros_hogar', 'numero_hermanos',
        'condicion_discapacidad', 'grupo_etnico', 'condicion_vulnerabilidad',
        'trabaja_actualmente',
        'puntaje_lectura_critica', 'puntaje_matematicas', 'puntaje_sociales_ciudadanas', 'puntaje_ciencias_naturales', 'puntaje_ingles'
        # Nota: 'puntaje_global_saber11' se calcula automáticamente cuando hay componentes suficientes
    ]

    socio_missing = [k for k in required_socio if socio.get(k) in (None, "")]
    # Reglas condicionales: si se selecciona 'Otra' u 'Otro', se requiere el campo de texto
    if socio.get('condicion_discapacidad') == 'Otra' and not socio.get('otro_discapacidad'):
        socio_missing.append('otro_discapacidad')
    if socio.get('grupo_etnico') == 'Otro' and not socio.get('otro_grupo_etnico'):
        socio_missing.append('otro_grupo_etnico')
    if socio_missing:
        missing['sociodemografica'] = socio_missing

    # Dimensión IM: para finalizar, todas las 35 preguntas deben estar respondidas ('V' o 'F')
    preguntas_im = [f'pregunta_{i}' for i in range(1, 36)]
    im_missing = [q for q in preguntas_im if intel.get(q) not in ('V', 'F')]
    if im_missing:
        missing['inteligencias_multiples'] = im_missing

    return {"ok": len(missing) == 0, "missing": missing}

def finalizar_cuestionario(db_session: Session, id_usuario: int):
    """Marca el cuestionario como finalizado si está completo."""
    respuestas = obtener_respuestas_por_usuario(db_session, id_usuario)
    if not respuestas:
        return {"status": "error", "message": "Usuario no encontrado"}

    check = validar_completitud_cuestionario(respuestas)
    if not check['ok']:
        return {"status": "error", "message": "Faltan campos por completar", "missing": check['missing']}

    # Marcar finalizado
    user = db_controller.get_user_with_responses(db_session, id_usuario)
    setattr(user, 'finalizado', True)
    db_session.commit()
    return {"status": "success", "message": "Cuestionario finalizado. Ya no se permiten modificaciones."}
