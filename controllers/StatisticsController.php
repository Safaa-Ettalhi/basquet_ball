<?php

require_once '../config/Database.php';
require_once '../models/Statistics.php';

class StatisticsController {
    private $db;
    private $statistics;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->statistics = new Statistics($this->db);
    }
    

    private function validateShootingStats($data) {

        if (isset($data['field_goals_made'], $data['field_goals_attempted'])) {
            if ($data['field_goals_made'] > $data['field_goals_attempted']) {
                throw new Exception("Les tirs de terrain réussis ne peuvent pas être supérieurs aux tirs tentés");
            }
        }

        if (isset($data['three_points_made'], $data['three_points_attempted'])) {
            if ($data['three_points_made'] > $data['three_points_attempted']) {
                throw new Exception("Les tirs à 3 points réussis ne peuvent pas être supérieurs aux tirs tentés");
            }
        }

        if (isset($data['free_throws_made'], $data['free_throws_attempted'])) {
            if ($data['free_throws_made'] > $data['free_throws_attempted']) {
                throw new Exception("Les lancers francs réussis ne peuvent pas être supérieurs aux lancers tentés");
            }
        }
    }

    private function validateStatsData($data) {
        $required = ['player_id', 'match_id', 'points', 'rebounds', 'assists'];
        
        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                throw new Exception("Champ requis manquant: " . $field);
            }
        }

        $numericFields = ['points', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers', 'minutes_played'];
        foreach ($numericFields as $field) {
            if (isset($data[$field]) && (!is_numeric($data[$field]) || $data[$field] < 0)) {
                throw new Exception("Le champ $field doit être un nombre positif");
            }
        }
        
        $this->validateShootingStats($data);
    }
    
    public function getAllStatistics($playerId = null, $matchId = null) {
        try {
            $query = "SELECT 
                        ps.*,
                        p.first_name,
                        p.last_name,
                        p.position,
                        m.match_date,
                        COALESCE(t.name, 'Équipe inconnue') as opponent_name,
                        CASE 
                            WHEN ps.field_goals_attempted > 0 
                            THEN ROUND((ps.field_goals_made / ps.field_goals_attempted) * 100, 1)
                            ELSE 0 
                        END as fg_percentage
                      FROM player_statistics ps
                      JOIN players p ON ps.player_id = p.id
                      JOIN matches m ON ps.match_id = m.id
                      LEFT JOIN teams t ON m.opponent_team_id = t.id";
            
            $conditions = [];
            $params = [];
            
            if ($playerId) {
                $conditions[] = "ps.player_id = :player_id";
                $params[':player_id'] = $playerId;
            }
            
            if ($matchId) {
                $conditions[] = "ps.match_id = :match_id";
                $params[':match_id'] = $matchId;
            }
            
            if (!empty($conditions)) {
                $query .= " WHERE " . implode(" AND ", $conditions);
            }
            
            $query .= " ORDER BY m.match_date DESC, p.last_name ASC";
            
            $stmt = $this->db->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            error_log("Erreur getAllStatistics: " . $e->getMessage());
            return [];
        }
    }
    
    public function getPlayerStatistics($playerId) {
        try {
            return $this->statistics->getPlayerStats($playerId);
        } catch (Exception $e) {
            error_log("Erreur getPlayerStatistics: " . $e->getMessage());
            return [];
        }
    }
    
    public function getMatchStatistics($matchId) {
        try {
            return $this->statistics->getMatchStats($matchId);
        } catch (Exception $e) {
            error_log("Erreur getMatchStatistics: " . $e->getMessage());
            return [];
        }
    }
    
    public function addPlayerMatchStats($data) {
        try {
            $this->validateStatsData($data);
            
            $playerCheck = $this->db->prepare("SELECT id FROM players WHERE id = :player_id");
            $playerCheck->bindParam(':player_id', $data['player_id']);
            $playerCheck->execute();
            if (!$playerCheck->fetch()) {
                throw new Exception("Joueur introuvable");
            }
            
            $matchCheck = $this->db->prepare("SELECT id FROM matches WHERE id = :match_id");
            $matchCheck->bindParam(':match_id', $data['match_id']);
            $matchCheck->execute();
            if (!$matchCheck->fetch()) {
                throw new Exception("Match introuvable");
            }
            
            $existingCheck = $this->db->prepare("SELECT id FROM player_statistics WHERE player_id = :player_id AND match_id = :match_id");
            $existingCheck->bindParam(':player_id', $data['player_id']);
            $existingCheck->bindParam(':match_id', $data['match_id']);
            $existingCheck->execute();
            if ($existingCheck->fetch()) {
                throw new Exception("Des statistiques existent déjà pour ce joueur dans ce match");
            }
            
            return $this->statistics->addPlayerMatchStats($data);
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    public function updatePlayerMatchStats($id, $data) {
        try {
            $checkQuery = "SELECT id FROM player_statistics WHERE id = :id";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->bindParam(':id', $id);
            $checkStmt->execute();
            
            if (!$checkStmt->fetch()) {
                throw new Exception("Statistique introuvable");
            }
            
            $this->validateShootingStats($data);
            
            $query = "UPDATE player_statistics 
                      SET points=:points, rebounds=:rebounds, assists=:assists,
                          steals=:steals, blocks=:blocks, turnovers=:turnovers,
                          minutes_played=:minutes_played, field_goals_made=:field_goals_made,
                          field_goals_attempted=:field_goals_attempted,
                          three_points_made=:three_points_made,
                          three_points_attempted=:three_points_attempted,
                          free_throws_made=:free_throws_made,
                          free_throws_attempted=:free_throws_attempted
                      WHERE id=:id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id);
            $defaults = [
                'points' => 0, 'rebounds' => 0, 'assists' => 0, 'steals' => 0,
                'blocks' => 0, 'turnovers' => 0, 'minutes_played' => 0,
                'field_goals_made' => 0, 'field_goals_attempted' => 0,
                'three_points_made' => 0, 'three_points_attempted' => 0,
                'free_throws_made' => 0, 'free_throws_attempted' => 0
            ];
            
            foreach ($defaults as $key => $defaultValue) {
                $value = isset($data[$key]) ? (int)$data[$key] : $defaultValue;
                $stmt->bindValue(":" . $key, $value, PDO::PARAM_INT);
            }
            
            $result = $stmt->execute();
            
            if (!$result) {
                $errorInfo = $stmt->errorInfo();
                throw new Exception("Erreur SQL: " . $errorInfo[2]);
            }
            
            return $result;
            
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    public function deletePlayerMatchStats($id) {
        try {
            $checkQuery = "SELECT id FROM player_statistics WHERE id = :id";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->bindParam(':id', $id);
            $checkStmt->execute();
            
            if (!$checkStmt->fetch()) {
                throw new Exception("Statistique introuvable");
            }
            
            $query = "DELETE FROM player_statistics WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id);
            
            return $stmt->execute();
            
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    public function getStatById($id) {
        try {
            $query = "SELECT ps.*, p.first_name, p.last_name, m.match_date, 
                             COALESCE(t.name, 'Équipe inconnue') as opponent_name
                      FROM player_statistics ps
                      JOIN players p ON ps.player_id = p.id
                      JOIN matches m ON ps.match_id = m.id
                      LEFT JOIN teams t ON m.opponent_team_id = t.id
                      WHERE ps.id = :id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Erreur getStatById: " . $e->getMessage());
            return null;
        }
    }
}

// API endpoints
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
        $controller = new StatisticsController();
        
        switch($_GET['action']) {
            case 'getAll':
                $playerId = isset($_GET['player_id']) ? $_GET['player_id'] : null;
                $matchId = isset($_GET['match_id']) ? $_GET['match_id'] : null;
                $result = $controller->getAllStatistics($playerId, $matchId);
                echo json_encode($result);
                break;
                
            case 'getPlayerStats':
                if(isset($_GET['player_id'])) {
                    $result = $controller->getPlayerStatistics($_GET['player_id']);
                    echo json_encode($result);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'player_id manquant']);
                }
                break;
                
            case 'getMatchStats':
                if(isset($_GET['match_id'])) {
                    $result = $controller->getMatchStatistics($_GET['match_id']);
                    echo json_encode($result);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'match_id manquant']);
                }
                break;
                
            case 'getOne':
                if(isset($_GET['id'])) {
                    $result = $controller->getStatById($_GET['id']);
                    echo json_encode($result);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'id manquant']);
                }
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Action non reconnue']);
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $controller = new StatisticsController();
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'JSON invalide: ' . json_last_error_msg()]);
            exit;
        }
        
        if(isset($data['action'])) {
            switch($data['action']) {
                case 'addStats':
                    try {
                        $result = $controller->addPlayerMatchStats($data);
                        echo json_encode(['success' => $result]);
                    } catch (Exception $e) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                    }
                    break;
                    
                case 'update':
                    if(isset($data['id'])) {
                        try {
                            $result = $controller->updatePlayerMatchStats($data['id'], $data);
                            echo json_encode(['success' => $result]);
                        } catch (Exception $e) {
                            http_response_code(400);
                            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                        }
                    } else {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'ID manquant']);
                    }
                    break;
                    
                case 'delete':
                    if(isset($data['id'])) {
                        try {
                            $result = $controller->deletePlayerMatchStats($data['id']);
                            echo json_encode(['success' => $result]);
                        } catch (Exception $e) {
                            http_response_code(400);
                            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                        }
                    } else {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'ID manquant']);
                    }
                    break;
                    
                default:
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Action non reconnue']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Action manquante']);
        }
    }
} catch (Exception $e) {
    error_log("Erreur StatisticsController: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>
