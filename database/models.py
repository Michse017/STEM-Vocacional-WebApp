from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

Base = declarative_base()

class Usuario(Base):
    __tablename__ = 'usuarios'
    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    codigo_estudiante = Column(String(20), unique=True, nullable=False)

    cognitiva = relationship("RespCognitiva", uselist=False, back_populates="usuario")
    educativa_familiar = relationship("RespEducativaFamiliar", uselist=False, back_populates="usuario")
    socioeconomica = relationship("RespSocioeconomica", uselist=False, back_populates="usuario")
    autoeficacia = relationship("RespAutoeficacia", uselist=False, back_populates="usuario")

class RespCognitiva(Base):
    __tablename__ = 'resp_cognitiva'
    id_resp_cognitiva = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario'), nullable=False, unique=True)
    ptj_fisica = Column(Numeric)
    ptj_quimica = Column(Numeric)
    ptj_biologia = Column(Numeric)
    ptj_matematicas = Column(Numeric)
    ptj_geografia = Column(Numeric)
    ptj_historia = Column(Numeric)
    ptj_filosofia = Column(Numeric)
    ptj_sociales_ciudadano = Column(Numeric)
    ptj_ciencias_sociales = Column(Numeric)
    ptj_lenguaje = Column(Numeric)
    ptj_lectura_critica = Column(Numeric)
    ptj_ingles = Column(Numeric)
    ecaes = Column(Numeric)
    pga_acumulado = Column(Numeric)
    promedio_periodo = Column(Numeric)
    fecha_respuesta = Column(DateTime)
    fecha_actualizacion = Column(DateTime)

    usuario = relationship("Usuario", back_populates="cognitiva")

class RespEducativaFamiliar(Base):
    __tablename__ = 'resp_educativa_familiar'
    id_resp_edu_fam = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario'), nullable=False, unique=True)
    colegio = Column(String(150))
    ciudad_colegio = Column(String(100))
    depto_colegio = Column(String(50))
    municipio_colegio = Column(String(100))
    fecha_graduacion = Column(Date)
    fecha_respuesta = Column(DateTime)
    fecha_actualizacion = Column(DateTime)

    usuario = relationship("Usuario", back_populates="educativa_familiar")

class RespSocioeconomica(Base):
    __tablename__ = 'resp_socioeconomica'
    id_resp_socio = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario'), nullable=False, unique=True)
    estrato = Column(String(20))
    becas = Column(String(255))
    ceres = Column(String(255))
    periodo_ingreso = Column(String(20))
    tipo_estudiante = Column(String(50))
    fecha_respuesta = Column(DateTime)
    fecha_actualizacion = Column(DateTime)

    usuario = relationship("Usuario", back_populates="socioeconomica")

class RespAutoeficacia(Base):
    __tablename__ = 'resp_autoeficacia'
    id_resp_auto = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario'), nullable=False, unique=True)
    creditos_matriculados = Column(Integer)
    creditos_ganadas = Column(Integer)
    creditos_reprobadas = Column(Integer)
    puntos_calidad_pga = Column(Numeric)
    situacion = Column(String(50))
    estado = Column(String(50))
    nro_materias_aprobadas = Column(Integer)
    nro_materias_reprobadas = Column(Integer)
    fecha_respuesta = Column(DateTime)
    fecha_actualizacion = Column(DateTime)

    usuario = relationship("Usuario", back_populates="autoeficacia")