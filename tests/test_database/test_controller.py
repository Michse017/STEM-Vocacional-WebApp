import pytest
from unittest.mock import patch, Mock, MagicMock
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class TestDatabaseController:
    
    @patch('psycopg2.connect')  # ✅ CORREGIDO: patchear psycopg2 directamente
    def test_get_usuario_by_codigo_success(self, mock_connect):
        """Probar búsqueda exitosa de usuario"""
        # Configurar mock completo
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        # Datos de prueba
        user_data = {
            'id_usuario': 1,
            'codigo_estudiante': '2023001',
            'nombre': 'Test User',
            'email': 'test@example.com'
        }
        mock_cursor.fetchone.return_value = user_data
        
        # Importar y probar
        from database.controller import get_usuario_by_codigo
        resultado = get_usuario_by_codigo('2023001')
        
        # Verificaciones
        assert resultado == user_data
        mock_cursor.execute.assert_called_once()
        mock_conn.close.assert_called_once()
    
    @patch('psycopg2.connect')  # ✅ CORREGIDO
    def test_get_usuario_by_codigo_not_found(self, mock_connect):
        """Probar usuario no encontrado"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = None
        
        from database.controller import get_usuario_by_codigo
        resultado = get_usuario_by_codigo('inexistente')
        
        assert resultado is None
    
    @patch('psycopg2.connect')  # ✅ CORREGIDO
    def test_get_usuario_by_codigo_connection_error(self, mock_connect):
        """Probar error de conexión"""
        mock_connect.side_effect = Exception("Connection failed")
        
        from database.controller import get_usuario_by_codigo
        resultado = get_usuario_by_codigo('2023001')
        
        assert resultado is None
    
    @patch('psycopg2.connect')  # ✅ CORREGIDO
    def test_upsert_cognitiva_insert(self, mock_connect):
        """Probar inserción de respuesta cognitiva"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = None  # No existe
        
        data = {'ptj_fisica': 85.5, 'ptj_matematicas': 90.0}
        
        from database.controller import upsert_cognitiva
        resultado = upsert_cognitiva(1, data)
        
        assert resultado is True
        assert mock_cursor.execute.call_count == 2  # SELECT + INSERT
        mock_conn.commit.assert_called_once()
    
    @patch('psycopg2.connect')  # ✅ CORREGIDO
    def test_upsert_cognitiva_update(self, mock_connect):
        """Probar actualización de respuesta cognitiva"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = {'id_resp_cognitiva': 1}  # Ya existe
        
        data = {'ptj_fisica': 88.0, 'ptj_matematicas': 92.0}
        
        from database.controller import upsert_cognitiva
        resultado = upsert_cognitiva(1, data)
        
        assert resultado is True
        assert mock_cursor.execute.call_count == 2  # SELECT + UPDATE
        mock_conn.commit.assert_called_once()