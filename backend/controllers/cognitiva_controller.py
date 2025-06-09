from database.controller import upsert_cognitiva, get_usuario_by_codigo

def save_cognitiva(codigo_estudiante, data):
    usuario = get_usuario_by_codigo(codigo_estudiante)
    if not usuario:
        return False
    # Saneamiento: si los campos numéricos vienen vacíos, pásalos como None
    for key in [
        "ptj_fisica", "ptj_quimica", "ptj_biologia", "ptj_matematicas",
        "ptj_geografia", "ptj_historia", "ptj_filosofia", "ptj_sociales_ciudadano",
        "ptj_ciencias_sociales", "ptj_lenguaje", "ptj_lectura_critica", "ptj_ingles",
        "ecaes", "pga_acumulado", "promedio_periodo"
    ]:
        v = data.get(key)
        data[key] = float(v) if v not in (None, '', 'NaN') else None
    upsert_cognitiva(usuario.id_usuario, data)
    return True