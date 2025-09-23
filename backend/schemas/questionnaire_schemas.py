from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, Dict
from datetime import date, timedelta
from enum import Enum
import re

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

"""
Se eliminan los enums de miembros de hogar y número de hermanos en favor de enteros (según DDL).
Seguiremos aceptando cadenas comunes ("Ninguno", "2-3", "6 o más") y las convertiremos a enteros.
"""

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
    miembros_hogar: Optional[int] = None
    numero_hermanos: Optional[int] = None

    # Condiciones especiales
    condicion_discapacidad: Optional[CondicionDiscapacidadEnum] = None
    otro_discapacidad: Optional[str] = Field(None, max_length=100)
    grupo_etnico: Optional[GrupoEtnicoEnum] = None
    otro_grupo_etnico: Optional[str] = Field(None, max_length=100)
    condicion_vulnerabilidad: Optional[CondicionVulnerabilidadEnum] = None

    # Trabajo actual
    trabaja_actualmente: Optional[TrabajoActualEnum] = None

    # ICFES / Saber 11
    puntaje_global_saber11: Optional[int] = Field(None, ge=0, le=500)
    puntaje_lectura_critica: Optional[int] = Field(None, ge=0, le=100)
    puntaje_matematicas: Optional[int] = Field(None, ge=0, le=100)
    puntaje_sociales_ciudadanas: Optional[int] = Field(None, ge=0, le=100)
    puntaje_ciencias_naturales: Optional[int] = Field(None, ge=0, le=100)
    puntaje_ingles: Optional[int] = Field(None, ge=0, le=100)

    class Config:
        from_attributes = True

    # --- Validadores ---
    @field_validator('fecha_nacimiento', 'fecha_graduacion_bachillerato')
    @classmethod
    def no_futuras(cls, v: Optional[date]):
        if v and v > date.today():
            raise ValueError('La fecha no puede ser posterior a hoy')
        return v

    @model_validator(mode='after')
    def valida_relaciones_fechas_y_icfes(self):
        # Reglas de fechas: grad >= nacimiento + 14 años
        if self.fecha_nacimiento and self.fecha_graduacion_bachillerato:
            try:
                # Aproximamos 14 años como 14*365 días (suficiente para validación)
                min_grad = self.fecha_nacimiento + timedelta(days=14*365)
                if self.fecha_graduacion_bachillerato < min_grad:
                    raise ValueError('La fecha de graduación debe ser al menos 14 años posterior a la fecha de nacimiento')
            except Exception:
                raise ValueError('Fechas inválidas')

        # Cálculo del puntaje global si se tienen todos los componentes
        comp = [
            self.puntaje_lectura_critica,
            self.puntaje_matematicas,
            self.puntaje_sociales_ciudadanas,
            self.puntaje_ciencias_naturales,
            self.puntaje_ingles,
        ]
        if all(v is not None for v in comp):
            ponderado = (3*(self.puntaje_lectura_critica + self.puntaje_matematicas + self.puntaje_sociales_ciudadanas + self.puntaje_ciencias_naturales) + 1*self.puntaje_ingles)
            indice_global = ponderado / 13
            calculado = int(round(indice_global * 5))
            # Si el usuario envía un valor distinto, lo ajustamos al correcto
            object.__setattr__(self, 'puntaje_global_saber11', calculado)
        return self

    @field_validator('trabaja_actualmente', mode='before')
    @classmethod
    def normaliza_trabajo_actual(cls, v):
        if v is None:
            return v
        if isinstance(v, TrabajoActualEnum):
            return v
        if isinstance(v, str):
            t = v.strip().lower()
            # tolerar acentos/variantes
            t = t.replace('sí', 'si')
            mapping = {
                'si, tiempo parcial': TrabajoActualEnum.si_parcial,
                'si, tiempo completo': TrabajoActualEnum.si_completo,
                'no': TrabajoActualEnum.no,
            }
            return mapping.get(t, v)
        return v

    @field_validator('miembros_hogar', 'numero_hermanos', mode='before')
    @classmethod
    def parse_enteros_flexibles(cls, v):
        if v is None:
            return v
        if isinstance(v, int):
            return v
        if isinstance(v, str):
            txt = v.strip().lower()
            if txt in ['ninguno', '0']:
                return 0
            # Rango como "2-3" -> tomamos el máximo del rango
            m = re.match(r'^(\d+)\s*[-–]\s*(\d+)$', txt)
            if m:
                a, b = int(m.group(1)), int(m.group(2))
                return max(a, b)
            # "6 o más", "4 o más"
            m2 = re.match(r'^(\d+)\s*o\s*m[aá]s$', txt)
            if m2:
                return int(m2.group(1))
            # dígito simple
            if txt.isdigit():
                return int(txt)
        # Si no se puede interpretar, lo dejamos como None para no bloquear guardado parcial
        return None

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