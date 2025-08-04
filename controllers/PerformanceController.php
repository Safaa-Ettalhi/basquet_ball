<?php

require_once '../config/Database.php';

class PerformanceController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    public function getPlayerPerformanceAnalysis($playerId) {
        try {
            $query = "SELECT 
                        p.first_name, p.last_name, p.position, p.role,
                        AVG(ps.points) as avg_points,
                        AVG(ps.rebounds) as avg_rebounds,
                        AVG(ps.assists) as avg_assists,
                        AVG(ps.steals) as avg_steals,
                        AVG(ps.blocks) as avg_blocks,
                        AVG(ps.minutes_played) as avg_minutes,
                        COUNT(ps.id) as games_played,
                        SUM(ps.field_goals_made) as total_fg_made,
                        SUM(ps.field_goals_attempted) as total_fg_attempted,
                        SUM(ps.three_points_made) as total_3p_made,
                        SUM(ps.three_points_attempted) as total_3p_attempted
                      FROM players p
                      LEFT JOIN player_statistics ps ON p.id = ps.player_id
                      WHERE p.id = :player_id
                      GROUP BY p.id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':player_id', $playerId);
            $stmt->execute();
            
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($stats) {
                // Calcul des pourcentages et évaluations
                $stats['fg_percentage'] = $stats['total_fg_attempted'] > 0 ? 
                    ($stats['total_fg_made'] / $stats['total_fg_attempted']) * 100 : 0;
                
                $stats['three_point_percentage'] = $stats['total_3p_attempted'] > 0 ? 
                    ($stats['total_3p_made'] / $stats['total_3p_attempted']) * 100 : 0;
                
                // Évaluation de performance
                $stats['performance_rating'] = $this->calculatePerformanceRating($stats);
                $stats['strengths'] = $this->identifyStrengths($stats);
                $stats['weaknesses'] = $this->identifyWeaknesses($stats);
                $stats['recommendations'] = $this->generateRecommendations($stats);
            }
            
