import pandas as pd
import os
import json

# Cargar todos los datos del Excel
EXCEL_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "DataProyecto#1.xlsx")
EXCEL_PATH = os.path.abspath(EXCEL_PATH)
all_sheets = pd.read_excel(EXCEL_PATH, sheet_name=None)
df = pd.concat(all_sheets.values(), ignore_index=True)

# Carpeta donde guardar respuestas
RESPONSES_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "responses")
os.makedirs(RESPONSES_DIR, exist_ok=True)

# Preguntas por dimensión y su mapeo a columnas
QUESTIONNAIRE_STRUCTURE = [
    {
        "dimension": "Cognitiva",
        "questions": [
            {
                "text": "¿Presentaste las pruebas Saber 11 o ICFES después de 2014?",
                "variable": "Fecha_graduacion",
                "type": "opcion_unica",
                "options": ["Sí", "No"],
                "autofill": lambda user: "Sí" if str(user.get("Fecha_graduacion", ""))[:4].isdigit() and int(str(user.get("Fecha_graduacion", ""))[:4]) > 2014 else "No"
            },
            {
                "text": "¿Tienes los resultados oficiales de Saber 11?",
                "variable": ["Ptj_fisica", "Ptj_quimica", "Ptj_biologia", "Ptj_matematicas"],
                "type": "opcion_unica",
                "options": ["Sí", "No"],
                "autofill": lambda user: "Sí" if all(user.get(col) not in [None, "", "nan"] for col in ["Ptj_fisica", "Ptj_quimica", "Ptj_biologia", "Ptj_matematicas"]) else "No"
            },
            {
                "text": "¿Cuál fue tu puntaje en Física?",
                "variable": "Ptj_fisica",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Ptj_fisica", "")
            },
            {
                "text": "¿Cuál fue tu puntaje en Química?",
                "variable": "Ptj_quimica",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Ptj_quimica", "")
            },
            {
                "text": "¿Cuál fue tu puntaje en Biología?",
                "variable": "Ptj_biologia",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Ptj_biologia", "")
            },
            {
                "text": "¿Cuál fue tu puntaje en Matemáticas?",
                "variable": "Ptj_matematicas",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Ptj_matematicas", "")
            },
            {
                "text": "¿Tus pruebas incluyen resultados en áreas sociales o humanísticas?",
                "variable": ["Ptj_geografia", "Ptj_historia", "Ptj_filosofia", "Ptj_sociales_ciudadano", "Ptj_ciencias_sociales"],
                "type": "opcion_unica",
                "options": ["Sí", "No"],
                "autofill": lambda user: "Sí" if any(user.get(col) not in [None, "", "nan"] for col in ["Ptj_geografia", "Ptj_historia", "Ptj_filosofia", "Ptj_sociales_ciudadano", "Ptj_ciencias_sociales"]) else "No"
            },
            {
                "text": "¿Cuál fue tu puntaje en Geografía?",
                "variable": "Ptj_geografia",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Ptj_geografia", "")
            },
            {
                "text": "¿Cuál fue tu puntaje en Historia?",
                "variable": "Ptj_historia",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Ptj_historia", "")
            },
            {
                "text": "¿Cuál fue tu puntaje en Filosofía?",
                "variable": "Ptj_filosofia",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Ptj_filosofia", "")
            },
            {
                "text": "¿Cuál fue tu puntaje en Sociales (ciudadano)?",
                "variable": "Ptj_sociales_ciudadano",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Ptj_sociales_ciudadano", "")
            },
            {
                "text": "¿Cuál fue tu puntaje en Ciencias Sociales?",
                "variable": "Ptj_ciencias_sociales",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Ptj_ciencias_sociales", "")
            },
            {
                "text": "¿Incluyeron lectura crítica, lenguaje e inglés en tus pruebas Saber 11?",
                "variable": ["Ptj_lenguaje", "Ptj_lectura_critica", "Ptj_ingles"],
                "type": "opcion_unica",
                "options": ["Sí", "No"],
                "autofill": lambda user: "Sí" if any(user.get(col) not in [None, "", "nan"] for col in ["Ptj_lenguaje", "Ptj_lectura_critica", "Ptj_ingles"]) else "No"
            },
            {
                "text": "¿Cuál fue tu puntaje en Lenguaje?",
                "variable": "Ptj_lenguaje",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Ptj_lenguaje", "")
            },
            {
                "text": "¿Cuál fue tu puntaje en Lectura Crítica?",
                "variable": "Ptj_lectura_critica",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Ptj_lectura_critica", "")
            },
            {
                "text": "¿Cuál fue tu puntaje en Inglés?",
                "variable": "Ptj_ingles",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Ptj_ingles", "")
            },
            {
                "text": "¿Has presentado la prueba Saber Pro (ECAES)?",
                "variable": "Ecaes",
                "type": "opcion_unica",
                "options": ["Sí", "No"],
                "autofill": lambda user: "Sí" if user.get("Ecaes") not in [None, "", "nan"] else "No"
            },
            {
                "text": "¿En qué año presentaste Saber Pro?",
                "variable": "Ecaes",
                "type": "texto",
                "options": None,
                "autofill": lambda user: user.get("Ecaes", "")
            },
            {
                "text": "¿Cuál es tu promedio acumulado actual?",
                "variable": "Pga_acomulado",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Pga_acomulado", "")
            },
            {
                "text": "¿Cuál es tu promedio del último periodo?",
                "variable": "Promedio_periodo",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Promedio_periodo", "")
            }
        ]
    },
    {
        "dimension": "Educativa/Familiar",
        "questions": [
            {
                "text": "¿Dónde cursaste el bachillerato? (nombre del colegio)",
                "variable": "Colegio",
                "type": "texto",
                "options": None,
                "autofill": lambda user: user.get("Colegio", "")
            },
            {
                "text": "¿Ciudad donde cursaste el bachillerato?",
                "variable": "Ciudad_colegio",
                "type": "texto",
                "options": None,
                "autofill": lambda user: user.get("Ciudad_colegio", "")
            },
            {
                "text": "¿Departamento donde cursaste el bachillerato?",
                "variable": "Depto_colegio",
                "type": "texto",
                "options": None,
                "autofill": lambda user: user.get("Depto_colegio", "")
            },
            {
                "text": "¿Municipio donde cursaste el bachillerato?",
                "variable": "Municipio_colegio",
                "type": "texto",
                "options": None,
                "autofill": lambda user: user.get("Municipio_colegio", "")
            },
            {
                "text": "¿Recuerdas si tu colegio fue técnico, académico, rural o urbano?",
                "variable": "Nivel",
                "type": "opcion_unica",
                "options": ["Técnico", "Académico", "Rural", "Urbano"],
                "autofill": lambda user: user.get("Nivel", "")
            },
            {
                "text": "¿En qué año te graduaste del colegio?",
                "variable": "Fecha_graduacion",
                "type": "texto",
                "options": None,
                "autofill": lambda user: user.get("Fecha_graduacion", "")
            }
        ]
    },
    {
        "dimension": "Socioeconómica",
        "questions": [
            {
                "text": "¿Cuál es el estrato socioeconómico de tu vivienda actual?",
                "variable": "Estrato",
                "type": "opcion_unica",
                "options": ["ESTRATO 1", "ESTRATO 2", "ESTRATO 3", "ESTRATO 4", "ESTRATO 5", "ESTRATO 6", "NS/NR", "N/A"],
                "autofill": lambda user: user.get("Estrato", "")
            },
            {
                "text": "¿Actualmente cuentas con alguna beca o ayuda económica? ¿Cuál?",
                "variable": "Becas",
                "type": "texto",
                "options": None,
                "autofill": lambda user: user.get("Becas", "")
            },
            {
                "text": "¿Estás vinculado(a) a algún programa Ceres u otro programa especial?",
                "variable": "Ceres",
                "type": "opcion_unica",
                "options": ["Sí", "No", "Nombre de programa"],
                "autofill": lambda user: user.get("Ceres", "")
            },
            {
                "text": "¿Cuándo ingresaste a la universidad?",
                "variable": "Periodo_ingreso",
                "type": "texto",
                "options": None,
                "autofill": lambda user: user.get("Periodo_ingreso", "")
            },
            {
                "text": "¿Eres estudiante nuevo, de transferencia o reintegrado?",
                "variable": "Tipo_estudiante",
                "type": "opcion_unica",
                "options": ["PRIMERA VEZ", "CONTINUO", "REINICIO", "TRANSFERENCIA", "REINGRESO"],
                "autofill": lambda user: user.get("Tipo_estudiante", "")
            }
        ]
    },
    {
        "dimension": "Autoeficacia",
        "questions": [
            {
                "text": "¿Cuántos créditos tienes matriculados actualmente?",
                "variable": "Creditos_matriculados",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Creditos_matriculados", "")
            },
            {
                "text": "¿Cuántos créditos has ganado?",
                "variable": "Creditos_ganadas",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Creditos_ganadas", "")
            },
            {
                "text": "¿Cuántos créditos has reprobado?",
                "variable": "Creditos_reprobadas",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Creditos_reprobadas", "")
            },
            {
                "text": "¿Cuál es tu índice de calidad actual?",
                "variable": "Puntos_calidad_pga",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Puntos_calidad_pga", "")
            },
            {
                "text": "¿Cuál es tu estado actual en la universidad?",
                "variable": ["Situacion", "Estado"],
                "type": "opcion_unica",
                "options": ["ACTIVO", "PAUSA", "RETIRADO", "EGRESADO", "OTRO"],
                "autofill": lambda user: user.get("Situacion") or user.get("Estado", "")
            },
            {
                "text": "¿Cuántas materias has aprobado en total?",
                "variable": "Nro_materias_aprobadas",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Nro_materias_aprobadas", "")
            },
            {
                "text": "¿Cuántas materias has perdido en total?",
                "variable": "Nro_materias_reprobadas",
                "type": "numero",
                "options": None,
                "autofill": lambda user: user.get("Nro_materias_reprobadas", "")
            },
        ]
    }
]

def get_user_row(user_id):
    user_row = df[df["Id"] == user_id]
    if not user_row.empty:
        return user_row.iloc[0].to_dict()
    return None

def get_questionnaire_for_user(user_id):
    user = get_user_row(user_id)
    if not user:
        return None
    dimensions = []
    for dim in QUESTIONNAIRE_STRUCTURE:
        dim_block = {"dimension": dim["dimension"], "questions": []}
        for q in dim["questions"]:
            prefilled = q["autofill"](user) if callable(q["autofill"]) else ""
            dim_block["questions"].append({
                "text": q["text"],
                "variable": q["variable"],
                "type": q["type"],
                "options": q["options"],
                "value": prefilled
            })
        dimensions.append(dim_block)
    return dimensions

def save_questionnaire_response(user_id, responses):
    # Guarda las respuestas en un archivo JSON por usuario
    filepath = os.path.join(RESPONSES_DIR, f"{user_id}.json")
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(responses, f, ensure_ascii=False, indent=4)
        print(f"Respuestas guardadas en {filepath}")
        return True
    except Exception as e:
        print(f"Error guardando respuestas: {e}")
        return False