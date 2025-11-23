import os
import uuid
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
# Cargar .env ANTES de importar módulos que crean el engine
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass
from database.controller import engine
from database.models import Base
from database.models import ensure_user_schema
from database.dynamic_models import ensure_dynamic_schema
from database.dynamic_models import Questionnaire, QuestionnaireVersion, Section, Question, Option
from sqlalchemy.orm import Session
from .routes.usuario_routes import usuario_bp
from .routes.dynamic_questionnaire_routes import dynamic_questionnaire_bp
from .routes.admin_dynamic_routes import admin_dynamic_bp
from .routes.auth_admin_routes import auth_admin_bp
from .extensions import limiter

def create_app():
    """Crea y configura la aplicación Flask."""
    app = Flask(__name__)

    # Attach rate limiter
    limiter.init_app(app)

    default_secret = 'dev_super_secret_key_change_for_prod'
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', default_secret)
    # Per-process JWT signing secret ensures tokens become invalid on app restart
    app.config['JWT_SIGNING_SECRET'] = os.urandom(32).hex()
    # Per-process instance id (used by frontend to invalidate client sessions on restart)
    app.config['INSTANCE_ID'] = uuid.uuid4().hex
    # Admin header fallback removed; JWT-only enforced for admin endpoints

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
            'https://stem-vocacional-web-3h18qe8wm-michse017s-projects.vercel.app',
            "http://localhost:3000",
        ]
        CORS(app, resources={r"/api/*": {"origins": allowed_origins, "allow_headers": ["Content-Type", "Authorization"]}}, supports_credentials=True)
    else:
        CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"], "allow_headers": ["Content-Type", "Authorization"]}}, supports_credentials=True)

    app.register_blueprint(usuario_bp, url_prefix='/api')
    # Legacy questionnaire removed from runtime.
    app.config['ENABLE_LEGACY_QUESTIONNAIRE'] = False
    app.register_blueprint(auth_admin_bp, url_prefix='/api')
    # Admin endpoints (guarded by JWT and optional header fallback). Always mounted; feature flag controls dynamic ops.
    app.register_blueprint(admin_dynamic_bp, url_prefix='/api')
    # Dynamic questionnaires always enabled
    app.config['ENABLE_DYNAMIC_QUESTIONNAIRES'] = True
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
                "/api/dynamic/questionnaires"
            ],
        })

    @app.route('/api/health')
    def health_check():
        return jsonify({
            "status": "ok",
            "message": "API del servicio STEM-Vocacional está funcionando.",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "environment": os.environ.get('FLASK_ENV', 'development'),
            "instance_id": app.config.get('INSTANCE_ID')
        }), 200

    with app.app_context():
        try:
            print("Verificando y/o creando tablas de la base de datos...")
            Base.metadata.create_all(bind=engine)
            # Ensure dynamic schema incremental changes (e.g., is_primary flag)
            try:
                ensure_dynamic_schema(engine)
            except Exception as e:
                try:
                    import traceback; traceback.print_exc()
                except Exception:
                    pass
                print(f"[startup] ensure_dynamic_schema skipped with error: {e}")
            # Ensure user auth columns exist / legacy cleanup
            try:
                ensure_user_schema(engine)
            except Exception as e:
                try:
                    import traceback; traceback.print_exc()
                except Exception:
                    pass
                print(f"[startup] ensure_user_schema skipped with error: {e}")
            # Ensure usability survey questionnaire exists (hardcoded, hidden from listings)
            try:
                _ensure_ux_survey()
            except Exception as e:
                try:
                    import traceback; traceback.print_exc()
                except Exception:
                    pass
                print(f"[startup] ensure_ux_survey skipped with error: {e}")
            print("Tablas de la base de datos verificadas/creadas.")
        except Exception as db_error:
            print(f" Error al conectar con la base de datos: {db_error}")
            print("  La aplicación continuará, pero las funciones de base de datos no estarán disponibles.")
            print(" Verifica la conexión a internet y la configuración de Azure SQL Server.")

    return app

def _ensure_ux_survey():
    """Crear cuestionario 'ux_survey' (Encuesta de usabilidad) si no existe.

    Implementado como cuestionario dinámico oculto para reutilizar el mismo
    almacenamiento sin cambiar el esquema. Una sola versión publicada con
    10 preguntas de escala Likert (1-5) usando opciones explícitas.
    """
    likert = [
        ("5", "Muy de acuerdo"),
        ("4", "De acuerdo"),
        ("3", "No sé"),
        ("2", "En desacuerdo"),
        ("1", "Muy en desacuerdo"),
    ]
    # Preguntas (texto exacto del requerimiento). Guardar código estable.
    questions = [
        ("ux_q1", "Creo que me gustaría usar este sistema de forma frecuente"),
        ("ux_q2", "El sistema es innecesariamente complejo"),
        ("ux_q3", "Creo que el sistema fue fácil de usar"),
        ("ux_q4", "Creo que necesito el apoyo de un técnico para usar el sistema"),
        ("ux_q5", "Muchas funciones del sistema fueron bien integradas"),
        ("ux_q6", "Pienso que había mucha inconsistencia en el sistema"),
        ("ux_q7", "Pienso que la mayoría de personas aprenderán a usar este sistema muy rápido"),
        ("ux_q8", "Pienso que el sistema fue incómodo de usar"),
        ("ux_q9", "Me sentí seguro usando este sistema"),
        ("ux_q10", "Necesité aprender muchas cosas antes de entender el sistema"),
    ]
    with Session(engine) as s:
        existing = s.query(Questionnaire).filter_by(code="ux_survey").first()
        if existing:
            return  # Ya existe
        q = Questionnaire(code="ux_survey", title="Encuesta de Usabilidad STEM", description="Encuesta de usabilidad de la herramienta STEM", status="active", is_primary=False)
        s.add(q)
        s.flush()
        v = QuestionnaireVersion(questionnaire_id=q.id, version_number=1, status="published", metadata_json={"kind": "ux_survey", "hardcoded": True})
        s.add(v)
        s.flush()
        sec = Section(questionnaire_version_id=v.id, title="Usabilidad", description="Bloque único de 10 afirmaciones SUS adaptadas", order=1)
        s.add(sec)
        s.flush()
        order_counter = 1
        for code, text in questions:
            qu = Question(section_id=sec.id, code=code, text=text, type="choice", required=True, order=order_counter)
            s.add(qu)
            s.flush()
            # Opciones Likert
            opt_order = 1
            for value, label in likert:
                s.add(Option(question_id=qu.id, value=value, label=label, order=opt_order))
                opt_order += 1
            order_counter += 1
        s.commit()
        print("[ensure_ux_survey] Questionnaire 'ux_survey' creado con versión publicada.")

# --- Punto de Entrada para Ejecución ---
if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=False)