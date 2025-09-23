from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError, DataError
from datetime import datetime

from .config import engine, SessionLocal
from .models import Base, Usuario, RespSociodemografica, RespInteligenciasMultiples
from sqlalchemy.inspection import inspect as sa_inspect

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
    """Crea o actualiza el registro sociodemográfico de un usuario.
    Nota: Si se envía cualquier componente ICFES, se re-calcula el puntaje global
    usando la combinación de valores existentes en BD + nuevos del payload, y se
    ignora cualquier valor manual enviado para puntaje_global_saber11.
    """
    # Normalizaciones específicas
    # Convertir strings vacíos a None y asegurar tipos básicos
    def _none_if_empty(v):
        return None if isinstance(v, str) and not v.strip() else v
    data = {k: _none_if_empty(v) for k, v in data.items()}

    # Ignorar cualquier valor manual para el global; se recalcula cuando haya datos suficientes
    if 'puntaje_global_saber11' in data:
        data.pop('puntaje_global_saber11', None)

    # Asegurar ints para miembros/ hermanos si vienen string
    for k in ('miembros_hogar', 'numero_hermanos', 'puntaje_global_saber11', 'puntaje_lectura_critica', 'puntaje_matematicas', 'puntaje_sociales_ciudadanas', 'puntaje_ciencias_naturales', 'puntaje_ingles'):
        if k in data and data[k] is not None:
            try:
                data[k] = int(data[k])
            except (TypeError, ValueError):
                data[k] = None

    # Clamp de puntajes
    def clamp(val, lo, hi):
        if val is None:
            return None
        return max(lo, min(hi, int(val)))
    for k, lo, hi in [
        ('puntaje_lectura_critica', 0, 100),
        ('puntaje_matematicas', 0, 100),
        ('puntaje_sociales_ciudadanas', 0, 100),
        ('puntaje_ciencias_naturales', 0, 100),
        ('puntaje_ingles', 0, 100),
    ]:
        if k in data:
            data[k] = clamp(data[k], lo, hi)

    # Buscar existente para poder combinar valores y recalcular global
    existente = db_session.query(RespSociodemografica).filter_by(id_usuario=id_usuario).first()

    # Recalcular global si existen TODOS los componentes tras combinar existente + data
    # Preferir valores del payload; si faltan, tomar los existentes
    def merged_value(key):
        return data.get(key) if key in data and data.get(key) is not None else (getattr(existente, key) if existente else None)

    comp_keys = [
        'puntaje_lectura_critica',
        'puntaje_matematicas',
        'puntaje_sociales_ciudadanas',
        'puntaje_ciencias_naturales',
        'puntaje_ingles',
    ]
    merged_comps = [merged_value(k) for k in comp_keys]
    if all(v is not None for v in merged_comps):
        ponderado = (3*(merged_comps[0] + merged_comps[1] + merged_comps[2] + merged_comps[3]) + merged_comps[4])
        data['puntaje_global_saber11'] = clamp(int(round((ponderado/13)*5)), 0, 500)
    # Filtrar solo campos mapeados en el modelo para evitar atributos no existentes
    mapped_cols = {c.key for c in sa_inspect(RespSociodemografica).mapper.column_attrs}
    data = {k: v for k, v in data.items() if k in mapped_cols}

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
    # Filtrar solo campos mapeados (soportar 35 preguntas)
    mapped_cols = {c.key for c in sa_inspect(RespInteligenciasMultiples).mapper.column_attrs}
    data = {k: v for k, v in data.items() if k in mapped_cols}

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