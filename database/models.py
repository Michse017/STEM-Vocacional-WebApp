from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, CheckConstraint, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()

class Usuario(Base):
    """
    Tabla central que representa a un estudiante.
    """
    __tablename__ = 'usuarios'
    
    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    codigo_estudiante = Column(String(20), unique=True, nullable=False, index=True)
    # Nuevo campo para estado de finalización del cuestionario
    finalizado = Column(Boolean, nullable=False, default=False)

    # Relación uno a uno con la tabla de respuestas sociodemográficas
    sociodemografica = relationship(
        "RespSociodemografica", 
        uselist=False, 
        back_populates="usuario", 
        cascade="all, delete-orphan"
    )
    
    # Relación uno a uno con la tabla de respuestas de inteligencias múltiples
    inteligencias_multiples = relationship(
        "RespInteligenciasMultiples", 
        uselist=False, 
        back_populates="usuario", 
        cascade="all, delete-orphan"
    )
    
    # Relaciones con el sistema dinámico de cuestionarios
    respuestas_cuestionarios = relationship(
        "RespuestaCuestionario", 
        back_populates="usuario", 
        cascade="all, delete-orphan"
    )

class RespSociodemografica(Base):
    """
    Almacena las respuestas de la dimensión sociodemográfica, socioeconómica y académica.
    """
    __tablename__ = 'resp_sociodemografica'
    
    id_resp_sociodemo = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario', ondelete='CASCADE'), nullable=False, unique=True, index=True)

    # Datos personales básicos
    fecha_nacimiento = Column(Date)
    sexo = Column(String(20))
    fecha_graduacion_bachillerato = Column(Date)

    # Condiciones familiares
    nivel_educativo_madre = Column(String(50))
    nivel_educativo_padre = Column(String(50))
    ocupacion_padre = Column(String(50))
    ocupacion_madre = Column(String(50))
    # En el DDL son INT
    miembros_hogar = Column(Integer)
    numero_hermanos = Column(Integer)

    # Condiciones especiales
    condicion_discapacidad = Column(String(50))
    otro_discapacidad = Column(String(100))
    grupo_etnico = Column(String(50))
    otro_grupo_etnico = Column(String(100))
    condicion_vulnerabilidad = Column(String(50))

    # Trabajo y acceso
    trabaja_actualmente = Column(String(20))

    # ICFES / Saber 11
    puntaje_global_saber11 = Column(Integer, CheckConstraint('puntaje_global_saber11 BETWEEN 0 AND 500'))
    puntaje_lectura_critica = Column(Integer, CheckConstraint('puntaje_lectura_critica BETWEEN 0 AND 100'))
    puntaje_matematicas = Column(Integer, CheckConstraint('puntaje_matematicas BETWEEN 0 AND 100'))
    puntaje_sociales_ciudadanas = Column(Integer, CheckConstraint('puntaje_sociales_ciudadanas BETWEEN 0 AND 100'))
    puntaje_ciencias_naturales = Column(Integer, CheckConstraint('puntaje_ciencias_naturales BETWEEN 0 AND 100'))
    puntaje_ingles = Column(Integer, CheckConstraint('puntaje_ingles BETWEEN 0 AND 100'))

    # Metadatos
    fecha_respuesta = Column(DateTime, server_default=func.now())
    fecha_actualizacion = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relación inversa para acceder al usuario desde la respuesta
    usuario = relationship("Usuario", back_populates="sociodemografica")