            return $stats ?: [];
        } catch (Exception $e) {
            error_log("Erreur getPlayerPerformanceAnalysis: " . $e->getMessage());
            return [];
        }
    }
    
    public function getTeamPerformanceOverview() {
        try {
            $query = "SELECT 
                        p.id, p.first_name, p.last_name, p.position,
                        AVG(ps.points) as avg_points,
                        AVG(ps.rebounds) as avg_rebounds,
                        AVG(ps.assists) as avg_assists,
                        COUNT(ps.id) as games_played
                      FROM players p
                      LEFT JOIN player_statistics ps ON p.id = ps.player_id
                      WHERE p.health_status = 'healthy'
                      GROUP BY p.id
                      ORDER BY avg_points DESC";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Erreur getTeamPerformanceOverview: " . $e->getMessage());
            return [];
        }
    }
    
    public function getMatchPerformanceAnalysis($matchId) {
        try {
            $query = "SELECT 
                        ps.*, p.first_name, p.last_name, p.position,
                        m.match_date, m.our_score, m.opponent_score,
                        t.name as opponent_name
                      FROM player_statistics ps
                      JOIN players p ON ps.player_id = p.id
                      JOIN matches m ON ps.match_id = m.id
                      LEFT JOIN teams t ON m.opponent_team_id = t.id
                      WHERE ps.match_id = :match_id
                      ORDER BY ps.points DESC";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':match_id', $matchId);
            $stmt->execute();
            
            $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            
            foreach ($stats as &$stat) {
                $stat['efficiency'] = $this->calculatePlayerEfficiency($stat);
                $stat['performance_grade'] = $this->getPerformanceGrade($stat);
            }
            
            return $stats;
        } catch (Exception $e) {
            error_log("Erreur getMatchPerformanceAnalysis: " . $e->getMessage());
            return [];
        }
    }
    
    private function calculatePerformanceRating($stats) {
        $rating = 0;
        
        // Points (30%)
        $rating += ($stats['avg_points'] / 25) * 30;
        
        // Rebonds (20%)
        $rating += ($stats['avg_rebounds'] / 10) * 20;
        
        // Passes (20%)
        $rating += ($stats['avg_assists'] / 8) * 20;
        
        // Efficacité aux tirs (20%)
        $rating += ($stats['fg_percentage'] / 50) * 20;
        
        // Régularité (10%)
        $rating += ($stats['games_played'] / 20) * 10;
        
        return min(100, max(0, $rating));
    }
    
    private function identifyStrengths($stats) {
        $strengths = [];
        
        if ($stats['avg_points'] > 15) $strengths[] = "Excellent marqueur";
        if ($stats['avg_rebounds'] > 8) $strengths[] = "Dominant au rebond";
        if ($stats['avg_assists'] > 6) $strengths[] = "Excellent passeur";
        if ($stats['fg_percentage'] > 45) $strengths[] = "Très efficace aux tirs";
        if ($stats['three_point_percentage'] > 35) $strengths[] = "Bon tireur à 3 points";
        if ($stats['games_played'] > 20) $strengths[] = "Joueur régulier et fiable";
        if ($stats['avg_minutes'] > 30) $strengths[] = "Joueur endurant et capable de jouer de longues minutes";
        if ($stats['avg_steals'] > 2) $strengths[] = "Bonne défense avec de nombreux interceptions";
        if ($stats['avg_blocks'] > 1) $strengths[] = "Bonne présence défensive avec des contres";
        if ($stats['performance_rating'] > 80) $strengths[] = "Performance globale exceptionnelle";
    
        if(empty($strengths)) {
            $strengths[] = "Aucune force particulière identifiée";
        }
        return $strengths;
    }
    
    private function identifyWeaknesses($stats) {
        $weaknesses = [];
        
        if ($stats['avg_points'] < 8) $weaknesses[] = "Manque d'efficacité offensive";
        if ($stats['avg_rebounds'] < 4) $weaknesses[] = "Faible au rebond";
        if ($stats['fg_percentage'] < 40) $weaknesses[] = "Efficacité aux tirs à améliorer";
        if ($stats['games_played'] < 10) $weaknesses[] = "Manque de régularité";
        if ($stats['avg_assists'] < 2) $weaknesses[] = "Peu de passes décisives";
        if (empty($weaknesses)) {
            $weaknesses[] = "Aucune faiblesse particulière identifiée";
        }
        return $weaknesses;
    }
    
    private function generateRecommendations($stats) {
        $recommendations = [];
        
        if ($stats['fg_percentage'] < 42) {
            $recommendations[] = "Travailler la précision aux tirs lors des entraînements";
        }
        
        if ($stats['avg_rebounds'] < 5) {
            $recommendations[] = "Améliorer le positionnement pour les rebonds";
        }
        
        if ($stats['avg_assists'] < 3) {
            $recommendations[] = "Développer la vision de jeu et les passes";
        }
         if (empty($recommendations)) {
        $recommendations[] = "Aucune recommandation pour le moment";
    }
        return $recommendations;
    }
    
    private function calculatePlayerEfficiency($stat) {
        return ($stat['points'] + $stat['rebounds'] + $stat['assists'] + $stat['steals'] + $stat['blocks']) - 
               ($stat['turnovers'] + ($stat['field_goals_attempted'] - $stat['field_goals_made']));
    }
    
    private function getPerformanceGrade($stat) {
        $efficiency = $this->calculatePlayerEfficiency($stat);
        
        if ($efficiency >= 20) return 'A+';
        if ($efficiency >= 15) return 'A';
        if ($efficiency >= 10) return 'B+';
        if ($efficiency >= 5) return 'B';
        if ($efficiency >= 0) return 'C';
        return 'D';
    }
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// API endpoints
try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
        $controller = new PerformanceController();
        
        switch($_GET['action']) {
            case 'getPlayerAnalysis':
                if(isset($_GET['player_id'])) {
                    $result = $controller->getPlayerPerformanceAnalysis($_GET['player_id']);
                    header('Content-Type: application/json');
                    echo json_encode($result);
                } else {
                    header('Content-Type: application/json');
                    echo json_encode(['error' => 'player_id manquant']);
                }
                break;
                
            case 'getTeamOverview':
                $result = $controller->getTeamPerformanceOverview();
                header('Content-Type: application/json');
                echo json_encode($result);
                break;
                
            case 'getMatchAnalysis':
                if(isset($_GET['match_id'])) {
                    $result = $controller->getMatchPerformanceAnalysis($_GET['match_id']);
                    header('Content-Type: application/json');
                    echo json_encode($result);
                } else {
                    header('Content-Type: application/json');
                    echo json_encode(['error' => 'match_id manquant']);
                }
                break;
                
            default:
                header('Content-Type: application/json');
                echo json_encode(['error' => 'Action non reconnue']);
        }
    }
} catch (Exception $e) {
    error_log("Erreur PerformanceController: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Erreur serveur']);
}
?>
