import os
from urllib.parse import quote_plus

class Config:
    # Configuración de base de datos
    DB_SERVER = os.getenv('DB_SERVER', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '1433')
    DB_NAME = os.getenv('DB_NAME', 'sistema_estudiantes')
    DB_USER = os.getenv('DB_USER', 'stemuser')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'StemPass123!')
    DB_DRIVER = os.getenv('DB_DRIVER', 'ODBC Driver 17 for SQL Server')
    DB_TRUST_CERT = os.getenv('DB_TRUST_CERTIFICATE', 'yes')
    DB_ENCRYPT = os.getenv('DB_ENCRYPT', 'no')
    
    # String de conexión con SSL deshabilitado y configuración mejorada
    SQLALCHEMY_DATABASE_URI = (
        f"mssql+pyodbc://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_SERVER}:{DB_PORT}/{DB_NAME}"
        f"?driver={quote_plus(DB_DRIVER)}"
        f"&TrustServerCertificate={DB_TRUST_CERT}"
        f"&Encrypt={DB_ENCRYPT}"
        f"&Connection+Timeout=30"
    )
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'connect_args': {
            'timeout': 30
        }
    }

    print(f"Configuración BD: {DB_SERVER}:{DB_PORT}/{DB_NAME} - Usuario: {DB_USER}")