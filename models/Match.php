<?php

abstract class BaseMatch {
    protected $conn;
    protected $table_name = "matches";
    
    public $id;
    public $opponent_team_id; 
    public $home_team_id;    
    public $away_team_id;     
    public $match_date;
    public $location;
    public $match_type;
    public $our_score;       
    public $opponent_score;  
    public $home_score;      
    public $away_score;      
    public $status;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    abstract public function getMatchStrategy(): string;
    
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET home_team_id=:home_team_id, away_team_id=:away_team_id,
                      match_date=:match_date, location=:location, 
                      match_type=:match_type, home_score=:home_score, 
                      away_score=:away_score, status=:status";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":home_team_id", $this->home_team_id);
        $stmt->bindParam(":away_team_id", $this->away_team_id);
        $stmt->bindParam(":match_date", $this->match_date);
        $stmt->bindParam(":location", $this->location);
        $stmt->bindParam(":match_type", $this->match_type);
        $stmt->bindParam(":home_score", $this->home_score);
        $stmt->bindParam(":away_score", $this->away_score);
        $stmt->bindParam(":status", $this->status);
        
        return $stmt->execute();
    }
    
    public function readAll() {
        $query = "SELECT m.*, 
                         ht.name as home_team_name, ht.city as home_team_city,
                         at.name as away_team_name, at.city as away_team_city,
                         ot.name as opponent_name, ot.city as opponent_city
                  FROM " . $this->table_name . " m
                  LEFT JOIN teams ht ON m.home_team_id = ht.id
                  LEFT JOIN teams at ON m.away_team_id = at.id
                  LEFT JOIN teams ot ON m.opponent_team_id = ot.id
                  ORDER BY m.match_date DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
    
    public function readOne() {
        $query = "SELECT m.*, 
                         ht.name as home_team_name, ht.city as home_team_city,
                         at.name as away_team_name, at.city as away_team_city,
                         ot.name as opponent_name, ot.city as opponent_city
                  FROM " . $this->table_name . " m
                  LEFT JOIN teams ht ON m.home_team_id = ht.id
                  LEFT JOIN teams at ON m.away_team_id = at.id
                  LEFT JOIN teams ot ON m.opponent_team_id = ot.id
                  WHERE m.id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();
        return $stmt;
    }
    
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET home_team_id=:home_team_id, away_team_id=:away_team_id,
                      match_date=:match_date, location=:location,
                      match_type=:match_type, status=:status
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":home_team_id", $this->home_team_id);
        $stmt->bindParam(":away_team_id", $this->away_team_id);
        $stmt->bindParam(":match_date", $this->match_date);
        $stmt->bindParam(":location", $this->location);
        $stmt->bindParam(":match_type", $this->match_type);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":id", $this->id);
        
        return $stmt->execute();
    }
    
    public function updateScore($home_score, $away_score) {
        $query = "UPDATE " . $this->table_name . "
                  SET home_score=:home_score, away_score=:away_score,
                      status='completed'
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':home_score', $home_score);
        $stmt->bindParam(':away_score', $away_score);
        $stmt->bindParam(':id', $this->id);
        
        return $stmt->execute();
    }
    
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        return $stmt->execute();
    }
}

class FriendlyMatch extends BaseMatch {
    public function getMatchStrategy(): string {
        return "Stratégie détendue - Focus sur l'expérimentation et le développement des jeunes joueurs";
    }
}

class OfficialMatch extends BaseMatch {
    public function getMatchStrategy(): string {
        return "Stratégie compétitive - Utiliser la meilleure formation et tactiques pour gagner";
    }
}

class MatchFactory {
    public static function createMatch($type, $db) {
        switch($type) {
            case 'friendly':
                return new FriendlyMatch($db);
            case 'official':
                return new OfficialMatch($db);
            default:
                throw new InvalidArgumentException("Type de match non supporté: " . $type);
        }
    }
}
?>