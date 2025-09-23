import requests

# Probar frontend
print("Testing frontend...")
try:
    response = requests.get("https://stem-vocacional-webapp.vercel.app", timeout=10)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Frontend disponible")
        # Buscar indicios de React
        content = response.text.lower()
        if 'react' in content or 'stem' in content or 'cuestionario' in content:
            print("✅ Contenido React/STEM detectado")
        else:
            print("⚠️  Contenido inesperado")
    else:
        print(f"❌ Frontend error: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")

# Verificar URL específica del admin
print("\nTesting admin path...")
try:
    response = requests.get("https://stem-vocacional-webapp.vercel.app", timeout=10)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Admin path disponible")
except Exception as e:
    print(f"Error: {e}")