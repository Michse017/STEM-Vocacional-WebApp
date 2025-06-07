from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    id_usuario = db.Column(db.Integer, primary_key=True, autoincrement=True)
    codigo_estudiante = db.Column(db.String(255), nullable=False, unique=True)
    
    def to_dict(self):
        return {
            'id_usuario': self.id_usuario,
            'codigo_estudiante': self.codigo_estudiante
        }

class RespuestaCognitiva(db.Model):
    __tablename__ = 'resp_cognitiva'
    
    id_resp_cognitiva = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    ptj_fisica = db.Column(db.Numeric)
    ptj_quimica = db.Column(db.Numeric)
    ptj_biologia = db.Column(db.Numeric)
    ptj_matematicas = db.Column(db.Numeric)
    ptj_geografia = db.Column(db.Numeric)
    ptj_historia = db.Column(db.Numeric)
    ptj_filosofia = db.Column(db.Numeric)
    ptj_sociales_ciudadano = db.Column(db.Numeric)
    ptj_ciencias_sociales = db.Column(db.Numeric)
    ptj_lenguaje = db.Column(db.Numeric)
    ptj_lectura_critica = db.Column(db.Numeric)
    ptj_ingles = db.Column(db.Numeric)
    ecaes = db.Column(db.Numeric)
    pga_acumulado = db.Column(db.Numeric)
    promedio_periodo = db.Column(db.Numeric)
    fecha_respuesta = db.Column(db.DateTime)
    fecha_actualizacion = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id_resp_cognitiva': self.id_resp_cognitiva,
            'id_usuario': self.id_usuario,
            'ptj_fisica': float(self.ptj_fisica) if self.ptj_fisica else None,
            'ptj_quimica': float(self.ptj_quimica) if self.ptj_quimica else None,
            'ptj_biologia': float(self.ptj_biologia) if self.ptj_biologia else None,
            'ptj_matematicas': float(self.ptj_matematicas) if self.ptj_matematicas else None,
            'ptj_geografia': float(self.ptj_geografia) if self.ptj_geografia else None,
            'ptj_historia': float(self.ptj_historia) if self.ptj_historia else None,
            'ptj_filosofia': float(self.ptj_filosofia) if self.ptj_filosofia else None,
            'ptj_sociales_ciudadano': float(self.ptj_sociales_ciudadano) if self.ptj_sociales_ciudadano else None,
            'ptj_ciencias_sociales': float(self.ptj_ciencias_sociales) if self.ptj_ciencias_sociales else None,
            'ptj_lenguaje': float(self.ptj_lenguaje) if self.ptj_lenguaje else None,
            'ptj_lectura_critica': float(self.ptj_lectura_critica) if self.ptj_lectura_critica else None,
            'ptj_ingles': float(self.ptj_ingles) if self.ptj_ingles else None,
            'ecaes': float(self.ecaes) if self.ecaes else None,
            'pga_acumulado': float(self.pga_acumulado) if self.pga_acumulado else None,
            'promedio_periodo': float(self.promedio_periodo) if self.promedio_periodo else None,
            'fecha_respuesta': self.fecha_respuesta.isoformat() if self.fecha_respuesta else None,
            'fecha_actualizacion': self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None
        }

class RespuestaEducativa(db.Model):
    __tablename__ = 'resp_educativa'
    
    id_respuesta = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    puntaje_educacion = db.Column(db.Float)
    nivel_educativo = db.Column(db.String(255))
    institucion = db.Column(db.String(255))
    fecha_respuesta = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id_respuesta': self.id_respuesta,
            'id_usuario': self.id_usuario,
            'puntaje_educacion': self.puntaje_educacion,
            'nivel_educativo': self.nivel_educativo,
            'institucion': self.institucion,
            'fecha_respuesta': self.fecha_respuesta.isoformat() if self.fecha_respuesta else None
        }

class RespuestaEducativaFamiliar(db.Model):
    __tablename__ = 'resp_educativa_familiar'
    
    id_resp_edu_fam = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    colegio = db.Column(db.String(255))
    ciudad_colegio = db.Column(db.String(255))
    depto_colegio = db.Column(db.String(255))
    municipio_colegio = db.Column(db.String(255))
    fecha_graduacion = db.Column(db.Date)
    fecha_respuesta = db.Column(db.DateTime)
    fecha_actualizacion = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id_resp_edu_fam': self.id_resp_edu_fam,
            'id_usuario': self.id_usuario,
            'colegio': self.colegio,
            'ciudad_colegio': self.ciudad_colegio,
            'depto_colegio': self.depto_colegio,
            'municipio_colegio': self.municipio_colegio,
            'fecha_graduacion': self.fecha_graduacion.isoformat() if self.fecha_graduacion else None,
            'fecha_respuesta': self.fecha_respuesta.isoformat() if self.fecha_respuesta else None,
            'fecha_actualizacion': self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None
        }

class RespuestaSocioeconomica(db.Model):
    __tablename__ = 'resp_socioeconomica'
    
    id_resp_socio = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    estrato = db.Column(db.String(255))
    becas = db.Column(db.String(255))
    ceres = db.Column(db.String(255))
    periodo_ingreso = db.Column(db.String(255))
    tipo_estudiante = db.Column(db.String(255))
    fecha_respuesta = db.Column(db.DateTime)
    fecha_actualizacion = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id_resp_socio': self.id_resp_socio,
            'id_usuario': self.id_usuario,
            'estrato': self.estrato,
            'becas': self.becas,
            'ceres': self.ceres,
            'periodo_ingreso': self.periodo_ingreso,
            'tipo_estudiante': self.tipo_estudiante,
            'fecha_respuesta': self.fecha_respuesta.isoformat() if self.fecha_respuesta else None,
            'fecha_actualizacion': self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None
        }

class RespuestaAutoeficacia(db.Model):
    __tablename__ = 'resp_autoeficacia'
    
    id_resp_auto = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    creditos_matriculados = db.Column(db.Integer)
    creditos_ganadas = db.Column(db.Integer)
    creditos_reprobadas = db.Column(db.Integer)
    puntos_calidad_pga = db.Column(db.Numeric)
    situacion = db.Column(db.String(255))
    estado = db.Column(db.String(255))
    nro_materias_aprobadas = db.Column(db.Integer)
    nro_materias_reprobadas = db.Column(db.Integer)
    fecha_respuesta = db.Column(db.DateTime)
    fecha_actualizacion = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id_resp_auto': self.id_resp_auto,
            'id_usuario': self.id_usuario,
            'creditos_matriculados': self.creditos_matriculados,
            'creditos_ganadas': self.creditos_ganadas,
            'creditos_reprobadas': self.creditos_reprobadas,
            'puntos_calidad_pga': float(self.puntos_calidad_pga) if self.puntos_calidad_pga else None,
            'situacion': self.situacion,
            'estado': self.estado,
            'nro_materias_aprobadas': self.nro_materias_aprobadas,
            'nro_materias_reprobadas': self.nro_materias_reprobadas,
            'fecha_respuesta': self.fecha_respuesta.isoformat() if self.fecha_respuesta else None,
            'fecha_actualizacion': self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None
        }