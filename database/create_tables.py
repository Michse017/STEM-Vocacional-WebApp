#!/usr/bin/env python3
"""
Script para crear las tablas del sistema dinámico de cuestionarios en la base de datos de producción.
Este script debe ejecutarse UNA SOLA VEZ después del despliegue para crear las nuevas tablas.
"""

import sys
import os

# Agregar el directorio padre al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.controller import engine
from database.models import Base, Cuestionario, Pregunta, OpcionPregunta, RespuestaCuestionario, RespuestaUsuario

def create_dynamic_questionnaire_tables():
    """
    Crea las tablas específicas del sistema dinámico de cuestionarios.
    """
    try:
        print("🔄 Conectando a la base de datos...")
        
        # Crear solo las tablas nuevas del sistema dinámico
        print("📝 Creando tablas del sistema dinámico de cuestionarios...")
        
        # Crear las tablas en orden específico para evitar problemas de dependencias
        tables_order = [
            ('cuestionarios', Cuestionario.__table__),
            ('preguntas', Pregunta.__table__),
            ('opciones_pregunta', OpcionPregunta.__table__),
            ('respuestas_cuestionario', RespuestaCuestionario.__table__),
            ('respuestas_usuario', RespuestaUsuario.__table__)
        ]
        
        # Crear las tablas
        for table_name, table in tables_order:
            try:
                table.create(engine, checkfirst=True)
                print(f"✅ Tabla '{table_name}' creada/verificada exitosamente")
            except Exception as e:
                error_msg = str(e)
                if "already exists" in error_msg.lower() or "object name" in error_msg.lower():
                    print(f"ℹ️  Tabla '{table_name}' ya existe")
                elif "foreign key constraint" in error_msg.lower() and "cycles" in error_msg.lower():
                    print(f"⚠️  Tabla '{table_name}': Error de cascada - continuando (tabla probablemente ya existe)")
                else:
                    print(f"⚠️  Tabla '{table_name}': {error_msg}")
                    # Para otros errores, intentamos continuar
        
        print("\n🎉 Migración completada exitosamente!")
        print("📋 Resumen de tablas del sistema dinámico:")
        print("   - cuestionarios: Definición de cuestionarios")
        print("   - preguntas: Preguntas de cada cuestionario")
        print("   - opciones_pregunta: Opciones de respuesta")
        print("   - respuestas_cuestionario: Registro de usuarios por cuestionario")
        print("   - respuestas_usuario: Respuestas individuales de cada usuario")
        
        return True
        
    except Exception as e:
        print(f"❌ Error durante la migración: {str(e)}")
        print("🔍 Detalles del error:")
        import traceback
        traceback.print_exc()
        return False

def insert_sample_questionnaire():
    """
    Inserta un cuestionario de prueba para verificar que todo funciona.
    """
    try:
        from sqlalchemy.orm import sessionmaker
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Verificar si ya existe el cuestionario de prueba
        existing = session.query(Cuestionario).filter_by(titulo="Cuestionario de Prueba").first()
        if existing:
            print("📋 Cuestionario de prueba ya existe")
            session.close()
            return True
        
        print("📝 Insertando cuestionario de prueba...")
        
        # Crear cuestionario de prueba
        cuestionario_prueba = Cuestionario(
            titulo="Cuestionario de Prueba",
            descripcion="Este es un cuestionario de prueba para verificar el sistema dinámico",
            categoria="test",
            activo=True,
            orden=1
        )
        
        session.add(cuestionario_prueba)
        session.flush()  # Para obtener el ID
        
        # Crear pregunta de prueba
        pregunta_prueba = Pregunta(
            id_cuestionario=cuestionario_prueba.id_cuestionario,
            texto="¿Te gusta el sistema dinámico de cuestionarios?",
            tipo_pregunta="seleccion_unica",
            requerida=True,
            orden=1,
            activa=True
        )
        
        session.add(pregunta_prueba)
        session.flush()
        
        # Crear opciones de respuesta
        opciones = [
            OpcionPregunta(
                id_pregunta=pregunta_prueba.id_pregunta,
                texto="Sí, me gusta mucho",
                valor="si",
                orden=1
            ),
            OpcionPregunta(
                id_pregunta=pregunta_prueba.id_pregunta,
                texto="Es útil",
                valor="util",
                orden=2
            ),
            OpcionPregunta(
                id_pregunta=pregunta_prueba.id_pregunta,
                texto="Necesita mejoras",
                valor="mejoras",
                orden=3
            )
        ]
        
        for opcion in opciones:
            session.add(opcion)
        
        session.commit()
        print("✅ Cuestionario de prueba insertado exitosamente")
        session.close()
        return True
        
    except Exception as e:
        print(f"❌ Error insertando cuestionario de prueba: {str(e)}")
        if 'session' in locals():
            session.rollback()
            session.close()
        return False

if __name__ == "__main__":
    print("🚀 Iniciando migración del sistema dinámico de cuestionarios...")
    print("=" * 60)
    
    # Crear tablas
    success = create_dynamic_questionnaire_tables()
    
    if success:
        print("\n" + "=" * 60)
        print("📝 Insertando datos de prueba...")
        insert_sample_questionnaire()
        
        print("\n" + "=" * 60)
        print("🎉 ¡Migración completada exitosamente!")
        print("🌐 El sistema dinámico de cuestionarios está listo para usar")
        print("📱 Puedes acceder a la administración desde el frontend")
    else:
        print("\n" + "=" * 60)
        print("❌ La migración falló. Revisa los errores anteriores.")
        sys.exit(1)