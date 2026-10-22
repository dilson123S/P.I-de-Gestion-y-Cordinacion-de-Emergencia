-- =============================================================================
-- ESQUEMA RELACIONAL SQL (PostgreSQL) - PLATAFORMA DE GESTIÓN DE EMERGENCIAS (SIGEM)
-- Principio Rector: Registro Único de Datos (RNF-07)
-- Flujo Estricto de Estados: REPORTADO -> CLASIFICADO -> ASIGNADO -> EN_ATENCION -> CERRADO
-- =============================================================================

-- 1. TIPOS ENUMERADOS (ENUMS)
CREATE TYPE "EstadoEmergencia" AS ENUM (
    'REPORTADO',
    'CLASIFICADO',
    'ASIGNADO',
    'EN_ATENCION',
    'CERRADO'
);

CREATE TYPE "RolUsuario" AS ENUM (
    'CIUDADANO',
    'OPERADOR',
    'DESPACHADOR',
    'PERSONAL_CAMPO',
    'ADMIN'
);

CREATE TYPE "EstadoUnidad" AS ENUM (
    'DISPONIBLE',
    'DESPACHADA',
    'EN_ESCENA',
    'FUERA_DE_SERVICIO'
);

-- 2. TABLA: USUARIOS (Actores del Sistema)
CREATE TABLE "usuarios" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) UNIQUE NOT NULL,
    "telefono" VARCHAR(30),
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'CIUDADANO',
    "activo" BOOLEAN NOT NULL DEFAULT TRUE,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA: CATALOGO_TIPO_EMERGENCIA (RF-09: Catálogos Administrables)
CREATE TABLE "catalogo_tipo_emergencia" (
    "id" SERIAL PRIMARY KEY,
    "codigo" VARCHAR(20) UNIQUE NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "prioridad_default" INTEGER NOT NULL DEFAULT 3, -- 1=Crítica, 2=Alta, 3=Media, 4=Baja
    "icono" VARCHAR(10),
    "activo" BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. TABLA: UNIDADES (Recursos de Respuesta y Vehículos)
CREATE TABLE "unidades" (
    "id" SERIAL PRIMARY KEY,
    "codigo" VARCHAR(50) UNIQUE NOT NULL,
    "tipo" VARCHAR(50) NOT NULL, -- Ambulancia, Bomberos, Patrulla, etc.
    "placa" VARCHAR(20),
    "estado" "EstadoUnidad" NOT NULL DEFAULT 'DISPONIBLE',
    "latitud_actual" DOUBLE PRECISION,
    "longitud_actual" DOUBLE PRECISION,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_personal" INTEGER UNIQUE REFERENCES "usuarios"("id") ON DELETE SET NULL
);

-- 5. ENTIDAD CENTRAL: EMERGENCIAS (Reportes y Flujo Unificado RNF-07)
CREATE TABLE "emergencias" (
    "id" SERIAL PRIMARY KEY,

    -- Datos de Captura Inicial (RF-01 / RNF-07)
    "descripcion" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,
    "evidencia_url" VARCHAR(500),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Estado del Ciclo de Vida y Prioridad
    "estado" "EstadoEmergencia" NOT NULL DEFAULT 'REPORTADO',
    "prioridad" INTEGER NOT NULL DEFAULT 3,

    -- Transición: CLASIFICADO (RF-03)
    "notas_clasificacion" TEXT,
    "fecha_clasificacion" TIMESTAMP(3),

    -- Transición: ASIGNADO (RF-05)
    "notas_despacho" TEXT,
    "fecha_asignacion" TIMESTAMP(3),

    -- Transición: EN_ATENCION
    "notas_atencion" TEXT,
    "fecha_inicio_atencion" TIMESTAMP(3),

    -- Transición: CERRADO
    "resolucion" TEXT,
    "fecha_cierre" TIMESTAMP(3),

    -- LLAVES FORÁNEAS - CONEXIÓN CON ACTORES
    "id_ciudadano" INTEGER NOT NULL REFERENCES "usuarios"("id") ON DELETE RESTRICT,
    "id_operador" INTEGER REFERENCES "usuarios"("id") ON DELETE SET NULL,
    "id_despachador" INTEGER REFERENCES "usuarios"("id") ON DELETE SET NULL,
    "id_unidad" INTEGER REFERENCES "unidades"("id") ON DELETE SET NULL,
    "id_tipo_emergencia" INTEGER REFERENCES "catalogo_tipo_emergencia"("id") ON DELETE RESTRICT,

    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices de rendimiento para Emergencias
CREATE INDEX "idx_emergencias_estado" ON "emergencias"("estado");
CREATE INDEX "idx_emergencias_id_ciudadano" ON "emergencias"("id_ciudadano");
CREATE INDEX "idx_emergencias_fecha_creacion" ON "emergencias"("fecha_creacion");

-- 6. TABLA: LOG_AUDITORIA (RNF-09: Trazabilidad y Seguridad Estricta)
CREATE TABLE "log_auditoria" (
    "id" SERIAL PRIMARY KEY,
    "id_emergencia" INTEGER NOT NULL REFERENCES "emergencias"("id") ON DELETE CASCADE,
    "id_usuario_accion" INTEGER NOT NULL REFERENCES "usuarios"("id") ON DELETE RESTRICT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accion_realizada" VARCHAR(200) NOT NULL,
    "estado_anterior" "EstadoEmergencia",
    "estado_nuevo" "EstadoEmergencia",
    "datos_modificados" JSONB,
    "ip_address" VARCHAR(45)
);

-- Índices de auditoría
CREATE INDEX "idx_log_auditoria_id_emergencia" ON "log_auditoria"("id_emergencia");
CREATE INDEX "idx_log_auditoria_id_usuario" ON "log_auditoria"("id_usuario_accion");
CREATE INDEX "idx_log_auditoria_fecha" ON "log_auditoria"("fecha");
