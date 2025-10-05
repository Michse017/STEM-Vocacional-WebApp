"""Deprecated: legacy questionnaire service removed.

This module intentionally provides no legacy functionality. Any remaining imports
should be removed from callers. Temporary no-op stubs are kept to avoid crashes
while finishing the migration.
"""

from sqlalchemy.orm import Session
from typing import Dict, Any

def guardar_respuestas_cuestionario(db_session: Session, data) -> Dict[str, Any]:  # type: ignore[no-untyped-def]
    return {"status": "gone", "message": "Legacy questionnaire disabled"}

def obtener_respuestas_por_usuario(db_session: Session, id_usuario: int):
    return {}

def validar_completitud_cuestionario(respuestas: Dict[str, Any]) -> Dict[str, Any]:
    return {"ok": False, "missing": {}}

def finalizar_cuestionario(db_session: Session, id_usuario: int):
    return {"status": "gone", "message": "Use dynamic finalize flow"}
