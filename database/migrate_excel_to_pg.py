""""
import pandas as pd
import os
from datetime import datetime
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from .models import Base, Usuario, RespCognitiva, RespEducativaFamiliar, RespSocioeconomica, RespAutoeficacia
from .config import DATABASE_URL

EXCEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "DataProyecto#1.xlsx"))

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
Base.metadata.create_all(engine)

# Combina todas las hojas relevantes (menos 2023-FP) en un solo DataFrame para usuarios
xls = pd.ExcelFile(EXCEL_PATH)
sheet_names = [s for s in xls.sheet_names if s != "2023-FP"]
df = pd.concat([pd.read_excel(EXCEL_PATH, sheet_name=s) for s in sheet_names], ignore_index=True)

def safe_float(x):
    try:
        if pd.isnull(x):
            return None
        return float(x)
    except:
        return None

def migrate():
    session = Session()
    for idx, row in df.iterrows():
        codigo = str(row.get("Id")).strip()
        if not codigo:
            continue

        # Usuario
        usuario = session.query(Usuario).filter_by(codigo_estudiante=codigo).first()
        if not usuario:
            usuario = Usuario(codigo_estudiante=codigo)
            session.add(usuario)
            session.commit()
            session.refresh(usuario)
        id_usuario = usuario.id_usuario

        # Cognitiva
        cognitiva = session.query(RespCognitiva).filter_by(id_usuario=id_usuario).first()
        if not cognitiva:
            cognitiva = RespCognitiva(
                id_usuario=id_usuario,
                ptj_fisica=safe_float(row.get("Ptj_fisica")),
                ptj_quimica=safe_float(row.get("Ptj_quimica")),
                ptj_biologia=safe_float(row.get("Ptj_biologia")),
                ptj_matematicas=safe_float(row.get("Ptj_matematicas")),
                ptj_geografia=safe_float(row.get("Ptj_geografia")),
                ptj_historia=safe_float(row.get("Ptj_historia")),
                ptj_filosofia=safe_float(row.get("Ptj_filosofia")),
                ptj_sociales_ciudadano=safe_float(row.get("Ptj_sociales_ciudadano")),
                ptj_ciencias_sociales=safe_float(row.get("Ptj_ciencias_sociales")),
                ptj_lenguaje=safe_float(row.get("Ptj_lenguaje")),
                ptj_lectura_critica=safe_float(row.get("Ptj_lectura_critica")),
                ptj_ingles=safe_float(row.get("Ptj_ingles")),
                ecaes=safe_float(row.get("Ecaes")),
                pga_acumulado=safe_float(row.get("Pga_acomulado")),
                promedio_periodo=safe_float(row.get("Promedio_periodo")),
                fecha_respuesta=datetime.now(),
                fecha_actualizacion=datetime.now()
            )
            session.add(cognitiva)

        # Educativa/Familiar
        educativa = session.query(RespEducativaFamiliar).filter_by(id_usuario=id_usuario).first()
        if not educativa:
            educativa = RespEducativaFamiliar(
                id_usuario=id_usuario,
                colegio=row.get("Colegio"),
                ciudad_colegio=row.get("Ciudad_colegio"),
                depto_colegio=row.get("Depto_colegio"),
                municipio_colegio=row.get("Municipio_colegio"),
                fecha_graduacion=row.get("Fecha_graduacion"),
                fecha_respuesta=datetime.now(),
                fecha_actualizacion=datetime.now()
            )
            session.add(educativa)

        # Socioeconómica
        socio = session.query(RespSocioeconomica).filter_by(id_usuario=id_usuario).first()
        if not socio:
            socio = RespSocioeconomica(
                id_usuario=id_usuario,
                estrato=row.get("Estrato"),
                becas=row.get("Becas"),
                ceres=row.get("Ceres"),
                periodo_ingreso=row.get("Periodo_ingreso"),
                tipo_estudiante=row.get("Tipo_estudiante"),
                fecha_respuesta=datetime.now(),
                fecha_actualizacion=datetime.now()
            )
            session.add(socio)

        # Autoeficacia
        auto = session.query(RespAutoeficacia).filter_by(id_usuario=id_usuario).first()
        if not auto:
            auto = RespAutoeficacia(
                id_usuario=id_usuario,
                creditos_matriculados=row.get("Creditos_matriculados"),
                creditos_ganadas=row.get("Creditos_ganadas"),
                creditos_reprobadas=row.get("Creditos_reprobadas") or row.get("Nro_materias_reprobadas"),
                puntos_calidad_pga=safe_float(row.get("Puntos_calidad_pga")),
                situacion=row.get("Situacion"),
                estado=row.get("Estado"),
                nro_materias_aprobadas=row.get("Nro_materias_aprobadas"),
                nro_materias_reprobadas=row.get("Nro_materias_reprobadas"),
                fecha_respuesta=datetime.now(),
                fecha_actualizacion=datetime.now()
            )
            session.add(auto)

        if idx % 200 == 0:
            print(f"Migrados {idx} usuarios...")
            session.commit()
    session.commit()
    print("Migración completada.")

if __name__ == "__main__":
    migrate()

"""

