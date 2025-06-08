from database.controller import get_usuario_by_codigo

def authenticate_user(codigo_estudiante):
    usuario = get_usuario_by_codigo(codigo_estudiante)
    if usuario:
        return usuario
    return None