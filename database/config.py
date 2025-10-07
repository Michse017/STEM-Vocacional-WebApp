import os
import getpass
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Cargar variables desde entorno (sin credenciales por defecto)
DB_SERVER = os.getenv("DB_SERVER")
DB_DATABASE = os.getenv("DB_DATABASE")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
# Driver/puerto pueden tener defaults seguros
DB_DRIVER = os.getenv("DB_DRIVER", "{ODBC Driver 17 for SQL Server}")
DB_PORT = os.getenv("DB_PORT", "1433")

_cached_password = None

def _require(value, name: str):
    if not value:
        print(f"❌ Error: la variable de entorno {name} no está configurada.", file=sys.stderr)
        print(f"Configure {name} en el entorno o en .env y vuelva a intentar.", file=sys.stderr)
        sys.exit(1)
    return value

def get_password(interactive=False):
    """Obtiene la contraseña de forma segura."""
    global _cached_password
    
    if DB_PASSWORD:
        return DB_PASSWORD
    if _cached_password:
        return _cached_password
    
    if interactive:
        _cached_password = getpass.getpass(f"Contraseña para {DB_USER}: ")
        return _cached_password
    else:
        print("❌ Error: la variable de entorno DB_PASSWORD no está configurada.", file=sys.stderr)
        print("Configure DB_PASSWORD antes de iniciar la aplicación.", file=sys.stderr)
        sys.exit(1) # Termina la ejecución si no hay contraseña en modo no interactivo

def get_database_url(interactive=False):
    """Construye la URL de conexión para SQLAlchemy (pyodbc)."""
    # Validar variables requeridas
    server = _require(DB_SERVER, "DB_SERVER")
    database = _require(DB_DATABASE, "DB_DATABASE")
    user = _require(DB_USER, "DB_USER")
    password = get_password(interactive)
    encoded_user = user.replace('@', '%40')
    # Aseguramos que la contraseña sea un string antes de reemplazar
    encoded_password = str(password).replace('@', '%40').replace('!', '%21')
    
    # Corrección: El nombre del driver para la URL no debe llevar llaves.
    driver_for_url = DB_DRIVER.strip('{}').replace(' ', '+')

    return (
        f"mssql+pyodbc://{encoded_user}:{encoded_password}@"
        f"{server}:{DB_PORT}/{database}?"
        f"driver={driver_for_url}&"
        f"encrypt=yes&"
        f"TrustServerCertificate=no&"
        f"timeout=30"
    )

from sqlalchemy import create_engine, URL

def create_sqlalchemy_engine():
    """Crea el motor de SQLAlchemy. Intenta pymssql y cae a pyodbc si falla.

    Razón: en Windows/Python recientes (p. ej. 3.13), pymssql puede no estar disponible.
    En ese caso, usamos ODBC (driver 17/18) con URL pyodbc.
    """
    # Validar variables requeridas antes de construir URLs
    _require(DB_SERVER, "DB_SERVER")
    _require(DB_DATABASE, "DB_DATABASE")
    _require(DB_USER, "DB_USER")
    password = get_password()
    # Intento 1: pymssql
    try:
        connection_url = URL.create(
            "mssql+pymssql",
            username=DB_USER,
            password=password,
            host=DB_SERVER,
            port=DB_PORT,
            database=DB_DATABASE,
            query={
                "charset": "utf8",
                "timeout": "60",
            },
        )
        return create_engine(
            connection_url,
            pool_size=5,
            max_overflow=10,
            pool_timeout=30,
            pool_recycle=3600,
            pool_pre_ping=True,
            echo=False,
        )
    except Exception as e:
        print(f"⚠️ pymssql no disponible o falló la conexión: {e}", file=sys.stderr)
        print("Intentando fallback con pyodbc...", file=sys.stderr)
        try:
            # Construir URL pyodbc desde helper ya preparado para ODBC
            odbc_url = get_database_url(interactive=False)
            return create_engine(
                odbc_url,
                pool_size=5,
                max_overflow=10,
                pool_timeout=30,
                pool_recycle=3600,
                pool_pre_ping=True,
                echo=False,
            )
        except Exception as e2:
            print(f"❌ Error al crear el motor con pyodbc: {e2}", file=sys.stderr)
            print("Sugerencias: asegúrate de instalar 'pyodbc' (pip) y el ODBC Driver 17 o 18 para SQL Server.", file=sys.stderr)
            print("En Windows, instala: https://learn.microsoft.com/sql/connect/odbc/windows/release-notes-odbc-sql-server", file=sys.stderr)
            sys.exit(1)

engine = create_sqlalchemy_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_connection_string_for_test():
    """Construye un connection string ODBC para pruebas interactivas."""
    # Validar variables requeridas para la prueba interactiva
    _require(DB_SERVER, "DB_SERVER")
    _require(DB_DATABASE, "DB_DATABASE")
    _require(DB_USER, "DB_USER")
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
    """Ejecuta una verificación de conexión usando pyodbc."""
    import pyodbc
    try:
        print("Probando SQL Authentication...")
        conn_str = get_connection_string_for_test()
        
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        cursor.execute("SELECT DB_NAME() as db, SUSER_NAME() as user_name")
        result = cursor.fetchone()
        conn.close()
        
        print("✅ Conexión SQL exitosa!")
        print(f"Base de datos: {result.db}")
        print(f"Usuario: {result.user_name}")
        return True, f"DB: {result.db}, User: {result.user_name}"
        
    except Exception as e:
        print(f"❌ Error SQL Authentication: {e}")
        return False, str(e)

if __name__ == "__main__":
    success, message = test_connection()
    print(f"\nResultado: {'✅ OK' if success else '❌ FALLO'}")
    print(f"Detalle: {message}")