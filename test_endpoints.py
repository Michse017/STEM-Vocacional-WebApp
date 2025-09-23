"""
Script para probar los endpoints de administración de cuestionarios
"""
import requests
import json

BASE_URL = 'http://localhost:5000'

def test_get_cuestionarios():
    """Probar GET /api/admin/cuestionarios"""
    print("🔍 Probando GET /api/admin/cuestionarios")
    try:
        response = requests.get(f'{BASE_URL}/api/admin/cuestionarios')
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_create_cuestionario():
    """Probar POST /api/admin/cuestionarios"""
    print("\n📝 Probando POST /api/admin/cuestionarios")
    data = {
        "nombre": "Test Cuestionario",
        "descripcion": "Cuestionario de prueba",
        "tipo": "test"
    }
    try:
        response = requests.post(f'{BASE_URL}/api/admin/cuestionarios', json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_health():
    """Probar GET /health"""
    print("\n💚 Probando GET /health")
    try:
        response = requests.get(f'{BASE_URL}/health')
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    print("🚀 Probando endpoints de administración de cuestionarios")
    print("=" * 60)
    
    # Probar health endpoint
    test_health()
    
    # Probar obtener cuestionarios
    test_get_cuestionarios()
    
    # Probar crear cuestionario
    test_create_cuestionario()
    
    # Probar obtener cuestionarios nuevamente
    print("\n🔄 Verificando lista actualizada")
    test_get_cuestionarios()