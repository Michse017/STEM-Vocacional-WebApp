import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Agregar el directorio padre al path para poder importar database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.controller import engine
from database.models import Base

# --- Importación de Rutas (Blueprints) ---
from backend.routes.usuario_routes import usuario_bp
from backend.routes.questionnaire_routes import questionnaire_bp

# Intentar importar rutas de administración
try:
    from backend.routes.admin_cuestionarios_routes import admin_cuestionarios_bp
    ADMIN_ROUTES_AVAILABLE = True
    print("✅ Rutas de administración disponibles")
except ImportError as e:
    print(f"⚠️  Rutas de administración no disponibles: {str(e)}")
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
            "admin_routes": ADMIN_ROUTES_AVAILABLE,
            "endpoints": ["/api/health", "/api/usuarios", "/api/cuestionarios"] + 
                        (["/api/admin/cuestionarios"] if ADMIN_ROUTES_AVAILABLE else []),
        })

    @app.route('/api/health')
    def health_check():
        try:
            from database.controller import engine
            # Verificar conexión a la base de datos
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            db_status = True
        except:
            db_status = False
            
        return jsonify({
            "status": "healthy",
            "service": "admin-cuestionarios",
            "version": "2.0.0",
            "database_available": db_status,
            "admin_routes_enabled": ADMIN_ROUTES_AVAILABLE,
            "environment": os.environ.get('FLASK_ENV', 'development'),
        }), 200

    # Inicializar base de datos
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

# Crear la aplicación para producción
app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)