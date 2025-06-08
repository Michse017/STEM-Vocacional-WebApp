CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    codigo_estudiante VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE resp_cognitiva (
    id_resp_cognitiva SERIAL PRIMARY KEY,
    id_usuario INTEGER UNIQUE REFERENCES usuarios(id_usuario),
    ptj_fisica NUMERIC,
    ptj_quimica NUMERIC,
    ptj_biologia NUMERIC,
    ptj_matematicas NUMERIC,
    ptj_geografia NUMERIC,
    ptj_historia NUMERIC,
    ptj_filosofia NUMERIC,
    ptj_sociales_ciudadano NUMERIC,
    ptj_ciencias_sociales NUMERIC,
    ptj_lenguaje NUMERIC,
    ptj_lectura_critica NUMERIC,
    ptj_ingles NUMERIC,
    ecaes NUMERIC,
    pga_acumulado NUMERIC,
    promedio_periodo NUMERIC,
    fecha_respuesta TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);

CREATE TABLE resp_educativa_familiar (
    id_resp_edu_fam SERIAL PRIMARY KEY,
    id_usuario INTEGER UNIQUE REFERENCES usuarios(id_usuario),
    colegio VARCHAR(150),
    ciudad_colegio VARCHAR(100),
    depto_colegio VARCHAR(50),
    municipio_colegio VARCHAR(100),
    fecha_graduacion DATE,
    fecha_respuesta TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);

CREATE TABLE resp_socioeconomica (
    id_resp_socio SERIAL PRIMARY KEY,
    id_usuario INTEGER UNIQUE REFERENCES usuarios(id_usuario),
    estrato VARCHAR(20),
    becas VARCHAR(255),
    ceres VARCHAR(255),
    periodo_ingreso VARCHAR(20),
    tipo_estudiante VARCHAR(50),
    fecha_respuesta TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);

CREATE TABLE resp_autoeficacia (
    id_resp_auto SERIAL PRIMARY KEY,
    id_usuario INTEGER UNIQUE REFERENCES usuarios(id_usuario),
    creditos_matriculados INTEGER,
    creditos_ganadas INTEGER,
    creditos_reprobadas INTEGER,
    puntos_calidad_pga NUMERIC,
    situacion VARCHAR(50),
    estado VARCHAR(50),
    nro_materias_aprobadas INTEGER,
    nro_materias_reprobadas INTEGER,
    fecha_respuesta TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);