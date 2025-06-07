import pyodbc
import psycopg2
import pandas as pd
import os
from sqlalchemy import create_engine

# Conexión SQL Server local
sql_server_conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost,1433;"
    "DATABASE=sistema_estudiantes;"
    "UID=stemuser;"
    "PWD=StemPass123!;"
    "TrustServerCertificate=yes;"
    "Encrypt=no"
)

# Conexión PostgreSQL Render (usar la URL que te dé Render)
postgres_url = "postgresql://user:pass@host:port/db"  # Reemplazar
postgres_engine = create_engine(postgres_url)

# Migrar tablas
tables = ['usuarios', 'resp_cognitiva', 'resp_educativa', 'resp_educativa_familiar', 'resp_socioeconomica', 'resp_autoeficacia']

for table in tables:
    print(f"Migrando {table}...")
    df = pd.read_sql(f"SELECT * FROM {table}", sql_server_conn)
    df.to_sql(table, postgres_engine, if_exists='replace', index=False)
    print(f"✅ {len(df)} registros migrados")

print("🎉 Migración completada!")