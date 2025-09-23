import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Agregar el directorio padre al path para poder importar database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.controller import engine, is_database_available, create_all_tables
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
    from backend.routes.admin_cuestionarios_routes import admin_cuestionarios_bp
    ADMIN_ROUTES_AVAILABLE = True
    print("✅ admin_cuestionarios_routes importado exitosamente")
except ImportError as import_error:
    print(f"⚠️  ERROR importando rutas de administración: {import_error}")
    ADMIN_ROUTES_AVAILABLE = False
except Exception as e:
    print(f"❌ ERROR crítico importando rutas de administración: {e}")
    import traceback
    print(f"Traceback: {traceback.format_exc()}")
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
            r"/api/*": {
                "origins": allowed_origins,
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
            }, 
            r"/admin/*": {
                "origins": allowed_origins,
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
            }
        }, supports_credentials=True)
    else:
        CORS(app, resources={
            r"/api/*": {
                "origins": "http://localhost:3000",
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
            },
            r"/admin/*": {
                "origins": "http://localhost:3000",
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
                "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
            }
        }, supports_credentials=True)

    # Registrar blueprints
    app.register_blueprint(usuario_bp, url_prefix='/api')
    app.register_blueprint(questionnaire_bp, url_prefix='/api')

    # Registrar rutas de administración solo si están disponibles
    if ADMIN_ROUTES_AVAILABLE:
        try:
            app.register_blueprint(admin_cuestionarios_bp, url_prefix='/api/admin')
            print("✅ Blueprint admin_cuestionarios registrado exitosamente en /api/admin")
            
            # Verificar rutas registradas
            admin_routes = [rule.rule for rule in app.url_map.iter_rules() if '/admin/' in rule.rule]
            print(f"✅ Se registraron {len(admin_routes)} rutas de admin:")
            for route in admin_routes[:3]:  # Mostrar las primeras 3
                print(f"  - {route}")
        except Exception as e:
            print(f"❌ ERROR registrando blueprint de admin: {e}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
    else:
        print("⚠️  Rutas de administración no registradas - ADMIN_ROUTES_AVAILABLE = False")

    @app.route('/')
    def home():
        db_status = "available" if is_database_available() else "unavailable"
        return jsonify({
            "message": "STEM-Vocacional Backend API",
            "status": "running",
            "environment": os.environ.get('FLASK_ENV', 'development'),
            "database_status": db_status,
            "endpoints": {
                "health": "/api/health",
                "database_status": "/api/database/status", 
                "usuarios": "/api/usuarios",
                "questionnaire": "/api/questionnaire",
                "admin": "/api/admin/cuestionarios" if ADMIN_ROUTES_AVAILABLE else "unavailable"
            },
            "troubleshooting": {
                "database_unavailable": "Si la base de datos no está disponible, verifica las variables de entorno y el estado de Azure SQL Database",
                "documentation": "Ver DEPLOY_TROUBLESHOOTING.md para más información"
            }
        })

    @app.route('/api/health')
    def health_check():
        db_status = "available" if is_database_available() else "unavailable"
        status_code = 200 if is_database_available() else 503
        
        return jsonify({
            "status": "ok",
            "message": "API del servicio STEM-Vocacional está funcionando.",
            "environment": os.environ.get('FLASK_ENV', 'development'),
            "database_status": db_status,
            "database_message": "Conexión a Azure SQL disponible" if is_database_available() else "Base de datos no disponible - verifica configuración",
        }), status_code
        
    @app.route('/api/database/status')
    def database_status():
        """Endpoint específico para verificar el estado de la base de datos."""
        if is_database_available():
            return jsonify({
                "status": "available",
                "message": "Conexión a Azure SQL disponible",
                "server": os.getenv("DB_SERVER", "No configurado"),
                "database": os.getenv("DB_DATABASE", "No configurado"),
                "user": os.getenv("DB_USER", "No configurado"),
            }), 200
        else:
            return jsonify({
                "status": "unavailable",
                "message": "Base de datos no disponible",
                "troubleshooting": {
                    "check_env_vars": [
                        "DB_SERVER",
                        "DB_DATABASE", 
                        "DB_USER",
                        "DB_PASSWORD"
                    ],
                    "common_issues": [
                        "Azure SQL Database pausada",
                        "Problemas de conectividad de red",
                        "Variables de entorno no configuradas",
                        "Credenciales incorrectas"
                    ],
                    "azure_sql_message": "La base de datos Azure SQL puede estar pausada o no disponible temporalmente"
                }
            }), 503

    with app.app_context():
        if is_database_available():
            try:
                print("Verificando y/o creando tablas de la base de datos...")
                success = create_all_tables()
                if success:
                    print("✅ Tablas de la base de datos verificadas/creadas.")
                else:
                    print("⚠️ Problemas creando tablas, pero la aplicación continuará.")
            except Exception as db_error:
                print(f"❌ Error al conectar con la base de datos: {db_error}")
                print("⚠️ La aplicación continuará, pero las funciones de base de datos no estarán disponibles.")
                print("🔧 Verifica la conexión a internet y la configuración de Azure SQL Server.")
        else:
            print("⚠️ Base de datos no disponible - La aplicación funcionará en modo sin conexión.")
            print("🔧 Verifica la configuración de Azure SQL Server y las variables de entorno.")

    return app

# --- Punto de Entrada para Ejecución ---
if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=False)