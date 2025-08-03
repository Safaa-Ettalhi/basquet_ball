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
    
    public function getAllPlayers() {
        $stmt = $this->player->readAll();
        $players = array();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $players[] = $row;
        }
        
        return $players;
    }
    
    public function getPlayer($id) {
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
    }
    
    public function createPlayer($data) {
        $this->player->first_name = $data['first_name'];
        $this->player->last_name = $data['last_name'];
        $this->player->position = $data['position'];
        $this->player->jersey_number = $data['jersey_number'];
        $this->player->height = $data['height'];
        $this->player->weight = $data['weight'];
        $this->player->birth_date = $data['birth_date'];
        $this->player->salary = $data['salary'];
        $this->player->health_status = $data['health_status'] ?? 'healthy';
        $this->player->role = $data['role'] ?? 'player';
        
        return $this->player->create();
    }
    
    public function updatePlayer($id, $data) {
  
        $this->player->id = $id;
        if (!$this->player->readOne()) {
            return false;
        }
        
       
        $updateType = $data['update_type'] ?? 'full';
        
        if ($updateType === 'admin') {
          
            $this->player->first_name = $data['first_name'];
            $this->player->last_name = $data['last_name'];
            $this->player->birth_date = $data['birth_date'];
            $this->player->salary = $data['salary'];
            $this->player->role = $data['role'];
           
            
            return $this->updatePlayerAdmin();
            
        } elseif ($updateType === 'sports') {
            
            $this->player->position = $data['position'];
            $this->player->jersey_number = $data['jersey_number'];
            $this->player->height = $data['height'];
            $this->player->weight = $data['weight'];
            $this->player->health_status = $data['health_status'];
           
            
            return $this->updatePlayerSports();
            
        } else {
           
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
    }
    
    private function updatePlayerAdmin() {
        $query = "UPDATE players 
                  SET first_name=:first_name, last_name=:last_name,
                      birth_date=:birth_date, salary=:salary, role=:role
                  WHERE id=:id";
        
        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':first_name', $this->player->first_name);
        $stmt->bindParam(':last_name', $this->player->last_name);
        $stmt->bindParam(':birth_date', $this->player->birth_date);
        $stmt->bindParam(':salary', $this->player->salary);
        $stmt->bindParam(':role', $this->player->role);
        $stmt->bindParam(':id', $this->player->id);
        
        return $stmt->execute();
    }
    
    private function updatePlayerSports() {
        $query = "UPDATE players 
                  SET position=:position, jersey_number=:jersey_number,
                      height=:height, weight=:weight, health_status=:health_status
                  WHERE id=:id";
        
        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':position', $this->player->position);
        $stmt->bindParam(':jersey_number', $this->player->jersey_number);
        $stmt->bindParam(':height', $this->player->height);
        $stmt->bindParam(':weight', $this->player->weight);
        $stmt->bindParam(':health_status', $this->player->health_status);
        $stmt->bindParam(':id', $this->player->id);
        
        return $stmt->execute();
    }
    
    public function deletePlayer($id) {
        $this->player->id = $id;
        return $this->player->delete();
    }
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// API endpoints
try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
        $controller = new PlayerController();
        
        switch($_GET['action']) {
            case 'getAll':
                header('Content-Type: application/json');
                echo json_encode($controller->getAllPlayers());
                break;
                
            case 'getOne':
                if(isset($_GET['id'])) {
                    header('Content-Type: application/json');
                    $player = $controller->getPlayer($_GET['id']);
                    echo json_encode($player);
                } else {
                    header('Content-Type: application/json');
                    echo json_encode(['error' => 'ID manquant']);
                }
                break;
                
            default:
                header('Content-Type: application/json');
                echo json_encode(['error' => 'Action non reconnue']);
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $controller = new PlayerController();
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'JSON invalide']);
            exit;
        }
        
        if(isset($data['action'])) {
            switch($data['action']) {
                case 'create':
                    $result = $controller->createPlayer($data);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                    break;
                    
                case 'update':
                    if(isset($data['id'])) {
                        $result = $controller->updatePlayer($data['id'], $data);
                        header('Content-Type: application/json');
                        echo json_encode(['success' => $result]);
                    } else {
                        header('Content-Type: application/json');
                        echo json_encode(['success' => false, 'error' => 'ID manquant']);
                    }
                    break;
                    
                case 'delete':
                    if(isset($data['id'])) {
                        $result = $controller->deletePlayer($data['id']);
                        header('Content-Type: application/json');
                        echo json_encode(['success' => $result]);
                    } else {
                        header('Content-Type: application/json');
                        echo json_encode(['success' => false, 'error' => 'ID manquant']);
                    }
                    break;
                    
                default:
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'error' => 'Action non reconnue']);
            }
        } else {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Action manquante']);
        }
    }
} catch (Exception $e) {
    error_log("Erreur PlayerController: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Erreur serveur']);
}
?>
