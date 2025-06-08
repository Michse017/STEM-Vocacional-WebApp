from database.controller import upsert_cognitiva, get_usuario_by_codigo

def save_cognitiva(codigo_estudiante, data):
    usuario = get_usuario_by_codigo(codigo_estudiante)
    if not usuario:
        return False
    upsert_cognitiva(usuario.id_usuario, data)
    return True