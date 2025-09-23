import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Agregar el directorio actual al path para poder importar database
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

try:
    from database.controller import engine
    from database.models import Base
    print("✅ Modelos de base de datos importados correctamente")
except ImportError as e:
    print(f"⚠️  Error importando modelos de base de datos: {e}")

# --- Importación de Rutas (Blueprints) ---
try:
    from backend.routes.usuario_routes import usuario_bp
    from backend.routes.questionnaire_routes import questionnaire_bp
    print("✅ Rutas originales importadas correctamente")
except ImportError as e:
    print(f"⚠️  Error importando rutas originales: {e}")

try:
    from backend.routes.admin_cuestionarios_routes import admin_cuestionarios_bp
    print("✅ Rutas de administración importadas correctamente")
except ImportError as e:
    print(f"⚠️  Error importando rutas de administración: {e}")
    # Crear un blueprint vacío para evitar errores
    from flask import Blueprint
    admin_cuestionarios_bp = Blueprint('admin_cuestionarios', __name__)

def create_app():
    """
    Función factoría para crear y configurar la aplicación Flask.
    Este patrón es útil para las pruebas y la escalabilidad.
    """
    # 1. Creación de la instancia de la aplicación
    app = Flask(__name__)

    # 2. Configuración de CORS
    CORS(app, origins=[
        'http://localhost:3000',
        'https://stem-vocacional-web-app.vercel.app',
        'https://stem-vocacional-web-app-git-main-brndlds-projects.vercel.app',
        'https://stem-vocacional-web-app-brndlds-projects.vercel.app'
    ], supports_credentials=True)

    # 3. Configuración de la base de datos
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas de base de datos verificadas/creadas")
    except Exception as e:
        print(f"⚠️  Error con la base de datos: {e}")

    # 4. Registro de blueprints (rutas)
    try:
        app.register_blueprint(usuario_bp, url_prefix='/api')
        print("✅ Rutas de usuario registradas")
    except:
        print("⚠️  No se pudieron registrar rutas de usuario")

    try:
        app.register_blueprint(questionnaire_bp, url_prefix='/api')
        print("✅ Rutas de cuestionarios registradas")
    except:
        print("⚠️  No se pudieron registrar rutas de cuestionarios")

    try:
        app.register_blueprint(admin_cuestionarios_bp, url_prefix='/api/admin')
        print("✅ Rutas de administración registradas")
    except:
        print("⚠️  No se pudieron registrar rutas de administración")

    # 5. Endpoint de salud
    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({
            'status': 'healthy',
            'message': 'STEM Vocacional API is running',
            'version': '2.0.0',
            'features': {
                'dynamic_questionnaires': True,
                'admin_interface': True
            }
        })

    # 6. Endpoint raíz
    @app.route('/')
    def index():
        return jsonify({
            'message': 'STEM Vocacional API',
            'endpoints': {
                'health': '/health',
                'users': '/api/usuarios',
                'questionnaires': '/api/cuestionarios',
                'admin': '/api/admin/cuestionarios'
            }
        })

    return app

# Crear la aplicación
app = create_app()

if __name__ == '__main__':
    print("🚀 Iniciando STEM Vocacional API v2.0")
    print("📋 Características habilitadas:")
    print("   - Cuestionarios dinámicos")
    print("   - Interfaz de administración")
    print("   - CORS configurado para producción")
    print("🔗 Servidor corriendo en http://localhost:5000")
    
    # Ejecutar en modo desarrollo
    app.run(debug=True, host='0.0.0.0', port=5000)