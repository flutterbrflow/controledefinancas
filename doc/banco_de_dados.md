# 🗄️ Banco de Dados

## Schema Principal

```sql
-- Usuários
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transações
CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  data DATE NOT NULL,
  dependencia_origem VARCHAR(255),
  historico TEXT,
  data_balancete DATE,
  numero_documento VARCHAR(100),
  valor DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Contas Recorrentes
CREATE TABLE recurring_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  dia_vencimento INT NOT NULL,
  categoria VARCHAR(100),
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Metas Financeiras
CREATE TABLE goals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  valor_meta DECIMAL(15,2) NOT NULL,
  valor_atual DECIMAL(15,2) DEFAULT 0,
  cor VARCHAR(20) DEFAULT '#3b82f6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
