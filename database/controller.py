from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from .models import Base, Usuario, RespCognitiva, RespEducativaFamiliar, RespSocioeconomica, RespAutoeficacia
from .config import DATABASE_URL

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def create_all_tables():
    Base.metadata.create_all(engine)

def get_usuario_by_codigo(codigo):
    session = Session()
    usuario = session.query(Usuario).filter_by(codigo_estudiante=codigo).first()
    session.close()
    return usuario

def add_usuario(codigo):
    session = Session()
    usuario = Usuario(codigo_estudiante=codigo)
    session.add(usuario)
    session.commit()
    session.refresh(usuario)
    session.close()
    return usuario

def upsert_cognitiva(id_usuario, data):
    session = Session()
    resp = session.query(RespCognitiva).filter_by(id_usuario=id_usuario).first()
    if not resp:
        resp = RespCognitiva(id_usuario=id_usuario, **data)
        session.add(resp)
    else:
        for k, v in data.items():
            setattr(resp, k, v)
    session.commit()
    session.close()

def upsert_educativa_familiar(id_usuario, data):
    session = Session()
    resp = session.query(RespEducativaFamiliar).filter_by(id_usuario=id_usuario).first()
    if not resp:
        resp = RespEducativaFamiliar(id_usuario=id_usuario, **data)
        session.add(resp)
    else:
        for k, v in data.items():
            setattr(resp, k, v)
    session.commit()
    session.close()

def upsert_socioeconomica(id_usuario, data):
    session = Session()
    resp = session.query(RespSocioeconomica).filter_by(id_usuario=id_usuario).first()
    if not resp:
        resp = RespSocioeconomica(id_usuario=id_usuario, **data)
        session.add(resp)
    else:
        for k, v in data.items():
            setattr(resp, k, v)
    session.commit()
    session.close()

def upsert_autoeficacia(id_usuario, data):
    session = Session()
    resp = session.query(RespAutoeficacia).filter_by(id_usuario=id_usuario).first()
    if not resp:
        resp = RespAutoeficacia(id_usuario=id_usuario, **data)
        session.add(resp)
    else:
        for k, v in data.items():
            setattr(resp, k, v)
    session.commit()
    session.close()

def get_usuario_full_responses(id_usuario):
    """
    Devuelve un dict con todas las respuestas del usuario, por tabla.
    Ejemplo:
    {
      "resp_cognitiva": { ... },
      "resp_educativa_familiar": { ... },
      "resp_socioeconomica": { ... },
      "resp_autoeficacia": { ... }
    }
    """
    session = Session()
    result = {}

    cognitiva = session.query(RespCognitiva).filter_by(id_usuario=id_usuario).first()
    educativa = session.query(RespEducativaFamiliar).filter_by(id_usuario=id_usuario).first()
    socio = session.query(RespSocioeconomica).filter_by(id_usuario=id_usuario).first()
    auto = session.query(RespAutoeficacia).filter_by(id_usuario=id_usuario).first()

    def to_dict(obj):
        if not obj:
            return {}
        # Selecciona solo las columnas útiles
        return {col.name: getattr(obj, col.name) for col in obj.__table__.columns}

    result["resp_cognitiva"] = to_dict(cognitiva)
    result["resp_educativa_familiar"] = to_dict(educativa)
    result["resp_socioeconomica"] = to_dict(socio)
    result["resp_autoeficacia"] = to_dict(auto)

    session.close()
    return result