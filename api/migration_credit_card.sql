-- Adiciona colunas para suporte a parcelamento de cartão de crédito
ALTER TABLE transactions ADD COLUMN parcela_atual INT DEFAULT NULL;
ALTER TABLE transactions ADD COLUMN total_parcelas INT DEFAULT NULL;
