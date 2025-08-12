<?php

require_once '../config/Database.php';
require_once '../models/Match.php';

class MatchController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    private function validateMatchDate($matchDate, $isUpdate = false, $existingStatus = null) {
        $date = new DateTime($matchDate);
        $now = new DateTime();
        $now->setTime(0, 0, 0);

        if ($isUpdate && $existingStatus === 'completed') {
            return true;
        }
        
        if ($date < $now) {
            throw new Exception('La date du match ne peut pas être antérieure à aujourd\'hui');
        }
        
        return true;
    }

    private function validateMatchData($data) {
        $required = ['home_team_id', 'away_team_id', 'match_date', 'location', 'match_type'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("Le champ $field est requis");
            }
        }

        if ($data['home_team_id'] === $data['away_team_id']) {
            throw new Exception('L\'équipe à domicile et l\'équipe visiteur ne peuvent pas être identiques');
        }

        $validTypes = ['friendly', 'championship', 'cup'];
        if (!in_array($data['match_type'], $validTypes)) {
            throw new Exception('Type de match invalide. Valeurs acceptées: ' . implode(', ', $validTypes));
        }

        $this->validateMatchDate($data['match_date']);
    }
    
    public function getAllMatches() {
        try {
            $match = new FriendlyMatch($this->db);
            $stmt = $match->readAll();
            $matches = array();
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $matches[] = $row;
            }
            
            return $matches;
        } catch (Exception $e) {
            error_log("Erreur getAllMatches: " . $e->getMessage());
            return [];
        }
    }
    
    public function getMatch($id) {
        try {
            $match = new FriendlyMatch($this->db);
            $match->id = $id;
            $stmt = $match->readOne();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Erreur getMatch: " . $e->getMessage());
            return null;
        }
    }
    
    private function checkTeamDayConflict($team_id, $match_date, $exclude_match_id = null) {
        $query = "SELECT m.id, m.match_date, ht.name as home_team_name, at.name as away_team_name, ot.name as opponent_name
                  FROM matches m
                  LEFT JOIN teams ht ON m.home_team_id = ht.id
                  LEFT JOIN teams at ON m.away_team_id = at.id  
                  LEFT JOIN teams ot ON m.opponent_team_id = ot.id
                  WHERE (m.home_team_id = :team_id OR m.away_team_id = :team_id OR m.opponent_team_id = :team_id)
                  AND DATE(m.match_date) = DATE(:match_date)
                  AND m.status != 'cancelled'";
        
        if ($exclude_match_id) {
            $query .= " AND m.id != :exclude_match_id";
        }
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':team_id', $team_id);
        $stmt->bindParam(':match_date', $match_date);
        
        if ($exclude_match_id) {
            $stmt->bindParam(':exclude_match_id', $exclude_match_id);
        }
        
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function getTeamName($team_id) {
        $query = "SELECT name, city FROM teams WHERE id = :team_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':team_id', $team_id);
        $stmt->execute();
        $team = $stmt->fetch(PDO::FETCH_ASSOC);
        return $team ? $team['name'] . ' (' . $team['city'] . ')' : 'Équipe inconnue';
    }

    private function validateTeamsExist($homeTeamId, $awayTeamId) {
        $query = "SELECT id FROM teams WHERE id = :team_id";
        $stmt = $this->db->prepare($query);

        $stmt->bindParam(':team_id', $homeTeamId);
        $stmt->execute();
        if (!$stmt->fetch()) {
            throw new Exception("L'équipe à domicile (ID: $homeTeamId) n'existe pas");
        }

        $stmt->bindParam(':team_id', $awayTeamId);
        $stmt->execute();
        if (!$stmt->fetch()) {
            throw new Exception("L'équipe visiteur (ID: $awayTeamId) n'existe pas");
        }
    }
    
    public function createMatch($data) {
        try {
            $this->validateMatchData($data);
            
            $this->validateTeamsExist($data['home_team_id'], $data['away_team_id']);
            
            $homeTeamConflict = $this->checkTeamDayConflict($data['home_team_id'], $data['match_date']);
            if ($homeTeamConflict) {
                $teamName = $this->getTeamName($data['home_team_id']);
                $conflictDate = date('d/m/Y', strtotime($homeTeamConflict['match_date']));
                $conflictTime = date('H:i', strtotime($homeTeamConflict['match_date']));
                throw new Exception("Conflit détecté : L'équipe à domicile ($teamName) a déjà un match programmé le $conflictDate à $conflictTime.");
            }
            
            $awayTeamConflict = $this->checkTeamDayConflict($data['away_team_id'], $data['match_date']);
            if ($awayTeamConflict) {
                $teamName = $this->getTeamName($data['away_team_id']);
                $conflictDate = date('d/m/Y', strtotime($awayTeamConflict['match_date']));
                $conflictTime = date('H:i', strtotime($awayTeamConflict['match_date']));
                throw new Exception("Conflit détecté : L'équipe visiteur ($teamName) a déjà un match programmé le $conflictDate à $conflictTime.");
            }

            $match = MatchFactory::createMatch($data['match_type'], $this->db);
            
            $match->home_team_id = $data['home_team_id'];
            $match->away_team_id = $data['away_team_id'];
            $match->match_date = $data['match_date'];
            $match->location = $data['location'];
            $match->match_type = $data['match_type'];
            $match->home_score = 0;  
            $match->away_score = 0;  
            $match->status = 'scheduled';
            
            $result = $match->create();
            return ['success' => $result];
            
        } catch (Exception $e) {
            error_log("Erreur création match: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    public function updateMatch($id, $data) {
        try {
            $existingMatch = $this->getMatch($id);
            if (!$existingMatch) {
                throw new Exception('Match non trouvé');
            }

            $this->validateMatchData($data);
            $this->validateMatchDate($data['match_date'], true, $existingMatch['status']);

            $this->validateTeamsExist($data['home_team_id'], $data['away_team_id']);

            if (isset($data['status']) && $data['status'] === 'completed') {
                $matchDate = new DateTime($existingMatch['match_date']);
                $now = new DateTime();
                
                if ($matchDate > $now) {
                    throw new Exception('Impossible de marquer le match comme terminé : la date du match n\'est pas encore passée');
                }
            }

            $homeTeamConflict = $this->checkTeamDayConflict($data['home_team_id'], $data['match_date'], $id);
            if ($homeTeamConflict) {
                $teamName = $this->getTeamName($data['home_team_id']);
                $conflictDate = date('d/m/Y', strtotime($homeTeamConflict['match_date']));
                $conflictTime = date('H:i', strtotime($homeTeamConflict['match_date']));
                throw new Exception("Conflit détecté : L'équipe à domicile ($teamName) a déjà un match programmé le $conflictDate à $conflictTime.");
            }
            
            $awayTeamConflict = $this->checkTeamDayConflict($data['away_team_id'], $data['match_date'], $id);
            if ($awayTeamConflict) {
                $teamName = $this->getTeamName($data['away_team_id']);
                $conflictDate = date('d/m/Y', strtotime($awayTeamConflict['match_date']));
                $conflictTime = date('H:i', strtotime($awayTeamConflict['match_date']));
                throw new Exception("Conflit détecté : L'équipe visiteur ($teamName) a déjà un match programmé le $conflictDate à $conflictTime.");
            }
            $match = MatchFactory::createMatch($data['match_type'], $this->db);
            $match->id = $id;
            $match->home_team_id = $data['home_team_id'];
            $match->away_team_id = $data['away_team_id'];
            $match->match_date = $data['match_date'];
            $match->location = $data['location'];
            $match->match_type = $data['match_type'];
            $match->status = $data['status'] ?? $existingMatch['status'];
            
            $result = $match->update();
            return ['success' => $result];
            
        } catch (Exception $e) {
            error_log("Erreur modification match: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    public function deleteMatch($id) {
        try {
            $existingMatch = $this->getMatch($id);
            if (!$existingMatch) {
                throw new Exception('Match non trouvé');
            }

            if ($existingMatch['status'] === 'completed') {
                $statsQuery = "SELECT COUNT(*) as count FROM player_statistics WHERE match_id = :match_id";
                $stmt = $this->db->prepare($statsQuery);
                $stmt->bindParam(':match_id', $id);
                $stmt->execute();
                $statsCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                
                if ($statsCount > 0) {
                    throw new Exception('Impossible de supprimer ce match : des statistiques y sont associées');
                }
            }
            
            $match = new FriendlyMatch($this->db);
            $match->id = $id;
            return $match->delete();
            
        } catch (Exception $e) {
            error_log("Erreur suppression match: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function updateMatchScore($id, $home_score, $away_score) {
        try {
            $existingMatch = $this->getMatch($id);
            if (!$existingMatch) {
                throw new Exception('Match non trouvé');
            }
            
            if ($existingMatch['status'] !== 'completed') {
                throw new Exception('Impossible d\'ajouter le score : le match doit d\'abord être marqué comme "terminé"');
            }
            
            if (!is_numeric($home_score) || !is_numeric($away_score) || $home_score < 0 || $away_score < 0) {
                throw new Exception('Les scores doivent être des nombres positifs');
            }
            
            if (($existingMatch['home_score'] != 0 || $existingMatch['away_score'] != 0) && 
                ($existingMatch['home_score'] != null || $existingMatch['away_score'] != null)) {
                throw new Exception('Le score a déjà été saisi pour ce match');
            }

            $query = "UPDATE matches SET home_score=:home_score, away_score=:away_score WHERE id=:id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':home_score', $home_score);
            $stmt->bindParam(':away_score', $away_score);
            $stmt->bindParam(':id', $id);
            
            $result = $stmt->execute();
            return ['success' => $result];
            
        } catch (Exception $e) {
            error_log("Erreur mise à jour score: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function checkTeamDayAvailability($team_id, $match_date, $exclude_match_id = null) {
        try {
            $conflict = $this->checkTeamDayConflict($team_id, $match_date, $exclude_match_id);
            return [
                'available' => !$conflict,
                'conflict' => $conflict ? [
                    'match_id' => $conflict['id'],
                    'match_date' => $conflict['match_date'],
                    'opponent' => ($conflict['home_team_name'] ?: 'Équipe 1') . ' vs ' . ($conflict['away_team_name'] ?: ($conflict['opponent_name'] ?: 'Équipe 2'))
                ] : null
            ];
        } catch (Exception $e) {
            error_log("Erreur checkTeamDayAvailability: " . $e->getMessage());
            return ['available' => false, 'error' => $e->getMessage()];
        }
    }
    
    public function getMatchStrategy($type) {
        try {
            $match = MatchFactory::createMatch($type, $this->db);
            return $match->getMatchStrategy();
        } catch (Exception $e) {
            error_log("Erreur getMatchStrategy: " . $e->getMessage());
            return "Stratégie non définie";
        }
    }
    
    public function getMatchesByTeam($teamId) {
        try {
            $query = "SELECT m.*, 
                             ht.name as home_team_name, ht.city as home_team_city,
                             at.name as away_team_name, at.city as away_team_city
                      FROM matches m
                      LEFT JOIN teams ht ON m.home_team_id = ht.id
                      LEFT JOIN teams at ON m.away_team_id = at.id
                      WHERE m.home_team_id = :team_id OR m.away_team_id = :team_id
                      ORDER BY m.match_date DESC";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':team_id', $teamId);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Erreur getMatchesByTeam: " . $e->getMessage());
            return [];
        }
    }
    
    // Obtenir les matchs à venir
    public function getUpcomingMatches($limit = 10) {
        try {
            $query = "SELECT m.*, 
                             ht.name as home_team_name, ht.city as home_team_city,
                             at.name as away_team_name, at.city as away_team_city
                      FROM matches m
                      LEFT JOIN teams ht ON m.home_team_id = ht.id
                      LEFT JOIN teams at ON m.away_team_id = at.id
                      WHERE m.match_date >= NOW() AND m.status = 'scheduled'
                      ORDER BY m.match_date ASC
                      LIMIT :limit";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Erreur getUpcomingMatches: " . $e->getMessage());
            return [];
        }
    }
}

// API endpoints
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
        $controller = new MatchController();
        
        switch($_GET['action']) {
            case 'getAll':
                echo json_encode($controller->getAllMatches());
                break;
                
            case 'getOne':
                if(isset($_GET['id'])) {
                    $match = $controller->getMatch($_GET['id']);
                    echo json_encode($match);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID manquant']);
                }
                break;
                
            case 'getStrategy':
                if(isset($_GET['type'])) {
                    echo json_encode(['strategy' => $controller->getMatchStrategy($_GET['type'])]);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'Type manquant']);
                }
                break;
                
            case 'checkTeamDayAvailability':
                if(isset($_GET['team_id'], $_GET['match_date'])) {
                    $exclude_match_id = isset($_GET['exclude_match_id']) ? $_GET['exclude_match_id'] : null;
                    echo json_encode($controller->checkTeamDayAvailability($_GET['team_id'], $_GET['match_date'], $exclude_match_id));
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'team_id et match_date requis']);
                }
                break;
                
            case 'getByTeam':
                if(isset($_GET['team_id'])) {
                    echo json_encode($controller->getMatchesByTeam($_GET['team_id']));
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'team_id manquant']);
                }
                break;
                
            case 'getUpcoming':
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
                echo json_encode($controller->getUpcomingMatches($limit));
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Action non reconnue']);
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $controller = new MatchController();
        $input = file_get_contents("php://input");
        
        if (!empty($input)) {
            $data = json_decode($input, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'JSON invalide']);
                exit;
            }
        } else {
            $data = $_POST;
        }
        
        if(isset($data['action'])) {
            switch($data['action']) {
                case 'create':
                    try {
                        $result = $controller->createMatch($data);
                        echo json_encode($result);
                    } catch (Exception $e) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                    }
                    break;
                    
                case 'update':
                    if(isset($data['id'])) {
                        try {
                            $result = $controller->updateMatch($data['id'], $data);
                            echo json_encode($result);
                        } catch (Exception $e) {
                            http_response_code(400);
                            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                        }
                    } else {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'ID manquant']);
                    }
                    break;
                    
                case 'delete':
                    if(isset($data['id'])) {
                        try {
                            $result = $controller->deleteMatch($data['id']);
                            if ($result) {
                                echo json_encode(['success' => true, 'message' => 'Match supprimé avec succès']);
                            } else {
                                echo json_encode(['success' => false, 'error' => 'Erreur lors de la suppression du match']);
                            }
                        } catch (Exception $e) {
                            http_response_code(400);
                            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                        }
                    } else {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'ID manquant']);
                    }
                    break;
                    
                case 'updateScore':
                    if(isset($data['id'], $data['home_score'], $data['away_score'])) {
                        try {
                            $result = $controller->updateMatchScore($data['id'], $data['home_score'], $data['away_score']);
                            echo json_encode($result);
                        } catch (Exception $e) {
                            http_response_code(400);
                            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                        }
                    } else {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'id, home_score et away_score requis']);
                    }
                    break;
                    
                default:
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Action non reconnue']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Action manquante']);
        }
    }
} catch (Exception $e) {
    error_log("Erreur MatchController: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur']);
}
?>
