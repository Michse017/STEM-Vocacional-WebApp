-- Schema DEFINITIVO basado en el formato final del cuestionario

-- Eliminar tablas antiguas si existen para empezar desde cero (opcional, pero recomendado para una limpieza total)
DROP TABLE IF EXISTS resp_autoeficacia;
DROP TABLE IF EXISTS resp_socioeconomica;
DROP TABLE IF EXISTS resp_educativa_familiar;
DROP TABLE IF EXISTS resp_cognitiva;
DROP TABLE IF EXISTS usuarios;

-- 1. Tabla Central de Usuarios (se mantiene igual)
CREATE TABLE usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    codigo_estudiante NVARCHAR(20) UNIQUE NOT NULL
);
GO

-- 2. Tabla para la Dimensión Sociodemográfica, Socioeconómica y Académica
CREATE TABLE resp_sociodemografica (
    id_resp_sociodemo INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,

    -- Datos personales básicos
    fecha_nacimiento DATE,
    sexo NVARCHAR(20),
    fecha_graduacion_bachillerato DATE,

    -- Condiciones familiares
    nivel_educativo_madre NVARCHAR(50),
    nivel_educativo_padre NVARCHAR(50),
    ocupacion_padre NVARCHAR(50),
    ocupacion_madre NVARCHAR(50),
    miembros_hogar NVARCHAR(10),
    numero_hermanos NVARCHAR(10),

    -- Condiciones especiales
    condicion_discapacidad NVARCHAR(50),
    otro_discapacidad NVARCHAR(100),
    grupo_etnico NVARCHAR(50),
    otro_grupo_etnico NVARCHAR(100),
    condicion_vulnerabilidad NVARCHAR(50),

    -- Trabajo y Estudio
    trabaja_actualmente NVARCHAR(20),

    -- Dimensiones académicas (Pruebas Saber 11)
    puntaje_global_saber11 INT CHECK (puntaje_global_saber11 BETWEEN 0 AND 500),
    puntaje_lectura_critica INT CHECK (puntaje_lectura_critica BETWEEN 0 AND 100),
    puntaje_matematicas INT CHECK (puntaje_matematicas BETWEEN 0 AND 100),
    puntaje_ingles INT CHECK (puntaje_ingles BETWEEN 0 AND 100),
    puntaje_competencias_ciudadanas INT CHECK (puntaje_competencias_ciudadanas BETWEEN 0 AND 100),
    puntaje_ciencias_naturales INT CHECK (puntaje_ciencias_naturales BETWEEN 0 AND 100),

    -- Metadatos de la respuesta
    fecha_respuesta DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE()
);
GO

-- 3. Tabla para las Dimensiones Cognitivas (Test de Inteligencias Múltiples)
CREATE TABLE resp_inteligencias_multiples (
    id_resp_intel INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,

    -- Respuestas a las 35 preguntas (V/F/Nulo)
    -- Usamos NVARCHAR(1) para almacenar 'V', 'F' o dejarlo NULL si está en blanco.
    pregunta_1 NVARCHAR(1) CHECK (pregunta_1 IN ('V', 'F')),
    pregunta_2 NVARCHAR(1) CHECK (pregunta_2 IN ('V', 'F')),
    pregunta_3 NVARCHAR(1) CHECK (pregunta_3 IN ('V', 'F')),
    pregunta_4 NVARCHAR(1) CHECK (pregunta_4 IN ('V', 'F')),
    pregunta_5 NVARCHAR(1) CHECK (pregunta_5 IN ('V', 'F')),
    pregunta_6 NVARCHAR(1) CHECK (pregunta_6 IN ('V', 'F')),
    pregunta_7 NVARCHAR(1) CHECK (pregunta_7 IN ('V', 'F')),
    pregunta_8 NVARCHAR(1) CHECK (pregunta_8 IN ('V', 'F')),
    pregunta_9 NVARCHAR(1) CHECK (pregunta_9 IN ('V', 'F')),
    pregunta_10 NVARCHAR(1) CHECK (pregunta_10 IN ('V', 'F')),
    pregunta_11 NVARCHAR(1) CHECK (pregunta_11 IN ('V', 'F')),
    pregunta_12 NVARCHAR(1) CHECK (pregunta_12 IN ('V', 'F')),
    pregunta_13 NVARCHAR(1) CHECK (pregunta_13 IN ('V', 'F')),
    pregunta_14 NVARCHAR(1) CHECK (pregunta_14 IN ('V', 'F')),
    pregunta_15 NVARCHAR(1) CHECK (pregunta_15 IN ('V', 'F')),
    pregunta_16 NVARCHAR(1) CHECK (pregunta_16 IN ('V', 'F')),
    pregunta_17 NVARCHAR(1) CHECK (pregunta_17 IN ('V', 'F')),
    pregunta_18 NVARCHAR(1) CHECK (pregunta_18 IN ('V', 'F')),
    pregunta_19 NVARCHAR(1) CHECK (pregunta_19 IN ('V', 'F')),
    pregunta_20 NVARCHAR(1) CHECK (pregunta_20 IN ('V', 'F')),
    pregunta_21 NVARCHAR(1) CHECK (pregunta_21 IN ('V', 'F')),
    pregunta_22 NVARCHAR(1) CHECK (pregunta_22 IN ('V', 'F')),
    pregunta_23 NVARCHAR(1) CHECK (pregunta_23 IN ('V', 'F')),
    pregunta_24 NVARCHAR(1) CHECK (pregunta_24 IN ('V', 'F')),
    pregunta_25 NVARCHAR(1) CHECK (pregunta_25 IN ('V', 'F')),
    pregunta_26 NVARCHAR(1) CHECK (pregunta_26 IN ('V', 'F')),
    pregunta_27 NVARCHAR(1) CHECK (pregunta_27 IN ('V', 'F')),
    pregunta_28 NVARCHAR(1) CHECK (pregunta_28 IN ('V', 'F')),
    pregunta_29 NVARCHAR(1) CHECK (pregunta_29 IN ('V', 'F')),
    pregunta_30 NVARCHAR(1) CHECK (pregunta_30 IN ('V', 'F')),
    pregunta_31 NVARCHAR(1) CHECK (pregunta_31 IN ('V', 'F')),
    pregunta_32 NVARCHAR(1) CHECK (pregunta_32 IN ('V', 'F')),
    pregunta_33 NVARCHAR(1) CHECK (pregunta_33 IN ('V', 'F')),
    pregunta_34 NVARCHAR(1) CHECK (pregunta_34 IN ('V', 'F')),
    pregunta_35 NVARCHAR(1) CHECK (pregunta_35 IN ('V', 'F')),

    -- Metadatos de la respuesta
    fecha_respuesta DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE()
);
GO

-- Índices para mejorar el rendimiento de las búsquedas
CREATE INDEX idx_codigo_estudiante ON usuarios(codigo_estudiante);
CREATE INDEX idx_sociodemo_id_usuario ON resp_sociodemografica(id_usuario);
CREATE INDEX idx_intel_id_usuario ON resp_inteligencias_multiples(id_usuario);
GO