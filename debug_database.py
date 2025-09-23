"""
Script de debug para identificar por qué is_database_available() falla
"""

import os
import sys

# Agregar el directorio padre al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from database.config import engine, SessionLocal
    from database.controller import is_database_available
    
    print("=== DEBUG DATABASE AVAILABILITY ===")
    print(f"engine: {engine}")
    print(f"engine is not None: {engine is not None}")
    print(f"SessionLocal: {SessionLocal}")  
    print(f"SessionLocal is not None: {SessionLocal is not None}")
    print(f"is_database_available(): {is_database_available()}")
    
    if engine is not None:
        print("Engine existe, probando conexión...")
        try:
            with engine.connect() as conn:
                result = conn.execute("SELECT 1").fetchone()
                print(f"✅ Conexión exitosa: {result}")
        except Exception as e:
            print(f"❌ Error de conexión: {e}")
    else:
        print("❌ Engine es None")
        
    if SessionLocal is not None:
        print("SessionLocal existe, probando sesión...")
        try:
            session = SessionLocal()
            print(f"✅ Sesión creada exitosamente: {session}")
            session.close()
        except Exception as e:
            print(f"❌ Error creando sesión: {e}")
    else:
        print("❌ SessionLocal es None")
        
except Exception as e:
    print(f"Error importando: {e}")
    import traceback
    traceback.print_exc()