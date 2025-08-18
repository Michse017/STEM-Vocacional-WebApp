import os

# Configuración SQL Server Azure - SQL Authentication
DB_SERVER = os.getenv("DB_SERVER", "stemdb.database.windows.net")
DB_DATABASE = os.getenv("DB_DATABASE", "StemDB")
DB_USER = os.getenv("DB_USER", "michsega17@gmail.com@stemdb")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")  # Agregar contraseña real
DB_DRIVER = os.getenv("DB_DRIVER", "{ODBC Driver 18 for SQL Server}")
DB_PORT = os.getenv("DB_PORT", "1433")

# Connection string para SQL Authentication (basado en Azure Portal)
CONNECTION_STRING = (
    f"Driver={DB_DRIVER};"
    f"Server=tcp:{DB_SERVER},{DB_PORT};"
    f"Database={DB_DATABASE};"
    f"Uid={DB_USER};"
    f"Pwd={DB_PASSWORD};"
    f"Encrypt=yes;"
    f"TrustServerCertificate=no;"
    f"Connection Timeout=60;"
)

# Para SQLAlchemy
DATABASE_URL = (
    f"mssql+pyodbc://{DB_USER.replace('@', '%40')}:{DB_PASSWORD}@"
    f"{DB_SERVER}:{DB_PORT}/{DB_DATABASE}?"
    f"driver=ODBC+Driver+18+for+SQL+Server&"
    f"encrypt=yes&"
    f"TrustServerCertificate=no"
)

def get_database_url():
    return DATABASE_URL

def get_connection_string():
    return CONNECTION_STRING

# Para compatibilidad
DB_NAME = DB_DATABASE
DATABASE_URL_TEST = DATABASE_URL
