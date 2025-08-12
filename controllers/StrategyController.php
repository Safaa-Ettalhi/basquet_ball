<?php

require_once '../config/Database.php';

class StrategyController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    public function getAllStrategies() {
        $query = "SELECT sv.*, m.match_date, m.status as match_status,
                         ht.name as home_team_name, ht.city as home_team_city,
                         at.name as away_team_name, at.city as away_team_city,
                         ot.name as opponent_name, ot.city as opponent_city,
                         u1.username as proposed_by_name, u2.username as validated_by_name
                  FROM strategy_validations sv
                  LEFT JOIN matches m ON sv.match_id = m.id
                  LEFT JOIN teams ht ON m.home_team_id = ht.id
                  LEFT JOIN teams at ON m.away_team_id = at.id
                  LEFT JOIN teams ot ON m.opponent_team_id = ot.id
                  LEFT JOIN users u1 ON sv.proposed_by = u1.id
                  LEFT JOIN users u2 ON sv.validated_by = u2.id
                  ORDER BY sv.created_at DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    

    public function getAvailableMatches() {
        $query = "SELECT m.id, m.match_date, m.location, m.status,
                         ht.name as home_team_name, ht.city as home_team_city,
                         at.name as away_team_name, at.city as away_team_city,
                         ot.name as opponent_name, ot.city as opponent_city
                  FROM matches m
                  LEFT JOIN teams ht ON m.home_team_id = ht.id
                  LEFT JOIN teams at ON m.away_team_id = at.id
                  LEFT JOIN teams ot ON m.opponent_team_id = ot.id
                  WHERE m.match_date >= NOW()
                  AND m.status != 'completed'
                  AND m.status != 'cancelled'
                  AND (m.home_score = 0 OR m.home_score IS NULL)
                  AND (m.away_score = 0 OR m.away_score IS NULL)
                  ORDER BY m.match_date ASC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function proposeStrategy($data) {
        $query = "INSERT INTO strategy_validations 
                  SET match_id=:match_id, strategy_name=:strategy_name,
                      proposed_by=:proposed_by, comments=:comments, status='pending'";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':match_id', $data['match_id']);
        $stmt->bindParam(':strategy_name', $data['strategy_name']);
        $stmt->bindParam(':proposed_by', $data['proposed_by']);
        $stmt->bindParam(':comments', $data['comments']);
        
        return $stmt->execute();
    }
    
    public function updateStrategy($id, $data) {
        $query = "UPDATE strategy_validations 
                  SET strategy_name=:strategy_name, comments=:comments
                  WHERE id=:id";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':strategy_name', $data['strategy_name']);
        $stmt->bindParam(':comments', $data['comments']);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }
    
    public function deleteStrategy($id) {
        $query = "DELETE FROM strategy_validations WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }
    
    public function validateStrategy($id, $status, $validatedBy, $comments = '') {
        $query = "UPDATE strategy_validations 
                  SET status=:status, validated_by=:validated_by, 
                      comments=:comments, validated_at=NOW()
                  WHERE id=:id";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':validated_by', $validatedBy);
        $stmt->bindParam(':comments', $comments);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }
}

// API endpoints
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $controller = new StrategyController();
    
    switch($_GET['action']) {
        case 'getAll':
            header('Content-Type: application/json');
            echo json_encode($controller->getAllStrategies());
            break;
            
        case 'getAvailableMatches':
            header('Content-Type: application/json');
            echo json_encode($controller->getAvailableMatches());
            break;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller = new StrategyController();
    $data = json_decode(file_get_contents("php://input"), true);
    
    if(isset($data['action'])) {
        switch($data['action']) {
            case 'propose':
                $result = $controller->proposeStrategy($data);
                header('Content-Type: application/json');
                echo json_encode(['success' => $result]);
                break;
                
            case 'update':
                if(isset($data['id'])) {
                    $result = $controller->updateStrategy($data['id'], $data);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                }
                break;
                
            case 'delete':
                if(isset($data['id'])) {
                    $result = $controller->deleteStrategy($data['id']);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                }
                break;
                
            case 'validate':
                if(isset($data['id'], $data['status'], $data['validated_by'])) {
                    $result = $controller->validateStrategy(
                        $data['id'], 
                        $data['status'], 
                        $data['validated_by'], 
                        $data['comments'] ?? ''
                    );
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                }
                break;
        }
    }
}
?>