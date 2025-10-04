import os
from flask import Flask, jsonify
from flask_cors import CORS
from backend.routes.admin_dynamic_routes import admin_dynamic_bp
from backend.routes.dynamic_questionnaire_routes import dynamic_questionnaire_bp
from database.controller import engine
from database.models import Base


def create_admin_app():
    app = Flask(__name__)
    default_secret = 'dev_super_secret_key_change_for_prod'
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', default_secret)
    # Shared admin access key (optional). If set, admin routes require X-Admin-Access header to match.
    app.config['ADMIN_ACCESS_KEY'] = os.environ.get('ADMIN_ACCESS_KEY')

    # Production hardening
    if os.environ.get('FLASK_ENV') == 'production':
        if app.config['SECRET_KEY'] == default_secret:
            raise RuntimeError("SECRET_KEY is required in production. Set SECRET_KEY env with a strong random value.")
        app.config.update(
            SESSION_COOKIE_SECURE=True,
            SESSION_COOKIE_HTTPONLY=True,
            SESSION_COOKIE_SAMESITE='Lax',
        )

    # Restrictive CORS (adjust as needed for internal admin panel)
    allowed_admin_origins = os.environ.get('ADMIN_FRONTEND_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
    CORS(app,
        resources={r"/api/*": {"origins": allowed_admin_origins,
                           "allow_headers": ["Content-Type", "Authorization", "X-Admin-Access"]}},
        supports_credentials=True)

    # Feature flag still controls dynamic models
    app.config['ENABLE_DYNAMIC_QUESTIONNAIRES'] = os.environ.get('ENABLE_DYNAMIC_QUESTIONNAIRES', '0') == '1'

    if app.config['ENABLE_DYNAMIC_QUESTIONNAIRES']:
        app.register_blueprint(dynamic_questionnaire_bp, url_prefix='/api')
    # Always mount admin (it will error if flag off for dynamic-specific ops)
    app.register_blueprint(admin_dynamic_bp, url_prefix='/api')

    @app.route('/')
    def root():
        return jsonify({
            'admin_app': True,
            'dynamic_enabled': app.config['ENABLE_DYNAMIC_QUESTIONNAIRES'],
            'endpoints': [
                '/api/admin/questionnaires',
                '/api/admin/...',
                *( ['/api/dynamic/questionnaires'] if app.config['ENABLE_DYNAMIC_QUESTIONNAIRES'] else [] )
            ]
        })

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'app': 'admin'})

    with app.app_context():
        try:
            Base.metadata.create_all(bind=engine)
        except Exception as e:  # noqa: BLE001
            print(f"[AdminApp] DB init error: {e}")

    return app


if __name__ == '__main__':
    app = create_admin_app()
    app.run(host='0.0.0.0', port=5001, debug=False)
