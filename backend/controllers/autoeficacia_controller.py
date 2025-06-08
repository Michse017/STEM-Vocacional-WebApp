from database.controller import upsert_autoeficacia, get_usuario_by_codigo

def save_autoeficacia(codigo_estudiante, data):
    usuario = get_usuario_by_codigo(codigo_estudiante)
    if not usuario:
        return False
    upsert_autoeficacia(usuario.id_usuario, data)
    return True