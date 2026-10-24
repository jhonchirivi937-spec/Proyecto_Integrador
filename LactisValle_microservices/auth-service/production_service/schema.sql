USE lactisvalle_db;

-- 1. Eliminar tablas que no se necesitan en esta etapa
DROP TABLE IF EXISTS alerta_sanitaria;
DROP TABLE IF EXISTS bovino;

-- 2. Mantener la tabla de autenticación
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Mantener la tabla principal de sincronización
CREATE TABLE IF NOT EXISTS registro_ordeno (
    id_ordeno INT AUTO_INCREMENT PRIMARY KEY,
    id_bovino VARCHAR(50) NOT NULL,
    jornada ENUM('Mañana', 'Tarde') NOT NULL DEFAULT 'Mañana',
    litros_pesados DECIMAL(4,2) NOT NULL,
    condicion_corporal DECIMAL(3,2) DEFAULT 3.00,
    estado_sanitario VARCHAR(50) NOT NULL DEFAULT 'Sana',
    observaciones TEXT NULL,
    promedio_referencia DECIMAL(4,2) DEFAULT 0.00,
    delta_p DECIMAL(5,2) DEFAULT 0.00,
    es_alerta BOOLEAN NOT NULL DEFAULT FALSE,
    estado_regla VARCHAR(50) DEFAULT 'Normal',
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_ordeno_litros CHECK (litros_pesados >= 0.00 AND litros_pesados <= 99.99)
) ENGINE=InnoDB;