<?php

require_once 'interfaces/StatisticsInterface.php';

class Statistics implements StatisticsInterface {
    private $conn;
    private $table_name = "player_statistics";
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    public function calculateAverage(array $values): float {
        if (empty($values)) {
            return 0.0;
        }
        return array_sum($values) / count($values);
    }
    
    public function getPlayerStats(int $playerId): array {
        $query = "SELECT 
                    AVG(points) as avg_points,
                    AVG(rebounds) as avg_rebounds,
                    AVG(assists) as avg_assists,
                    AVG(steals) as avg_steals,
                    AVG(blocks) as avg_blocks,
                    AVG(minutes_played) as avg_minutes,
                    SUM(field_goals_made) as total_fg_made,
                    SUM(field_goals_attempted) as total_fg_attempted,
                    SUM(three_points_made) as total_3p_made,
                    SUM(three_points_attempted) as total_3p_attempted,
                    COUNT(*) as games_played
                  FROM " . $this->table_name . "
                  WHERE player_id = :player_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":player_id", $playerId);
        $stmt->execute();
        
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Calcul des pourcentages
        if ($stats['total_fg_attempted'] > 0) {
            $stats['fg_percentage'] = ($stats['total_fg_made'] / $stats['total_fg_attempted']) * 100;
        } else {
            $stats['fg_percentage'] = 0;
        }
        
        if ($stats['total_3p_attempted'] > 0) {
            $stats['three_point_percentage'] = ($stats['total_3p_made'] / $stats['total_3p_attempted']) * 100;
        } else {
            $stats['three_point_percentage'] = 0;
        }
        
        return $stats;
    }
    
    public function getMatchStats(int $matchId): array {
        $query = "SELECT 
                    ps.*,
                    p.first_name,
                    p.last_name,
                    p.position
                  FROM " . $this->table_name . " ps
                  JOIN players p ON ps.player_id = p.id
                  WHERE ps.match_id = :match_id
                  ORDER BY ps.points DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":match_id", $matchId);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function addPlayerMatchStats(array $data) {
        try {
           
            $defaults = [
                'steals' => 0,
                'blocks' => 0,
                'turnovers' => 0,
                'minutes_played' => 0,
                'field_goals_made' => 0,
                'field_goals_attempted' => 0,
                'three_points_made' => 0,
                'three_points_attempted' => 0,
                'free_throws_made' => 0,
                'free_throws_attempted' => 0
            ];
            
            
            $data = array_merge($defaults, $data);
            
            $query = "INSERT INTO " . $this->table_name . "
                      SET player_id=:player_id, match_id=:match_id,
                          points=:points, rebounds=:rebounds, assists=:assists,
                          steals=:steals, blocks=:blocks, turnovers=:turnovers,
                          minutes_played=:minutes_played, field_goals_made=:field_goals_made,
                          field_goals_attempted=:field_goals_attempted,
                          three_points_made=:three_points_made,
                          three_points_attempted=:three_points_attempted,
                          free_throws_made=:free_throws_made,
                          free_throws_attempted=:free_throws_attempted";
            
            $stmt = $this->conn->prepare($query);
            
           
            $stmt->bindValue(":player_id", (int)$data['player_id'], PDO::PARAM_INT);
            $stmt->bindValue(":match_id", (int)$data['match_id'], PDO::PARAM_INT);
            $stmt->bindValue(":points", (int)$data['points'], PDO::PARAM_INT);
            $stmt->bindValue(":rebounds", (int)$data['rebounds'], PDO::PARAM_INT);
            $stmt->bindValue(":assists", (int)$data['assists'], PDO::PARAM_INT);
            $stmt->bindValue(":steals", (int)$data['steals'], PDO::PARAM_INT);
            $stmt->bindValue(":blocks", (int)$data['blocks'], PDO::PARAM_INT);
            $stmt->bindValue(":turnovers", (int)$data['turnovers'], PDO::PARAM_INT);
            $stmt->bindValue(":minutes_played", (int)$data['minutes_played'], PDO::PARAM_INT);
            $stmt->bindValue(":field_goals_made", (int)$data['field_goals_made'], PDO::PARAM_INT);
            $stmt->bindValue(":field_goals_attempted", (int)$data['field_goals_attempted'], PDO::PARAM_INT);
            $stmt->bindValue(":three_points_made", (int)$data['three_points_made'], PDO::PARAM_INT);
            $stmt->bindValue(":three_points_attempted", (int)$data['three_points_attempted'], PDO::PARAM_INT);
            $stmt->bindValue(":free_throws_made", (int)$data['free_throws_made'], PDO::PARAM_INT);
            $stmt->bindValue(":free_throws_attempted", (int)$data['free_throws_attempted'], PDO::PARAM_INT);
            
            $result = $stmt->execute();
            
            if (!$result) {
                $errorInfo = $stmt->errorInfo();
                throw new Exception("Erreur SQL: " . $errorInfo[2]);
            }
            
            return $result;
            
        } catch (PDOException $e) {
            error_log("Erreur PDO dans addPlayerMatchStats: " . $e->getMessage());
            throw new Exception("Erreur de base de données: " . $e->getMessage());
        } catch (Exception $e) {
            error_log("Erreur dans addPlayerMatchStats: " . $e->getMessage());
            throw $e;
        }
    }
}
?>
