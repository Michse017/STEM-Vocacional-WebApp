from database.controller import upsert_educativa_familiar, get_usuario_by_codigo

def save_educativa_familiar(codigo_estudiante, data):
    usuario = get_usuario_by_codigo(codigo_estudiante)
    if not usuario:
        return False
    upsert_educativa_familiar(usuario.id_usuario, data)
    return True