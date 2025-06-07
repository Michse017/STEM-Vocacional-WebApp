import requests
import json

BASE_URL = "http://localhost:5000"

def test_endpoint(method, endpoint, data=None, description=""):
    url = f"{BASE_URL}{endpoint}"
    try:
        print(f"\n🧪 {description}")
        print(f"{method} {endpoint}")
        
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        
        print(f"Status: {response.status_code}")
        
        if response.status_code < 400:
            result = response.json()
            if 'data' in result and isinstance(result['data'], list):
                print(f"✅ Success: {len(result['data'])} registros encontrados")
            else:
                print(f"✅ Success: {result}")
        else:
            print(f"❌ Error: {response.json()}")
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
    print("-" * 60)

# Ejecutar todas las pruebas
print("🚀 Probando todos los endpoints actualizados...\n")

# Endpoints básicos
test_endpoint("GET", "/", description="Endpoint principal")
test_endpoint("GET", "/health", description="Health check")

# Usuarios
test_endpoint("GET", "/api/usuarios", description="Obtener todos los usuarios")
test_endpoint("POST", "/api/usuarios", {
    "codigo_estudiante": "TEST_FLASK_001"
}, description="Crear nuevo usuario")

# Cognitiva con todos los campos
test_endpoint("GET", "/api/cognitiva", description="Obtener respuestas cognitivas")
test_endpoint("POST", "/api/cognitiva", {
    "id_usuario": 1,
    "ptj_fisica": 85.5,
    "ptj_quimica": 78.0,
    "ptj_biologia": 92.3,
    "ptj_matematicas": 88.7,
    "ptj_geografia": 75.2,
    "ptj_historia": 82.1,
    "ptj_filosofia": 79.5,
    "ptj_sociales_ciudadano": 83.2,
    "ptj_ciencias_sociales": 86.4,
    "ptj_lenguaje": 89.3,
    "ptj_lectura_critica": 87.6,
    "ptj_ingles": 72.8,
    "ecaes": 91.2,
    "pga_acumulado": 4.2,
    "promedio_periodo": 4.0
}, description="Crear respuesta cognitiva completa")

# Educativa
test_endpoint("GET", "/api/educativa", description="Obtener respuestas educativas")
test_endpoint("POST", "/api/educativa", {
    "id_usuario": 1,
    "puntaje_educacion": 4.5,
    "nivel_educativo": "Universitario",
    "institucion": "Universidad Nacional"
}, description="Crear respuesta educativa")

# Educativa Familiar
test_endpoint("GET", "/api/educativa-familiar", description="Obtener respuestas educativas familiares")
test_endpoint("POST", "/api/educativa-familiar", {
    "id_usuario": 1,
    "colegio": "Colegio San Patricio",
    "ciudad_colegio": "Bogotá",
    "depto_colegio": "Cundinamarca",
    "municipio_colegio": "Bogotá D.C.",
    "fecha_graduacion": "2020-12-15"
}, description="Crear respuesta educativa familiar")

# Socioeconómica
test_endpoint("GET", "/api/socioeconomica", description="Obtener respuestas socioeconómicas")
test_endpoint("POST", "/api/socioeconomica", {
    "id_usuario": 1,
    "estrato": "3",
    "becas": "Ninguna",
    "ceres": "No",
    "periodo_ingreso": "2023-1",
    "tipo_estudiante": "Pregrado"
}, description="Crear respuesta socioeconómica")

# Autoeficacia
test_endpoint("GET", "/api/autoeficacia", description="Obtener respuestas de autoeficacia")
test_endpoint("POST", "/api/autoeficacia", {
    "id_usuario": 1,
    "creditos_matriculados": 18,
    "creditos_ganadas": 15,
    "creditos_reprobadas": 3,
    "puntos_calidad_pga": 65.5,
    "situacion": "Activo",
    "estado": "Regular",
    "nro_materias_aprobadas": 5,
    "nro_materias_reprobadas": 1
}, description="Crear respuesta de autoeficacia")

print("🎉 Pruebas completadas!")