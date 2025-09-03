from sqlalchemy.orm import Session
from database import controller as db_controller
from ..schemas.questionnaire_schemas import CuestionarioCompletoSchema, SociodemograficaSchema, InteligenciasMultiplesSchema

def guardar_respuestas_cuestionario(db_session: Session, data: CuestionarioCompletoSchema):
    """
    Servicio para guardar o actualizar las respuestas de un cuestionario.
    """
    sociodemografica_data = data.sociodemografica.model_dump(exclude_unset=True)
    if sociodemografica_data:
        db_controller.upsert_sociodemografica(
            db_session, data.id_usuario, sociodemografica_data
        )

    inteligencias_data = data.inteligencias_multiples.model_dump(exclude_unset=True)
    if inteligencias_data:
        db_controller.upsert_inteligencias_multiples(
            db_session, data.id_usuario, inteligencias_data
        )

    return {
        "status": "success",
        "message": "Tus respuestas han sido guardadas correctamente."
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
        "sociodemografica": SociodemograficaSchema.from_orm(usuario.sociodemografica).model_dump() if usuario.sociodemografica else {},
        "inteligencias_multiples": InteligenciasMultiplesSchema.from_orm(usuario.inteligencias_multiples).model_dump() if usuario.inteligencias_multiples else {}
    }
    
    return respuestas
