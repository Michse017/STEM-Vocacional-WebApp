#!/usr/bin/env python3
"""
Script alternativo para crear las tablas del sistema dinámico usando SQL directo
que es compatible con las restricciones de SQL Server.
"""

import sys
import os

# Agregar el directorio padre al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.controller import engine
from sqlalchemy import text

def create_tables_sql_server():
    """
    Crea las tablas usando SQL directo compatible con SQL Server.
    """
    try:
        print("🔄 Conectando a la base de datos...")
        
        # SQL para crear las tablas en orden específico
        sql_commands = [
            # 1. Tabla cuestionarios
            """
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cuestionarios' AND xtype='U')
            CREATE TABLE cuestionarios (
                id_cuestionario INTEGER NOT NULL IDENTITY(1,1),
                titulo NVARCHAR(200) NOT NULL,
                descripcion NVARCHAR(max),
                categoria NVARCHAR(100),
                activo BIT DEFAULT 1,
                orden INTEGER DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_cuestionario)
            )
            """,
            
            # 2. Tabla preguntas
            """
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='preguntas' AND xtype='U')
            CREATE TABLE preguntas (
                id_pregunta INTEGER NOT NULL IDENTITY(1,1),
                id_cuestionario INTEGER NOT NULL,
                texto NVARCHAR(max) NOT NULL,
                tipo_pregunta NVARCHAR(50) NOT NULL,
                requerida BIT DEFAULT 0,
                orden INTEGER NOT NULL,
                activa BIT DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_pregunta),
                FOREIGN KEY(id_cuestionario) REFERENCES cuestionarios (id_cuestionario) ON DELETE CASCADE
            )
            """,
            
            # 3. Tabla opciones_pregunta
            """
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='opciones_pregunta' AND xtype='U')
            CREATE TABLE opciones_pregunta (
                id_opcion INTEGER NOT NULL IDENTITY(1,1),
                id_pregunta INTEGER NOT NULL,
                texto NVARCHAR(200) NOT NULL,
                valor NVARCHAR(100),
                orden INTEGER NOT NULL,
                activa BIT DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_opcion),
                FOREIGN KEY(id_pregunta) REFERENCES preguntas (id_pregunta) ON DELETE CASCADE
            )
            """,
            
            # 4. Tabla respuestas_cuestionario
            """
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='respuestas_cuestionario' AND xtype='U')
            CREATE TABLE respuestas_cuestionario (
                id_respuesta_cuestionario INTEGER NOT NULL IDENTITY(1,1),
                id_usuario INTEGER NOT NULL,
                id_cuestionario INTEGER NOT NULL,
                completado BIT DEFAULT 0,
                fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_completado DATETIME,
                PRIMARY KEY (id_respuesta_cuestionario),
                FOREIGN KEY(id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE,
                FOREIGN KEY(id_cuestionario) REFERENCES cuestionarios (id_cuestionario) ON DELETE CASCADE
            )
            """,
            
            # 5. Tabla respuestas_usuario (SIN CASCADE en id_pregunta para evitar ciclos)
            """
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='respuestas_usuario' AND xtype='U')
            CREATE TABLE respuestas_usuario (
                id_respuesta INTEGER NOT NULL IDENTITY(1,1),
                id_respuesta_cuestionario INTEGER NOT NULL,
                id_pregunta INTEGER NOT NULL,
                valor_respuesta NVARCHAR(max),
                fecha_respuesta DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_respuesta),
                FOREIGN KEY(id_respuesta_cuestionario) REFERENCES respuestas_cuestionario (id_respuesta_cuestionario) ON DELETE CASCADE,
                FOREIGN KEY(id_pregunta) REFERENCES preguntas (id_pregunta)
            )
            """
        ]
        
        table_names = ['cuestionarios', 'preguntas', 'opciones_pregunta', 'respuestas_cuestionario', 'respuestas_usuario']
        
        with engine.connect() as connection:
            for i, sql in enumerate(sql_commands):
                try:
                    connection.execute(text(sql))
                    connection.commit()
                    print(f"✅ Tabla '{table_names[i]}' creada/verificada exitosamente")
                except Exception as e:
                    error_msg = str(e)
                    if "already exists" in error_msg.lower() or "duplicate" in error_msg.lower():
                        print(f"ℹ️  Tabla '{table_names[i]}' ya existe")
                    else:
                        print(f"⚠️  Tabla '{table_names[i]}': {error_msg}")
        
        print("\n🎉 Migración SQL Server completada exitosamente!")
        return True
        
    except Exception as e:
        print(f"❌ Error durante la migración SQL: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def insert_sample_questionnaire_sql():
    """
    Inserta un cuestionario de prueba usando SQL directo.
    """
    try:
        with engine.connect() as connection:
            # Verificar si ya existe
            result = connection.execute(text("SELECT COUNT(*) as count FROM cuestionarios WHERE titulo = 'Cuestionario de Prueba SQL'"))
            count = result.fetchone()[0]
            
            if count > 0:
                print("📋 Cuestionario de prueba SQL ya existe")
                return True
            
            print("📝 Insertando cuestionario de prueba SQL...")
            
            # Insertar cuestionario
            connection.execute(text("""
                INSERT INTO cuestionarios (titulo, descripcion, categoria, activo, orden)
                VALUES ('Cuestionario de Prueba SQL', 'Cuestionario creado con SQL directo', 'test', 1, 1)
            """))
            
            # Obtener el ID del cuestionario
            result = connection.execute(text("SELECT id_cuestionario FROM cuestionarios WHERE titulo = 'Cuestionario de Prueba SQL'"))
            cuestionario_id = result.fetchone()[0]
            
            # Insertar pregunta
            connection.execute(text(f"""
                INSERT INTO preguntas (id_cuestionario, texto, tipo_pregunta, requerida, orden, activa)
                VALUES ({cuestionario_id}, '¿Funciona el sistema con SQL directo?', 'seleccion_unica', 1, 1, 1)
            """))
            
            # Obtener el ID de la pregunta
            result = connection.execute(text(f"SELECT id_pregunta FROM preguntas WHERE id_cuestionario = {cuestionario_id}"))
            pregunta_id = result.fetchone()[0]
            
            # Insertar opciones
            opciones = [
                ("Sí, funciona perfectamente", "si", 1),
                ("Funciona bien", "bien", 2),
                ("Hay algunos problemas", "problemas", 3)
            ]
            
            for texto, valor, orden in opciones:
                connection.execute(text(f"""
                    INSERT INTO opciones_pregunta (id_pregunta, texto, valor, orden, activa)
                    VALUES ({pregunta_id}, '{texto}', '{valor}', {orden}, 1)
                """))
            
            connection.commit()
            print("✅ Cuestionario de prueba SQL insertado exitosamente")
            return True
            
    except Exception as e:
        print(f"❌ Error insertando cuestionario de prueba SQL: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Iniciando migración SQL Server...")
    print("=" * 60)
    
    # Crear tablas
    success = create_tables_sql_server()
    
    if success:
        print("\n" + "=" * 60)
        print("📝 Insertando datos de prueba...")
        insert_sample_questionnaire_sql()
        
        print("\n" + "=" * 60)
        print("🎉 ¡Migración SQL Server completada exitosamente!")
        print("🌐 El sistema dinámico de cuestionarios está listo para usar")
        print("📱 Puedes acceder a la administración desde el frontend")
    else:
        print("\n" + "=" * 60)
        print("❌ La migración falló. Revisa los errores anteriores.")
        sys.exit(1)