from flask import Blueprint
from app.controllers.socioeconomica_controller import (
    obtener_todas_socioeconomicas,
    crear_socioeconomica,
    obtener_socioeconomica_por_id,
    obtener_socioeconomicas_por_usuario,
    eliminar_socioeconomica
)

socioeconomica_bp = Blueprint('socioeconomica', __name__)

# Rutas para respuestas socioeconómicas
socioeconomica_bp.route('/api/socioeconomica', methods=['GET'])(obtener_todas_socioeconomicas)
socioeconomica_bp.route('/api/socioeconomica', methods=['POST'])(crear_socioeconomica)
socioeconomica_bp.route('/api/socioeconomica/<int:id_respuesta>', methods=['GET'])(obtener_socioeconomica_por_id)
socioeconomica_bp.route('/api/socioeconomica/usuario/<int:id_usuario>', methods=['GET'])(obtener_socioeconomicas_por_usuario)
socioeconomica_bp.route('/api/socioeconomica/<int:id_respuesta>', methods=['DELETE'])(eliminar_socioeconomica)