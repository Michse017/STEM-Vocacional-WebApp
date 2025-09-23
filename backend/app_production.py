import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Agregar el directorio padre al path para poder importar database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from database.controller import engine
    from database.models import Base
    print("✅ Modelos de base de datos importados correctamente")
except ImportError as e:
    print(f"⚠️  Error importando modelos de base de datos: {e}")
    engine = None
    Base = None

# --- Importación de Rutas (Blueprints) ---
try:
    from routes.usuario_routes import usuario_bp
    from routes.questionnaire_routes import questionnaire_bp
    print("✅ Rutas originales importadas correctamente")
except ImportError as e:
    print(f"⚠️  Error importando rutas originales: {e}")
    from flask import Blueprint
    usuario_bp = Blueprint('usuario', __name__)
    questionnaire_bp = Blueprint('questionnaire', __name__)

try:
    from routes.admin_cuestionarios_routes_v2 import admin_cuestionarios_bp
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

    # 2. Configuración de la Aplicación
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_super_secret_key_change_for_prod')

    # 3. Configuración de CORS
    CORS(app, origins=[
        'http://localhost:3000',
        'https://stem-vocacional-web-app.vercel.app',
        'https://stem-vocacional-web-app-git-main-brndlds-projects.vercel.app',
        'https://stem-vocacional-web-app-brndlds-projects.vercel.app',
        'https://estem-iota.vercel.app'
    ], supports_credentials=True)

    # 4. Configuración de la base de datos
    if engine and Base:
        try:
            Base.metadata.create_all(bind=engine)
            print("✅ Tablas de base de datos verificadas/creadas")
        except Exception as e:
            print(f"⚠️  Error con la base de datos: {e}")

    # 5. Registro de blueprints (rutas)
    try:
        app.register_blueprint(usuario_bp, url_prefix='/api')
        print("✅ Rutas de usuario registradas")
    except Exception as e:
        print(f"⚠️  Error registrando rutas de usuario: {e}")

    try:
        app.register_blueprint(questionnaire_bp, url_prefix='/api')
        print("✅ Rutas de cuestionarios registradas")
    except Exception as e:
        print(f"⚠️  Error registrando rutas de cuestionarios: {e}")

    try:
        app.register_blueprint(admin_cuestionarios_bp, url_prefix='/api/admin')
        print("✅ Rutas de administración registradas")
    except Exception as e:
        print(f"⚠️  Error registrando rutas de administración: {e}")

    # 6. Endpoint de salud
    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({
            'status': 'healthy',
            'message': 'STEM Vocacional API is running',
            'version': '2.0.0',
            'features': {
                'dynamic_questionnaires': True,
                'admin_interface': True,
                'database_connected': engine is not None
            }
        })

    # 7. Endpoint raíz
    @app.route('/')
    def index():
        return jsonify({
            'message': 'STEM Vocacional API v2.0',
            'status': 'running',
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
    print("   - Sistema de cuestionarios dinámicos")
    print("   - Interfaz de administración")
    print("   - CORS configurado para producción")
    print("   - Modo fallback para desarrollo")
    print("🔗 Servidor corriendo en http://localhost:5000")
    
    # Ejecutar en modo desarrollo
    app.run(debug=True, host='0.0.0.0', port=5000)