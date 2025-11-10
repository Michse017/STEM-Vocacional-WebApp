from database.controller import get_usuario_by_codigo
from database.models import Usuario
from sqlalchemy.orm import Session

def validar_usuario_por_codigo(db_session: Session, codigo_estudiante: str) -> Usuario:
    """Busca un usuario por su código. Si no existe, lanza un error.

    Importante: la creación de usuarios de estudiante se realiza SOLO por
    el endpoint administrativo dedicado (POST /api/admin/users). El endpoint
    público /api/usuarios debe limitarse a validar existencia del código para
    el flujo del estudiante.
    """
    usuario = get_usuario_by_codigo(db_session, codigo_estudiante)
    if not usuario:
        raise ValueError("El código de estudiante no existe.")
    return usuario

def obtener_respuestas_guardadas(db_session: Session, id_usuario: int):
    """Deprecated: legacy questionnaire answers are no longer exposed.
    Returns an empty payload to keep callers stable during transition.
    """
    return {}