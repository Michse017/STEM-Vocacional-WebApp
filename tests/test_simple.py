import pytest
import sys
import os

# Agregar path básico
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_basic_python():
    """Prueba básica de Python"""
    assert 1 + 1 == 2
    assert "hello".upper() == "HELLO"
    
def test_imports_work():
    """Probar que los imports básicos funcionan"""
    try:
        import os
        import sys
        import subprocess
        assert True
    except ImportError:
        assert False, "Imports básicos fallaron"

def test_project_structure():
    """Verificar estructura del proyecto"""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    required_dirs = ['backend', 'database', 'tests']
    for dir_name in required_dirs:
        dir_path = os.path.join(project_root, dir_name)
        assert os.path.exists(dir_path), f"Directorio {dir_name} no encontrado"

def test_database_config_import():
    """Probar import de configuración de base de datos"""
    try:
        from database import config
        assert hasattr(config, 'DATABASE_URL')
        assert config.DATABASE_URL is not None
        assert 'postgresql://' in config.DATABASE_URL
    except ImportError as e:
        pytest.fail(f"No se pudo importar database.config: {e}")

def test_flask_app_import():
    """Probar import de la aplicación Flask"""
    try:
        from backend import app
        assert app is not None
    except ImportError as e:
        pytest.fail(f"No se pudo importar backend.app: {e}")

def test_controller_imports():
    """Probar imports de controladores"""
    try:
        from database import controller
        assert hasattr(controller, 'get_usuario_by_codigo')
        
        from backend.controllers import usuario_controller
        assert hasattr(usuario_controller, 'authenticate_user')
        
    except ImportError as e:
        pytest.fail(f"Error importando controladores: {e}")

def test_questionnaire_structure():
    """Probar estructura del cuestionario"""
    try:
        from backend.logic import questionnaire_structure
        assert hasattr(questionnaire_structure, 'QUESTIONNAIRE_STRUCTURE')
        structure = questionnaire_structure.QUESTIONNAIRE_STRUCTURE
        # CAMBIAR ESTA LÍNEA:
        # assert 'dimensions' in structure
        # POR ESTA:
        if isinstance(structure, list):
            # Si es una lista, buscar el primer elemento con 'dimension'
            assert len(structure) > 0, "QUESTIONNAIRE_STRUCTURE no puede estar vacía"
            assert any('dimension' in item for item in structure), "Debe tener elementos con 'dimension'"
        else:
            # Si es un diccionario, debe tener 'dimensions'
            assert 'dimensions' in structure, "QUESTIONNAIRE_STRUCTURE debe tener 'dimensions'"
    except ImportError as e:
        pytest.fail(f"questionnaire_structure no disponible: {e}")

def test_environment_variables():
    """Probar manejo de variables de entorno"""
    original_value = os.environ.get('TEST_VAR')
    
    # Establecer variable
    os.environ['TEST_VAR'] = 'test_value'
    assert os.environ.get('TEST_VAR') == 'test_value'
    
    # Limpiar
    if original_value is None:
        if 'TEST_VAR' in os.environ:
            del os.environ['TEST_VAR']
    else:
        os.environ['TEST_VAR'] = original_value

def test_python_version():
    """Verificar versión de Python"""
    import sys
    assert sys.version_info.major >= 3
    assert sys.version_info.minor >= 8