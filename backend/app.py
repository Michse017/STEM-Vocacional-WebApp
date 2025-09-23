import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Agregar el directorio padre al path para poder importar database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.controller import engine
from database.models import Base

# --- Importación de Rutas (Blueprints) ---
# Importamos los blueprints que definen los endpoints de nuestra API.
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.routes.usuario_routes import usuario_bp
from backend.routes.questionnaire_routes import questionnaire_bp

# Intentar importar rutas de administración
try:
    from backend.routes.admin_cuestionarios_routes_v2 import admin_cuestionarios_bp
    ADMIN_ROUTES_AVAILABLE = True
except ImportError:
    print("⚠️  Rutas de administración no disponibles")
    ADMIN_ROUTES_AVAILABLE = False

def create_app():
    """Crea y configura la aplicación Flask."""
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_super_secret_key_change_for_prod')

    if os.environ.get('FLASK_ENV') == 'production':
        allowed_origins = [
            os.environ.get('FRONTEND_URL', 'https://stem-vocacional-webapp.vercel.app'),
            'https://stem-vocacional-web-app.vercel.app',
            'https://estem-iota.vercel.app',
            "http://localhost:3000",
        ]
        # Configurar CORS para todas las rutas (/api/* y /admin/*)
        CORS(app, resources={
            r"/api/*": {"origins": allowed_origins}, 
            r"/admin/*": {"origins": allowed_origins}
        }, supports_credentials=True)
    else:
        CORS(app, resources={
            r"/api/*": {"origins": "http://localhost:3000"},
            r"/admin/*": {"origins": "http://localhost:3000"}
        }, supports_credentials=True)

    # Registrar blueprints
    app.register_blueprint(usuario_bp, url_prefix='/api')
    app.register_blueprint(questionnaire_bp, url_prefix='/api')

    # Registrar rutas de administración solo si están disponibles
    if ADMIN_ROUTES_AVAILABLE:
        app.register_blueprint(admin_cuestionarios_bp, url_prefix='/api/admin')
        print("✅ Rutas de administración registradas")
    else:
        print("⚠️  Rutas de administración no registradas")

    @app.route('/')
    def home():
        return jsonify({
            "message": "STEM-Vocacional Backend API",
            "status": "running",
            "environment": os.environ.get('FLASK_ENV', 'development'),
            "endpoints": ["/api/health", "/api/usuarios", "/api/questionnaire"],
        })

    @app.route('/api/health')
    def health_check():
        return jsonify({
            "status": "ok",
            "message": "API del servicio STEM-Vocacional está funcionando.",
            "environment": os.environ.get('FLASK_ENV', 'development'),
        }), 200

    with app.app_context():
        try:
            print("Verificando y/o creando tablas de la base de datos...")
            Base.metadata.create_all(bind=engine)
            print("Tablas de la base de datos verificadas/creadas.")
        except Exception as db_error:
            print(f" Error al conectar con la base de datos: {db_error}")
            print("  La aplicación continuará, pero las funciones de base de datos no estarán disponibles.")
            print(" Verifica la conexión a internet y la configuración de Azure SQL Server.")

    return app

# --- Punto de Entrada para Ejecución ---
if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=False)