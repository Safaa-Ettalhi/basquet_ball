<?php

require_once '../config/Database.php';
require_once '../models/Training.php';

class TrainingController {
    private $db;
    private $training;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->training = new Training($this->db);
    }

    private function validateFutureDate($date) {
        $trainingDate = new DateTime($date);
        $now = new DateTime();
        
        if ($trainingDate <= $now) {
            throw new Exception("L'entraînement ne peut pas être programmé dans le passé");
        }
    }

    private function validateTrainingData($data) {
        $required = ['training_type_id', 'date', 'duration_minutes', 'location'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("Le champ $field est requis");
            }
        }
        
        $this->validateFutureDate($data['date']);
        
        if (!is_numeric($data['duration_minutes']) || $data['duration_minutes'] < 15 || $data['duration_minutes'] > 300) {
            throw new Exception("La durée doit être entre 15 et 300 minutes");
        }
    }
    
    public function getAllTrainings() {
        try {
            $stmt = $this->training->readAll();
            $trainings = array();
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $trainings[] = $row;
            }
            
            return $trainings;
        } catch (Exception $e) {
            error_log("Erreur getAllTrainings: " . $e->getMessage());
            return [];
        }
    }
    
    public function getTraining($id) {
        try {
            $query = "SELECT t.*, tt.name as training_type_name, u.username as created_by_name,
                             GROUP_CONCAT(CONCAT(p.first_name, ' ', p.last_name) SEPARATOR ', ') as participants
                      FROM trainings t
                      LEFT JOIN training_types tt ON t.training_type_id = tt.id
                      LEFT JOIN users u ON t.created_by = u.id
                      LEFT JOIN training_participants tp ON t.id = tp.training_id
                      LEFT JOIN players p ON tp.player_id = p.id
                      WHERE t.id = :id
                      GROUP BY t.id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(":id", $id);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Erreur getTraining: " . $e->getMessage());
            return null;
        }
    }
    
    public function createTraining($data) {
        try {
            $this->validateTrainingData($data);
            
            $result = $this->training->scheduleTraining($data);
            
            if ($result && isset($data['participants']) && is_array($data['participants'])) {
                $trainingId = $this->db->lastInsertId();
                foreach ($data['participants'] as $playerId) {
                    $this->training->addParticipant($trainingId, $playerId);
                }
            }
            
            return $result;
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    public function updateTraining($id, $data) {
        try {
            $existing = $this->getTraining($id);
            if (!$existing) {
                throw new Exception("Entraînement introuvable");
            }
            
            $this->validateTrainingData($data);
            
            $query = "UPDATE trainings 
                      SET training_type_id=:training_type_id, date=:date,
                          duration_minutes=:duration_minutes, location=:location,
                          description=:description
                      WHERE id=:id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':training_type_id', $data['training_type_id']);
            $stmt->bindParam(':date', $data['date']);
            $stmt->bindParam(':duration_minutes', $data['duration_minutes']);
            $stmt->bindParam(':location', $data['location']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':id', $id);
            
            return $stmt->execute();
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    public function deleteTraining($id) {
        try {
            $query = "DELETE FROM trainings WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id);
            
            return $stmt->execute();
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    public function getTrainingsByDate($date) {
        try {
            return $this->training->getTrainingsByDate($date);
        } catch (Exception $e) {
            error_log("Erreur getTrainingsByDate: " . $e->getMessage());
            return [];
        }
    }
    
    public function addParticipants($trainingId, $participants) {
        try {
            if (!is_array($participants)) {
                throw new Exception("Les participants doivent être un tableau");
            }
            
            foreach ($participants as $playerId) {
                $this->training->addParticipant($trainingId, $playerId);
            }
            return true;
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
        $controller = new TrainingController();
        
        switch($_GET['action']) {
            case 'getAll':
                echo json_encode($controller->getAllTrainings());
                break;
                
            case 'getOne':
                if(isset($_GET['id'])) {
                    echo json_encode($controller->getTraining($_GET['id']));
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID manquant']);
                }
                break;
                
            case 'getByDate':
                if(isset($_GET['date'])) {
                    echo json_encode($controller->getTrainingsByDate($_GET['date']));
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'Date manquante']);
                }
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Action non reconnue']);
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $controller = new TrainingController();
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'JSON invalide']);
            exit;
        }
        
        if(isset($data['action'])) {
            switch($data['action']) {
                case 'create':
                    try {
                        $result = $controller->createTraining($data);
                        echo json_encode(['success' => $result]);
                    } catch (Exception $e) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                    }
                    break;
                    
                case 'update':
                    if(isset($data['id'])) {
                        try {
                            $result = $controller->updateTraining($data['id'], $data);
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
                            $result = $controller->deleteTraining($data['id']);
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
    error_log("Erreur TrainingController: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur']);
}
?>