class RespInteligenciasMultiples(Base):
    """
    Almacena las respuestas del test de inteligencias múltiples.
    Cada pregunta es una columna para permitir respuestas parciales (nulos).
    """
    __tablename__ = 'resp_inteligencias_multiples'

    id_resp_intel = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario', ondelete='CASCADE'), nullable=False, unique=True, index=True)

    # Columnas para cada una de las 35 preguntas (permiten NULL)
    pregunta_1 = Column(String(1), CheckConstraint("pregunta_1 IN ('V', 'F')"))
    pregunta_2 = Column(String(1), CheckConstraint("pregunta_2 IN ('V', 'F')"))
    pregunta_3 = Column(String(1), CheckConstraint("pregunta_3 IN ('V', 'F')"))
    pregunta_4 = Column(String(1), CheckConstraint("pregunta_4 IN ('V', 'F')"))
    pregunta_5 = Column(String(1), CheckConstraint("pregunta_5 IN ('V', 'F')"))
    pregunta_6 = Column(String(1), CheckConstraint("pregunta_6 IN ('V', 'F')"))
    pregunta_7 = Column(String(1), CheckConstraint("pregunta_7 IN ('V', 'F')"))
    pregunta_8 = Column(String(1), CheckConstraint("pregunta_8 IN ('V', 'F')"))
    pregunta_9 = Column(String(1), CheckConstraint("pregunta_9 IN ('V', 'F')"))
    pregunta_10 = Column(String(1), CheckConstraint("pregunta_10 IN ('V', 'F')"))
    pregunta_11 = Column(String(1), CheckConstraint("pregunta_11 IN ('V', 'F')"))
    pregunta_12 = Column(String(1), CheckConstraint("pregunta_12 IN ('V', 'F')"))
    pregunta_13 = Column(String(1), CheckConstraint("pregunta_13 IN ('V', 'F')"))
    pregunta_14 = Column(String(1), CheckConstraint("pregunta_14 IN ('V', 'F')"))
    pregunta_15 = Column(String(1), CheckConstraint("pregunta_15 IN ('V', 'F')"))
    pregunta_16 = Column(String(1), CheckConstraint("pregunta_16 IN ('V', 'F')"))
    pregunta_17 = Column(String(1), CheckConstraint("pregunta_17 IN ('V', 'F')"))
    pregunta_18 = Column(String(1), CheckConstraint("pregunta_18 IN ('V', 'F')"))
    pregunta_19 = Column(String(1), CheckConstraint("pregunta_19 IN ('V', 'F')"))
    pregunta_20 = Column(String(1), CheckConstraint("pregunta_20 IN ('V', 'F')"))
    pregunta_21 = Column(String(1), CheckConstraint("pregunta_21 IN ('V', 'F')"))
    pregunta_22 = Column(String(1), CheckConstraint("pregunta_22 IN ('V', 'F')"))
    pregunta_23 = Column(String(1), CheckConstraint("pregunta_23 IN ('V', 'F')"))
    pregunta_24 = Column(String(1), CheckConstraint("pregunta_24 IN ('V', 'F')"))
    pregunta_25 = Column(String(1), CheckConstraint("pregunta_25 IN ('V', 'F')"))
    pregunta_26 = Column(String(1), CheckConstraint("pregunta_26 IN ('V', 'F')"))
    pregunta_27 = Column(String(1), CheckConstraint("pregunta_27 IN ('V', 'F')"))
    pregunta_28 = Column(String(1), CheckConstraint("pregunta_28 IN ('V', 'F')"))
    pregunta_29 = Column(String(1), CheckConstraint("pregunta_29 IN ('V', 'F')"))
    pregunta_30 = Column(String(1), CheckConstraint("pregunta_30 IN ('V', 'F')"))
    pregunta_31 = Column(String(1), CheckConstraint("pregunta_31 IN ('V', 'F')"))
    pregunta_32 = Column(String(1), CheckConstraint("pregunta_32 IN ('V', 'F')"))
    pregunta_33 = Column(String(1), CheckConstraint("pregunta_33 IN ('V', 'F')"))
    pregunta_34 = Column(String(1), CheckConstraint("pregunta_34 IN ('V', 'F')"))
    pregunta_35 = Column(String(1), CheckConstraint("pregunta_35 IN ('V', 'F')"))
    # Preguntas 36-40 eliminadas para alinear con el instrumento oficial

    # Metadatos
    fecha_respuesta = Column(DateTime, server_default=func.now())
    fecha_actualizacion = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relación inversa para acceder al usuario desde la respuesta
    usuario = relationship("Usuario", back_populates="inteligencias_multiples")


# ============================================================================
# SISTEMA DINÁMICO DE CUESTIONARIOS
# ============================================================================

class Cuestionario(Base):
    """
    Tabla principal para almacenar cuestionarios dinámicos.
    Permite crear cuestionarios sin modificar el código.
    """
    __tablename__ = 'cuestionarios'
    
    id_cuestionario = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    activo = Column(Boolean, default=True)
    tipo = Column(String(50))  # 'sociodemografico', 'inteligencias_multiples', 'personalidad', etc.
    fecha_creacion = Column(DateTime, server_default=func.now())
    fecha_actualizacion = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    preguntas = relationship("Pregunta", back_populates="cuestionario", cascade="all, delete-orphan")
    respuestas_cuestionario = relationship("RespuestaCuestionario", back_populates="cuestionario", cascade="all, delete-orphan")


