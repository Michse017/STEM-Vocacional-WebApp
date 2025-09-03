import os
from flask import Flask, jsonify
from flask_cors import CORS
from database.controller import engine
from database.models import Base

# --- Importación de Rutas (Blueprints) ---
# Importamos los blueprints que definen los endpoints de nuestra API.
from .routes.usuario_routes import usuario_bp
from .routes.questionnaire_routes import questionnaire_bp

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
    # Esto es VITAL para permitir que tu frontend (ej. en localhost:3000)
    # se comunique con tu backend (ej. en localhost:5000).
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

    # 3. Registro de Blueprints
    # Aquí le decimos a Flask que use los archivos de rutas que creamos.
    # El `url_prefix` organiza toda tu API bajo '/api'.
    app.register_blueprint(usuario_bp, url_prefix='/api')
    app.register_blueprint(questionnaire_bp, url_prefix='/api')

    # 4. Ruta de Verificación de Salud (Health Check)
    # Es una buena práctica tener un endpoint simple para saber si la API está viva.
    @app.route('/api/health')
    def health_check():
        return jsonify({
            "status": "ok",
            "message": "API del servicio STEM-Vocacional está funcionando."
        }), 200

    # 5. Creación de las tablas de la base de datos
    # Esta línea asegura que al iniciar la aplicación, las tablas definidas
    # en los modelos de SQLAlchemy se creen en la base de datos si no existen.
    # Es seguro ejecutarlo múltiples veces.
    with app.app_context():
        print("Verificando y/o creando tablas de la base de datos...")
        Base.metadata.create_all(bind=engine)
        print("Tablas de la base de datos verificadas/creadas.")

    return app

# --- Punto de Entrada para Ejecución ---
if __name__ == '__main__':
    # Creamos la aplicación usando la función factoría
    app = create_app()
    
    # Ejecutamos el servidor de desarrollo de Flask
    # debug=True activa la recarga automática al guardar cambios.
    # host='0.0.0.0' hace que el servidor sea accesible desde tu red local.
    # port=5000 es el puerto estándar para desarrollo de Flask.
    app.run(host='0.0.0.0', port=5000, debug=True)