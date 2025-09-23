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
from routes.usuario_routes import usuario_bp
from routes.questionnaire_routes import questionnaire_bp
from routes.admin_cuestionarios_routes import admin_cuestionarios_bp

def create_app():
    """
    Función factoría para crear y configurar la aplicación Flask.
    Este patrón es útil para las pruebas y la escalabilidad.
    """
    # 1. Creación de la instancia de la aplicación
    app = Flask(__name__)

    # 2. Configuración de la Aplicación
    
    # Configura una clave secreta. Es crucial para la seguridad de las sesiones.
    # En producción, esto debería cargarse desde una variable de entorno.
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_super_secret_key_change_for_prod')

    # Configuración de CORS (Cross-Origin Resource Sharing)
    # Configuración dinámica para desarrollo y producción
    if os.environ.get('FLASK_ENV') == 'production':
        # En producción, permitir múltiples dominios de Vercel
        allowed_origins = [
            os.environ.get('FRONTEND_URL', 'https://stem-vocacional-webapp.vercel.app'),
            'https://stem-vocacional-web-app.vercel.app',  # Nuevo dominio
            'https://estem-iota.vercel.app',  # Dominio anterior
            "http://localhost:3000"
        ]
        CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)
    else:
        # En desarrollo, permitir localhost
        CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

    # 3. Registro de Blueprints
    # Aquí le decimos a Flask que use los archivos de rutas que creamos.
    # El `url_prefix` organiza toda tu API bajo '/api'.
    app.register_blueprint(usuario_bp, url_prefix='/api')
    app.register_blueprint(questionnaire_bp, url_prefix='/api')
    app.register_blueprint(admin_cuestionarios_bp, url_prefix='/api/admin')

    # 4. Ruta raíz para verificar que el servidor está activo
    @app.route('/')
    def home():
        return jsonify({
            "message": "STEM-Vocacional Backend API",
            "status": "running",
            "environment": os.environ.get('FLASK_ENV', 'development'),
            "endpoints": ["/api/health", "/api/usuarios", "/api/questionnaire"]
        })

    # 5. Ruta de Verificación de Salud (Health Check)
    # Es una buena práctica tener un endpoint simple para saber si la API está viva.
    @app.route('/api/health')
    def health_check():
        return jsonify({
            "status": "ok",
            "message": "API del servicio STEM-Vocacional está funcionando.",
            "environment": os.environ.get('FLASK_ENV', 'development')
        }), 200

    # 5. Creación de las tablas de la base de datos
    # Esta línea asegura que al iniciar la aplicación, las tablas definidas
    # en los modelos de SQLAlchemy se creen en la base de datos si no existen.
    # Es seguro ejecutarlo múltiples veces.
    with app.app_context():
        try:
            print("Verificando y/o creando tablas de la base de datos...")
            Base.metadata.create_all(bind=engine)
            print("Tablas de la base de datos verificadas/creadas.")
        except Exception as db_error:
            print(f"❌ Error al conectar con la base de datos: {db_error}")
            print("⚠️  La aplicación continuará, pero las funciones de base de datos no estarán disponibles.")
            print("💡 Verifica la conexión a internet y la configuración de Azure SQL Server.")

    return app

    return app

# --- Punto de Entrada para Ejecución ---
if __name__ == '__main__':
    # Creamos la aplicación usando la función factoría
    app = create_app()
    
    # Ejecutamos el servidor de desarrollo de Flask
    # debug=False para evitar reinicios automáticos que pueden causar problemas de conexión
    # host='0.0.0.0' hace que el servidor sea accesible desde tu red local.
    # port=5000 es el puerto estándar para desarrollo de Flask.
    app.run(host='0.0.0.0', port=5000, debug=False)