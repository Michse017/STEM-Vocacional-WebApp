import pyodbc
import getpass

def insert_simple_user():
    """Insertar SOLO en tabla usuarios - función básica"""
    try:
        print("👤 INSERCIÓN SIMPLE - SOLO TABLA USUARIOS")
        print("=" * 50)
        
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
        
        # Códigos universitarios para insertar
        estudiantes = [
            "T00066207",
            "T00078445", 
            "T00091523",
            "T00055891",
            "T00047229"
        ]
        
        print(f"\n📝 INSERTANDO {len(estudiantes)} ESTUDIANTES:")
        
        inserted_count = 0
        
        for i, codigo in enumerate(estudiantes, 1):
            try:
                print(f"  👤 [{i}/{len(estudiantes)}] Insertando: {codigo}")
                
                # SOLO insertar en usuarios
                cursor.execute("""
                    INSERT INTO usuarios (codigo_estudiante) 
                    VALUES (?)
                """, codigo)
                
                print(f"    ✅ {codigo} insertado")
                inserted_count += 1
                
            except pyodbc.IntegrityError as e:
                if "duplicate" in str(e).lower() or "primary key" in str(e).lower():
                    print(f"    ⚠️ {codigo} ya existe (duplicado)")
                else:
                    print(f"    ❌ Error con {codigo}: {e}")
            except Exception as e:
                print(f"    ❌ Error con {codigo}: {e}")
        
        # Commit todas las inserciones
        conn.commit()
        print(f"\n� Commit realizado - {inserted_count} nuevos estudiantes")
        
        # Verificar lo que hay en la tabla
        print(f"\n� VERIFICANDO TABLA USUARIOS:")
        cursor.execute("SELECT * FROM usuarios ORDER BY id_usuario")
        users = cursor.fetchall()
        
        print(f"📊 Total usuarios en BD: {len(users)}")
        for user in users:
            print(f"  ID: {user[0]}, Código: {user[1]}")
        
        conn.close()
        
        print(f"\n🎉 RESULTADO:")
        print(f"✅ {inserted_count} estudiantes nuevos insertados")
        print(f"📊 {len(users)} estudiantes total en BD")
        
        print(f"\n🔍 QUERIES PARA AZURE PORTAL:")
        print(f"SELECT * FROM usuarios;")
        print(f"SELECT COUNT(*) as total FROM usuarios;")
        
        return True, len(users)
        
    except Exception as e:
        print(f"❌ Error general: {e}")
        return False, 0

def check_table_structure():
    """Verificar estructura real de todas las tablas"""
    try:
        print("\n�️ VERIFICANDO ESTRUCTURA DE TABLAS")
        print("=" * 50)
        
        password = getpass.getpass("🔐 Contraseña para verificación: ")
        
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
        
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # Ver todas las tablas
        cursor.execute("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        """)
        tables = cursor.fetchall()
        
        print(f"📋 TABLAS ENCONTRADAS ({len(tables)}):")
        
        for table in tables:
            table_name = table[0]
            print(f"\n🗂️ TABLA: {table_name}")
            
            # Ver columnas de cada tabla
            cursor.execute("""
                SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = ?
                ORDER BY ORDINAL_POSITION
            """, table_name)
            
            columns = cursor.fetchall()
            for col in columns:
                length_info = f"({col[2]})" if col[2] else ""
                nullable = "NULL" if col[3] == "YES" else "NOT NULL"
                print(f"  📄 {col[0]}: {col[1]}{length_info} {nullable}")
            
            # Contar registros
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                print(f"  📊 Registros: {count}")
            except Exception as e:
                print(f"  ❌ Error contando: {e}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error verificando estructura: {e}")
        return False

if __name__ == "__main__":
    print("👤 INSERCIÓN SIMPLE Y VERIFICACIÓN DE ESTRUCTURA")
    print("=" * 60)
    
    opcion = input("¿Qué quieres hacer?\n1. Insertar usuarios simples\n2. Ver estructura de tablas\n3. Ambos\nOpción [1/2/3]: ").strip()
    
    if opcion == "2":
        # Solo verificar estructura
        check_table_structure()
    elif opcion == "3":
        # Ambos
        success, total = insert_simple_user()
        if success:
            print("\n" + "="*60)
            check_table_structure()
    else:
        # Solo insertar (por defecto)
        success, total = insert_simple_user()
        
        if success:
            print(f"\n🎯 ¡INSERCIÓN EXITOSA!")
            print(f"� {total} usuarios en total en la base de datos")
            print(f"\n🔍 Ve a Azure Portal Query Editor y ejecuta:")
            print(f"   SELECT * FROM usuarios;")
        else:
            print(f"\n❌ Error en la inserción")