from flask import Flask, jsonify
from flask_cors import CORS
from app.config.database import Config
from app.models.models import db
from app.routes.usuario_routes import usuario_bp
from app.routes.cognitiva_routes import cognitiva_bp
from app.routes.educativa_routes import educativa_bp
from app.routes.educativa_familiar_routes import educativa_familiar_bp
from app.routes.socioeconomica_routes import socioeconomica_bp
from app.routes.autoeficacia_routes import autoeficacia_bp
from sqlalchemy import text
import os
from datetime import datetime

def create_app():
    app = Flask(__name__)
    
    # Detectar si estamos en Render
    if os.getenv('RENDER'):
        # Configuración para Render
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        print("🚀 Configuración RENDER cargada")
    else:
        # Tu configuración local actual
        app.config.from_object(Config)
        print("🏠 Configuración LOCAL cargada")
    
    # Habilitar CORS
    CORS(app)
    
    # Inicializar base de datos
    db.init_app(app)
    
    # Crear tablas en Render
    if os.getenv('RENDER'):
        with app.app_context():
            try:
                db.create_all()
                print("✅ Tablas creadas en PostgreSQL")
            except Exception as e:
                print(f"⚠️ Error creando tablas: {e}")
    
    # Registrar blueprints (rutas)
    app.register_blueprint(usuario_bp)
    app.register_blueprint(cognitiva_bp)
    app.register_blueprint(educativa_bp)
    app.register_blueprint(educativa_familiar_bp)
    app.register_blueprint(socioeconomica_bp)
    app.register_blueprint(autoeficacia_bp)
    
    # Rutas básicas
    @app.route('/')
    def home():
        return jsonify({
            'message': 'API STEM Vocacional funcionando',
            'status': 'success',
            'environment': 'Render' if os.getenv('RENDER') else 'Local'
        })
    
    @app.route('/health')
    def health():
        try:
            db.session.execute(text('SELECT 1'))
            return jsonify({
                'status': 'healthy',
                'database': 'connected',
                'environment': 'Render' if os.getenv('RENDER') else 'Local',
                'timestamp': datetime.now().isoformat()
            }), 200
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'database': 'disconnected',
                'error': str(e),
                'environment': 'Render' if os.getenv('RENDER') else 'Local',
                'timestamp': datetime.now().isoformat()
            }), 500
    
    return app

# ESTA LÍNEA ES CRÍTICA PARA GUNICORN
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = not os.getenv('RENDER')
    app.run(debug=debug, host='0.0.0.0', port=port)