"""
Script de diagnóstico para verificar el estado de la aplicación Flask en producción.
"""
import sys
import os

print("=== DIAGNÓSTICO FLASK APP ===")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print(f"Python path: {sys.path}")

# Verificar importación del módulo principal
try:
    from backend.app import create_app
    print("✅ backend.app importado correctamente")
    
    app = create_app()
    print(f"✅ App creada correctamente")
    print(f"Blueprints registrados: {list(app.blueprints.keys())}")
    
    # Listar todas las rutas registradas
    print("\n=== RUTAS REGISTRADAS ===")
    with app.app_context():
        for rule in app.url_map.iter_rules():
            print(f"  {rule.methods} {rule.rule} -> {rule.endpoint}")
    
except Exception as e:
    print(f"❌ Error al importar o crear app: {str(e)}")
    import traceback
    print(f"Traceback: {traceback.format_exc()}")

# Verificar importación específica de admin routes
try:
    from backend.routes.admin_cuestionarios_routes import admin_cuestionarios_bp
    print("✅ admin_cuestionarios_routes importado correctamente")
    print(f"Blueprint name: {admin_cuestionarios_bp.name}")
    
except Exception as e:
    print(f"❌ Error al importar admin routes: {str(e)}")
    import traceback
    print(f"Traceback: {traceback.format_exc()}")