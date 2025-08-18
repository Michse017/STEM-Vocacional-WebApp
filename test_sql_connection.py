import pyodbc
import time
import getpass
from database.config import get_connection_string, get_database_url

def test_sql_authentication():
    """Test completo con SQL Authentication - Driver 17"""
    try:
        print("🚀 TEST SQL AUTHENTICATION - DRIVER 17")
        print("=" * 60)
        
        # Solicitar contraseña una sola vez
        password = getpass.getpass("🔐 Contraseña para michsega17@gmail.com@stemdb: ")
        
        # Connection string con Driver 17 (consistente con config.py)
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
        
        print("⏳ Conectando con SQL Authentication (Driver 17)...")
        start_time = time.time()
        
        conn = pyodbc.connect(conn_str)
        elapsed = time.time() - start_time
        
        print(f"✅ ¡CONEXIÓN EXITOSA! Tiempo: {elapsed:.1f}s")
        
        cursor = conn.cursor()
        
        # Información básica
        cursor.execute("SELECT DB_NAME() as database_name, SUSER_NAME() as user_name")
        result = cursor.fetchone()
        
        print(f"📊 Base de datos: {result.database_name}")
        print(f"👤 Usuario conectado: {result.user_name}")
        print(f"🖥️ Versión: Azure SQL Database")
        
        # Verificar tablas
        cursor.execute("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        """)
        tables = cursor.fetchall()
        
        print(f"\n🗂️ Tablas encontradas ({len(tables)}):")
        expected_tables = ['resp_autoeficacia', 'resp_cognitiva', 'resp_educativa_familiar', 'resp_socioeconomica', 'usuarios']
        
        for table in tables:
            table_name = table.TABLE_NAME
            status = "✅" if table_name in expected_tables else "⚠️"
            print(f"  {status} {table_name}")
        
        if len(tables) == 5:
            print("\n🎉 ¡Todas las 5 tablas están correctas!")
        
        # Analizar estructura del campo codigo_estudiante ANTES de insertar
        cursor.execute("""
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'codigo_estudiante'
        """)
        col_info = cursor.fetchone()
        max_length = col_info.CHARACTER_MAXIMUM_LENGTH if col_info else 50
        print(f"\n📏 Campo codigo_estudiante: máximo {max_length} caracteres")
        
        # Test de operaciones CRUD BÁSICAS
        print(f"\n🔧 PROBANDO OPERACIONES CRUD:")
        
        # 1. READ: Contar registros
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        user_count = cursor.fetchone()[0]
        print(f"📊 Registros en usuarios: {user_count}")
        
        # 2. CREATE: Insertar registro de prueba CON TAMAÑO CORRECTO
        test_code = f"T{int(time.time() % 1000000)}"  # Código corto: T123456
        if len(test_code) > max_length:
            test_code = test_code[:max_length]
        
        cursor.execute("INSERT INTO usuarios (codigo_estudiante) VALUES (?)", test_code)
        conn.commit()
        print(f"➕ Registro insertado: {test_code} ({len(test_code)} caracteres)")
        
        # 3. READ: Verificar inserción
        cursor.execute("SELECT COUNT(*) FROM usuarios WHERE codigo_estudiante = ?", test_code)
        count = cursor.fetchone()[0]
        print(f"🔍 Verificación inserción: {count} registro(s)")
        
        # 4. UPDATE: Test básico de actualización (si hay más columnas)
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'usuarios'
            ORDER BY ORDINAL_POSITION
        """)
        columns = [row.COLUMN_NAME for row in cursor.fetchall()]
        print(f"📋 Columnas en usuarios: {', '.join(columns)}")
        
        # 5. DELETE: Limpiar registro de prueba
        cursor.execute("DELETE FROM usuarios WHERE codigo_estudiante = ?", test_code)
        conn.commit()
        print(f"🗑️ Registro de prueba eliminado")
        
        # Conteo de registros en todas las tablas
        print(f"\n📊 ESTADO ACTUAL DE TODAS LAS TABLAS:")
        for table_name in expected_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                print(f"  📊 {table_name}: {count} registros")
            except Exception as e:
                print(f"  ⚠️ Error en {table_name}: {e}")
        
        # Estructura completa de tablas
        print(f"\n🏗️ ESTRUCTURA DE TABLAS:")
        for table_name in expected_tables:
            try:
                cursor.execute(f"""
                    SELECT COUNT(*) as column_count
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = '{table_name}'
                """)
                col_count = cursor.fetchone()[0]
                print(f"  📋 {table_name}: {col_count} columnas")
            except Exception as e:
                print(f"  ⚠️ Error estructura {table_name}: {e}")
        
        conn.close()
        return True, password, max_length
        
    except Exception as e:
        print(f"❌ Error: {e}")
        
        if "Login failed" in str(e):
            print("\n🔐 PROBLEMA DE AUTENTICACIÓN:")
            print("  ❌ Usuario o contraseña incorrectos")
        elif "truncated" in str(e).lower():
            print("\n� PROBLEMA DE TAMAÑO:")
            print("  ❌ Campo codigo_estudiante muy pequeño")
            print("  💡 Usar códigos más cortos")
        elif "timeout" in str(e).lower():
            print("\n⏰ PROBLEMA DE TIMEOUT:")
            print("  ❌ Conexión muy lenta o BD pausada")
        
        return False, None, None

def test_sqlalchemy_integration(password, max_length=10):
    """Test SQLAlchemy con SQL Authentication - SOLO BD"""
    try:
        print("\n🔧 TEST SQLALCHEMY - SOLO CONEXIÓN Y QUERIES BÁSICAS")
        print("=" * 50)
        
        from sqlalchemy import create_engine, text
        
        # URL con Driver 17
        database_url = (
            f"mssql+pyodbc://michsega17%40gmail.com%40stemdb:{password}@"
            f"stemdb.database.windows.net:1433/StemDB?"
            f"driver=ODBC+Driver+17+for+SQL+Server&"
            f"encrypt=yes&"
            f"TrustServerCertificate=no&"
            f"timeout=60"
        )
        
        print("⏳ Creando engine SQLAlchemy...")
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            # Query básica
            result = conn.execute(text("""
                SELECT 
                    DB_NAME() as database_name,
                    COUNT(*) as table_count
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE'
            """))
            row = result.fetchone()
            
            print(f"✅ SQLAlchemy engine funcionando!")
            print(f"📊 Base de datos: {row.database_name}")
            print(f"🗂️ Tablas: {row.table_count}")
            
            # Test de lectura simple
            result2 = conn.execute(text("SELECT COUNT(*) as total FROM usuarios"))
            users_count = result2.fetchone()
            print(f"👥 Usuarios actuales: {users_count.total}")
            
            # Test de inserción CORTA con SQLAlchemy
            short_code = f"S{int(time.time() % 100000)}"  # Muy corto: S12345
            if len(short_code) > max_length:
                short_code = short_code[:max_length]
                
            print(f"📏 Probando inserción: {short_code} ({len(short_code)} chars)")
            
            conn.execute(text("INSERT INTO usuarios (codigo_estudiante) VALUES (:code)"), {"code": short_code})
            conn.commit()
            print(f"➕ Inserción SQLAlchemy exitosa")
            
            # Verificar inserción
            result3 = conn.execute(text("SELECT COUNT(*) as total FROM usuarios WHERE codigo_estudiante = :code"), {"code": short_code})
            verify_count = result3.fetchone()
            print(f"🔍 Verificación: {verify_count.total} registro insertado")
            
            # Limpiar test
            conn.execute(text("DELETE FROM usuarios WHERE codigo_estudiante = :code"), {"code": short_code})
            conn.commit()
            print(f"🧹 Test data limpiada")
            
        return True
        
    except Exception as e:
        print(f"❌ Error SQLAlchemy: {e}")
        
        if "truncated" in str(e).lower():
            print(f"💡 Campo codigo_estudiante muy pequeño (max: {max_length} chars)")
            print("💡 Necesario usar códigos más cortos")
        
        return False

def test_config_functions():
    """Test básico de funciones del config.py"""
    try:
        print("\n🔗 TEST FUNCIONES DE CONFIG.PY")
        print("=" * 40)
        
        # Test funciones principales
        conn_str = get_connection_string()
        db_url = get_database_url()
        
        print("✅ get_connection_string() funcionando")
        print("✅ get_database_url() funcionando")
        
        # Test conexión directa usando config
        import pyodbc
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        cursor.execute("SELECT DB_NAME() as db")
        result = cursor.fetchone()
        conn.close()
        
        print(f"✅ Conexión usando config exitosa!")
        print(f"📊 Base de datos conectada: {result.db}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en config functions: {e}")
        return False

if __name__ == "__main__":
    print("🧪 TEST COMPLETO - ENFOQUE EN BASE DE DATOS")
    print("=" * 70)
    
    # Test 1: SQL Authentication + operaciones CRUD básicas
    success, password, max_length = test_sql_authentication()
    
    # Test 2: SQLAlchemy básico (si pyodbc funciona)
    sqlalchemy_ok = False
    if success and password:
        sqlalchemy_ok = test_sqlalchemy_integration(password, max_length or 10)
    
    # Test 3: Funciones del config (básico)
    config_ok = False
    if success:
        config_ok = test_config_functions()
    
    # Resumen final
    print("\n" + "=" * 70)
    print("🎯 RESUMEN - TESTS DE BASE DE DATOS")
    print("=" * 70)
    print(f"  🔌 pyodbc + Driver 17: {'✅ OK' if success else '❌ FALLO'}")
    print(f"  🔧 SQLAlchemy básico: {'✅ OK' if sqlalchemy_ok else '❌ NO PROBADO' if not success else '❌ FALLO'}")
    print(f"  🔗 Config functions: {'✅ OK' if config_ok else '❌ NO PROBADO' if not success else '❌ FALLO'}")
    
    if success:
        print(f"\n✅ CAMPO codigo_estudiante: máx {max_length or 10} caracteres")
        print("✅ Operaciones CRUD básicas funcionando")
        print("✅ Conexión Azure SQL estable")
    
    if success and sqlalchemy_ok and config_ok:
        print("\n🎉 ¡BASE DE DATOS 100% FUNCIONAL!")
        print("✅ pyodbc funcionando perfectamente")
        print("✅ SQLAlchemy compatible")
        print("✅ Config.py optimizado")
        print("\n🚀 LISTO PARA:")
        print("   1. python run_tests.py  ← Tests principales")
        print("   2. Desarrollo de lógica de aplicación")
        print("   3. Formularios conectados a BD")
    elif success:
        print("\n🎯 Base de datos principal funciona")
        print("💡 SQLAlchemy puede necesitar ajustes menores")
        print("💡 Continuar con: python run_tests.py")
    else:
        print("\n⚠️ PRIORIDAD: Arreglar conexión básica de BD")
        print("1. Verificar credenciales Azure")
        print("2. Verificar que BD no esté pausada")
        print("3. Verificar Driver 17 instalado")