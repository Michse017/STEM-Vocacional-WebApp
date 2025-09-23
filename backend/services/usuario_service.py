import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database.controller import get_usuario_by_codigo, is_database_available
from database.models import Usuario
from sqlalchemy.orm import Session

def validar_usuario_por_codigo(db_session: Session, codigo_estudiante: str) -> Usuario:
    """
    Busca un usuario por su código. Si no existe, lanza un error.
    """
    if not is_database_available():
        raise RuntimeError("Base de datos no disponible - No se pueden validar usuarios")
        
    usuario = get_usuario_by_codigo(db_session, codigo_estudiante)
    if not usuario:
        raise ValueError("El código de estudiante no existe.")
    return usuario

def obtener_respuestas_guardadas(db_session: Session, id_usuario: int):
    """
    Obtiene las respuestas guardadas de un usuario.
    """
    if not is_database_available():
        raise RuntimeError("Base de datos no disponible - No se pueden obtener respuestas")
        
    # Importar aquí para evitar importación circular
    from backend.services.questionnaire_service import obtener_respuestas_por_usuario
    return obtener_respuestas_por_usuario(db_session, id_usuario)