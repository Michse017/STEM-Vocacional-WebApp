import os
import getpass
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configuración SQL Server Azure - SQL Authentication
DB_SERVER = os.getenv("DB_SERVER", "stemdb.database.windows.net")
DB_DATABASE = os.getenv("DB_DATABASE", "StemDB")
DB_USER = os.getenv("DB_USER", "michsega17@gmail.com@stemdb")
DB_PASSWORD = os.getenv("DB_PASSWORD")  # Leemos la variable, sin valor por defecto ""
DB_DRIVER = os.getenv("DB_DRIVER", "{ODBC Driver 17 for SQL Server}")
DB_PORT = os.getenv("DB_PORT", "1433")

# Cache para la contraseña (evitar múltiples solicitudes)
_cached_password = None

def get_password(interactive=False):
    """
    Obtiene la contraseña de forma segura.
    - Primero, intenta obtenerla de la variable de entorno DB_PASSWORD.
    - Si no existe y el modo es interactivo, la solicita por terminal.
    - Si no existe y no es interactivo, falla con un error.
    """
    global _cached_password
    
    if DB_PASSWORD:
        return DB_PASSWORD
    if _cached_password:
        return _cached_password
    
    if interactive:
        _cached_password = getpass.getpass(f"🔐 Contraseña para {DB_USER}: ")
        return _cached_password
    else:
        print("❌ Error: La variable de entorno DB_PASSWORD no está configurada.", file=sys.stderr)
        print("      Para ejecutar la aplicación Flask, configura la contraseña antes de iniciar.", file=sys.stderr)
        print(r"      Ejemplo en PowerShell: $env:DB_PASSWORD='tu_contraseña'", file=sys.stderr)
        sys.exit(1) # Termina la ejecución si no hay contraseña en modo no interactivo

def get_database_url(interactive=False):
    """Construye la URL de conexión para SQLAlchemy."""
    password = get_password(interactive)
    encoded_user = DB_USER.replace('@', '%40')
    # Aseguramos que la contraseña sea un string antes de reemplazar
    encoded_password = str(password).replace('@', '%40').replace('!', '%21')
    
    # Corrección: El nombre del driver para la URL no debe llevar llaves.
    driver_for_url = DB_DRIVER.strip('{}').replace(' ', '+')

    return (
        f"mssql+pyodbc://{encoded_user}:{encoded_password}@"
        f"{DB_SERVER}:{DB_PORT}/{DB_DATABASE}?"
        f"driver={driver_for_url}&"
        f"encrypt=yes&"
        f"TrustServerCertificate=no&"
        f"timeout=30"
    )

# --- Instancias de SQLAlchemy ---
# Se crea el motor una sola vez. get_database_url() se llama aquí,
# por lo que es crucial que DB_PASSWORD esté seteada antes de iniciar la app.
engine = create_engine(get_database_url())
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# --- Funciones para Test Interactivo ---
def get_connection_string_for_test():
    """Función de test que siempre pide contraseña si no está seteada."""
    password = get_password(interactive=True)
    return (
        f"Driver={DB_DRIVER};"
        f"Server={DB_SERVER},{DB_PORT};"
        f"Database={DB_DATABASE};"
        f"Uid={DB_USER};"
        f"Pwd={password};"
        f"Encrypt=yes;"
        f"TrustServerCertificate=no;"
        f"Connection Timeout=60;"
    )

def test_connection():
    """Test rápido de verificación que usa pyodbc directamente."""
    import pyodbc
    try:
        print("🔌 Probando SQL Authentication...")
        conn_str = get_connection_string_for_test()
        
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        cursor.execute("SELECT DB_NAME() as db, SUSER_NAME() as user_name")
        result = cursor.fetchone()
        conn.close()
        
        print(f"✅ Conexión SQL exitosa!")
        print(f"📊 Base de datos: {result.db}")
        print(f"👤 Usuario: {result.user_name}")
        return True, f"DB: {result.db}, User: {result.user_name}"
        
    except Exception as e:
        print(f"❌ Error SQL Authentication: {e}")
        return False, str(e)

if __name__ == "__main__":
    # Al ejecutar este archivo directamente, se asume modo interactivo.
    success, message = test_connection()
    print(f"\nResultado: {'✅ OK' if success else '❌ FALLO'}")
    print(f"Detalle: {message}")