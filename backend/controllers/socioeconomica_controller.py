from database.controller import upsert_socioeconomica, get_usuario_by_codigo

def save_socioeconomica(codigo_estudiante, data):
    usuario = get_usuario_by_codigo(codigo_estudiante)
    if not usuario:
        return False
    upsert_socioeconomica(usuario.id_usuario, data)
    return True