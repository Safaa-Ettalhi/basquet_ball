<?php

interface PlayerInterface {
    public function getId(): int;
    public function getFullName(): string;
    public function getPosition(): string;
    public function getHealthStatus(): string;
    public function updateHealthStatus(string $status): bool;
}
?>
