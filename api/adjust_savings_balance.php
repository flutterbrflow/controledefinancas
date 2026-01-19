<?php
// Script para ajustar o saldo da poupança para ZERO por Usuário
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=UTF-8');

require_once 'db.php';

// Função para gerar UUID
function gen_uuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

try {
    // 1. Ação: Corrigir Saldo
    if (isset($_POST['fix_user_id']) && isset($_POST['amount'])) {
        $userId = $_POST['fix_user_id'];
        $amount = floatval($_POST['amount']);
        // CORREÇÃO: O valor a inserir deve ser IGUAL ao saldo calculado (que já é a soma invertida).
        // Se Saldo = -5000, precisamos inserir uma transação de -5000 (Aplicação).
        // Dashboard: SomaAtual(-5000) + Inverso(-5000) = -5000 + 5000 = 0.
        $valorInsert = $amount; 
        
        $sql = "INSERT INTO transactions (id, user_id, data, historico, valor, is_savings) VALUES (:id, :user_id, :data, :historico, :valor, 1)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => gen_uuid(),
            ':user_id' => $userId,
            ':data' => '2025-01-01',
            ':historico' => 'Saldo Inicial Poupança (Ajuste)',
            ':valor' => $valorInsert
        ]);
        echo "<div style='background: #d4edda; color: #155724; padding: 10px; border: 1px solid #c3e6cb; border-radius: 4px; margin-bottom: 20px;'>✅ Ajuste realizado para o usuário $userId! Saldo deve ser zero agora.</div>";
    }

    // 1.1 Ação: Limpar Ajustes do Usuário
    if (isset($_POST['clean_user_id'])) {
        $userId = $_POST['clean_user_id'];
        $stmt = $pdo->prepare("DELETE FROM transactions WHERE user_id = ? AND historico LIKE '%Ajuste%' AND is_savings = 1");
        $stmt->execute([$userId]);
        echo "<div style='background: #fff3cd; color: #856404; padding: 10px; border: 1px solid #ffeeba; border-radius: 4px; margin-bottom: 20px;'>🧹 Ajustes anteriores removidos para o usuário $userId. Recalculando...</div>";
    }

    // 2. Ação: Limpar 'system'
    if (isset($_POST['clean_system'])) {
        $stmt = $pdo->prepare("DELETE FROM transactions WHERE user_id = 'system'");
        $stmt->execute();
        echo "<div style='background: #cce5ff; color: #004085; padding: 10px; border: 1px solid #b8daff; border-radius: 4px; margin-bottom: 20px;'>🧹 Transações do usuário 'system' removidas.</div>";
    }

    echo "<h1>⚖️ Ajuste de Saldo da Poupança (Multi-Usuário)</h1>";
    echo "<p>Este script verifica o saldo de cada usuário individualmente e permite correção.</p>";

    // 3. Listar Usuários e Saldos
    // Pegar IDs distintos nas transações (ou usar tabela users se existir, mas vamos confiar nas transações para garantir abrangencia)
    $usersStmt = $pdo->query("SELECT DISTINCT user_id FROM transactions WHERE user_id IS NOT NULL AND user_id != 'system'");
    $userIds = $usersStmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($userIds)) {
        echo "<p>Nenhum usuário com transações encontrado.</p>";
    } else {
        echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%; max-width: 800px;'>";
        echo "<tr style='background: #f8f9fa;'><th>User ID</th><th>Saldo Poupança Calculado</th><th>Ação</th></tr>";

        foreach ($userIds as $uid) {
            $stmt = $pdo->prepare("SELECT SUM(-valor) as saldo FROM transactions WHERE is_savings = 1 AND user_id = ?");
            $stmt->execute([$uid]);
            $res = $stmt->fetch(PDO::FETCH_ASSOC);
            $saldo = floatval($res['saldo'] ?? 0);

            $style = $saldo == 0 ? "color: green;" : "color: red; font-weight: bold;";
            $status = $saldo == 0 ? "OK (Zero)" : "R$ " . number_format($saldo, 2, ',', '.');

            echo "<tr>";
            echo "<td><small>$uid</small></td>";
            echo "<td style='$style'>$status</td>";
            echo "<td>";
            echo "<div style='display:flex; gap:10px; align-items:center;'>";
            
            if (abs($saldo) > 0.01) {
                echo "<form method='POST' style='margin:0;'>";
                echo "<input type='hidden' name='fix_user_id' value='$uid'>";
                echo "<input type='hidden' name='amount' value='$saldo'>";
                echo "<button type='submit' style='cursor:pointer; background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 3px;'>Zerar Saldo</button>";
                echo "</form>";
            } else {
                echo "✅";
            }

            // Botão para limpar ajustes anteriores (caso tenha feito errado)
            echo "<form method='POST' style='margin:0;'>";
            echo "<input type='hidden' name='clean_user_id' value='$uid'>";
            echo "<button type='submit' onclick=\"return confirm('Tem certeza? Isso apagará todos os ajustes de saldo feitos anteriormente para este usuário.')\" style='cursor:pointer; background: #ffc107; color: black; border: none; padding: 5px 10px; border-radius: 3px;' title='Remove ajustes anteriores'>♻️ Limpar Ajustes</button>";
            echo "</form>";
            
            echo "</div>";
            echo "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }

    // Checar user 'system' (lixo)
    $sysStmt = $pdo->query("SELECT COUNT(*) as cnt FROM transactions WHERE user_id = 'system'");
    $sysCnt = $sysStmt->fetch(PDO::FETCH_ASSOC)['cnt'];
    
    if ($sysCnt > 0) {
        echo "<hr>";
        echo "<h3>Limpeza</h3>";
        echo "<p>Foram encontradas <strong>$sysCnt</strong> transações órfãs atribuídas ao usuário 'system' (de tentativas anteriores).</p>";
        echo "<form method='POST'><button type='submit' name='clean_system' style='background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px;'>Remover Transações 'system'</button></form>";
    }

} catch (Exception $e) {
    echo "<p style='color:red'>Erro Crítico: " . $e->getMessage() . "</p>";
}
?>
