<?php
// Script para ver as últimas transações e seus históricos exatos (debug de encoding)
header('Content-Type: application/json; charset=UTF-8');
require_once 'db.php';

try {
    // Pega as últimas 5 transações que contêm "Ajuste" ou "Saldo"
    $stmt = $pdo->query("SELECT id, user_id, data, historico, valor, is_savings FROM transactions WHERE historico LIKE '%Ajuste%' OR historico LIKE '%Saldo%' ORDER BY created_at DESC LIMIT 5");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
