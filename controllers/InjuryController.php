<?php

require_once '../config/Database.php';
require_once '../models/Injury.php';

class InjuryController {
    private $db;
    private $injury;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->injury = new Injury($this->db);
    }
    
    public function getAllInjuries() {
        try {
            return $this->injury->getActiveInjuries();
        } catch (Exception $e) {
            error_log("Erreur getAllInjuries: " . $e->getMessage());
            return [];
        }
    }
    
    public function createInjury($data) {
        try {
            $this->injury->player_id = $data['player_id'];
            $this->injury->injury_type = $data['injury_type'];
            $this->injury->description = $data['description'];
            $this->injury->severity = $data['severity'];
            $this->injury->injury_date = $data['injury_date'];
            $this->injury->expected_recovery_date = $data['expected_recovery_date'];
            $this->injury->treatment = $data['treatment'];
            
            return $this->injury->create();
        } catch (Exception $e) {
            error_log("Erreur createInjury: " . $e->getMessage());
            return false;
        }
    }
    
    public function markAsRecovered($id, $playerId) {
        try {
            $this->injury->id = $id;
            $this->injury->player_id = $playerId;
            return $this->injury->markAsRecovered();
        } catch (Exception $e) {
            error_log("Erreur markAsRecovered: " . $e->getMessage());
            return false;
        }
    }
    
    public function updateInjury($id, $data) {
        try {
            $query = "UPDATE injuries 
                      SET injury_type=:injury_type, description=:description,
                          severity=:severity, expected_recovery_date=:expected_recovery_date,
                          treatment=:treatment
                      WHERE id=:id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':injury_type', $data['injury_type']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':severity', $data['severity']);
            $stmt->bindParam(':expected_recovery_date', $data['expected_recovery_date']);
            $stmt->bindParam(':treatment', $data['treatment']);
            
            return $stmt->execute();
        } catch (Exception $e) {
            error_log("Erreur updateInjury: " . $e->getMessage());
            return false;
        }
    }
    
    public function deleteInjury($id) {
        try {
            $query = "DELETE FROM injuries WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id);
            return $stmt->execute();
        } catch (Exception $e) {
            error_log("Erreur deleteInjury: " . $e->getMessage());
            return false;
        }
    }
    
    public function getInjuryById($id) {
        try {
            $query = "SELECT i.*, p.first_name, p.last_name
                      FROM injuries i
                      JOIN players p ON i.player_id = p.id
                      WHERE i.id = :id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Erreur getInjuryById: " . $e->getMessage());
            return null;
        }
    }
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// API endpoints
try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
        $controller = new InjuryController();
        
        switch($_GET['action']) {
            case 'getAll':
                $result = $controller->getAllInjuries();
                header('Content-Type: application/json');
                echo json_encode($result);
                break;
                
            case 'getOne':
                if(isset($_GET['id'])) {
                    $result = $controller->getInjuryById($_GET['id']);
                    header('Content-Type: application/json');
                    echo json_encode($result);
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
        $controller = new InjuryController();
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
                    $result = $controller->createInjury($data);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                    break;
                    
                case 'update':
                    if(isset($data['id'])) {
                        $result = $controller->updateInjury($data['id'], $data);
                        header('Content-Type: application/json');
                        echo json_encode(['success' => $result]);
                    } else {
                        header('Content-Type: application/json');
                        echo json_encode(['success' => false, 'error' => 'ID manquant']);
                    }
                    break;
                    
                case 'delete':
                    if(isset($data['id'])) {
                        $result = $controller->deleteInjury($data['id']);
                        header('Content-Type: application/json');
                        echo json_encode(['success' => $result]);
                    } else {
                        header('Content-Type: application/json');
                        echo json_encode(['success' => false, 'error' => 'ID manquant']);
                    }
                    break;
                    
                case 'markRecovered':
                    if(isset($data['id'], $data['player_id'])) {
                        $result = $controller->markAsRecovered($data['id'], $data['player_id']);
                        header('Content-Type: application/json');
                        echo json_encode(['success' => $result]);
                    } else {
                        header('Content-Type: application/json');
                        echo json_encode(['success' => false, 'error' => 'Données manquantes']);
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
    error_log("Erreur InjuryController: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Erreur serveur']);
}
?>
