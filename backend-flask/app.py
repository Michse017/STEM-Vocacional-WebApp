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
import os
from datetime import datetime

def create_app():
    app = Flask(__name__)
    
    # AGREGAR: Detectar si estamos en Render
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
    
    # Registrar blueprints (rutas)
    app.register_blueprint(usuario_bp)
    app.register_blueprint(cognitiva_bp)
    app.register_blueprint(educativa_bp)
    app.register_blueprint(educativa_familiar_bp)
    app.register_blueprint(socioeconomica_bp)
    app.register_blueprint(autoeficacia_bp)
    
    # Ruta principal
    @app.route('/')
    def home():
        return jsonify({'message': 'API STEM Vocacional funcionando con Flask'})
    
    # Ruta de health check
    @app.route('/health')
    def health():
        try:
            # Importar text para SQLAlchemy moderna
            from sqlalchemy import text
            # Cambiar de 'SELECT 1' a text('SELECT 1')
            db.session.execute(text('SELECT 1'))
            return jsonify({
                'status': 'healthy',
                'database': 'connected',
                'timestamp': datetime.now().isoformat()
            }), 200
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'database': 'disconnected',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500
    
    # Manejo de errores globales
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Endpoint no encontrado',
            'error': 'Not Found'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor',
            'error': 'Internal Server Error'
        }), 500
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            'success': False,
            'message': 'Método no permitido',
            'error': 'Method Not Allowed'
        }), 405
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    # Solo mostrar info en local
    if not os.getenv('RENDER'):
        print("Variables de entorno:")
        print(f"DB_SERVER: {os.getenv('DB_SERVER', 'localhost')}")
        print(f"DB_NAME: {os.getenv('DB_NAME', 'sistema_estudiantes')}")
        print(f"DB_USER: {os.getenv('DB_USER', 'stemuser')}")
        print(f"PORT: {os.getenv('PORT', '5000')}")
        
        with app.app_context():
            try:
                print('Intentando conectar a la base de datos...')
                from sqlalchemy import text
                db.session.execute(text('SELECT 1'))
                db.create_all()
                print('✅ Conectado a SQL Server con Flask')
                print('✅ Tablas creadas exitosamente')
            except Exception as e:
                print(f'❌ Error conectando a SQL Server: {e}')
    
    port = int(os.environ.get('PORT', 5000))
    debug = not os.getenv('RENDER')  # Debug solo en local
    app.run(debug=debug, host='0.0.0.0', port=port)