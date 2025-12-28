-- Create database
CREATE DATABASE IF NOT EXISTS controle_financas;
USE controle_financas;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    data DATE NOT NULL,
    dependencia_origem VARCHAR(255),
    historico TEXT,
    data_balancete DATE,
    numero_documento VARCHAR(100),
    valor DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Recurring Transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    dia_vencimento INT NOT NULL,
    categoria VARCHAR(100),
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    valor_meta DECIMAL(15, 2) NOT NULL,
    valor_atual DECIMAL(15, 2) DEFAULT 0,
    cor VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
