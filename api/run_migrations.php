<?php
// Script para aplicar migrações pendentes
// Acesse via navegador: http://seu-servidor/api/run_migrations.php

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Aplicando Migrações...</h1>";

require_once 'db.php';

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. Adicionar is_credit_card
    try {
        echo "Tentando adicionar coluna 'is_credit_card'... ";
        $pdo->exec("ALTER TABLE transactions ADD COLUMN is_credit_card BOOLEAN DEFAULT 0");
        echo "<span style='color:green'>Sucesso!</span><br>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "Duplicate column") !== false || strpos($e->getMessage(), "exists") !== false) {
            echo "<span style='color:orange'>Coluna já existe (Ignorado).</span><br>";
        } else {
            echo "<span style='color:red'>Erro: " . $e->getMessage() . "</span><br>";
        }
    }

    // 2. Adicionar parcela_atual
    try {
        echo "Tentando adicionar coluna 'parcela_atual'... ";
        $pdo->exec("ALTER TABLE transactions ADD COLUMN parcela_atual INT DEFAULT NULL");
        echo "<span style='color:green'>Sucesso!</span><br>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "Duplicate column") !== false || strpos($e->getMessage(), "exists") !== false) {
            echo "<span style='color:orange'>Coluna já existe (Ignorado).</span><br>";
        } else {
            echo "<span style='color:red'>Erro: " . $e->getMessage() . "</span><br>";
        }
    }

    // 3. Adicionar total_parcelas
    try {
        echo "Tentando adicionar coluna 'total_parcelas'... ";
        $pdo->exec("ALTER TABLE transactions ADD COLUMN total_parcelas INT DEFAULT NULL");
        echo "<span style='color:green'>Sucesso!</span><br>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "Duplicate column") !== false || strpos($e->getMessage(), "exists") !== false) {
            echo "<span style='color:orange'>Coluna já existe (Ignorado).</span><br>";
        } else {
            echo "<span style='color:red'>Erro: " . $e->getMessage() . "</span><br>";
        }
    }

    // 4. Adicionar is_savings
    try {
        echo "Tentando adicionar coluna 'is_savings'... ";
        $pdo->exec("ALTER TABLE transactions ADD COLUMN is_savings TINYINT(1) DEFAULT 0");
        echo "<span style='color:green'>Sucesso!</span><br>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "Duplicate column") !== false || strpos($e->getMessage(), "exists") !== false) {
            echo "<span style='color:orange'>Coluna já existe (Ignorado).</span><br>";
        } else {
            echo "<span style='color:red'>Erro: " . $e->getMessage() . "</span><br>";
        }
    }

    // 5. Atualizar transações existentes de poupança baseado em palavras-chave
    try {
        echo "Atualizando transações existentes de poupança... ";
        $updateQuery = "UPDATE transactions SET is_savings = 1 WHERE is_savings = 0 AND (
            UPPER(historico) LIKE '%POUPAN%' OR 
            UPPER(historico) LIKE '%APL.POUP%' OR 
            UPPER(historico) LIKE '%RES.POUP%' OR 
            UPPER(historico) LIKE '%APLICACAO POUP%' OR
            UPPER(historico) LIKE '%APLICAÇÃO POUP%' OR
            UPPER(historico) LIKE '%RESGATE POUP%' OR
            UPPER(historico) LIKE '%TRANSFERIDO DA POUPAN%' OR
            UPPER(historico) LIKE '%TRANSFERIDO POUPAN%' OR
            UPPER(historico) LIKE '%TRANSFERENCIA DE CREDITO%' OR
            UPPER(historico) LIKE '%TRANSFERÊNCIA DE CRÉDITO%' OR
            UPPER(historico) LIKE '%TRANSFERENCIA PARA CONTA%' OR
            UPPER(historico) LIKE '%TRANSFERÊNCIA PARA CONTA%'
        )";
        $affected = $pdo->exec($updateQuery);
        echo "<span style='color:green'>$affected transação(ões) atualizada(s)!</span><br>";
    } catch (PDOException $e) {
        echo "<span style='color:red'>Erro: " . $e->getMessage() . "</span><br>";
    }

    echo "<br><strong>Processo concluído! Tente recarregar o Dashboard.</strong>";

} catch (Exception $e) {
    echo "<br><strong style='color:red'>Erro Fatal: " . $e->getMessage() . "</strong>";
}
?>
