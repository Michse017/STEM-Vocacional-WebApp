import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

server = os.getenv('DB_SERVER', 'localhost')
port = os.getenv('DB_PORT', '1433')
database = os.getenv('DB_NAME', 'sistema_estudiantes')
username = os.getenv('DB_USER', 'stemuser')
password = os.getenv('DB_PASSWORD', 'StemPass123!')

connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server},{port};DATABASE={database};UID={username};PWD={password}'

try:
    conn = pyodbc.connect(connection_string)
    cursor = conn.cursor()
    
    # Obtener todas las tablas
    cursor.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'")
    tables = [table[0] for table in cursor.fetchall()]
    
    for table in tables:
        print(f"\n=== Estructura de tabla: {table} ===")
        cursor.execute(f"""
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = '{table}'
            ORDER BY ORDINAL_POSITION
        """)
        
        columns = cursor.fetchall()
        for col in columns:
            print(f"  - {col[0]} ({col[1]}) - Nullable: {col[2]}")
    
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")