CREATE DATABASE IF NOT EXISTS lactisvalle_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE lactisvalle_db;
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS bovino (
    id_bovino VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    promedio_referencia DECIMAL(4,2) DEFAULT 0.00,
    estado VARCHAR(15) NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
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
CREATE TABLE IF NOT EXISTS alerta_sanitaria (
    id_alerta INT AUTO_INCREMENT PRIMARY KEY,
    id_ordeno INT NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    nivel_urgencia VARCHAR(20) NOT NULL DEFAULT 'CRITICO',
    atendido BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_alerta_ordeno FOREIGN KEY (id_ordeno)
        REFERENCES registro_ordeno(id_ordeno)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;
CREATE INDEX idx_bovino_nombre ON bovino(nombre);
CREATE INDEX idx_ordeno_bovino_fecha ON registro_ordeno(id_bovino, fecha_registro DESC);
CREATE INDEX idx_ordeno_alerta ON registro_ordeno(es_alerta);
CREATE INDEX idx_alerta_atendido ON alerta_sanitaria(atendido);