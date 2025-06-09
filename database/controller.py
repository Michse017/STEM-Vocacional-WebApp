from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError, DataError
from .models import Base, Usuario, RespCognitiva, RespEducativaFamiliar, RespSocioeconomica, RespAutoeficacia
from .config import DATABASE_URL
from datetime import datetime

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def create_all_tables():
    Base.metadata.create_all(engine)

def get_usuario_by_codigo(codigo):
    session = Session()
    try:
        usuario = session.query(Usuario).filter_by(codigo_estudiante=codigo).first()
        return usuario
    finally:
        session.close()

def add_usuario(codigo):
    session = Session()
    try:
        usuario = Usuario(codigo_estudiante=codigo)
        session.add(usuario)
        session.commit()
        session.refresh(usuario)
        return usuario
    except IntegrityError:
        session.rollback()
        return None
    finally:
        session.close()

def delete_usuario(codigo):
    session = Session()
    try:
        usuario = session.query(Usuario).filter_by(codigo_estudiante=codigo).first()
        if usuario:
            session.delete(usuario)
            session.commit()
            return True
        return False
    finally:
        session.close()

def validate_numeric(val, minval=None, maxval=None):
    if val is None or val == '':
        return None
    try:
        n = float(val)
        if minval is not None and n < minval:
            return None
        if maxval is not None and n > maxval:
            return None
        return n
    except:
        return None

def upsert_cognitiva(id_usuario, data):
    session = Session()
    try:
        resp = session.query(RespCognitiva).filter_by(id_usuario=id_usuario).first()
        valid_data = {}
        # Validaciones
        for k in [
            'ptj_fisica', 'ptj_quimica', 'ptj_biologia', 'ptj_matematicas', 'ptj_geografia', 'ptj_historia',
            'ptj_filosofia', 'ptj_sociales_ciudadano', 'ptj_ciencias_sociales', 'ptj_lenguaje', 'ptj_lectura_critica',
            'ptj_ingles'
        ]:
            valid_data[k] = validate_numeric(data.get(k), 0, 100)
        valid_data['ecaes'] = validate_numeric(data.get('ecaes'))
        valid_data['pga_acumulado'] = validate_numeric(data.get('pga_acumulado'), 0, 5)
        valid_data['promedio_periodo'] = validate_numeric(data.get('promedio_periodo'), 0, 5)
        valid_data['fecha_respuesta'] = datetime.now()
        valid_data['fecha_actualizacion'] = datetime.now()
        if not resp:
            resp = RespCognitiva(id_usuario=id_usuario, **valid_data)
            session.add(resp)
        else:
            for k, v in valid_data.items():
                setattr(resp, k, v)
        session.commit()
    except (IntegrityError, DataError) as e:
        print(f"Error upsert_cognitiva: {e}")
        session.rollback()
        raise
    finally:
        session.close()

def upsert_educativa_familiar(id_usuario, data):
    session = Session()
    try:
        resp = session.query(RespEducativaFamiliar).filter_by(id_usuario=id_usuario).first()
        valid_data = {
            'colegio': data.get('colegio'),
            'ciudad_colegio': data.get('ciudad_colegio'),
            'depto_colegio': data.get('depto_colegio'),
            'municipio_colegio': data.get('municipio_colegio'),
            'fecha_graduacion': data.get('fecha_graduacion'),
            'fecha_respuesta': datetime.now(),
            'fecha_actualizacion': datetime.now()
        }
        if not resp:
            resp = RespEducativaFamiliar(id_usuario=id_usuario, **valid_data)
            session.add(resp)
        else:
            for k, v in valid_data.items():
                setattr(resp, k, v)
        session.commit()
    except (IntegrityError, DataError) as e:
        print(f"Error upsert_educativa_familiar: {e}")
        session.rollback()
        raise
    finally:
        session.close()

def upsert_socioeconomica(id_usuario, data):
    session = Session()
    try:
        resp = session.query(RespSocioeconomica).filter_by(id_usuario=id_usuario).first()
        valid_data = {
            'estrato': data.get('estrato'),
            'becas': data.get('becas'),
            'ceres': data.get('ceres'),
            'periodo_ingreso': data.get('periodo_ingreso'),
            'tipo_estudiante': data.get('tipo_estudiante'),
            'fecha_respuesta': datetime.now(),
            'fecha_actualizacion': datetime.now()
        }
        if not resp:
            resp = RespSocioeconomica(id_usuario=id_usuario, **valid_data)
            session.add(resp)
        else:
            for k, v in valid_data.items():
                setattr(resp, k, v)
        session.commit()
    except (IntegrityError, DataError) as e:
        print(f"Error upsert_socioeconomica: {e}")
        session.rollback()
        raise
    finally:
        session.close()

def upsert_autoeficacia(id_usuario, data):
    session = Session()
    try:
        resp = session.query(RespAutoeficacia).filter_by(id_usuario=id_usuario).first()
        valid_data = {
            'creditos_matriculados': validate_numeric(data.get('creditos_matriculados'), 0),
            'creditos_ganadas': validate_numeric(data.get('creditos_ganadas'), 0),
            'creditos_reprobadas': validate_numeric(data.get('creditos_reprobadas'), 0),
            'puntos_calidad_pga': validate_numeric(data.get('puntos_calidad_pga'), 0),
            'situacion': data.get('situacion'),
            'estado': data.get('estado'),
            'nro_materias_aprobadas': validate_numeric(data.get('nro_materias_aprobadas'), 0),
            'nro_materias_reprobadas': validate_numeric(data.get('nro_materias_reprobadas'), 0),
            'fecha_respuesta': datetime.now(),
            'fecha_actualizacion': datetime.now()
        }
        if not resp:
            resp = RespAutoeficacia(id_usuario=id_usuario, **valid_data)
            session.add(resp)
        else:
            for k, v in valid_data.items():
                setattr(resp, k, v)
        session.commit()
    except (IntegrityError, DataError) as e:
        print(f"Error upsert_autoeficacia: {e}")
        session.rollback()
        raise
    finally:
        session.close()

def get_usuario_full_responses(id_usuario):
    session = Session()
    result = {}

    cognitiva = session.query(RespCognitiva).filter_by(id_usuario=id_usuario).first()
    educativa = session.query(RespEducativaFamiliar).filter_by(id_usuario=id_usuario).first()
    socio = session.query(RespSocioeconomica).filter_by(id_usuario=id_usuario).first()
    auto = session.query(RespAutoeficacia).filter_by(id_usuario=id_usuario).first()

    def to_dict(obj):
        if not obj:
            return {}
        return {col.name: getattr(obj, col.name) for col in obj.__table__.columns}

    result["resp_cognitiva"] = to_dict(cognitiva)
    result["resp_educativa_familiar"] = to_dict(educativa)
    result["resp_socioeconomica"] = to_dict(socio)
    result["resp_autoeficacia"] = to_dict(auto)

    session.close()
    return result