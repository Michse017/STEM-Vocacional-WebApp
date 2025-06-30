import pytest
from unittest.mock import patch, Mock
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

class TestUsuarioController:
    
    @patch('backend.controllers.usuario_controller.get_usuario_by_codigo')
    def test_authenticate_user_success(self, mock_get_usuario):
        """Probar autenticación exitosa"""
        # Mock del usuario
        mock_user = {
            'id_usuario': 1,
            'codigo_estudiante': '2023001',
            'nombre': 'Test User'
        }
        mock_get_usuario.return_value = mock_user
        
        from backend.controllers.usuario_controller import authenticate_user
        resultado = authenticate_user('2023001')
        
        assert resultado == mock_user
        mock_get_usuario.assert_called_once_with('2023001')
    
    @patch('backend.controllers.usuario_controller.get_usuario_by_codigo')
    def test_authenticate_user_failure(self, mock_get_usuario):
        """Probar autenticación fallida"""
        mock_get_usuario.return_value = None
        
        from backend.controllers.usuario_controller import authenticate_user
        resultado = authenticate_user('invalid_code')
        
        assert resultado is None
        mock_get_usuario.assert_called_once_with('invalid_code')
    
    @patch('backend.controllers.usuario_controller.get_usuario_by_codigo')
    def test_authenticate_user_empty_code(self, mock_get_usuario):
        """Probar autenticación con código vacío"""
        from backend.controllers.usuario_controller import authenticate_user
        resultado = authenticate_user('')
        
        assert resultado is None
        # No debería llamar a la BD con código vacío
        mock_get_usuario.assert_not_called()
    
    @patch('backend.controllers.usuario_controller.get_usuario_by_codigo')
    def test_authenticate_user_none_input(self, mock_get_usuario):
        """Probar autenticación con None"""
        from backend.controllers.usuario_controller import authenticate_user
        resultado = authenticate_user(None)
        
        assert resultado is None
        # No debería llamar a la BD con None
        mock_get_usuario.assert_not_called()

    @patch('backend.controllers.usuario_controller.authenticate_user')
    def test_get_user_profile_success(self, mock_authenticate):
        """Probar obtención de perfil exitosa"""
        mock_user = {'id_usuario': 1, 'codigo_estudiante': '2023001'}
        mock_authenticate.return_value = mock_user
        
        from backend.controllers.usuario_controller import get_user_profile
        resultado = get_user_profile('2023001')
        
        assert resultado['success'] is True
        assert resultado['usuario'] == mock_user

    @patch('backend.controllers.usuario_controller.authenticate_user')
    def test_get_user_profile_failure(self, mock_authenticate):
        """Probar obtención de perfil fallida"""
        mock_authenticate.return_value = None
        
        from backend.controllers.usuario_controller import get_user_profile
        resultado = get_user_profile('invalid')
        
        assert resultado['success'] is False
        assert 'message' in resultado