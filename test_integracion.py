import requests
import json

print("🔗 PROBANDO NUEVOS ENDPOINTS DE INTEGRACIÓN")
print("=" * 60)

BACKEND_URL = "https://stem-backend-9sc0.onrender.com"

print("1️⃣ Probando listar cuestionarios para usuarios...")
try:
    response = requests.get(f"{BACKEND_URL}/api/cuestionarios")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("✅ ¡NUEVO ENDPOINT FUNCIONANDO!")
        print(f"📊 Cuestionarios disponibles: {data.get('count', 0)}")
        if data.get('data'):
            for cuest in data['data']:
                print(f"   • {cuest.get('nombre')} - {cuest.get('num_preguntas')} preguntas")
    else:
        print(f"❌ Error: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n2️⃣ Probando obtener cuestionario específico...")
try:
    # Probar con el ID 4 (Prueba de guardado)
    response = requests.get(f"{BACKEND_URL}/api/cuestionarios/4")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("✅ ¡CUESTIONARIO ESPECÍFICO FUNCIONANDO!")
        cuest_data = data.get('data', {})
        print(f"📝 Nombre: {cuest_data.get('nombre')}")
        print(f"📄 Descripción: {cuest_data.get('descripcion')}")
        print(f"🔢 Preguntas: {len(cuest_data.get('preguntas', []))}")
    else:
        print(f"❌ Error: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n🎯 RESULTADO:")
print("Si ambos endpoints funcionan, el usuario test-001")
print("podrá ver y responder tus cuestionarios dinámicos.")