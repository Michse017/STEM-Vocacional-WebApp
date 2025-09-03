from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError, DataError
from datetime import datetime

from .config import engine, SessionLocal
from .models import Base, Usuario, RespSociodemografica, RespInteligenciasMultiples

# --- Funciones de Gestión de la Base de Datos ---

def create_all_tables():
    """
    Crea todas las tablas definidas en los modelos (models.py) si no existen.
    Es seguro ejecutar esta función incluso si las tablas ya están creadas en la BD.
    Útil para inicializar entornos de desarrollo o pruebas.
    """
    Base.metadata.create_all(engine)

def validate_data(data, fields_to_validate):
    """
    Valida y limpia los datos de entrada antes de insertarlos en la base de datos.
    """
    validated_data = {}
    for field, validation_rules in fields_to_validate.items():
        value = data.get(field)
        
        # Si el valor es una cadena vacía, se trata como nulo
        if isinstance(value, str) and not value.strip():
            value = None

        # Si se requiere un tipo de dato específico (ej. 'int' o 'date')
        if 'type' in validation_rules and value is not None:
            try:
                if validation_rules['type'] == 'int':
                    value = int(value)
                elif validation_rules['type'] == 'date':
                    # Se asume formato YYYY-MM-DD, si no, se ajusta o se deja como None
                    value = datetime.strptime(value, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                value = None # Si la conversión falla, se asigna None

        # Validación de rangos numéricos
        if 'range' in validation_rules and value is not None:
            min_val, max_val = validation_rules['range']
            if not (min_val <= value <= max_val):
                value = None # No cumple con el rango

        validated_data[field] = value
        
    return validated_data

# ============================================================================
# OPERACIONES CON USUARIOS
# ============================================================================

def get_usuario_by_codigo(db_session: Session, codigo_estudiante: str) -> Usuario | None:
    """Busca un usuario por su código de estudiante. Devuelve el objeto o None."""
    return db_session.query(Usuario).filter(Usuario.codigo_estudiante == codigo_estudiante).first()

def create_usuario(db_session: Session, codigo_estudiante: str) -> Usuario:
    """Crea un nuevo usuario en la base de datos y devuelve el objeto."""
    try:
        nuevo_usuario = Usuario(codigo_estudiante=codigo_estudiante)
        db_session.add(nuevo_usuario)
        db_session.commit()
        db_session.refresh(nuevo_usuario)
        return nuevo_usuario
    except (IntegrityError, DataError) as e:
        db_session.rollback()
        print(f"Error de base de datos al crear usuario: {e}")
        raise

def get_user_with_responses(db_session: Session, id_usuario: int) -> Usuario | None:
    """Obtiene un usuario y precarga sus respuestas de ambos cuestionarios."""
    return (
        db_session.query(Usuario)
        .filter_by(id_usuario=id_usuario)
        .options(
            joinedload(Usuario.sociodemografica),
            joinedload(Usuario.inteligencias_multiples)
        )
        .first()
    )

# ============================================================================
# OPERACIONES CON RESPUESTAS (UPSERT)
# ============================================================================

def upsert_sociodemografica(db_session: Session, id_usuario: int, data: dict):
    """Crea o actualiza el registro sociodemográfico de un usuario."""
    try:
        existente = db_session.query(RespSociodemografica).filter_by(id_usuario=id_usuario).first()
        
        if existente:
            for key, value in data.items():
                setattr(existente, key, value)
        else:
            nuevo_registro = RespSociodemografica(id_usuario=id_usuario, **data)
            db_session.add(nuevo_registro)
        
        db_session.commit()
    except (IntegrityError, DataError) as e:
        db_session.rollback()
        print(f"Error de BD al guardar datos sociodemográficos: {e}")
        raise

def upsert_inteligencias_multiples(db_session: Session, id_usuario: int, data: dict):
    """Crea o actualiza las respuestas de inteligencias múltiples de un usuario."""
    try:
        existente = db_session.query(RespInteligenciasMultiples).filter_by(id_usuario=id_usuario).first()
        
        if existente:
            for key, value in data.items():
                setattr(existente, key, value)
        else:
            nuevo_registro = RespInteligenciasMultiples(id_usuario=id_usuario, **data)
            db_session.add(nuevo_registro)

        db_session.commit()
    except (IntegrityError, DataError) as e:
        db_session.rollback()
        print(f"Error de BD al guardar inteligencias múltiples: {e}")
        raise

# ============================================================================
# HERRAMIENTA DE LÍNEA DE COMANDOS (CLI) PARA PRUEBAS
# ============================================================================

def _to_dict(obj):
    """Convierte un objeto SQLAlchemy a un diccionario (solo para la CLI)."""
    if not obj:
        return None
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}

if __name__ == '__main__':
    print("Ejecutando CLI de gestión de base de datos...")
    
    # El CLI gestiona su propia sesión para cada operación
    db = SessionLocal()
    try:
        # Ejemplo de uso: Crear un usuario
        print("\nCreando usuario de prueba 'test-cli-001'...")
        usuario_existente = get_usuario_by_codigo(db, 'test-cli-001')
        if not usuario_existente:
            nuevo = create_usuario(db, 'test-cli-001')
            print(f"Usuario creado con ID: {nuevo.id_usuario}")
        else:
            print("El usuario 'test-cli-001' ya existe.")

        # Ejemplo de uso: Obtener un usuario
        print("\nObteniendo usuario 'test-cli-001'...")
        usuario = get_usuario_by_codigo(db, 'test-cli-001')
        if usuario:
            print(f"Usuario encontrado: ID={usuario.id_usuario}, Código={usuario.codigo_estudiante}")
        else:
            print("Usuario no encontrado.")

    except Exception as e:
        print(f"Ocurrió un error en la operación de CLI: {e}")
    finally:
        db.close()
        print("\nSesión de base de datos cerrada. Fin del script.")