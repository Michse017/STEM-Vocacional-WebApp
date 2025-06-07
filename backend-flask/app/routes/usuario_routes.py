from flask import Blueprint
from app.controllers.usuario_controller import (
    obtener_todos_usuarios,
    crear_usuario,
    obtener_usuario_por_id,
    obtener_usuario_por_codigo,
    eliminar_usuario
)

usuario_bp = Blueprint('usuarios', __name__)

# Rutas para usuarios
usuario_bp.route('/api/usuarios', methods=['GET'])(obtener_todos_usuarios)
usuario_bp.route('/api/usuarios', methods=['POST'])(crear_usuario)
usuario_bp.route('/api/usuarios/<int:id_usuario>', methods=['GET'])(obtener_usuario_por_id)
usuario_bp.route('/api/usuarios/codigo/<string:codigo>', methods=['GET'])(obtener_usuario_por_codigo)
usuario_bp.route('/api/usuarios/<int:id_usuario>', methods=['DELETE'])(eliminar_usuario)