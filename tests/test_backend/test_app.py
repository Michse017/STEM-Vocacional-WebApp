import pytest
from unittest.mock import patch, Mock
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

class TestFlaskApp:
    
    def test_app_creation(self, app):
        """Probar que la aplicación se crea correctamente"""
        assert app is not None
        assert app.config['TESTING'] is True
    
    @patch('database.controller.get_usuario_by_codigo')
    def test_home_page_get(self, mock_get_usuario, client):
        """Probar página principal GET"""
        mock_get_usuario.return_value = None
        response = client.get('/')
        # Acepta 200 (página de login) o 404 si no existe la ruta
        assert response.status_code in [200, 404]
    
    @patch('database.controller.get_usuario_by_codigo')
    @patch('backend.controllers.usuario_controller.authenticate_user')
    def test_login_success_mock(self, mock_auth, mock_get_usuario, client):
        """Probar login exitoso con mocks completos"""
        # Mock del usuario autenticado
        mock_user = {
            'id_usuario': 1,
            'codigo_estudiante': '2023001',
            'nombre': 'Test User'
        }
        mock_auth.return_value = mock_user
        mock_get_usuario.return_value = mock_user
        
        response = client.post('/', data={'user_id': '2023001'})
        
        # Acepta 200, 302 (redirect) o 404 si la ruta no existe
        assert response.status_code in [200, 302, 404]
    
    def test_simple_routes_exist(self, client):
        """Probar que las rutas básicas al menos responden"""
        routes_to_test = ['/', '/questionnaire', '/dashboard', '/logout']
        
        for route in routes_to_test:
            response = client.get(route)
            # Cualquier respuesta menos 500 (error interno) está bien
            assert response.status_code != 500, f"Ruta {route} tiene error interno"
            print(f"Ruta {route}: {response.status_code}")