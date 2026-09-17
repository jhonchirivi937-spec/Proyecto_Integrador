-- =============================================================================
-- SISTEMA DE CONTROL LECHERO OFFLINE-FIRST: LACTISVALLE
-- Script DDL: Creación de Esquema, Tablas, Restricciones y Datos de Prueba
-- Motor compatible: MySQL 8.0+ / MariaDB 10.4+
-- =============================================================================

CREATE DATABASE IF NOT EXISTS lactisvalle_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE lactisvalle_db;

-- -----------------------------------------------------------------------------
-- 1. TABLA: bovino (Catálogo de referencia de animales)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bovino (
    id_bovino VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    promedio_referencia DECIMAL(4,2) NOT NULL,
    estado VARCHAR(15) NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_bovino_promedio CHECK (promedio_referencia >= 0.00)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 2. TABLA: registro_ordeno (Transacciones de pesaje diario)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registro_ordeno (
    id_ordeno INT AUTO_INCREMENT PRIMARY KEY,
    id_bovino VARCHAR(20) NOT NULL,
    litros_pesados DECIMAL(4,2) NOT NULL,
    promedio_referencia DECIMAL(4,2) NOT NULL,
    delta_p DECIMAL(5,2) NOT NULL,
    es_alerta BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_registro DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones de integridad referencial
    CONSTRAINT fk_ordeno_bovino FOREIGN KEY (id_bovino)
        REFERENCES bovino(id_bovino)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT chk_ordeno_litros CHECK (litros_pesados >= 0.00 AND litros_pesados <= 99.99)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 3. TABLA: alerta_sanitaria (Módulo de alertas por caída de producción)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerta_sanitaria (
    id_alerta INT AUTO_INCREMENT PRIMARY KEY,
    id_ordeno INT NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    nivel_urgencia VARCHAR(20) NOT NULL DEFAULT 'CRITICO',
    atendido BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones de integridad referencial
    CONSTRAINT fk_alerta_ordeno FOREIGN KEY (id_ordeno)
        REFERENCES registro_ordeno(id_ordeno)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- ÍNDICES DE OPTIMIZACIÓN DE CONSULTAS ($O(\log n)$)
-- =============================================================================
CREATE INDEX idx_bovino_nombre ON bovino(nombre);
CREATE INDEX idx_ordeno_bovino_fecha ON registro_ordeno(id_bovino, fecha_registro DESC);
CREATE INDEX idx_ordeno_alerta ON registro_ordeno(es_alerta);
CREATE INDEX idx_alerta_atendido ON alerta_sanitaria(atendido);

-- =============================================================================
-- INSERCIÓN DE DATOS DE PRUEBA INITIAL
-- =============================================================================
INSERT INTO bovino (id_bovino, nombre, promedio_referencia) VALUES
('CO-710240', 'Lucero', 12.50),
('CO-00988A', 'Mariposa', 15.00)
ON DUPLICATE KEY UPDATE promedio_referencia = VALUES(promedio_referencia);