class Pregunta(Base):
    """
    Tabla para almacenar las preguntas de cada cuestionario.
    Cada pregunta pertenece a un cuestionario específico.
    """
    __tablename__ = 'preguntas'
    
    id_pregunta = Column(Integer, primary_key=True, autoincrement=True)
    id_cuestionario = Column(Integer, ForeignKey('cuestionarios.id_cuestionario', ondelete='CASCADE'), nullable=False)
    texto = Column(Text, nullable=False)
    tipo_pregunta = Column(String(50), nullable=False)  # 'texto', 'seleccion_unica', 'seleccion_multiple', 'escala', 'fecha', 'numero', 'booleano'
    requerida = Column(Boolean, default=True)
    orden = Column(Integer, nullable=False)
    
    # Campos adicionales para validación
    min_valor = Column(Integer)  # Para preguntas numéricas o escalas
    max_valor = Column(Integer)  # Para preguntas numéricas o escalas
    patron_validacion = Column(String(200))  # Regex para validación de texto
    ayuda_texto = Column(Text)  # Texto de ayuda para el usuario
    
    fecha_creacion = Column(DateTime, server_default=func.now())
    
    # Relaciones
    cuestionario = relationship("Cuestionario", back_populates="preguntas")
    opciones = relationship("OpcionPregunta", back_populates="pregunta", cascade="all, delete-orphan")
    respuestas = relationship("RespuestaUsuario", back_populates="pregunta", cascade="all, delete-orphan")


class OpcionPregunta(Base):
    """
    Tabla para almacenar las opciones de respuesta para preguntas de selección.
    Solo se usa para preguntas de tipo 'seleccion_unica' o 'seleccion_multiple'.
    """
    __tablename__ = 'opciones_pregunta'
    
    id_opcion = Column(Integer, primary_key=True, autoincrement=True)
    id_pregunta = Column(Integer, ForeignKey('preguntas.id_pregunta', ondelete='CASCADE'), nullable=False)
    texto = Column(String(200), nullable=False)
    valor = Column(String(100))  # Valor interno que se almacena (puede ser diferente al texto mostrado)
    orden = Column(Integer, nullable=False)
    activa = Column(Boolean, default=True)
    
    fecha_creacion = Column(DateTime, server_default=func.now())
    
    # Relaciones
    pregunta = relationship("Pregunta", back_populates="opciones")


class RespuestaCuestionario(Base):
    """
    Tabla para rastrear qué cuestionarios ha completado cada usuario.
    """
    __tablename__ = 'respuestas_cuestionario'
    
    id_respuesta_cuestionario = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario', ondelete='CASCADE'), nullable=False)
    id_cuestionario = Column(Integer, ForeignKey('cuestionarios.id_cuestionario', ondelete='CASCADE'), nullable=False)
    completado = Column(Boolean, default=False)
    fecha_inicio = Column(DateTime, server_default=func.now())
    fecha_completado = Column(DateTime)
    
    # Relaciones
    usuario = relationship("Usuario")
    cuestionario = relationship("Cuestionario", back_populates="respuestas_cuestionario")
    respuestas_detalle = relationship("RespuestaUsuario", back_populates="respuesta_cuestionario", cascade="all, delete-orphan")


class RespuestaUsuario(Base):
    """
    Tabla para almacenar las respuestas individuales de cada usuario a cada pregunta.
    """
    __tablename__ = 'respuestas_usuario'
    
    id_respuesta = Column(Integer, primary_key=True, autoincrement=True)
    id_respuesta_cuestionario = Column(Integer, ForeignKey('respuestas_cuestionario.id_respuesta_cuestionario', ondelete='CASCADE'), nullable=False)
    id_pregunta = Column(Integer, ForeignKey('preguntas.id_pregunta'), nullable=False)  # Sin CASCADE para evitar ciclos
    valor_respuesta = Column(Text)  # Almacena la respuesta en formato texto (JSON para respuestas múltiples)
    fecha_respuesta = Column(DateTime, server_default=func.now())
    
    # Relaciones
    respuesta_cuestionario = relationship("RespuestaCuestionario", back_populates="respuestas_detalle")
    pregunta = relationship("Pregunta", back_populates="respuestas")