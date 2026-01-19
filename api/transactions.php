<?php
require_once 'db.php';

// Previne cache do navegador
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

$userId = $_GET['userId'] ?? '';
if (!$userId) {
    echo json_encode(['error' => 'ID do usuário é obrigatório']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->prepare("SELECT id, user_id as userId, data, dependencia_origem as dependenciaOrigem, historico, data_balancete as dataBalancete, numero_documento as numeroDocumento, CAST(valor AS DECIMAL(15,2)) as valor, parcela_atual as parcelaAtual, total_parcelas as totalParcelas, is_credit_card as isCreditCard, is_savings as isSavings, created_at as createdAt FROM transactions WHERE user_id = ? ORDER BY data DESC");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['valor'] = (float)$row['valor'];
            $row['isCreditCard'] = (bool)$row['isCreditCard'];
            $row['isSavings'] = (bool)$row['isSavings'];
        }
        echo json_encode($rows);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Auxiliar para gerar UUID
        $genUuid = function() {
            $uuid = bin2hex(random_bytes(16));
            return substr($uuid, 0, 8) . '-' . substr($uuid, 8, 4) . '-4' . substr($uuid, 12, 3) . '-' . substr($uuid, 15, 4) . '-' . substr($uuid, 19, 12);
        };

        $transactions = isset($input[0]) ? $input : [$input];
        
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO transactions (id, user_id, data, dependencia_origem, historico, valor, data_balancete, numero_documento, parcela_atual, total_parcelas, is_credit_card, is_savings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $ids = [];
            foreach ($transactions as $data) {
                $id = $genUuid();
                $ids[] = $id;
                $stmt->execute([
                    $id,
                    $userId,
                    $data['data'],
                    $data['dependenciaOrigem'] ?? '',
                    $data['historico'] ?? '',
                    $data['valor'],
                    $data['dataBalancete'] ?? null,
                    $data['numeroDocumento'] ?? null,
                    $data['parcelaAtual'] ?? null,
                    $data['totalParcelas'] ?? null,
                    isset($data['isCreditCard']) ? ($data['isCreditCard'] ? 1 : 0) : 0,
                    isset($data['isSavings']) ? ($data['isSavings'] ? 1 : 0) : 0
                ]);
            }
            $pdo->commit();
            echo json_encode(['success' => true, 'ids' => $ids]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['error' => 'Falha ao salvar transações: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? '';
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            echo json_encode(['success' => true]);
        } else {
            // Se não houver ID, apaga todas as transações do usuário
            $stmt = $pdo->prepare("DELETE FROM transactions WHERE user_id = ?");
            $stmt->execute([$userId]);
            echo json_encode(['success' => true, 'message' => 'Todas as transações foram excluídas']);
        }
        break;
}
?>
