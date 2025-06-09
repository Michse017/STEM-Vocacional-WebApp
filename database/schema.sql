CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    codigo_estudiante VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS resp_cognitiva (
    id_resp_cognitiva SERIAL PRIMARY KEY,
    id_usuario INTEGER UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    ptj_fisica NUMERIC CHECK (ptj_fisica >= 0 AND ptj_fisica <= 100),
    ptj_quimica NUMERIC CHECK (ptj_quimica >= 0 AND ptj_quimica <= 100),
    ptj_biologia NUMERIC CHECK (ptj_biologia >= 0 AND ptj_biologia <= 100),
    ptj_matematicas NUMERIC CHECK (ptj_matematicas >= 0 AND ptj_matematicas <= 100),
    ptj_geografia NUMERIC CHECK (ptj_geografia >= 0 AND ptj_geografia <= 100),
    ptj_historia NUMERIC CHECK (ptj_historia >= 0 AND ptj_historia <= 100),
    ptj_filosofia NUMERIC CHECK (ptj_filosofia >= 0 AND ptj_filosofia <= 100),
    ptj_sociales_ciudadano NUMERIC CHECK (ptj_sociales_ciudadano >= 0 AND ptj_sociales_ciudadano <= 100),
    ptj_ciencias_sociales NUMERIC CHECK (ptj_ciencias_sociales >= 0 AND ptj_ciencias_sociales <= 100),
    ptj_lenguaje NUMERIC CHECK (ptj_lenguaje >= 0 AND ptj_lenguaje <= 100),
    ptj_lectura_critica NUMERIC CHECK (ptj_lectura_critica >= 0 AND ptj_lectura_critica <= 100),
    ptj_ingles NUMERIC CHECK (ptj_ingles >= 0 AND ptj_ingles <= 100),
    ecaes NUMERIC,
    pga_acumulado NUMERIC CHECK (pga_acumulado >= 0 AND pga_acumulado <= 5),
    promedio_periodo NUMERIC CHECK (promedio_periodo >= 0 AND promedio_periodo <= 5),
    fecha_respuesta TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resp_educativa_familiar (
    id_resp_edu_fam SERIAL PRIMARY KEY,
    id_usuario INTEGER UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    colegio VARCHAR(150),
    ciudad_colegio VARCHAR(100),
    depto_colegio VARCHAR(50),
    municipio_colegio VARCHAR(100),
    fecha_graduacion DATE,
    fecha_respuesta TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resp_socioeconomica (
    id_resp_socio SERIAL PRIMARY KEY,
    id_usuario INTEGER UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    estrato VARCHAR(20),
    becas VARCHAR(255),
    ceres VARCHAR(255),
    periodo_ingreso VARCHAR(20),
    tipo_estudiante VARCHAR(50),
    fecha_respuesta TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resp_autoeficacia (
    id_resp_auto SERIAL PRIMARY KEY,
    id_usuario INTEGER UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    creditos_matriculados INTEGER CHECK (creditos_matriculados >= 0),
    creditos_ganadas INTEGER CHECK (creditos_ganadas >= 0),
    creditos_reprobadas INTEGER CHECK (creditos_reprobadas >= 0),
    puntos_calidad_pga NUMERIC CHECK (puntos_calidad_pga >= 0),
    situacion VARCHAR(50),
    estado VARCHAR(50),
    nro_materias_aprobadas INTEGER CHECK (nro_materias_aprobadas >= 0),
    nro_materias_reprobadas INTEGER CHECK (nro_materias_reprobadas >= 0),
    fecha_respuesta TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_codigo_estudiante ON usuarios(codigo_estudiante);