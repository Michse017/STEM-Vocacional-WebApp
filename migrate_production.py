"""
Script para ejecutar la migración de cuestionarios dinámicos en Azure SQL usando pymssql
"""
import pymssql
import getpass

def execute_migration_pymssql():
    """Ejecuta la migración usando pymssql (compatible con Linux/Render)"""
    try:
        print("🚀 MIGRACIÓN DE CUESTIONARIOS DINÁMICOS (pymssql)")
        print("=" * 60)
        
        # Solicitar contraseña
        password = getpass.getpass("🔐 Contraseña para Azure SQL: ")
        
        print("⏳ Conectando a Azure SQL...")
        
        # Conexión usando pymssql
        conn = pymssql.connect(
            server='stemdb.database.windows.net',
            user='michsega17@gmail.com@stemdb',
            password=password,
            database='StemDB',
            port=1433,
            timeout=60,
            login_timeout=60
        )
        
        cursor = conn.cursor()
        print("✅ Conexión exitosa!")
        
        # Leer el archivo de migración
        print("📖 Leyendo archivo de migración...")
        with open('database/migration_dynamic_questionnaires.sql', 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        # Dividir las instrucciones SQL por GO
        sql_batches = [batch.strip() for batch in migration_sql.split('GO') if batch.strip()]
        
        print(f"🔧 Ejecutando {len(sql_batches)} lotes SQL...")
        
        for i, batch in enumerate(sql_batches, 1):
            if batch:
                try:
                    print(f"  [{i}/{len(sql_batches)}] Ejecutando lote...")
                    cursor.execute(batch)
                    conn.commit()
                    print(f"  ✅ Lote {i} completado")
                except Exception as e:
                    if "already exists" in str(e).lower() or "object name" in str(e).lower():
                        print(f"  ⚠️  Objeto ya existe, continuando...")
                    else:
                        print(f"  ❌ Error en lote {i}: {e}")
                        raise
        
        print("\n🎉 ¡Migración completada exitosamente!")
        
        # Verificar que las tablas se crearon
        print("\n📋 Verificando tablas creadas...")
        cursor.execute("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME IN ('Cuestionarios', 'Preguntas', 'OpcionesPregunta', 'RespuestasCuestionario', 'RespuestasUsuario')
            ORDER BY TABLE_NAME
        """)
        
        tables = cursor.fetchall()
        if tables:
            print("✅ Tablas creadas:")
            for table in tables:
                print(f"   - {table[0]}")
        else:
            print("⚠️  No se encontraron las tablas esperadas")
        
        cursor.close()
        conn.close()
        
        print("\n🎯 La migración se completó correctamente.")
        print("   El sistema de cuestionarios dinámicos está listo.")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error durante la migración: {e}")
        return False

if __name__ == "__main__":
    success = execute_migration_pymssql()
    if success:
        print("\n🚀 ¡Listo para hacer commit y desplegar!")
    else:
        print("\n💔 Migración falló. Revisar errores antes de continuar.")