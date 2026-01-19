-- Adiciona coluna para sinalizar transações de cartão de crédito
ALTER TABLE transactions ADD COLUMN is_credit_card BOOLEAN DEFAULT 0;
