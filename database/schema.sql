-- Schema convertido para SQL Server Azure

-- Tabla usuarios
CREATE TABLE usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,           -- SERIAL → IDENTITY
    codigo_estudiante NVARCHAR(20) UNIQUE NOT NULL     -- VARCHAR → NVARCHAR
);

-- Tabla resp_cognitiva  
CREATE TABLE resp_cognitiva (
    id_resp_cognitiva INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    ptj_fisica DECIMAL(5,2) CHECK (ptj_fisica >= 0 AND ptj_fisica <= 100),        -- NUMERIC → DECIMAL
    ptj_quimica DECIMAL(5,2) CHECK (ptj_quimica >= 0 AND ptj_quimica <= 100),
    ptj_biologia DECIMAL(5,2) CHECK (ptj_biologia >= 0 AND ptj_biologia <= 100),
    ptj_matematicas DECIMAL(5,2) CHECK (ptj_matematicas >= 0 AND ptj_matematicas <= 100),
    ptj_geografia DECIMAL(5,2) CHECK (ptj_geografia >= 0 AND ptj_geografia <= 100),
    ptj_historia DECIMAL(5,2) CHECK (ptj_historia >= 0 AND ptj_historia <= 100),
    ptj_filosofia DECIMAL(5,2) CHECK (ptj_filosofia >= 0 AND ptj_filosofia <= 100),
    ptj_sociales_ciudadano DECIMAL(5,2) CHECK (ptj_sociales_ciudadano >= 0 AND ptj_sociales_ciudadano <= 100),
    ptj_ciencias_sociales DECIMAL(5,2) CHECK (ptj_ciencias_sociales >= 0 AND ptj_ciencias_sociales <= 100),
    ptj_lenguaje DECIMAL(5,2) CHECK (ptj_lenguaje >= 0 AND ptj_lenguaje <= 100),
    ptj_lectura_critica DECIMAL(5,2) CHECK (ptj_lectura_critica >= 0 AND ptj_lectura_critica <= 100),
    ptj_ingles DECIMAL(5,2) CHECK (ptj_ingles >= 0 AND ptj_ingles <= 100),
    ecaes DECIMAL(8,2),
    pga_acumulado DECIMAL(3,2) CHECK (pga_acumulado >= 0 AND pga_acumulado <= 5),
    promedio_periodo DECIMAL(3,2) CHECK (promedio_periodo >= 0 AND promedio_periodo <= 5),
    fecha_respuesta DATETIME2 DEFAULT GETDATE(),       -- TIMESTAMP → DATETIME2
    fecha_actualizacion DATETIME2 DEFAULT GETDATE()
);

-- Tabla resp_educativa_familiar
CREATE TABLE resp_educativa_familiar (
    id_resp_edu_fam INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    colegio NVARCHAR(150),
    ciudad_colegio NVARCHAR(100),
    depto_colegio NVARCHAR(50),
    municipio_colegio NVARCHAR(100),
    fecha_graduacion DATE,
    fecha_respuesta DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE()
);

-- Tabla resp_socioeconomica
CREATE TABLE resp_socioeconomica (
    id_resp_socio INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    estrato NVARCHAR(20),
    becas NVARCHAR(255),
    ceres NVARCHAR(255),
    periodo_ingreso NVARCHAR(20),
    tipo_estudiante NVARCHAR(50),
    fecha_respuesta DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE()
);

-- Tabla resp_autoeficacia
CREATE TABLE resp_autoeficacia (
    id_resp_auto INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    creditos_matriculados INT CHECK (creditos_matriculados >= 0),
    creditos_ganadas INT CHECK (creditos_ganadas >= 0),
    creditos_reprobadas INT CHECK (creditos_reprobadas >= 0),
    puntos_calidad_pga DECIMAL(8,2) CHECK (puntos_calidad_pga >= 0),
    situacion NVARCHAR(50),
    estado NVARCHAR(50),
    nro_materias_aprobadas INT CHECK (nro_materias_aprobadas >= 0),
    nro_materias_reprobadas INT CHECK (nro_materias_reprobadas >= 0),
    fecha_respuesta DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE()
);

-- Índices
CREATE INDEX idx_codigo_estudiante ON usuarios(codigo_estudiante);