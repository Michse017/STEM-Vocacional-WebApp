QUESTIONNAIRE_STRUCTURE = {
    "dimensions": [
        {
            "dimension": "Cognitiva",
            "table": "resp_cognitiva",
            "questions": [
                {
                    "text": "¿Presentaste las pruebas Saber 11 o ICFES después de 2014?",
                    "variable": "fecha_graduacion",  # viene de educativa_familiar
                    "type": "opcion_unica",
                    "options": ["Sí", "No"]
                },
                {
                    "text": "¿Tienes los resultados oficiales de Saber 11?",
                    "variable": ["ptj_fisica", "ptj_quimica", "ptj_biologia", "ptj_matematicas"],
                    "type": "opcion_unica",
                    "options": ["Sí", "No"]
                },
                {"text": "¿Cuál fue tu puntaje en Física?", "variable": "ptj_fisica", "type": "numero"},
                {"text": "¿Cuál fue tu puntaje en Química?", "variable": "ptj_quimica", "type": "numero"},
                {"text": "¿Cuál fue tu puntaje en Biología?", "variable": "ptj_biologia", "type": "numero"},
                {"text": "¿Cuál fue tu puntaje en Matemáticas?", "variable": "ptj_matematicas", "type": "numero"},
                {
                    "text": "¿Tus pruebas incluyen resultados en áreas sociales o humanísticas?",
                    "variable": ["ptj_geografia", "ptj_historia", "ptj_filosofia", "ptj_sociales_ciudadano", "ptj_ciencias_sociales"],
                    "type": "opcion_unica",
                    "options": ["Sí", "No"]
                },
                {"text": "¿Cuál fue tu puntaje en Geografía?", "variable": "ptj_geografia", "type": "numero"},
                {"text": "¿Cuál fue tu puntaje en Historia?", "variable": "ptj_historia", "type": "numero"},
                {"text": "¿Cuál fue tu puntaje en Filosofía?", "variable": "ptj_filosofia", "type": "numero"},
                {"text": "¿Cuál fue tu puntaje en Sociales (ciudadano)?", "variable": "ptj_sociales_ciudadano", "type": "numero"},
                {"text": "¿Cuál fue tu puntaje en Ciencias Sociales?", "variable": "ptj_ciencias_sociales", "type": "numero"},
                {
                    "text": "¿Incluyeron lectura crítica, lenguaje e inglés en tus pruebas Saber 11?",
                    "variable": ["ptj_lenguaje", "ptj_lectura_critica", "ptj_ingles"],
                    "type": "opcion_unica",
                    "options": ["Sí", "No"]
                },
                {"text": "¿Cuál fue tu puntaje en Lenguaje?", "variable": "ptj_lenguaje", "type": "numero"},
                {"text": "¿Cuál fue tu puntaje en Lectura Crítica?", "variable": "ptj_lectura_critica", "type": "numero"},
                {"text": "¿Cuál fue tu puntaje en Inglés?", "variable": "ptj_ingles", "type": "numero"},
                {
                    "text": "¿Has presentado la prueba Saber Pro (ECAES)?",
                    "variable": "ecaes",
                    "type": "opcion_unica",
                    "options": ["Sí", "No"]
                },
                {
                    "text": "¿Cuál fue tu puntaje en Saber Pro (ECAES)?",
                    "variable": "ecaes",
                    "type": "numero"
                },
                {"text": "¿Cuál es tu promedio acumulado actual?", "variable": "pga_acumulado", "type": "numero"},
                {"text": "¿Cuál es tu promedio del último periodo?", "variable": "promedio_periodo", "type": "numero"},
            ]
        },
        {
            "dimension": "Educativa/Familiar",
            "table": "resp_educativa_familiar",
            "questions": [
                {"text": "¿Dónde cursaste el bachillerato? (nombre del colegio)", "variable": "colegio", "type": "texto"},
                {"text": "¿Ciudad donde cursaste el bachillerato?", "variable": "ciudad_colegio", "type": "texto"},
                {"text": "¿Departamento donde cursaste el bachillerato?", "variable": "depto_colegio", "type": "texto"},
                {"text": "¿Municipio donde cursaste el bachillerato?", "variable": "municipio_colegio", "type": "texto"},
                {
                    "text": "¿Recuerdas si tu colegio fue técnico, académico, rural o urbano?",
                    "variable": "nivel",
                    "type": "opcion_unica",
                    "options": ["Técnico", "Académico", "Rural", "Urbano"]
                },
                {"text": "¿En qué año te graduaste del colegio?", "variable": "fecha_graduacion", "type": "texto"},
            ]
        },
        {
            "dimension": "Socioeconómica",
            "table": "resp_socioeconomica",
            "questions": [
                {
                    "text": "¿Cuál es el estrato socioeconómico de tu vivienda actual?",
                    "variable": "estrato",
                    "type": "opcion_unica",
                    "options": ["ESTRATO 1", "ESTRATO 2", "ESTRATO 3", "ESTRATO 4", "ESTRATO 5", "ESTRATO 6", "NS/NR", "N/A"]
                },
                {"text": "¿Actualmente cuentas con alguna beca o ayuda económica? ¿Cuál?", "variable": "becas", "type": "texto"},
                {
                    "text": "¿Estás vinculado(a) a algún programa Ceres u otro programa especial?",
                    "variable": "ceres",
                    "type": "opcion_unica",
                    "options": ["Sí", "No", "Nombre de programa"]
                },
                {"text": "¿Cuándo ingresaste a la universidad?", "variable": "periodo_ingreso", "type": "texto"},
                {
                    "text": "¿Eres estudiante nuevo, de transferencia o reintegrado?",
                    "variable": "tipo_estudiante",
                    "type": "opcion_unica",
                    "options": ["PRIMERA VEZ", "CONTINUO", "REINICIO", "TRANSFERENCIA", "REINGRESO"]
                }
            ]
        },
        {
            "dimension": "Autoeficacia",
            "table": "resp_autoeficacia",
            "questions": [
                {"text": "¿Cuántos créditos tienes matriculados actualmente?", "variable": "creditos_matriculados", "type": "numero"},
                {"text": "¿Cuántos créditos has ganado?", "variable": "creditos_ganadas", "type": "numero"},
                {"text": "¿Cuántos créditos has reprobado?", "variable": "creditos_reprobadas", "type": "numero"},
                {"text": "¿Cuál es tu índice de calidad actual?", "variable": "puntos_calidad_pga", "type": "numero"},
                {
                    "text": "¿Cuál es tu estado actual en la universidad?",
                    "variable": ["situacion", "estado"],
                    "type": "opcion_unica",
                    "options": ["ACTIVO", "PAUSA", "RETIRADO", "EGRESADO", "OTRO"]
                },
                {"text": "¿Cuántas materias has aprobado en total?", "variable": "nro_materias_aprobadas", "type": "numero"},
                {"text": "¿Cuántas materias has perdido en total?", "variable": "nro_materias_reprobadas", "type": "numero"},
            ]
        }
    ]
}