import pandas as pd
import os
from datetime import datetime
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from .models import Base, Usuario, RespCognitiva, RespEducativaFamiliar, RespSocioeconomica, RespAutoeficacia
from .config import DATABASE_URL

EXCEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "data", "DataProyecto#1.xlsx"))

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
Base.metadata.create_all(engine)

# Solo migrar los 5 primeros de la hoja "202230"
df = pd.read_excel(EXCEL_PATH, sheet_name="202230").head(5)

def safe_float(x):
    try:
        if pd.isnull(x):
            return None
        return float(x)
    except:
        return None
    
from datetime import datetime

def safe_date(x):
    # Si ya es datetime o date, retorna directo
    if pd.isnull(x):
        return None
    if isinstance(x, (datetime, pd.Timestamp)):
        return x.date()
    # Prueba varios formatos
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(str(x), fmt).date()
        except Exception:
            continue
    # Si no se puede, retorna None
    return None

def migrate():
    session = Session()
    for idx, row in df.iterrows():
        codigo = str(row.get("Id")).strip()
        if not codigo:
            continue

        # Usuario
        usuario = session.query(Usuario).filter_by(codigo_estudiante=codigo).first()
        if not usuario:
            usuario = Usuario(codigo_estudiante=codigo)
            session.add(usuario)
            session.commit()
            session.refresh(usuario)
        id_usuario = usuario.id_usuario

        # Cognitiva
        cognitiva = session.query(RespCognitiva).filter_by(id_usuario=id_usuario).first()
        if not cognitiva:
            cognitiva = RespCognitiva(
                id_usuario=id_usuario,
                ptj_fisica=safe_float(row.get("Ptj_fisica")),
                ptj_quimica=safe_float(row.get("Ptj_quimica")),
                ptj_biologia=safe_float(row.get("Ptj_biologia")),
                ptj_matematicas=safe_float(row.get("Ptj_matematicas")),
                ptj_geografia=safe_float(row.get("Ptj_geografia")),
                ptj_historia=safe_float(row.get("Ptj_historia")),
                ptj_filosofia=safe_float(row.get("Ptj_filosofia")),
                ptj_sociales_ciudadano=safe_float(row.get("Ptj_sociales_ciudadano")),
                ptj_ciencias_sociales=safe_float(row.get("Ptj_ciencias_sociales")),
                ptj_lenguaje=safe_float(row.get("Ptj_lenguaje")),
                ptj_lectura_critica=safe_float(row.get("Ptj_lectura_critica")),
                ptj_ingles=safe_float(row.get("Ptj_ingles")),
                ecaes=safe_float(row.get("Ecaes")),
                pga_acumulado=safe_float(row.get("Pga_acomulado")),
                promedio_periodo=safe_float(row.get("Promedio_periodo")),
                fecha_respuesta=datetime.now(),
                fecha_actualizacion=datetime.now()
            )
            session.add(cognitiva)

        # Educativa/Familiar
        educativa = session.query(RespEducativaFamiliar).filter_by(id_usuario=id_usuario).first()
        if not educativa:
            educativa = RespEducativaFamiliar(
                id_usuario=id_usuario,
                colegio=row.get("Colegio"),
                ciudad_colegio=row.get("Ciudad_colegio"),
                depto_colegio=row.get("Depto_colegio"),
                municipio_colegio=row.get("Municipio_colegio"),
                fecha_graduacion=safe_date(row.get("Fecha_graduacion")),  # <-- USAR safe_date
                fecha_respuesta=datetime.now(),
                fecha_actualizacion=datetime.now()
            )
            session.add(educativa)

        # Socioeconómica
        socio = session.query(RespSocioeconomica).filter_by(id_usuario=id_usuario).first()
        if not socio:
            socio = RespSocioeconomica(
                id_usuario=id_usuario,
                estrato=row.get("Estrato"),
                becas=row.get("Becas"),
                ceres=row.get("Ceres"),
                periodo_ingreso=row.get("Periodo_ingreso"),
                tipo_estudiante=row.get("Tipo_estudiante"),
                fecha_respuesta=datetime.now(),
                fecha_actualizacion=datetime.now()
            )
            session.add(socio)

        # Autoeficacia
        auto = session.query(RespAutoeficacia).filter_by(id_usuario=id_usuario).first()
        if not auto:
            auto = RespAutoeficacia(
                id_usuario=id_usuario,
                creditos_matriculados=row.get("Creditos_matriculados"),
                creditos_ganadas=row.get("Creditos_ganadas"),
                creditos_reprobadas=row.get("Creditos_reprobadas") or row.get("Nro_materias_reprobadas"),
                puntos_calidad_pga=safe_float(row.get("Puntos_calidad_pga")),
                situacion=row.get("Situacion"),
                estado=row.get("Estado"),
                nro_materias_aprobadas=row.get("Nro_materias_aprobadas"),
                nro_materias_reprobadas=row.get("Nro_materias_reprobadas"),
                fecha_respuesta=datetime.now(),
                fecha_actualizacion=datetime.now()
            )
            session.add(auto)

        print(f"Usuario migrado: {codigo}")

    session.commit()
    print("Migración de 5 usuarios completada.")

if __name__ == "__main__":
    migrate()