<?php

require_once '../config/Database.php';
require_once '../models/Match.php';

class MatchController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    public function getAllMatches() {
        $match = new FriendlyMatch($this->db);
        $stmt = $match->readAll();
        $matches = array();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $matches[] = $row;
        }
        
        return $matches;
    }
    
    public function getMatch($id) {
        $query = "SELECT m.*, t.name as opponent_name, t.city as opponent_city
                  FROM matches m
                  LEFT JOIN teams t ON m.opponent_team_id = t.id
                  WHERE m.id = :id";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function createMatch($data) {
        try {
            $match = MatchFactory::createMatch($data['match_type'], $this->db);
            
            $match->opponent_team_id = $data['opponent_team_id'];
            $match->match_date = $data['match_date'];
            $match->location = $data['location'];
            $match->match_type = $data['match_type'];
            $match->our_score = $data['our_score'] ?? 0;
            $match->opponent_score = $data['opponent_score'] ?? 0;
            $match->status = $data['status'] ?? 'scheduled';
            
            return $match->create();
        } catch (Exception $e) {
            return false;
        }
    }
    
    public function updateMatch($id, $data) {
        $query = "UPDATE matches 
                  SET opponent_team_id=:opponent_team_id, match_date=:match_date,
                      location=:location, match_type=:match_type, status=:status
                  WHERE id=:id";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':opponent_team_id', $data['opponent_team_id']);
        $stmt->bindParam(':match_date', $data['match_date']);
        $stmt->bindParam(':location', $data['location']);
        $stmt->bindParam(':match_type', $data['match_type']);
        $stmt->bindParam(':status', $data['status']);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }
    
    public function deleteMatch($id) {
        $query = "DELETE FROM matches WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }
    
    public function updateMatchScore($id, $our_score, $opponent_score) {
        $match = new FriendlyMatch($this->db);
        $match->id = $id;
        return $match->updateScore($our_score, $opponent_score);
    }
    
    public function getMatchStrategy($type) {
        try {
            $match = MatchFactory::createMatch($type, $this->db);
            return $match->getMatchStrategy();
        } catch (Exception $e) {
            return "Stratégie non définie";
        }
    }
}

// API endpoints
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $controller = new MatchController();
    
    switch($_GET['action']) {
        case 'getAll':
            header('Content-Type: application/json');
            echo json_encode($controller->getAllMatches());
            break;
            
        case 'getOne':
            if(isset($_GET['id'])) {
                header('Content-Type: application/json');
                echo json_encode($controller->getMatch($_GET['id']));
            }
            break;
            
        case 'getStrategy':
            if(isset($_GET['type'])) {
                header('Content-Type: application/json');
                echo json_encode(['strategy' => $controller->getMatchStrategy($_GET['type'])]);
            }
            break;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller = new MatchController();
    $data = json_decode(file_get_contents("php://input"), true);
    
    if(isset($data['action'])) {
        switch($data['action']) {
            case 'create':
                $result = $controller->createMatch($data);
                header('Content-Type: application/json');
                echo json_encode(['success' => $result]);
                break;
                
            case 'update':
                if(isset($data['id'])) {
                    $result = $controller->updateMatch($data['id'], $data);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                }
                break;
                
            case 'delete':
                if(isset($data['id'])) {
                    $result = $controller->deleteMatch($data['id']);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                }
                break;
                
            case 'updateScore':
                if(isset($data['id'], $data['our_score'], $data['opponent_score'])) {
                    $result = $controller->updateMatchScore($data['id'], $data['our_score'], $data['opponent_score']);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                }
                break;
        }
    }
}
?>
