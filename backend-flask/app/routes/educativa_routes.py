from flask import Blueprint
from app.controllers.educativa_controller import (
    obtener_todas_educativas,
    crear_educativa,
    obtener_educativa_por_id,
    obtener_educativas_por_usuario,
    eliminar_educativa
)

educativa_bp = Blueprint('educativa', __name__)

# Rutas para respuestas educativas
educativa_bp.route('/api/educativa', methods=['GET'])(obtener_todas_educativas)
educativa_bp.route('/api/educativa', methods=['POST'])(crear_educativa)
educativa_bp.route('/api/educativa/<int:id_respuesta>', methods=['GET'])(obtener_educativa_por_id)
educativa_bp.route('/api/educativa/usuario/<int:id_usuario>', methods=['GET'])(obtener_educativas_por_usuario)
educativa_bp.route('/api/educativa/<int:id_respuesta>', methods=['DELETE'])(eliminar_educativa)