from database.controller import get_usuario_by_codigo
from database.models import Usuario
from sqlalchemy.orm import Session
from .questionnaire_service import obtener_respuestas_por_usuario

def validar_usuario_por_codigo(db_session: Session, codigo_estudiante: str) -> Usuario:
    """
    Busca un usuario por su código. Si no existe, lanza un error.
    """
    usuario = get_usuario_by_codigo(db_session, codigo_estudiante)
    if not usuario:
        raise ValueError("El código de estudiante no existe.")
    return usuario

def obtener_respuestas_guardadas(db_session: Session, id_usuario: int):
    """
    Obtiene las respuestas guardadas de un usuario.
    """
    return obtener_respuestas_por_usuario(db_session, id_usuario)