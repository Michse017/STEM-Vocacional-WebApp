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
    
    print("=== RESTRICCIONES DE UNICIDAD ===")
    cursor.execute("""
        SELECT 
            tc.TABLE_NAME,
            tc.CONSTRAINT_NAME,
            tc.CONSTRAINT_TYPE,
            kcu.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
            ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
        WHERE tc.CONSTRAINT_TYPE IN ('UNIQUE', 'PRIMARY KEY')
        ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_NAME
    """)
    
    constraints = cursor.fetchall()
    current_table = ""
    
    for constraint in constraints:
        table_name, constraint_name, constraint_type, column_name = constraint
        if table_name != current_table:
            print(f"\n📋 Tabla: {table_name}")
            current_table = table_name
        print(f"  🔐 {constraint_type}: {constraint_name} -> {column_name}")
    
    print("\n=== DATOS EXISTENTES POR USUARIO ===")
    tables = ['resp_cognitiva', 'resp_educativa', 'resp_educativa_familiar', 'resp_socioeconomica', 'resp_autoeficacia']
    
    for table in tables:
        cursor.execute(f"SELECT id_usuario, COUNT(*) as total FROM {table} GROUP BY id_usuario")
        results = cursor.fetchall()
        if results:
            print(f"\n📊 {table}:")
            for result in results:
                print(f"  Usuario {result[0]}: {result[1]} registro(s)")
        else:
            print(f"\n📊 {table}: Sin registros")
    
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")