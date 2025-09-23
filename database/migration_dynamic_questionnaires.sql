-- ============================================================================
-- MIGRACIÓN: Sistema Dinámico de Cuestionarios
-- Fecha: 2025-09-23
-- Descripción: Agrega tablas para un sistema flexible de cuestionarios
-- ============================================================================

-- 1. Tabla principal de cuestionarios
CREATE TABLE cuestionarios (
    id_cuestionario INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(MAX),
    activo BIT DEFAULT 1,
    tipo NVARCHAR(50),  -- 'sociodemografico', 'inteligencias_multiples', 'personalidad', etc.
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE()
);
GO

-- 2. Tabla de preguntas
CREATE TABLE preguntas (
    id_pregunta INT IDENTITY(1,1) PRIMARY KEY,
    id_cuestionario INT NOT NULL REFERENCES cuestionarios(id_cuestionario) ON DELETE CASCADE,
    texto NVARCHAR(MAX) NOT NULL,
    tipo_pregunta NVARCHAR(50) NOT NULL,  -- 'texto', 'seleccion_unica', 'seleccion_multiple', 'escala', 'fecha', 'numero', 'booleano'
    requerida BIT DEFAULT 1,
    orden INT NOT NULL,
    
    -- Campos adicionales para validación
    min_valor INT,  -- Para preguntas numéricas o escalas
    max_valor INT,  -- Para preguntas numéricas o escalas
    patron_validacion NVARCHAR(200),  -- Regex para validación de texto
    ayuda_texto NVARCHAR(MAX),  -- Texto de ayuda para el usuario
    
    fecha_creacion DATETIME2 DEFAULT GETDATE()
);
GO

-- 3. Tabla de opciones para preguntas de selección
CREATE TABLE opciones_pregunta (
    id_opcion INT IDENTITY(1,1) PRIMARY KEY,
    id_pregunta INT NOT NULL REFERENCES preguntas(id_pregunta) ON DELETE CASCADE,
    texto NVARCHAR(200) NOT NULL,
    valor NVARCHAR(100),  -- Valor interno que se almacena
    orden INT NOT NULL,
    activa BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE()
);
GO

-- 4. Tabla de respuestas de cuestionarios (nivel superior)
CREATE TABLE respuestas_cuestionario (
    id_respuesta_cuestionario INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_cuestionario INT NOT NULL REFERENCES cuestionarios(id_cuestionario) ON DELETE CASCADE,
    completado BIT DEFAULT 0,
    fecha_inicio DATETIME2 DEFAULT GETDATE(),
    fecha_completado DATETIME2
);
GO

-- 5. Tabla de respuestas individuales por pregunta
CREATE TABLE respuestas_usuario (
    id_respuesta INT IDENTITY(1,1) PRIMARY KEY,
    id_respuesta_cuestionario INT NOT NULL REFERENCES respuestas_cuestionario(id_respuesta_cuestionario) ON DELETE CASCADE,
    id_pregunta INT NOT NULL REFERENCES preguntas(id_pregunta) ON DELETE CASCADE,
    valor_respuesta NVARCHAR(MAX),  -- Almacena la respuesta en formato texto
    fecha_respuesta DATETIME2 DEFAULT GETDATE()
);
GO

-- Índices para mejorar rendimiento
CREATE INDEX idx_cuestionarios_activo ON cuestionarios(activo);
CREATE INDEX idx_cuestionarios_tipo ON cuestionarios(tipo);
CREATE INDEX idx_preguntas_cuestionario ON preguntas(id_cuestionario);
CREATE INDEX idx_preguntas_orden ON preguntas(id_cuestionario, orden);
CREATE INDEX idx_opciones_pregunta ON opciones_pregunta(id_pregunta);
CREATE INDEX idx_respuestas_cuestionario_usuario ON respuestas_cuestionario(id_usuario);
CREATE INDEX idx_respuestas_usuario_pregunta ON respuestas_usuario(id_pregunta);
GO

-- Constraints adicionales
ALTER TABLE preguntas ADD CONSTRAINT chk_tipo_pregunta 
    CHECK (tipo_pregunta IN ('texto', 'seleccion_unica', 'seleccion_multiple', 'escala', 'fecha', 'numero', 'booleano'));
GO

-- Constraint para evitar respuestas duplicadas por usuario-cuestionario
ALTER TABLE respuestas_cuestionario ADD CONSTRAINT uk_usuario_cuestionario 
    UNIQUE (id_usuario, id_cuestionario);
GO

PRINT 'Migración completada: Sistema dinámico de cuestionarios creado exitosamente.';