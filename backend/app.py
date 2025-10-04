import os
from flask import Flask, jsonify
from flask_cors import CORS
from database.controller import engine
from database.models import Base
from .routes.usuario_routes import usuario_bp
from .routes.questionnaire_routes import questionnaire_bp
from .routes.dynamic_questionnaire_routes import dynamic_questionnaire_bp

def create_app():
    """Crea y configura la aplicación Flask."""
    app = Flask(__name__)

    default_secret = 'dev_super_secret_key_change_for_prod'
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', default_secret)

    if os.environ.get('FLASK_ENV') == 'production':
        # Require a real secret key in production
        if app.config['SECRET_KEY'] == default_secret:
            raise RuntimeError("SECRET_KEY is required in production. Set the environment variable SECRET_KEY with a strong random value.")
        # Harden session cookies in production
        app.config.update(
            SESSION_COOKIE_SECURE=True,
            SESSION_COOKIE_HTTPONLY=True,
            SESSION_COOKIE_SAMESITE='Lax',
        )
        allowed_origins = [
            os.environ.get('FRONTEND_URL', 'https://stem-vocacional-webapp.vercel.app'),
            'https://stem-vocacional-web-app.vercel.app',
            'https://estem-iota.vercel.app',
            "http://localhost:3000",
        ]
        CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)
    else:
        CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

    app.register_blueprint(usuario_bp, url_prefix='/api')
    app.register_blueprint(questionnaire_bp, url_prefix='/api')
    # Dynamic questionnaires (initial scaffold) - behind feature flag
    app.config['ENABLE_DYNAMIC_QUESTIONNAIRES'] = os.environ.get('ENABLE_DYNAMIC_QUESTIONNAIRES', '0') == '1'
    if app.config['ENABLE_DYNAMIC_QUESTIONNAIRES']:
        app.register_blueprint(dynamic_questionnaire_bp, url_prefix='/api')

    @app.route('/')
    def home():
        return jsonify({
            "message": "STEM-Vocacional Backend API",
            "status": "running",
            "environment": os.environ.get('FLASK_ENV', 'development'),
            "endpoints": [
                "/api/health", 
                "/api/usuarios", 
                "/api/questionnaire",
                *( ["/api/dynamic/questionnaires"] if app.config.get('ENABLE_DYNAMIC_QUESTIONNAIRES') else [] )
            ],
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