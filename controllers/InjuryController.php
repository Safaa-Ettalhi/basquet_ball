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
    
    private function validateDates($injuryDate, $recoveryDate = null) {
        $injury = new DateTime($injuryDate);
        $today = new DateTime();
        $today->setTime(0, 0, 0);
        
        if ($injury < $today) {
            throw new Exception("La date de blessure ne peut pas être antérieure à aujourd'hui");
        }
        
        if ($recoveryDate && !empty($recoveryDate)) {
            $recovery = new DateTime($recoveryDate);
            if ($recovery <= $injury) {
                throw new Exception("La date de récupération doit être postérieure à la date de blessure");
            }
        }
    }

    private function validateInjuryData($data) {
        $required = ['player_id', 'injury_type', 'description', 'severity', 'injury_date'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("Le champ $field est requis");
            }
        }
        
        $this->validateDates($data['injury_date'], $data['expected_recovery_date'] ?? null);
        
        $validSeverities = ['minor', 'moderate', 'severe'];
        if (!in_array($data['severity'], $validSeverities)) {
            throw new Exception("Sévérité invalide. Valeurs acceptées: " . implode(', ', $validSeverities));
        }
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
            $this->validateInjuryData($data);
            
            $this->injury->player_id = $data['player_id'];
            $this->injury->injury_type = $data['injury_type'];
            $this->injury->description = $data['description'];
            $this->injury->severity = $data['severity'];
            $this->injury->injury_date = $data['injury_date'];
            $this->injury->expected_recovery_date = $data['expected_recovery_date'] ?? null;
            $this->injury->treatment = $data['treatment'] ?? '';
            
            return $this->injury->create();
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    public function markAsRecovered($id, $playerId) {
        try {
            $this->injury->id = $id;
            $this->injury->player_id = $playerId;
            return $this->injury->markAsRecovered();
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    public function updateInjury($id, $data) {
        try {
            $existing = $this->getInjuryById($id);
            if (!$existing) {
                throw new Exception("Blessure introuvable");
            }
            
            $this->validateDates($data['injury_date'], $data['expected_recovery_date'] ?? null);
            
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
            throw $e;
        }
    }
    
    public function deleteInjury($id) {
        try {
            $query = "DELETE FROM injuries WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id);
            return $stmt->execute();
        } catch (Exception $e) {
            throw $e;
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

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
        $controller = new InjuryController();
        
        switch($_GET['action']) {
            case 'getAll':
                $result = $controller->getAllInjuries();
                echo json_encode($result);
                break;
                
            case 'getOne':
                if(isset($_GET['id'])) {
                    $result = $controller->getInjuryById($_GET['id']);
                    echo json_encode($result);
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
        $controller = new InjuryController();
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
                        $result = $controller->createInjury($data);
                        echo json_encode(['success' => $result]);
                    } catch (Exception $e) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                    }
                    break;
                    
                case 'update':
                    if(isset($data['id'])) {
                        try {
                            $result = $controller->updateInjury($data['id'], $data);
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
                            $result = $controller->deleteInjury($data['id']);
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
                    
                case 'markRecovered':
                    if(isset($data['id'], $data['player_id'])) {
                        try {
                            $result = $controller->markAsRecovered($data['id'], $data['player_id']);
                            echo json_encode(['success' => $result]);
                        } catch (Exception $e) {
                            http_response_code(400);
                            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                        }
                    } else {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'Données manquantes']);
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
    error_log("Erreur InjuryController: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur']);
}
?>
