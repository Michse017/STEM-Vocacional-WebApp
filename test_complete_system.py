#!/usr/bin/env python3
"""
Script de prueba completo del sistema STEM Vocacional
Valida la funcionalidad end-to-end del sistema dinámico de cuestionarios
"""

import requests
import json
import time

# URLs de producción
BACKEND_URL = "https://stem-backend-9sc0.onrender.com"
FRONTEND_URL = "https://stem-vocacional-webapp.vercel.app"

def test_backend_health():
    """Prueba el health check del backend"""
    print("🏥 Probando salud del backend...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Backend saludable - Versión: {data.get('version', 'N/A')}")
            print(f"   🗄️  Base de datos: {'✅' if data.get('database_available') else '❌'}")
            print(f"   🌍 Entorno: {data.get('environment', 'N/A')}")
            return True
        else:
            print(f"   ❌ Health check falló: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error conectando al backend: {str(e)}")
        return False

def test_admin_api():
    """Prueba la API de administración"""
    print("\n📋 Probando API de administración...")
    
    # 1. Obtener cuestionarios existentes
    try:
        response = requests.get(f"{BACKEND_URL}/api/admin/cuestionarios", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Obtener cuestionarios: {len(data.get('cuestionarios', []))} encontrados")
            print(f"   🔧 Modo de datos: {data.get('mode', 'unknown')}")
        else:
            print(f"   ❌ Error obteniendo cuestionarios: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error en API: {str(e)}")
        return False
    
    # 2. Probar creación de cuestionario
    nuevo_cuestionario = {
        "nombre": "Test Cuestionario Producción",
        "descripcion": "Cuestionario de prueba creado desde script de validación",
        "tipo": "vocacional"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/admin/cuestionarios",
            json=nuevo_cuestionario,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"   ✅ Cuestionario creado exitosamente: ID {data.get('id')}")
            return data.get('id')
        elif response.status_code == 400:
            print(f"   ⚠️  Error de validación: {response.text}")
            return None
        else:
            print(f"   ❌ Error creando cuestionario: {response.status_code}")
            print(f"   📄 Respuesta: {response.text}")
            return None
    except Exception as e:
        print(f"   ❌ Error en creación: {str(e)}")
        return None

def test_frontend_access():
    """Prueba el acceso al frontend"""
    print("\n🌐 Probando acceso al frontend...")
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        if response.status_code == 200:
            print(f"   ✅ Frontend accesible")
            if "STEM Vocacional" in response.text or "react" in response.text.lower():
                print(f"   ✅ Contenido React detectado")
                return True
            else:
                print(f"   ⚠️  Frontend accesible pero contenido inesperado")
                return False
        else:
            print(f"   ❌ Frontend no accesible: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error accediendo al frontend: {str(e)}")
        return False

def test_cors_preflight():
    """Prueba las configuraciones CORS"""
    print("\n🔒 Probando configuración CORS...")
    try:
        # Simular una preflight request desde el frontend
        headers = {
            'Origin': 'https://stem-vocacional-webapp.vercel.app',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        response = requests.options(
            f"{BACKEND_URL}/api/admin/cuestionarios",
            headers=headers,
            timeout=10
        )
        
        if response.status_code in [200, 204]:
            cors_headers = response.headers
            print("   ✅ CORS preflight exitoso")
            if 'Access-Control-Allow-Origin' in cors_headers:
                print(f"   🌍 Origen permitido: {cors_headers['Access-Control-Allow-Origin']}")
            if 'Access-Control-Allow-Methods' in cors_headers:
                print(f"   📡 Métodos permitidos: {cors_headers['Access-Control-Allow-Methods']}")
            return True
        else:
            print(f"   ❌ CORS preflight falló: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error en prueba CORS: {str(e)}")
        return False

def generate_report(results):
    """Genera un reporte del estado del sistema"""
    print("\n" + "="*60)
    print("📊 REPORTE FINAL DEL SISTEMA")
    print("="*60)
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    print(f"🧪 Pruebas ejecutadas: {total_tests}")
    print(f"✅ Pruebas exitosas: {passed_tests}")
    print(f"❌ Pruebas fallidas: {total_tests - passed_tests}")
    print(f"📈 Tasa de éxito: {(passed_tests/total_tests)*100:.1f}%")
    
    print("\n📋 Detalle por componente:")
    status_map = {True: "✅ FUNCIONANDO", False: "❌ FALLANDO"}
    
    for test_name, result in results.items():
        print(f"   {test_name}: {status_map[result]}")
    
    if passed_tests == total_tests:
        print("\n🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!")
        print("🌐 URLs del sistema:")
        print(f"   • Backend API: {BACKEND_URL}")
        print(f"   • Frontend: {FRONTEND_URL}")
        print("   • Admin: Accesible desde el frontend")
    else:
        print("\n⚠️  Hay componentes que requieren atención")
    
    print("\n💡 Próximos pasos recomendados:")
    print("   1. Acceder al frontend en el navegador")
    print("   2. Probar la interfaz de administración")
    print("   3. Crear y gestionar cuestionarios")
    print("   4. Validar la persistencia de datos")

def main():
    """Función principal de pruebas"""
    print("🚀 INICIANDO VALIDACIÓN COMPLETA DEL SISTEMA STEM VOCACIONAL")
    print("="*60)
    
    results = {}
    
    # Ejecutar todas las pruebas
    results['Backend Health'] = test_backend_health()
    results['API Administración'] = test_admin_api() is not None
    results['Acceso Frontend'] = test_frontend_access()
    results['Configuración CORS'] = test_cors_preflight()
    
    # Generar reporte final
    generate_report(results)

if __name__ == "__main__":
    main()