<?php

require_once 'interfaces/TrainingInterface.php';

class Training implements TrainingInterface {
    private $conn;
    private $table_name = "trainings";
    
    public $id;
    public $training_type_id;
    public $date;
    public $duration_minutes;
    public $location;
    public $description;
    public $created_by;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    public function scheduleTraining(array $data): bool {
        $this->training_type_id = $data['training_type_id'];
        $this->date = $data['date'];
        $this->duration_minutes = $data['duration_minutes'];
        $this->location = $data['location'];
        $this->description = $data['description'];
        $this->created_by = $data['created_by'];
        
        $query = "INSERT INTO " . $this->table_name . "
                  SET training_type_id=:training_type_id, date=:date,
                      duration_minutes=:duration_minutes, location=:location,
                      description=:description, created_by=:created_by";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":training_type_id", $this->training_type_id);
        $stmt->bindParam(":date", $this->date);
        $stmt->bindParam(":duration_minutes", $this->duration_minutes);
        $stmt->bindParam(":location", $this->location);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":created_by", $this->created_by);
        
        return $stmt->execute();
    }
    
    public function getTrainingsByDate(string $date): array {
        $query = "SELECT t.*, tt.name as training_type_name, u.username as created_by_name
                  FROM " . $this->table_name . " t
                  LEFT JOIN training_types tt ON t.training_type_id = tt.id
                  LEFT JOIN users u ON t.created_by = u.id
                  WHERE DATE(t.date) = :date
                  ORDER BY t.date ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":date", $date);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function addParticipant(int $trainingId, int $playerId): bool {
        $query = "INSERT INTO training_participants 
                  SET training_id=:training_id, player_id=:player_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":training_id", $trainingId);
        $stmt->bindParam(":player_id", $playerId);
        
        return $stmt->execute();
    }
    
    public function readAll() {
        $query = "SELECT t.*, tt.name as training_type_name, u.username as created_by_name
                  FROM " . $this->table_name . " t
                  LEFT JOIN training_types tt ON t.training_type_id = tt.id
                  LEFT JOIN users u ON t.created_by = u.id
                  ORDER BY t.date DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
}

interface TrainingStrategy {
    public function execute(): string;
}

class CardioTrainingStrategy implements TrainingStrategy {
    public function execute(): string {
        return "Entraînement cardio: Course, sprints, exercices d'endurance";
    }
}

class TechnicalTrainingStrategy implements TrainingStrategy {
    public function execute(): string {
        return "Entraînement technique: Dribbles, passes, tirs, mouvements individuels";
    }
}

class TacticalTrainingStrategy implements TrainingStrategy {
    public function execute(): string {
        return "Entraînement tactique: Schémas de jeu, défense, attaque positionnelle";
    }
}

class TrainingContext {
    private $strategy;
    
    public function setStrategy(TrainingStrategy $strategy) {
        $this->strategy = $strategy;
    }
    
    public function executeTraining(): string {
        return $this->strategy->execute();
    }
}
?>
