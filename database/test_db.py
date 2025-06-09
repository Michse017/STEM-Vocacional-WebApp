from .controller import add_usuario, get_usuario_by_codigo, delete_usuario, upsert_cognitiva, upsert_educativa_familiar, upsert_socioeconomica, upsert_autoeficacia, get_usuario_full_responses

def test_full_flow():
    codigo = "TST123456"
    print("Creando usuario de prueba...")
    usuario = add_usuario(codigo)
    assert usuario is not None, "No se pudo crear usuario"
    print("Usuario creado:", usuario.codigo_estudiante)
    print("Insertando respuestas cognitivas...")
    upsert_cognitiva(usuario.id_usuario, {
        "ptj_fisica": 80, "ptj_quimica": 85, "ptj_biologia": 90, "ptj_matematicas": 95,
        "ptj_geografia": 88, "ptj_historia": 77, "ptj_filosofia": 66, "ptj_sociales_ciudadano": 55,
        "ptj_ciencias_sociales": 70, "ptj_lenguaje": 95, "ptj_lectura_critica": 88, "ptj_ingles": 82,
        "ecaes": 150, "pga_acumulado": 4.5, "promedio_periodo": 4.8
    })
    upsert_educativa_familiar(usuario.id_usuario, {
        "colegio": "Colegio Prueba",
        "ciudad_colegio": "Ciudad Prueba",
        "depto_colegio": "Depto Prueba",
        "municipio_colegio": "Mpio Prueba",
        "fecha_graduacion": "2021-11-30"
    })
    upsert_socioeconomica(usuario.id_usuario, {
        "estrato": "ESTRATO 3",
        "becas": "Beca Ejemplo",
        "ceres": "Ceres Prueba",
        "periodo_ingreso": "202220",
        "tipo_estudiante": "PRIMERA VEZ"
    })
    upsert_autoeficacia(usuario.id_usuario, {
        "creditos_matriculados": 18,
        "creditos_ganadas": 15,
        "creditos_reprobadas": 2,
        "puntos_calidad_pga": 60,
        "situacion": "ACTIVO",
        "estado": "ACTIVO",
        "nro_materias_aprobadas": 8,
        "nro_materias_reprobadas": 1
    })
    print("Lectura de respuestas del usuario:")
    data = get_usuario_full_responses(usuario.id_usuario)
    for tabla, valores in data.items():
        print(f"  {tabla}: {valores}")
    print("Eliminando usuario de prueba...")
    ok = delete_usuario(codigo)
    assert ok, "No se pudo eliminar usuario"
    print("Prueba completada correctamente.")

if __name__ == "__main__":
    test_full_flow()