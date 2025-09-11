import os
import getpass
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Detectar el tipo de base de datos según las variables de entorno
DATABASE_TYPE = os.getenv("DATABASE_TYPE", "azure_sql")  # "azure_sql" o "postgresql"

# Configuración para Azure SQL Server (desarrollo/existente)
AZURE_DB_SERVER = os.getenv("DB_SERVER", "stemdb.database.windows.net")
AZURE_DB_DATABASE = os.getenv("DB_DATABASE", "StemDB")
AZURE_DB_USER = os.getenv("DB_USER", "michsega17@gmail.com@stemdb")
AZURE_DB_PASSWORD = os.getenv("DB_PASSWORD")
AZURE_DB_DRIVER = os.getenv("DB_DRIVER", "{ODBC Driver 17 for SQL Server}")
AZURE_DB_PORT = os.getenv("DB_PORT", "1433")

# Configuración para PostgreSQL (Railway/producción gratuita)
PG_DATABASE_URL = os.getenv("DATABASE_URL")  # Railway proporciona esta variable

# Cache para la contraseña de Azure (evitar múltiples solicitudes)
_cached_password = None

def get_azure_password(interactive=False):
    """Obtiene la contraseña de Azure SQL de forma segura."""
    global _cached_password
    
    if AZURE_DB_PASSWORD:
        return AZURE_DB_PASSWORD
    if _cached_password:
        return _cached_password
    
    if interactive:
        _cached_password = getpass.getpass(f"🔐 Contraseña para {AZURE_DB_USER}: ")
        return _cached_password
    else:
        print("❌ Error: La variable de entorno DB_PASSWORD no está configurada.", file=sys.stderr)
        print("      Para ejecutar la aplicación Flask, configura la contraseña antes de iniciar.", file=sys.stderr)
        print(r"      Ejemplo en PowerShell: $env:DB_PASSWORD='tu_contraseña'", file=sys.stderr)
        sys.exit(1)

def create_sqlalchemy_engine():
    """Crea el motor de SQLAlchemy según el tipo de base de datos configurado."""
    try:
        if DATABASE_TYPE == "postgresql" and PG_DATABASE_URL:
            # Configuración para PostgreSQL (Railway)
            print("🐘 Usando PostgreSQL (Railway)")
            return create_engine(
                PG_DATABASE_URL,
                pool_size=5,
                max_overflow=10,
                pool_timeout=30,
                pool_recycle=3600,
                pool_pre_ping=True,
                echo=False
            )
        else:
            # Configuración para Azure SQL Server (desarrollo)
            print("🗃️ Usando Azure SQL Server")
            from sqlalchemy import URL
            
            connection_url = URL.create(
                "mssql+pyodbc",
                username=AZURE_DB_USER,
                password=get_azure_password(),
                host=AZURE_DB_SERVER,
                port=AZURE_DB_PORT,
                database=AZURE_DB_DATABASE,
                query={
                    "driver": AZURE_DB_DRIVER.strip('{}'),
                    "encrypt": "yes",
                    "TrustServerCertificate": "no",
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
                echo=False
            )
    except Exception as e:
        print(f"❌ Error al crear el motor de SQLAlchemy: {e}", file=sys.stderr)
        sys.exit(1)

engine = create_sqlalchemy_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Función para testing (mantener compatibilidad)
def test_connection():
    """Test de conexión que funciona con ambos tipos de BD."""
    try:
        if DATABASE_TYPE == "postgresql" and PG_DATABASE_URL:
            # Test para PostgreSQL
            import psycopg2
            from urllib.parse import urlparse
            
            parsed = urlparse(PG_DATABASE_URL)
            conn = psycopg2.connect(
                host=parsed.hostname,
                port=parsed.port,
                user=parsed.username,
                password=parsed.password,
                database=parsed.path[1:]
            )
            cursor = conn.cursor()
            cursor.execute("SELECT current_database(), current_user")
            result = cursor.fetchone()
            conn.close()
            
            print(f"✅ Conexión PostgreSQL exitosa!")
            print(f"📊 Base de datos: {result[0]}")
            print(f"👤 Usuario: {result[1]}")
            return True, f"DB: {result[0]}, User: {result[1]}"
        else:
            # Test para Azure SQL (código existente)
            import pyodbc
            
            print("🔌 Probando SQL Authentication...")
            conn_str = (
                f"Driver={AZURE_DB_DRIVER};"
                f"Server={AZURE_DB_SERVER},{AZURE_DB_PORT};"
                f"Database={AZURE_DB_DATABASE};"
                f"Uid={AZURE_DB_USER};"
                f"Pwd={get_azure_password(interactive=True)};"
                f"Encrypt=yes;"
                f"TrustServerCertificate=no;"
                f"Connection Timeout=60;"
            )
            
            conn = pyodbc.connect(conn_str)
            cursor = conn.cursor()
            cursor.execute("SELECT DB_NAME() as db, SUSER_NAME() as user_name")
            result = cursor.fetchone()
            conn.close()
            
            print(f"✅ Conexión Azure SQL exitosa!")
            print(f"📊 Base de datos: {result.db}")
            print(f"👤 Usuario: {result.user_name}")
            return True, f"DB: {result.db}, User: {result.user_name}"
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False, str(e)

if __name__ == "__main__":
    success, message = test_connection()
    print(f"\nResultado: {'✅ OK' if success else '❌ FALLO'}")
    print(f"Detalle: {message}")