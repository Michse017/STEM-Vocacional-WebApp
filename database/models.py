from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, ForeignKey, UniqueConstraint, CheckConstraint, Index
from sqlalchemy.orm import relationship

Base = declarative_base()

class Usuario(Base):
    __tablename__ = 'usuarios'
    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    codigo_estudiante = Column(String(20), unique=True, nullable=False, index=True)

    cognitiva = relationship("RespCognitiva", uselist=False, back_populates="usuario", cascade="all, delete-orphan")
    educativa_familiar = relationship("RespEducativaFamiliar", uselist=False, back_populates="usuario", cascade="all, delete-orphan")
    socioeconomica = relationship("RespSocioeconomica", uselist=False, back_populates="usuario", cascade="all, delete-orphan")
    autoeficacia = relationship("RespAutoeficacia", uselist=False, back_populates="usuario", cascade="all, delete-orphan")

class RespCognitiva(Base):
    __tablename__ = 'resp_cognitiva'
    id_resp_cognitiva = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario', ondelete='CASCADE'), nullable=False, unique=True)
    ptj_fisica = Column(Numeric, CheckConstraint("ptj_fisica >= 0 AND ptj_fisica <= 100", name="ck_ptj_fisica_range"))
    ptj_quimica = Column(Numeric, CheckConstraint("ptj_quimica >= 0 AND ptj_quimica <= 100", name="ck_ptj_quimica_range"))
    ptj_biologia = Column(Numeric, CheckConstraint("ptj_biologia >= 0 AND ptj_biologia <= 100", name="ck_ptj_biologia_range"))
    ptj_matematicas = Column(Numeric, CheckConstraint("ptj_matematicas >= 0 AND ptj_matematicas <= 100", name="ck_ptj_matematicas_range"))
    ptj_geografia = Column(Numeric, CheckConstraint("ptj_geografia >= 0 AND ptj_geografia <= 100", name="ck_ptj_geografia_range"))
    ptj_historia = Column(Numeric, CheckConstraint("ptj_historia >= 0 AND ptj_historia <= 100", name="ck_ptj_historia_range"))
    ptj_filosofia = Column(Numeric, CheckConstraint("ptj_filosofia >= 0 AND ptj_filosofia <= 100", name="ck_ptj_filosofia_range"))
    ptj_sociales_ciudadano = Column(Numeric, CheckConstraint("ptj_sociales_ciudadano >= 0 AND ptj_sociales_ciudadano <= 100", name="ck_ptj_sociales_ciudadano_range"))
    ptj_ciencias_sociales = Column(Numeric, CheckConstraint("ptj_ciencias_sociales >= 0 AND ptj_ciencias_sociales <= 100", name="ck_ptj_ciencias_sociales_range"))
    ptj_lenguaje = Column(Numeric, CheckConstraint("ptj_lenguaje >= 0 AND ptj_lenguaje <= 100", name="ck_ptj_lenguaje_range"))
    ptj_lectura_critica = Column(Numeric, CheckConstraint("ptj_lectura_critica >= 0 AND ptj_lectura_critica <= 100", name="ck_ptj_lectura_critica_range"))
    ptj_ingles = Column(Numeric, CheckConstraint("ptj_ingles >= 0 AND ptj_ingles <= 100", name="ck_ptj_ingles_range"))
    ecaes = Column(Numeric)
    pga_acumulado = Column(Numeric, CheckConstraint("pga_acumulado >= 0 AND pga_acumulado <= 5", name="ck_pga_acumulado_range"))
    promedio_periodo = Column(Numeric, CheckConstraint("promedio_periodo >= 0 AND promedio_periodo <= 5", name="ck_promedio_periodo_range"))
    fecha_respuesta = Column(DateTime)
    fecha_actualizacion = Column(DateTime)

    usuario = relationship("Usuario", back_populates="cognitiva")

class RespEducativaFamiliar(Base):
    __tablename__ = 'resp_educativa_familiar'
    id_resp_edu_fam = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario', ondelete='CASCADE'), nullable=False, unique=True)
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
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario', ondelete='CASCADE'), nullable=False, unique=True)
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
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario', ondelete='CASCADE'), nullable=False, unique=True)
    creditos_matriculados = Column(Integer, CheckConstraint("creditos_matriculados >= 0", name="ck_creditos_matriculados_positive"))
    creditos_ganadas = Column(Integer, CheckConstraint("creditos_ganadas >= 0", name="ck_creditos_ganadas_positive"))
    creditos_reprobadas = Column(Integer, CheckConstraint("creditos_reprobadas >= 0", name="ck_creditos_reprobadas_positive"))
    puntos_calidad_pga = Column(Numeric, CheckConstraint("puntos_calidad_pga >= 0", name="ck_puntos_calidad_pga_positive"))
    situacion = Column(String(50))
    estado = Column(String(50))
    nro_materias_aprobadas = Column(Integer, CheckConstraint("nro_materias_aprobadas >= 0", name="ck_nro_materias_aprobadas_positive"))
    nro_materias_reprobadas = Column(Integer, CheckConstraint("nro_materias_reprobadas >= 0", name="ck_nro_materias_reprobadas_positive"))
    fecha_respuesta = Column(DateTime)
    fecha_actualizacion = Column(DateTime)

    usuario = relationship("Usuario", back_populates="autoeficacia")