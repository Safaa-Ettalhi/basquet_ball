<?php

require_once 'interfaces/TeamInterface.php';

class Team implements TeamInterface {
    private $conn;
    private $table_name = "teams";
    
    public $id;
    public $name;
    public $city;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET name=:name, city=:city";
        
        $stmt = $this->conn->prepare($query);
        
 
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->city = htmlspecialchars(strip_tags($this->city));
        
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":city", $this->city);
        
        return $stmt->execute();
    }
    
    public function readAll() {
        $query = "SELECT t.*, 
                         COUNT(p.id) as player_count
                  FROM " . $this->table_name . " t
                  LEFT JOIN players p ON t.id = p.team_id
                  GROUP BY t.id
                  ORDER BY t.name ASC";
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
            $this->name = $row['name'];
            $this->city = $row['city'];
            return true;
        }
        return false;
    }
    
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET name=:name, city=:city
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        
       
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->city = htmlspecialchars(strip_tags($this->city));
        
        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':city', $this->city);
        $stmt->bindParam(':id', $this->id);
        
        return $stmt->execute();
    }
    
    public function delete() {
        try {
            $this->conn->beginTransaction();
            
         
            $query1 = "UPDATE players SET team_id = NULL WHERE team_id = ?";
            $stmt1 = $this->conn->prepare($query1);
            $stmt1->bindParam(1, $this->id);
            $stmt1->execute();
            
           
            $query2 = "DELETE FROM " . $this->table_name . " WHERE id = ?";
            $stmt2 = $this->conn->prepare($query2);
            $stmt2->bindParam(1, $this->id);
            $result = $stmt2->execute();
            
            $this->conn->commit();
            return $result;
        } catch (Exception $e) {
            $this->conn->rollback();
            return false;
        }
    }
    
    public function assignPlayers($playerIds) {
        try {
            $this->conn->beginTransaction();
            
            $query1 = "UPDATE players SET team_id = NULL WHERE team_id = ?";
            $stmt1 = $this->conn->prepare($query1);
            $stmt1->bindParam(1, $this->id);
            $stmt1->execute();
            
      
            if (!empty($playerIds)) {
                $placeholders = str_repeat('?,', count($playerIds) - 1) . '?';
                $query2 = "UPDATE players SET team_id = ? WHERE id IN ($placeholders)";
                $stmt2 = $this->conn->prepare($query2);
                
                $params = array_merge([$this->id], $playerIds);
                $stmt2->execute($params);
            }
            
            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollback();
            return false;
        }
    }
    
    public function getTeamPlayers() {
        $query = "SELECT * FROM players WHERE team_id = ? ORDER BY position, last_name";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
