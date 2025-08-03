<?php

interface TrainingInterface {
    public function scheduleTraining(array $data): bool;
    public function getTrainingsByDate(string $date): array;
    public function addParticipant(int $trainingId, int $playerId): bool;
}
?>
