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
        $stmt = $pdo->prepare("SELECT id, user_id as userId, titulo, valor_meta as valorMeta, valor_atual as valorAtual, cor, created_at as createdAt FROM goals WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['valorMeta'] = (float)$row['valorMeta'];
            $row['valorAtual'] = (float)$row['valorAtual'];
        }
        echo json_encode($rows);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = bin2hex(random_bytes(16));
        $id = substr($id, 0, 8) . '-' . substr($id, 8, 4) . '-4' . substr($id, 12, 3) . '-' . substr($id, 15, 4) . '-' . substr($id, 19, 12);
        
        $stmt = $pdo->prepare("INSERT INTO goals (id, user_id, titulo, valor_meta, valor_atual, cor) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $userId,
            $data['titulo'],
            $data['valorMeta'],
            0,
            $data['cor'] ?? '#2563EB'
        ]);
        
        echo json_encode(['success' => true, 'id' => $id]);
        break;

    case 'PUT':
        $id = $_GET['id'] ?? '';
        $data = json_decode(file_get_contents('php://input'), true);
        if ($id) {
            $stmt = $pdo->prepare("UPDATE goals SET valor_atual = GREATEST(0, valor_atual + ?) WHERE id = ? AND user_id = ?");
            $stmt->execute([$data['amount'], $id, $userId]);
            echo json_encode(['success' => true]);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? '';
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM goals WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            echo json_encode(['success' => true]);
        }
        break;
}
?>
