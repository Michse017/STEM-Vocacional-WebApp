import pytest
import psycopg2
import os
import sys
from unittest.mock import patch

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

@pytest.fixture(scope="session")
def test_database_url():
    """URL de base de datos para pruebas"""
    return "postgresql://stemuser:stem2025@localhost:5432/stemvocacional_test"

@pytest.fixture(scope="session")
def mock_database_url():
    """Mock de la configuración de base de datos"""
    test_url = "postgresql://stemuser:stem2025@localhost:5432/stemvocacional_test"
    with patch.dict(os.environ, {'DATABASE_URL': test_url}):
        yield test_url

@pytest.fixture
def app():
    """Crear aplicación Flask para pruebas"""
    # Mock de la configuración antes de importar
    with patch.dict(os.environ, {'DATABASE_URL': 'postgresql://test:test@localhost:5432/test'}):
        from backend.app import app
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        yield app

@pytest.fixture
def client(app):
    """Cliente de pruebas Flask"""
    return app.test_client()

@pytest.fixture
def mock_database_connection():
    """Mock de conexión a base de datos"""
    mock_conn = pytest.Mock()
    mock_cursor = pytest.Mock()
    mock_conn.cursor.return_value = mock_cursor
    return mock_conn, mock_cursor