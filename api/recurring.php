<?php
require_once 'db.php';

$userId = $_GET['userId'] ?? '';
if (!$userId) {
    echo json_encode(['error' => 'UserId is required']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->prepare("SELECT id, user_id as userId, titulo, valor, dia_vencimento as diaVencimento, categoria, ativa, created_at as createdAt FROM recurring_transactions WHERE user_id = ? ORDER BY dia_vencimento ASC");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['valor'] = (float)$row['valor'];
            $row['diaVencimento'] = (int)$row['diaVencimento'];
            $row['ativa'] = (bool)$row['ativa'];
        }
        echo json_encode($rows);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = bin2hex(random_bytes(16));
        $id = substr($id, 0, 8) . '-' . substr($id, 8, 4) . '-4' . substr($id, 12, 3) . '-' . substr($id, 15, 4) . '-' . substr($id, 19, 12);
        
        $stmt = $pdo->prepare("INSERT INTO recurring_transactions (id, user_id, titulo, valor, dia_vencimento, categoria, ativa) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $userId,
            $data['titulo'],
            $data['valor'],
            $data['diaVencimento'],
            $data['categoria'] ?? 'Fixo',
            1
        ]);
        
        echo json_encode(['success' => true, 'id' => $id]);
        break;

    case 'PATCH':
        $id = $_GET['id'] ?? '';
        if ($id) {
            $stmt = $pdo->prepare("UPDATE recurring_transactions SET ativa = NOT ativa WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            echo json_encode(['success' => true]);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? '';
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM recurring_transactions WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            echo json_encode(['success' => true]);
        }
        break;
}
?>
