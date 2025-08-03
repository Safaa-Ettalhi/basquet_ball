<?php

interface TeamInterface {
    public function create();
    public function readAll();
    public function readOne();
    public function update();
    public function delete();
    public function assignPlayers($playerIds);
    public function getTeamPlayers();
}
?>
