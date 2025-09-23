"""
Punto de entrada principal para la aplicación Flask.
Este archivo garantiza que Render ejecute correctamente la aplicación.
"""
import sys
import os

# Agregar directorio al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=== INICIANDO APLICACIÓN FLASK ===")
print(f"Directorio de trabajo: {os.getcwd()}")
print(f"Archivo ejecutado: {__file__}")
print(f"Python path: {sys.path[:3]}...")  # Mostrar solo los primeros 3

try:
    from backend.app import create_app
    print("✅ backend.app importado exitosamente")
    
    # Crear la aplicación
    app = create_app()
    print("✅ Aplicación Flask creada exitosamente")
    print(f"Blueprints registrados: {list(app.blueprints.keys())}")
    
    # Log de rutas importantes
    with app.app_context():
        admin_routes = [rule.rule for rule in app.url_map.iter_rules() if '/admin/' in rule.rule]
        print(f"✅ Rutas de admin registradas: {len(admin_routes)}")
        for route in admin_routes[:5]:  # Mostrar solo las primeras 5
            print(f"  - {route}")
    
except Exception as e:
    print(f"❌ ERROR CRÍTICO al crear la aplicación: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("✅ Aplicación lista para ser servida por Gunicorn/WSGI")

# Para Gunicorn: app será la instancia de Flask
# Para desarrollo: ejecutar directamente
if __name__ == '__main__':
    print("🚀 Ejecutando en modo desarrollo")
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)