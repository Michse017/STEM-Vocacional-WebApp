from flask import Blueprint
from app.controllers.cognitiva_controller import (
    obtener_todas_cognitivas,
    crear_cognitiva,
    obtener_cognitiva_por_id,
    obtener_cognitivas_por_usuario,
    eliminar_cognitiva,
    crear_o_actualizar_cognitiva  # Nueva función
)

cognitiva_bp = Blueprint('cognitiva', __name__)

# Rutas para respuestas cognitivas
cognitiva_bp.route('/api/cognitiva', methods=['GET'])(obtener_todas_cognitivas)
cognitiva_bp.route('/api/cognitiva', methods=['POST'])(crear_cognitiva)
cognitiva_bp.route('/api/cognitiva/<int:id_respuesta>', methods=['GET'])(obtener_cognitiva_por_id)
cognitiva_bp.route('/api/cognitiva/usuario/<int:id_usuario>', methods=['GET'])(obtener_cognitivas_por_usuario)
cognitiva_bp.route('/api/cognitiva/<int:id_respuesta>', methods=['DELETE'])(eliminar_cognitiva)

# Nueva ruta para crear o actualizar
cognitiva_bp.route('/api/cognitiva/upsert', methods=['POST'])(crear_o_actualizar_cognitiva)