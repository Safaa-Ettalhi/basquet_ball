<?php

require_once '../config/Database.php';
require_once '../models/Player.php';

class PlayerController {
    private $db;
    private $player;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->player = new Player($this->db);
    }

    private function validateAge($birthDate) {
        $birth = new DateTime($birthDate);
        $today = new DateTime();
        $age = $today->diff($birth)->y;
        
        if ($age < 18) {
            throw new Exception("Le joueur doit avoir au moins 18 ans");
        }
    }

    private function validatePlayerData($data) {
        $required = ['first_name', 'last_name', 'position', 'jersey_number', 'birth_date'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("Le champ $field est requis");
            }
        }
        
        $this->validateAge($data['birth_date']);
        
        if (!is_numeric($data['jersey_number']) || $data['jersey_number'] < 1 || $data['jersey_number'] > 99) {
            throw new Exception("Le numéro de maillot doit être entre 1 et 99");
        }
    }
    
    public function getAllPlayers() {
        try {
            $stmt = $this->player->readAll();
            $players = array();
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $players[] = $row;
            }
            
            return $players;
        } catch (Exception $e) {
            error_log("Erreur getAllPlayers: " . $e->getMessage());
            return [];
        }
    }
    
    public function getPlayer($id) {
        try {
            $this->player->id = $id;
            if($this->player->readOne()) {
                return array(
                    'id' => $this->player->id,
                    'first_name' => $this->player->first_name,
                    'last_name' => $this->player->last_name,
                    'position' => $this->player->position,
                    'jersey_number' => $this->player->jersey_number,
                    'height' => $this->player->height,
                    'weight' => $this->player->weight,
                    'birth_date' => $this->player->birth_date,
                    'salary' => $this->player->salary,
                    'health_status' => $this->player->health_status,
                    'role' => $this->player->role
                );
            }
            return null;
        } catch (Exception $e) {
            error_log("Erreur getPlayer: " . $e->getMessage());
            return null;
        }
    }
    
    public function createPlayer($data) {
        try {
            $this->validatePlayerData($data);
            
            $this->player->first_name = $data['first_name'];
            $this->player->last_name = $data['last_name'];
            $this->player->position = $data['position'];
            $this->player->jersey_number = $data['jersey_number'];
            $this->player->height = $data['height'] ?? null;
            $this->player->weight = $data['weight'] ?? null;
            $this->player->birth_date = $data['birth_date'];
            $this->player->salary = $data['salary'] ?? 0;
            $this->player->health_status = $data['health_status'] ?? 'healthy';
            $this->player->role = $data['role'] ?? 'player';
            
            return $this->player->create();
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    public function updatePlayer($id, $data) {
        try {
            $this->player->id = $id;
            if (!$this->player->readOne()) {
                throw new Exception("Joueur introuvable");
            }
            
            $updateType = $data['update_type'] ?? 'full';
            
            if ($updateType === 'admin') {
                $this->validateAge($data['birth_date']);
                return $this->updatePlayerAdmin($data);
            } elseif ($updateType === 'sports') {
                return $this->updatePlayerSports($data);
            } else {
                $this->validatePlayerData($data);
                return $this->updatePlayerFull($data);
            }
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    private function updatePlayerAdmin($data) {
        $query = "UPDATE players 
                  SET first_name=:first_name, last_name=:last_name,
                      birth_date=:birth_date, salary=:salary, role=:role
                  WHERE id=:id";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':first_name', $data['first_name']);
        $stmt->bindParam(':last_name', $data['last_name']);
        $stmt->bindParam(':birth_date', $data['birth_date']);
        $stmt->bindParam(':salary', $data['salary']);
        $stmt->bindParam(':role', $data['role']);
        $stmt->bindParam(':id', $this->player->id);
        
        return $stmt->execute();
    }
    
    private function updatePlayerSports($data) {
        $query = "UPDATE players 
                  SET position=:position, jersey_number=:jersey_number,
                      height=:height, weight=:weight, health_status=:health_status
                  WHERE id=:id";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':position', $data['position']);
        $stmt->bindParam(':jersey_number', $data['jersey_number']);
        $stmt->bindParam(':height', $data['height']);
        $stmt->bindParam(':weight', $data['weight']);
        $stmt->bindParam(':health_status', $data['health_status']);
        $stmt->bindParam(':id', $this->player->id);
        
        return $stmt->execute();
    }
    
    private function updatePlayerFull($data) {
        $this->player->first_name = $data['first_name'];
        $this->player->last_name = $data['last_name'];
        $this->player->position = $data['position'];
        $this->player->jersey_number = $data['jersey_number'];
        $this->player->height = $data['height'];
        $this->player->weight = $data['weight'];
        $this->player->birth_date = $data['birth_date'];
        $this->player->salary = $data['salary'];
        $this->player->health_status = $data['health_status'];
        $this->player->role = $data['role'] ?? 'player';
        
        return $this->player->update();
    }
    
    public function deletePlayer($id) {
        try {
            $this->player->id = $id;
            return $this->player->delete();
        } catch (Exception $e) {
            throw $e;
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
        $controller = new PlayerController();
        
        switch($_GET['action']) {
            case 'getAll':
                echo json_encode($controller->getAllPlayers());
                break;
                
            case 'getOne':
                if(isset($_GET['id'])) {
                    $player = $controller->getPlayer($_GET['id']);
                    echo json_encode($player);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID manquant']);
                }
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Action non reconnue']);
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $controller = new PlayerController();
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'JSON invalide']);
            exit;
        }
        
        if(isset($data['action'])) {
            switch($data['action']) {
                case 'create':
                    try {
                        $result = $controller->createPlayer($data);
                        echo json_encode(['success' => $result]);
                    } catch (Exception $e) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                    }
                    break;
                    
                case 'update':
                    if(isset($data['id'])) {
                        try {
                            $result = $controller->updatePlayer($data['id'], $data);
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
                            $result = $controller->deletePlayer($data['id']);
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
    error_log("Erreur PlayerController: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur']);
}
?>
