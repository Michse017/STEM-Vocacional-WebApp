import subprocess
import sys
import os
import textwrap

try:
    import requests  # type: ignore
except Exception:
    requests = None

# Cargar .env para que las pruebas hereden configuración (DB, etc.)
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

def run_tests():
    """Ejecutar pruebas de forma inteligente"""
    print("🧪 EJECUTANDO PRUEBAS UNITARIAS - STEM VOCACIONAL")
    print("=" * 60)
    py = sys.executable  # Usar el intérprete actual (venv)
    # Asegurar que los subprocesos usan el mismo entorno
    base_env = os.environ.copy()
    if not base_env.get("TEST_BASE_URL"):
        base_env["TEST_BASE_URL"] = "http://127.0.0.1:5000"
    print(f"TEST_BASE_URL: {base_env['TEST_BASE_URL']}")

    # Preflight: comprobar que el backend responde para evitar falsos negativos
    if requests is not None:
        try:
            r = requests.get(f"{base_env['TEST_BASE_URL']}/api/health", timeout=2)
            if r.status_code != 200:
                raise RuntimeError(f"/api/health devolvió {r.status_code}")
        except Exception as e:
            print("\n⚠️ Backend no responde en", base_env['TEST_BASE_URL'])
            print("Sugerencias:")
            print(" - Asegúrate de tener el backend corriendo en otra terminal:")
            print("   python manage.py run-public")
            print(" - Si usas otro puerto/host, define TEST_BASE_URL antes de correr pruebas:")
            print("   $env:TEST_BASE_URL = 'http://127.0.0.1:5000' ; python run_tests.py")
            return False
    
    # Verificar estructura básica
    if not os.path.exists('tests'):
        print("❌ Directorio 'tests' no encontrado")
        return False
    
    print("📁 Estructura encontrada:")
    for root, dirs, files in os.walk('tests'):
        level = root.replace('tests', '').count(os.sep)
        indent = ' ' * 2 * level
        print(f"{indent}📂 {os.path.basename(root)}/")
        subindent = ' ' * 2 * (level + 1)
        for file in files:
            if file.endswith('.py'):
                print(f"{subindent}📄 {file}")
    
    # Comandos de prueba en orden de importancia
    commands = [
        {
            "name": "🔍 Verificar pytest",
            "cmd": [py, "-m", "pytest", "--version"],
            "show_output": True,
            "show_errors": False
        },
        {
            "name": "📋 Listar pruebas disponibles",
            "cmd": [py, "-m", "pytest", "tests/", "--collect-only", "-q"],
            "show_output": True,
            "show_errors": True
        },
        {
            "name": "🧪 Ejecutar UNA prueba simple",
            "cmd": [py, "-m", "pytest", "tests/test_backend/test_api/test_health_and_cors.py::test_health_endpoint_ok", "-v"],
            "show_output": True,
            "show_errors": True
        },
        # Directorios no presentes aún se omiten para evitar ruido
        {
            "name": "🌐 Todas las pruebas (continuar en errores)",
            "cmd": [py, "-m", "pytest", "tests/", "-v", "--tb=short", "--continue-on-collection-errors"],
            "show_output": True,
            "show_errors": True
        }
    ]
    
    results = []
    
    for i, test_config in enumerate(commands, 1):
        print(f"\n🔄 [{i}/{len(commands)}] {test_config['name']}")
        print("-" * 50)
        
        try:
            result = subprocess.run(
                test_config['cmd'], 
                capture_output=True, 
                text=True, 
                timeout=120,
                env=base_env
            )
            
            if result.returncode == 0:
                print("✅ ÉXITO")
                results.append((test_config['name'], "✅"))
                
                if test_config.get('show_output') and result.stdout:
                    lines = result.stdout.strip().split('\n')
                    for line in lines[:20]:  # Mostrar primeras 20 líneas
                        print(f"  {line}")
                    if len(lines) > 20:
                        print(f"  ... (+{len(lines) - 20} líneas más)")
                        
            else:
                print("❌ ERROR")
                results.append((test_config['name'], "❌"))
                
                if test_config.get('show_errors'):
                    if result.stdout:
                        print("\n📤 STDOUT:")
                        stdout_lines = result.stdout.strip().split('\n')
                        for line in stdout_lines[-15:]:  # Últimas 15 líneas
                            if line.strip():
                                print(f"  {line}")
                    
                    if result.stderr:
                        print("\n📥 STDERR:")
                        stderr_lines = result.stderr.strip().split('\n')
                        for line in stderr_lines[-10:]:  # Últimas 10 líneas
                            if line.strip():
                                print(f"  ❌ {line}")
                            
        except subprocess.TimeoutExpired:
            print("⏰ TIMEOUT - Prueba cancelada")
            results.append((test_config['name'], "⏰"))
            
        except Exception as e:
            print(f"💥 ERROR INESPERADO: {e}")
            results.append((test_config['name'], "💥"))
    
    # Resumen final
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE PRUEBAS")
    print("=" * 60)
    
    success_count = 0
    for name, status in results:
        print(f"{status} {name}")
        if "✅" in status:
            success_count += 1
    
    print(f"\n🎯 RESULTADO: {success_count}/{len(results)} comandos exitosos")
    
    # Diagnóstico
    if success_count < len(results):
        print("\n🔧 DIAGNÓSTICO:")
        print("  • Si 'Listar pruebas' falla: problemas de importación")
        print("  • Si pruebas individuales fallan: errores en los tests")
        print("  • Revisar imports y paths en los archivos de prueba")
    
    # Comandos útiles
    print("\n💡 COMANDOS DE DEPURACIÓN:")
    print("  pytest tests/ --collect-only -v    # Ver todas las pruebas")
    print("  pytest tests/ -x -v                # Parar en primer error")
    print("  pytest tests/ --tb=long            # Errores detallados")
    print("  pytest tests/ -k 'config'          # Solo pruebas de config")
    
    return success_count > 0

def check_imports():
    """Verificar que los imports funcionan"""
    print("\n🔍 VERIFICANDO IMPORTS")
    print("-" * 30)
    
    modules_to_test = [
        ('database.config', 'Configuración de BD'),
        ('database.controller', 'Controlador de BD'),
        ('backend.app', 'Aplicación Flask'),
        ('backend.routes.usuario_routes', 'Rutas de Usuario')
    ]
    
    for module_name, description in modules_to_test:
        try:
            __import__(module_name)
            print(f"✅ {description} ({module_name})")
        except ImportError as e:
            print(f"❌ {description} ({module_name}): {e}")
        except Exception as e:
            print(f"⚠️ {description} ({module_name}): {e}")

if __name__ == "__main__":
    print("🚀 INICIANDO SISTEMA DE PRUEBAS")
    print("=" * 60)
    
    # Verificar imports primero
    check_imports()
    
    # Ejecutar pruebas
    success = run_tests()
    
    if success:
        print("\n🎉 ¡Al menos algunas pruebas funcionan!")
    else:
        print("\n⚠️ Revisar configuración - ver errores arriba")