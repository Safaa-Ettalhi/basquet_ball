<?php

require_once '../config/Database.php';
require_once '../models/Team.php';

class TeamController {
    private $db;
    private $team;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->team = new Team($this->db);
    }
    
    public function getAllTeams() {
        $stmt = $this->team->readAll();
        $teams = array();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $teams[] = $row;
        }
        
        return $teams;
    }
    
    public function getTeam($id) {
        $this->team->id = $id;
        if($this->team->readOne()) {
            return array(
                'id' => $this->team->id,
                'name' => $this->team->name,
                'city' => $this->team->city
            );
        }
        return null;
    }
    
    public function createTeam($data) {
        $this->team->name = $data['name'];
        $this->team->city = $data['city'];
        
        return $this->team->create();
    }
    
    public function updateTeam($id, $data) {
        $this->team->id = $id;
        $this->team->name = $data['name'];
        $this->team->city = $data['city'];
        
        return $this->team->update();
    }
    
    public function deleteTeam($id) {
        $this->team->id = $id;
        return $this->team->delete();
    }
    
    public function assignPlayers($teamId, $playerIds) {
        $this->team->id = $teamId;
        return $this->team->assignPlayers($playerIds);
    }
    
    public function getTeamPlayers($teamId) {
        $this->team->id = $teamId;
        return $this->team->getTeamPlayers();
    }
}

// API endpoints
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $controller = new TeamController();
    
    switch($_GET['action']) {
        case 'getAll':
            header('Content-Type: application/json');
            echo json_encode($controller->getAllTeams());
            break;
            
        case 'getOne':
            if(isset($_GET['id'])) {
                header('Content-Type: application/json');
                $team = $controller->getTeam($_GET['id']);
                echo json_encode($team);
            }
            break;
            
        case 'getTeamPlayers':
            if(isset($_GET['team_id'])) {
                header('Content-Type: application/json');
                $players = $controller->getTeamPlayers($_GET['team_id']);
                echo json_encode($players);
            }
            break;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller = new TeamController();
    $data = json_decode(file_get_contents("php://input"), true);
    
    if(isset($data['action'])) {
        switch($data['action']) {
            case 'create':
                $result = $controller->createTeam($data);
                header('Content-Type: application/json');
                echo json_encode(['success' => $result]);
                break;
                
            case 'update':
                if(isset($data['id'])) {
                    $result = $controller->updateTeam($data['id'], $data);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                }
                break;
                
            case 'delete':
                if(isset($data['id'])) {
                    $result = $controller->deleteTeam($data['id']);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                }
                break;
                
            case 'assignPlayers':
                if(isset($data['team_id']) && isset($data['player_ids'])) {
                    $result = $controller->assignPlayers($data['team_id'], $data['player_ids']);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                }
                break;
        }
    }
}
?>
