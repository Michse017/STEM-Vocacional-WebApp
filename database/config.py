import os
import getpass

# Configuración SQL Server Azure - SQL Authentication
DB_SERVER = os.getenv("DB_SERVER", "stemdb.database.windows.net")
DB_DATABASE = os.getenv("DB_DATABASE", "StemDB")
DB_USER = os.getenv("DB_USER", "michsega17@gmail.com@stemdb")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")  # Se solicita en runtime si está vacía
DB_DRIVER = os.getenv("DB_DRIVER", "{ODBC Driver 17 for SQL Server}")
DB_PORT = os.getenv("DB_PORT", "1433")

# Cache para la contraseña (evitar múltiples solicitudes)
_cached_password = None

def get_password():
    """Obtener contraseña de forma segura (una sola vez por sesión)"""
    global _cached_password
    
    if DB_PASSWORD:
        return DB_PASSWORD
    elif _cached_password:
        return _cached_password
    else:
        _cached_password = getpass.getpass("🔐 Contraseña para michsega17@gmail.com@stemdb: ")
        return _cached_password

# Connection string para SQL Authentication
def get_connection_string():
    password = get_password()
    return (
        f"Driver={DB_DRIVER};"
        f"Server=tcp:{DB_SERVER},{DB_PORT};"
        f"Database={DB_DATABASE};"
        f"Uid={DB_USER};"
        f"Pwd={password};"
        f"Encrypt=yes;"
        f"TrustServerCertificate=no;"
        f"Connection Timeout=60;"
    )

# URL para SQLAlchemy con SQL Authentication
def get_database_url():
    password = get_password()
    # Codificar caracteres especiales en la URL
    encoded_user = DB_USER.replace('@', '%40')
    encoded_password = password.replace('@', '%40').replace('!', '%21')
    
    return (
        f"mssql+pyodbc://{encoded_user}:{encoded_password}@"
        f"{DB_SERVER}:{DB_PORT}/{DB_DATABASE}?"
        f"driver=ODBC+Driver+17+for+SQL+Server&"  # ← Cambio: Driver 17 consistente
        f"encrypt=yes&"
        f"TrustServerCertificate=no&"
        f"timeout=60"
    )

# Para compatibilidad con código existente
DB_NAME = DB_DATABASE

# Inicializar variables globales (sin solicitar contraseña aún)
def init_config():
    """Inicializar configuración sin solicitar contraseña"""
    return get_connection_string(), get_database_url()

# Test rápido de conexión
def test_connection():
    """Test rápido de verificación SQL Authentication"""
    import pyodbc
    try:
        print("🔌 Probando SQL Authentication...")
        conn_str = get_connection_string()
        
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
    success, message = test_connection()
    print(f"\nResultado: {'✅ OK' if success else '❌ FALLO'}")
    print(f"Detalle: {message}")