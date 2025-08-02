<?php

interface StatisticsInterface {
    public function calculateAverage(array $values): float;
    public function getPlayerStats(int $playerId): array;
    public function getMatchStats(int $matchId): array;
}
?>
