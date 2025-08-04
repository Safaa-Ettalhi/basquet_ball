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
    
    public function getAllTrainings() {
        $stmt = $this->training->readAll();
        $trainings = array();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $trainings[] = $row;
        }
        
        return $trainings;
    }
    
    public function getTraining($id) {
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
    }
    
    public function createTraining($data) {
        $result = $this->training->scheduleTraining($data);
        
        if ($result && isset($data['participants'])) {
            $trainingId = $this->db->lastInsertId();
            foreach ($data['participants'] as $playerId) {
                $this->training->addParticipant($trainingId, $playerId);
            }
        }
        
        return $result;
    }
    
    public function updateTraining($id, $data) {
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
    }
    
    public function deleteTraining($id) {
        $query = "DELETE FROM trainings WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }
    
    public function getTrainingsByDate($date) {
        return $this->training->getTrainingsByDate($date);
    }
    
    public function addParticipants($trainingId, $participants) {
        foreach ($participants as $playerId) {
            $this->training->addParticipant($trainingId, $playerId);
        }
        return true;
    }
}

// API endpoints
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $controller = new TrainingController();
    
    switch($_GET['action']) {
        case 'getAll':
            header('Content-Type: application/json');
            echo json_encode($controller->getAllTrainings());
            break;
            
        case 'getOne':
            if(isset($_GET['id'])) {
                header('Content-Type: application/json');
                echo json_encode($controller->getTraining($_GET['id']));
            }
            break;
            
        case 'getByDate':
            if(isset($_GET['date'])) {
                header('Content-Type: application/json');
                echo json_encode($controller->getTrainingsByDate($_GET['date']));
            }
            break;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller = new TrainingController();
    $data = json_decode(file_get_contents("php://input"), true);
    
    if(isset($data['action'])) {
        switch($data['action']) {
            case 'create':
                $result = $controller->createTraining($data);
                header('Content-Type: application/json');
                echo json_encode(['success' => $result]);
                break;
                
            case 'update':
                if(isset($data['id'])) {
                    $result = $controller->updateTraining($data['id'], $data);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                }
                break;
                
            case 'delete':
                if(isset($data['id'])) {
                    $result = $controller->deleteTraining($data['id']);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                }
                break;
        }
    }
}
?>
