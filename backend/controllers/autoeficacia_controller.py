from database.controller import upsert_autoeficacia, get_usuario_by_codigo

def save_autoeficacia(codigo_estudiante, data):
    usuario = get_usuario_by_codigo(codigo_estudiante)
    if not usuario:
        return False
    # Saneamiento de enteros/decimales
    for key in [
        "creditos_matriculados", "creditos_ganadas", "creditos_reprobadas",
        "puntos_calidad_pga", "nro_materias_aprobadas", "nro_materias_reprobadas"
    ]:
        v = data.get(key)
        data[key] = int(v) if v not in (None, '', 'NaN') else None
        if key == "puntos_calidad_pga" and data[key] is not None:
            data[key] = float(data[key])
    upsert_autoeficacia(usuario.id_usuario, data)
    return True