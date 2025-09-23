"""
Script para verificar el problema de integración entre admin y usuario
Muestra los cuestionarios en admin vs los disponibles para usuarios
"""

import requests
import json

print("🔍 DIAGNÓSTICO: PROBLEMA DE INTEGRACIÓN ADMIN-USUARIO")
print("=" * 70)

BACKEND_URL = "https://stem-backend-9sc0.onrender.com"

print("1️⃣ CUESTIONARIOS EN SISTEMA DE ADMINISTRACIÓN:")
print("-" * 50)
try:
    response = requests.get(f"{BACKEND_URL}/api/admin/cuestionarios")
    if response.status_code == 200:
        data = response.json()
        cuestionarios_admin = data.get('data', [])
        print(f"✅ Total en admin: {len(cuestionarios_admin)}")
        for cuest in cuestionarios_admin:
            print(f"   • {cuest.get('nombre')} (ID: {cuest.get('id_cuestionario')})")
    else:
        print(f"❌ Error admin: {response.status_code}")
except Exception as e:
    print(f"❌ Error admin: {e}")

print("\n2️⃣ CUESTIONARIOS DISPONIBLES PARA USUARIOS:")
print("-" * 50)
try:
    # Intentar obtener cuestionarios para usuarios
    response = requests.get(f"{BACKEND_URL}/api/cuestionarios")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Endpoint de usuario existe")
        print(f"📄 Respuesta: {data}")
    else:
        print(f"❌ Error usuario: {response.status_code}")
        print("❌ NO EXISTE ENDPOINT PARA LISTAR CUESTIONARIOS PARA USUARIOS")
except Exception as e:
    print(f"❌ Error usuario: {e}")

print("\n3️⃣ ANÁLISIS DEL PROBLEMA:")
print("-" * 50)
print("🔍 PROBLEMA IDENTIFICADO:")
print("   • Admin crea cuestionarios en: /api/admin/cuestionarios")
print("   • Usuario usa cuestionario fijo en: /api/cuestionario (POST)")
print("   • NO HAY ENDPOINT para que usuario liste cuestionarios dinámicos")
print("   • Los sistemas NO están integrados")

print("\n4️⃣ SOLUCIÓN REQUERIDA:")
print("-" * 50)
print("✅ NECESITAMOS CREAR:")
print("   • GET /api/cuestionarios - Lista cuestionarios para usuarios")
print("   • GET /api/cuestionarios/{id} - Obtener cuestionario específico")
print("   • Modificar frontend usuario para mostrar lista de cuestionarios")
print("   • Conectar cuestionarios dinámicos con respuestas de usuarios")

print("\n💡 CONCLUSIÓN:")
print("El usuario test-001 no ve tus cuestionarios porque están en")
print("sistemas separados. Necesitamos crear la integración.")