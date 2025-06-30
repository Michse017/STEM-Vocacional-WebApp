import pytest
import os
from unittest.mock import patch
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

def test_database_config_defaults():
    """Probar configuración por defecto"""
    # Limpiar environment y reimportar
    env_backup = dict(os.environ)
    
    try:
        # Limpiar variables de entorno
        for key in ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME']:
            if key in os.environ:
                del os.environ[key]
        
        # Reimportar módulo
        import importlib
        import database.config
        importlib.reload(database.config)
        
        assert database.config.DB_USER == "stemuser"
        assert database.config.DB_PASSWORD == "stem2025"
        assert database.config.DB_HOST == "localhost"
        assert database.config.DB_PORT == "5432"
        assert database.config.DB_NAME == "stemvocacional"
        
    finally:
        # Restaurar environment
        os.environ.clear()
        os.environ.update(env_backup)

def test_database_url_format():
    """Probar formato de URL de base de datos"""
    # Test con environment limpio
    with patch.dict(os.environ, {}, clear=True):
        import importlib
        import database.config
        importlib.reload(database.config)
        
        expected_url = "postgresql://stemuser:stem2025@localhost:5432/stemvocacional"
        assert database.config.DATABASE_URL == expected_url

def test_database_config_with_custom_values():
    """Probar configuración con valores personalizados"""
    custom_env = {
        'DB_USER': 'custom_user',
        'DB_PASSWORD': 'custom_pass',
        'DB_HOST': 'custom_host',
        'DB_PORT': '5433',
        'DB_NAME': 'custom_db'
    }
    
    with patch.dict(os.environ, custom_env, clear=True):
        import importlib
        import database.config
        importlib.reload(database.config)
        
        assert database.config.DB_USER == "custom_user"
        assert database.config.DB_PASSWORD == "custom_pass"
        expected_url = "postgresql://custom_user:custom_pass@custom_host:5433/custom_db"
        assert database.config.DATABASE_URL == expected_url