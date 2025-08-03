<?php

abstract class BaseMatch {
    protected $conn;
    protected $table_name = "matches";
    
    public $id;
    public $opponent_team_id;
    public $match_date;
    public $location;
    public $match_type;
    public $our_score;
    public $opponent_score;
    public $status;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    abstract public function getMatchStrategy(): string;
    
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET opponent_team_id=:opponent_team_id, match_date=:match_date,
                      location=:location, match_type=:match_type,
                      our_score=:our_score, opponent_score=:opponent_score,
                      status=:status";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":opponent_team_id", $this->opponent_team_id);
        $stmt->bindParam(":match_date", $this->match_date);
        $stmt->bindParam(":location", $this->location);
        $stmt->bindParam(":match_type", $this->match_type);
        $stmt->bindParam(":our_score", $this->our_score);
        $stmt->bindParam(":opponent_score", $this->opponent_score);
        $stmt->bindParam(":status", $this->status);
        
        return $stmt->execute();
    }
    
    public function readAll() {
        $query = "SELECT m.*, t.name as opponent_name, t.city as opponent_city
                  FROM " . $this->table_name . " m
                  LEFT JOIN teams t ON m.opponent_team_id = t.id
                  ORDER BY m.match_date DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
    
    public function updateScore($our_score, $opponent_score) {
        $query = "UPDATE " . $this->table_name . "
                  SET our_score=:our_score, opponent_score=:opponent_score,
                      status='completed'
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':our_score', $our_score);
        $stmt->bindParam(':opponent_score', $opponent_score);
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
