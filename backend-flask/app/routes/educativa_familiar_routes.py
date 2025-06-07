from flask import Blueprint
from app.controllers.educativa_familiar_controller import (
    obtener_todas_educativas_familiares,
    crear_educativa_familiar,
    obtener_educativa_familiar_por_id,
    obtener_educativas_familiares_por_usuario,
    eliminar_educativa_familiar
)

educativa_familiar_bp = Blueprint('educativa_familiar', __name__)

# Rutas para respuestas educativas familiares
educativa_familiar_bp.route('/api/educativa-familiar', methods=['GET'])(obtener_todas_educativas_familiares)
educativa_familiar_bp.route('/api/educativa-familiar', methods=['POST'])(crear_educativa_familiar)
educativa_familiar_bp.route('/api/educativa-familiar/<int:id_respuesta>', methods=['GET'])(obtener_educativa_familiar_por_id)
educativa_familiar_bp.route('/api/educativa-familiar/usuario/<int:id_usuario>', methods=['GET'])(obtener_educativas_familiares_por_usuario)
educativa_familiar_bp.route('/api/educativa-familiar/<int:id_respuesta>', methods=['DELETE'])(eliminar_educativa_familiar)