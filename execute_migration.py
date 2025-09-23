"""
Script para ejecutar la migración de cuestionarios dinámicos en Azure SQL
"""
import pyodbc
import getpass

def execute_migration():
    """Ejecuta la migración de cuestionarios dinámicos"""
    try:
        print("🚀 MIGRACIÓN DE CUESTIONARIOS DINÁMICOS")
        print("=" * 60)
        
        # Solicitar contraseña
        password = getpass.getpass("🔐 Contraseña para michsega17@gmail.com@stemdb: ")
        
        # Connection string
        conn_str = (
            "Driver={ODBC Driver 17 for SQL Server};"
            "Server=tcp:stemdb.database.windows.net,1433;"
            "Database=StemDB;"
            "Uid=michsega17@gmail.com@stemdb;"
            f"Pwd={password};"
            "Encrypt=yes;"
            "TrustServerCertificate=no;"
            "Connection Timeout=60;"
        )
        
        print("⏳ Conectando a Azure SQL...")
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        print("✅ Conexión exitosa!")
        
        # Leer el archivo de migración
        print("📖 Leyendo archivo de migración...")
        with open('database/migration_dynamic_questionnaires.sql', 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        # Dividir las instrucciones SQL
        sql_statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip()]
        
        print(f"🔧 Ejecutando {len(sql_statements)} instrucciones SQL...")
        
        for i, statement in enumerate(sql_statements, 1):
            if statement:
                try:
                    print(f"  [{i}/{len(sql_statements)}] Ejecutando: {statement[:50]}...")
                    cursor.execute(statement)
                    conn.commit()
                    print(f"  ✅ Completado")
                except Exception as e:
                    if "already exists" in str(e).lower():
                        print(f"  ⚠️  Tabla ya existe, continuando...")
                    else:
                        print(f"  ❌ Error: {e}")
                        raise
        
        print("\n🎉 ¡Migración completada exitosamente!")
        
        # Verificar que las tablas se crearon
        print("\n📋 Verificando tablas creadas...")
        cursor.execute("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME IN ('Cuestionarios', 'Preguntas', 'OpcionesPregunta', 'RespuestasCuestionario', 'RespuestasUsuario')
        """)
        
        tables = cursor.fetchall()
        print(f"✅ Tablas encontradas: {[table[0] for table in tables]}")
        
        cursor.close()
        conn.close()
        
        print("\n🎯 La migración se completó correctamente.")
        print("   Ahora puedes usar el sistema de cuestionarios dinámicos.")
        
    except Exception as e:
        print(f"\n❌ Error durante la migración: {e}")
        return False
    
    return True

if __name__ == "__main__":
    execute_migration()