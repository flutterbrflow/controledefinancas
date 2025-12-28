<?php
// Endpoint para sugerir transações recorrentes baseado em padrões do histórico
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';

$userId = $_GET['userId'] ?? '';

if (empty($userId)) {
    http_response_code(400);
    echo json_encode(['error' => 'ID do usuário é obrigatório.']);
    exit;
}

try {
    // Busca todas as transações do usuário
    $stmt = $pdo->prepare("
        SELECT historico, dependencia_origem, valor, data
        FROM transactions
        WHERE user_id = ?
        ORDER BY data DESC
    ");
    $stmt->execute([$userId]);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Agrupa por descrição/origem similar
    $groups = [];
    
    foreach ($transactions as $trans) {
        // Normaliza chave de agrupamento
        $key = strtolower(trim($trans['historico'] . '|' . $trans['dependencia_origem']));
        
        if (!isset($groups[$key])) {
            $groups[$key] = [
                'historico' => $trans['historico'],
                'origem' => $trans['dependencia_origem'],
                'valores' => [],
                'datas' => [],
                'count' => 0
            ];
        }
        
        $groups[$key]['valores'][] = abs(floatval($trans['valor']));
        $groups[$key]['datas'][] = $trans['data'];
        $groups[$key]['count']++;
    }
    
    // Filtra grupos que aparecem pelo menos 2 vezes
    $suggestions = [];
    
    foreach ($groups as $key => $group) {
        if ($group['count'] >= 2) {
            // Calcula média de valores
            $avgValue = array_sum($group['valores']) / count($group['valores']);
            
            // Calcula desvio padrão para verificar consistência
            $variance = 0;
            foreach ($group['valores'] as $val) {
                $variance += pow($val - $avgValue, 2);
            }
            $stdDev = sqrt($variance / count($group['valores']));
            $coefficient = $stdDev / $avgValue; // Coeficiente de variação
            
            // Se valores são consistentes (variação < 15%)
            if ($coefficient < 0.15) {
                // Verifica se há padrão men sal
                $daysOfMonth = [];
                foreach ($group['datas'] as $dateStr) {
                    $day = intval(substr($dateStr, 8, 2));
                    $daysOfMonth[] = $day;
                }
                
                // Dia mais frequente
                $dayCounts = array_count_values($daysOfMonth);
                arsort($dayCounts);
                $mostFrequentDay = key($dayCounts);
                $dayFrequency = current($dayCounts);
                
                // Se o dia se repete em pelo menos 50% das ocorrências
                if ($dayFrequency >= ceil($group['count'] / 2)) {
                    $suggestions[] = [
                        'titulo' => $group['historico'],
                        'origem' => $group['origem'],
                        'valorMedio' => round($avgValue, 2),
                        'diaSugerido' => $mostFrequentDay,
                        'ocorrencias' => $group['count'],
                        'consistencia' => round((1 - $coefficient) * 100, 1) // Percentual de consistência
                    ];
                }
            }
        }
    }
    
    // Ordena por número de ocorrências
    usort($suggestions, function($a, $b) {
        return $b['ocorrencias'] - $a['ocorrencias'];
    });
    
    // Retorna top 10 sugestões
    echo json_encode(array_slice($suggestions, 0, 10));
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao gerar sugestões: ' . $e->getMessage()]);
}
?>
