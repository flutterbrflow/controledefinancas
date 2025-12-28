<?php
require_once 'db.php';

$action = $_GET['action'] ?? '';

if ($action === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
        echo json_encode(['error' => 'Preencha todos os campos.']);
        exit;
    }

    $id = bin2hex(random_bytes(16)); // Simple UUID simulation or use a proper lib
    $id = substr($id, 0, 8) . '-' . substr($id, 8, 4) . '-4' . substr($id, 12, 3) . '-' . substr($id, 15, 4) . '-' . substr($id, 19, 12);
    
    $password = password_hash($data['password'], PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare("INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)");
        $stmt->execute([$id, $data['name'], $data['email'], $password]);
        
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $id,
                'name' => $data['name'],
                'email' => $data['email']
            ]
        ]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            echo json_encode(['error' => 'Este e-mail já está cadastrado.']);
        } else {
            echo json_encode(['error' => 'Erro ao cadastrar usuário: ' . $e->getMessage()]);
        }
    }
}

if ($action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['email']) || empty($data['password'])) {
        echo json_encode(['error' => 'E-mail e senha são obrigatórios.']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch();

    if ($user && password_verify($data['password'], $user['password'])) {
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email']
            ]
        ]);
    } else {
        echo json_encode(['error' => 'E-mail ou senha incorretos.']);
    }
}
?>
