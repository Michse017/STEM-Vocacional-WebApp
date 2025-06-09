from database.controller import upsert_educativa_familiar, get_usuario_by_codigo

def save_educativa_familiar(codigo_estudiante, data):
    usuario = get_usuario_by_codigo(codigo_estudiante)
    if not usuario:
        return False
    # Valida la fecha si viene como str
    fecha = data.get("fecha_graduacion")
    if fecha and isinstance(fecha, str) and len(fecha) == 4 and fecha.isdigit():
        # Si solo viene el año, ponerlo como 31-12-año
        data["fecha_graduacion"] = f"{fecha}-12-31"
    upsert_educativa_familiar(usuario.id_usuario, data)
    return True