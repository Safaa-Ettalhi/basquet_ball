<?php

require_once 'interfaces/PlayerInterface.php';

class Player implements PlayerInterface {
    private $conn;
    private $table_name = "players";
    
    public $id;
    public $first_name;
    public $last_name;
    public $position;
    public $jersey_number;
    public $height;
    public $weight;
    public $birth_date;
    public $salary;
    public $health_status;
    public $role; 
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    public function getId(): int {
        return $this->id;
    }
    
    public function getFullName(): string {
        return $this->first_name . ' ' . $this->last_name;
    }
    
    public function getPosition(): string {
        return $this->position;
    }
    
    public function getHealthStatus(): string {
        return $this->health_status;
    }
    
    public function updateHealthStatus(string $status): bool {
        $query = "UPDATE " . $this->table_name . " 
                  SET health_status = :status 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":id", $this->id);
        
        return $stmt->execute();
    }
    
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET first_name=:first_name, last_name=:last_name, 
                      position=:position, jersey_number=:jersey_number,
                      height=:height, weight=:weight, birth_date=:birth_date,
                      salary=:salary, health_status=:health_status, role=:role";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":first_name", $this->first_name);
        $stmt->bindParam(":last_name", $this->last_name);
        $stmt->bindParam(":position", $this->position);
        $stmt->bindParam(":jersey_number", $this->jersey_number);
        $stmt->bindParam(":height", $this->height);
        $stmt->bindParam(":weight", $this->weight);
        $stmt->bindParam(":birth_date", $this->birth_date);
        $stmt->bindParam(":salary", $this->salary);
        $stmt->bindParam(":health_status", $this->health_status);
        $stmt->bindParam(":role", $this->role);
        
        if($stmt->execute()) {
            return true;
        }
        return false;
    }
    
    public function readAll() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY last_name ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
    
    public function readOne() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($row) {
            $this->first_name = $row['first_name'];
            $this->last_name = $row['last_name'];
            $this->position = $row['position'];
            $this->jersey_number = $row['jersey_number'];
            $this->height = $row['height'];
            $this->weight = $row['weight'];
            $this->birth_date = $row['birth_date'];
            $this->salary = $row['salary'];
            $this->health_status = $row['health_status'];
            $this->role = $row['role'] ?? 'player';
            return true;
        }
        return false;
    }
    
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET first_name=:first_name, last_name=:last_name,
                      position=:position, jersey_number=:jersey_number,
                      height=:height, weight=:weight, birth_date=:birth_date,
                      salary=:salary, health_status=:health_status, role=:role
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':first_name', $this->first_name);
        $stmt->bindParam(':last_name', $this->last_name);
        $stmt->bindParam(':position', $this->position);
        $stmt->bindParam(':jersey_number', $this->jersey_number);
        $stmt->bindParam(':height', $this->height);
        $stmt->bindParam(':weight', $this->weight);
        $stmt->bindParam(':birth_date', $this->birth_date);
        $stmt->bindParam(':salary', $this->salary);
        $stmt->bindParam(':health_status', $this->health_status);
        $stmt->bindParam(':role', $this->role);
        $stmt->bindParam(':id', $this->id);
        
        return $stmt->execute();
    }
    
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        
        return $stmt->execute();
    }
}
?>
