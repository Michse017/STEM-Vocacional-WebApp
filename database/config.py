import os
import getpass
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_SERVER = os.getenv("DB_SERVER", "stemdb.database.windows.net")
DB_DATABASE = os.getenv("DB_DATABASE", "StemDB")
DB_USER = os.getenv("DB_USER", "michsega17@gmail.com@stemdb")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_DRIVER = os.getenv("DB_DRIVER", "{ODBC Driver 17 for SQL Server}")
DB_PORT = os.getenv("DB_PORT", "1433")

_cached_password = None

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

from sqlalchemy import create_engine, URL

def create_sqlalchemy_engine():
    """Crea el motor de SQLAlchemy (pymssql)."""
    try:
        connection_url = URL.create(
            "mssql+pymssql",
            username=DB_USER,
            password=get_password(),
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
        print(f"❌ Error al crear el motor de SQLAlchemy: {e}", file=sys.stderr)
        sys.exit(1)

engine = create_sqlalchemy_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_connection_string_for_test():
    """Construye un connection string ODBC para pruebas interactivas."""
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

    if success:
        try:
            db = SessionLocal()
            print("\nIntentando insertar usuario de prueba 'test-002'...")
            merge_sql = text(
                """
                MERGE INTO usuarios AS target
                USING (SELECT :codigo AS codigo_estudiante) AS source
                ON (target.codigo_estudiante = source.codigo_estudiante)
                WHEN NOT MATCHED THEN
                    INSERT (codigo_estudiante, finalizado)
                    VALUES (source.codigo_estudiante, 0);
                """
            )
            db.execute(merge_sql, {"codigo": "test-002"})
            db.commit()
            print("✅ Usuario de prueba 'test-002' insertado (o ya existía).")
        except Exception as e:
            print(f"❌ Error al insertar usuario de prueba: {e}", file=sys.stderr)
            try:
                db.rollback()
            except Exception:
                pass
        finally:
            try:
                db.close()
            except Exception:
                pass