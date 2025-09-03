from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import date
from enum import Enum

# --- Enums para Opciones de Respuesta ---
# Usar Enums hace el código más legible, seguro y autodescriptivo.

class SexoEnum(str, Enum):
    masculino = "Masculino"
    femenino = "Femenino"
    no_responder = "Prefiero no responder"

class NivelEducativoEnum(str, Enum):
    sin_escolaridad = "Sin escolaridad"
    primaria_incompleta = "Primaria incompleta"
    primaria_completa = "Primaria completa"
    secundaria_incompleta = "Secundaria incompleta"
    secundaria_completa = "Secundaria completa"
    tecnica_tecnologica = "Técnica/Tecnológica"
    universitaria = "Universitaria"
    posgrado = "Posgrado"

class OcupacionEnum(str, Enum):
    empleado_formal = "Empleado formal"
    independiente = "Trabajador independiente"
    desempleado = "Desempleado"
    agricultor = "Agricultor"
    ama_de_casa = "Ama de casa"
    otro = "Otro"

class MiembrosHogarEnum(str, Enum):
    dos_tres = "2-3"
    cuatro_cinco = "4-5"
    seis_o_mas = "6 o más"

class NumeroHermanosEnum(str, Enum):
    ninguno = "Ninguno"
    uno = "1"
    dos_tres = "2-3"
    cuatro_o_mas = "4 o más"

class CondicionDiscapacidadEnum(str, Enum):
    ninguna = "Ninguna"
    fisica = "Física"
    visual = "Visual"
    auditiva = "Auditiva"
    cognitiva = "Cognitiva"
    otra = "Otra"

class GrupoEtnicoEnum(str, Enum):
    ninguno = "Ninguno"
    afrodescendiente = "Afrodescendiente"
    indigena = "Indígena"
    raizal_palenquero = "Raizal / Palenquero"
    gitano_rom = "Gitano (ROM)"
    otro = "Otro"

class CondicionVulnerabilidadEnum(str, Enum):
    ninguna = "Ninguna"
    migracion_interna = "Migración interna (otra región de Colombia)"
    migracion_internacional = "Migración internacional"
    victima_conflicto = "Víctima del conflicto armado"

class TrabajoActualEnum(str, Enum):
    si_parcial = "Sí, tiempo parcial"
    si_completo = "Sí, tiempo completo"
    no = "No"

class RespuestaVFEnum(str, Enum):
    verdadero = 'V'
    falso = 'F'

# --- Esquemas de Pydantic (Todos los campos son opcionales) ---

class SociodemograficaSchema(BaseModel):
    """
    Esquema para validar los datos sociodemográficos.
    Todos los campos son opcionales para permitir guardado parcial.
    """
    # Datos personales básicos
    fecha_nacimiento: Optional[date] = None
    sexo: Optional[SexoEnum] = None
    fecha_graduacion_bachillerato: Optional[date] = None

    # Condiciones familiares
    nivel_educativo_madre: Optional[NivelEducativoEnum] = None
    nivel_educativo_padre: Optional[NivelEducativoEnum] = None
    ocupacion_padre: Optional[OcupacionEnum] = None
    ocupacion_madre: Optional[OcupacionEnum] = None
    miembros_hogar: Optional[MiembrosHogarEnum] = None
    numero_hermanos: Optional[NumeroHermanosEnum] = None

    # Condiciones especiales
    condicion_discapacidad: Optional[CondicionDiscapacidadEnum] = None
    otro_discapacidad: Optional[str] = Field(None, max_length=100)
    grupo_etnico: Optional[GrupoEtnicoEnum] = None
    otro_grupo_etnico: Optional[str] = Field(None, max_length=100)
    condicion_vulnerabilidad: Optional[CondicionVulnerabilidadEnum] = None

    # Trabajo y Estudio
    trabaja_actualmente: Optional[TrabajoActualEnum] = None

    # Dimensiones académicas (Pruebas Saber 11)
    puntaje_global_saber11: Optional[int] = Field(None, ge=0, le=500)
    puntaje_lectura_critica: Optional[int] = Field(None, ge=0, le=100)
    puntaje_matematicas: Optional[int] = Field(None, ge=0, le=100)
    puntaje_ingles: Optional[int] = Field(None, ge=0, le=100)
    puntaje_competencias_ciudadanas: Optional[int] = Field(None, ge=0, le=100)
    puntaje_ciencias_naturales: Optional[int] = Field(None, ge=0, le=100)

    class Config:
        from_attributes = True

class InteligenciasMultiplesSchema(BaseModel):
    """
    Esquema para las respuestas del test de inteligencias múltiples.
    Todos los campos son opcionales.
    """
    pregunta_1: Optional[RespuestaVFEnum] = None
    pregunta_2: Optional[RespuestaVFEnum] = None
    pregunta_3: Optional[RespuestaVFEnum] = None
    pregunta_4: Optional[RespuestaVFEnum] = None
    pregunta_5: Optional[RespuestaVFEnum] = None
    pregunta_6: Optional[RespuestaVFEnum] = None
    pregunta_7: Optional[RespuestaVFEnum] = None
    pregunta_8: Optional[RespuestaVFEnum] = None
    pregunta_9: Optional[RespuestaVFEnum] = None
    pregunta_10: Optional[RespuestaVFEnum] = None
    pregunta_11: Optional[RespuestaVFEnum] = None
    pregunta_12: Optional[RespuestaVFEnum] = None
    pregunta_13: Optional[RespuestaVFEnum] = None
    pregunta_14: Optional[RespuestaVFEnum] = None
    pregunta_15: Optional[RespuestaVFEnum] = None
    pregunta_16: Optional[RespuestaVFEnum] = None
    pregunta_17: Optional[RespuestaVFEnum] = None
    pregunta_18: Optional[RespuestaVFEnum] = None
    pregunta_19: Optional[RespuestaVFEnum] = None
    pregunta_20: Optional[RespuestaVFEnum] = None
    pregunta_21: Optional[RespuestaVFEnum] = None
    pregunta_22: Optional[RespuestaVFEnum] = None
    pregunta_23: Optional[RespuestaVFEnum] = None
    pregunta_24: Optional[RespuestaVFEnum] = None
    pregunta_25: Optional[RespuestaVFEnum] = None
    pregunta_26: Optional[RespuestaVFEnum] = None
    pregunta_27: Optional[RespuestaVFEnum] = None
    pregunta_28: Optional[RespuestaVFEnum] = None
    pregunta_29: Optional[RespuestaVFEnum] = None
    pregunta_30: Optional[RespuestaVFEnum] = None
    pregunta_31: Optional[RespuestaVFEnum] = None
    pregunta_32: Optional[RespuestaVFEnum] = None
    pregunta_33: Optional[RespuestaVFEnum] = None
    pregunta_34: Optional[RespuestaVFEnum] = None
    pregunta_35: Optional[RespuestaVFEnum] = None

    class Config:
        from_attributes = True

class CuestionarioCompletoSchema(BaseModel):
    """
    Esquema principal que agrupa todas las partes del cuestionario.
    """
    id_usuario: int
    sociodemografica: SociodemograficaSchema = Field(default_factory=dict)
    inteligencias_multiples: InteligenciasMultiplesSchema = Field(default_factory=dict)

    class Config:
        from_attributes = True