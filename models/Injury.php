<?php

class Injury {
    private $conn;
    private $table_name = "injuries";
    
    public $id;
    public $player_id;
    public $injury_type;
    public $description;
    public $severity;
    public $injury_date;
    public $expected_recovery_date;
    public $actual_recovery_date;
    public $treatment;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET player_id=:player_id, injury_type=:injury_type,
                      description=:description, severity=:severity,
                      injury_date=:injury_date, expected_recovery_date=:expected_recovery_date,
                      treatment=:treatment";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":player_id", $this->player_id);
        $stmt->bindParam(":injury_type", $this->injury_type);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":severity", $this->severity);
        $stmt->bindParam(":injury_date", $this->injury_date);
        $stmt->bindParam(":expected_recovery_date", $this->expected_recovery_date);
        $stmt->bindParam(":treatment", $this->treatment);
        
        if($stmt->execute()) {
           
            $this->updatePlayerHealthStatus();
            return true;
        }
        return false;
    }
    
    private function updatePlayerHealthStatus() {
        $query = "UPDATE players SET health_status = 'injured' WHERE id = :player_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":player_id", $this->player_id);
        $stmt->execute();
    }
    
    public function markAsRecovered() {
        $query = "UPDATE " . $this->table_name . "
                  SET actual_recovery_date = CURDATE()
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        
        if($stmt->execute()) {
           
            $query2 = "UPDATE players SET health_status = 'healthy' WHERE id = :player_id";
            $stmt2 = $this->conn->prepare($query2);
            $stmt2->bindParam(":player_id", $this->player_id);
            $stmt2->execute();
            return true;
        }
        return false;
    }
    
    public function getActiveInjuries() {
        $query = "SELECT i.*, p.first_name, p.last_name, p.position
                  FROM " . $this->table_name . " i
                  JOIN players p ON i.player_id = p.id
                  WHERE i.actual_recovery_date IS NULL
                  ORDER BY i.injury_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
