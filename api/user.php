<?php
// Configurações do banco de dados - configure com suas credenciais
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';
require_once 'config.php';

$userId = $_GET['userId'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if (empty($userId)) {
    http_response_code(400);
    echo json_encode(['error' => 'ID do usuário é obrigatório.']);
    exit;
}

// GET - Obter dados do usuário
if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT id, name, email, avatar FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            echo json_encode($user);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Usuário não encontrado.']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao buscar usuário: ' . $e->getMessage()]);
    }
}

// PUT - Atualizar dados do usuário (nome e email)
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['name']) || empty($data['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Nome e email são obrigatórios.']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
        $stmt->execute([$data['name'], $data['email'], $userId]);
        
        echo json_encode(['success' => true, 'message' => 'Dados atualizados com sucesso.']);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            http_response_code(409);
            echo json_encode(['error' => 'Este e-mail já está em uso.']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao atualizar usuário: ' . $e->getMessage()]);
        }
    }
}

// POST - Upload de avatar
elseif ($method === 'POST') {
    // Verifica se arquivo foi enviado
    if (!isset($_FILES['avatar'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Nenhum arquivo foi enviado.']);
        exit;
    }
    
    $file = $_FILES['avatar'];
    
    // Validações
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    $maxSize = 2 * 1024 * 1024; // 2MB
    
    if (!in_array($file['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.']);
        exit;
    }
    
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['error' => 'Arquivo muito grande. Tamanho máximo: 2MB.']);
        exit;
    }
    
    // Cria diretório se não existir
    $uploadDir = __DIR__ . '/uploads/avatars/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    // Extensão do arquivo
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = $userId . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    // Remove avatar antigo se existir
    $oldFiles = glob($uploadDir . $userId . '.*');
    foreach ($oldFiles as $oldFile) {
        if (file_exists($oldFile)) {
            unlink($oldFile);
        }
    }
    
    // Move arquivo para pasta de uploads
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        // Atualiza caminho no banco de dados
        $avatarUrl = 'api/uploads/avatars/' . $filename;
        
        try {
            $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
            $stmt->execute([$avatarUrl, $userId]);
            
            echo json_encode([
                'success' => true,
                'avatar' => $avatarUrl,
                'message' => 'Avatar atualizado com sucesso.'
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao salvar avatar no banco: ' . $e->getMessage()]);
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao fazer upload do arquivo.']);
    }
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido.']);
}
?>
