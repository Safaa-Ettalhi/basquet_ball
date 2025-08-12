-- Création de la base de données
CREATE DATABASE IF NOT EXISTS basketball_management CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE basketball_management;

-- Table : users
CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('coach','manager','analyste') NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY (username)
);

-- Table : teams
CREATE TABLE teams (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table : players
CREATE TABLE players (
  id INT NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  position ENUM('PG','SG','SF','PF','C') NOT NULL,
  jersey_number INT UNIQUE,
  height DECIMAL(3,2),
  weight DECIMAL(5,2),
  birth_date DATE,
  salary DECIMAL(10,2),
  team_id INT,
  health_status ENUM('healthy','injured','recovering') DEFAULT 'healthy',
  role ENUM('player','captain','vice_captain','rookie','veteran') DEFAULT 'player',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_player_team (team_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- Table : matches
CREATE TABLE matches (
  id INT NOT NULL AUTO_INCREMENT,
  opponent_team_id INT,
  match_date DATETIME NOT NULL,
  location VARCHAR(100),
  match_type ENUM('friendly','official') NOT NULL,
  our_score INT DEFAULT 0,
  opponent_score INT DEFAULT 0,
  status ENUM('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (opponent_team_id) REFERENCES teams(id)
);

-- Table : player_statistics
CREATE TABLE player_statistics (
  id INT NOT NULL AUTO_INCREMENT,
  player_id INT,
  match_id INT,
  points INT DEFAULT 0,
  rebounds INT DEFAULT 0,
  assists INT DEFAULT 0,
  steals INT DEFAULT 0,
  blocks INT DEFAULT 0,
  turnovers INT DEFAULT 0,
  minutes_played INT DEFAULT 0,
  field_goals_made INT DEFAULT 0,
  field_goals_attempted INT DEFAULT 0,
  three_points_made INT DEFAULT 0,
  three_points_attempted INT DEFAULT 0,
  free_throws_made INT DEFAULT 0,
  free_throws_attempted INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- Table : injuries
CREATE TABLE injuries (
  id INT NOT NULL AUTO_INCREMENT,
  player_id INT,
  injury_type ENUM('muscle','bone','joint','ligament','concussion','other') NOT NULL,
  description TEXT,
  severity ENUM('minor','moderate','major','severe') NOT NULL,
  injury_date DATE NOT NULL,
  expected_recovery_date DATE,
  actual_recovery_date DATE,
  treatment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Table : budget_items
CREATE TABLE budget_items (
  id INT NOT NULL AUTO_INCREMENT,
  category ENUM('salary','equipment','medical','travel','facility','other') NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type ENUM('income','expense') NOT NULL,
  transaction_date DATE NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Table : strategy_validations
CREATE TABLE strategy_validations (
  id INT NOT NULL AUTO_INCREMENT,
  match_id INT,
  strategy_name VARCHAR(100) NOT NULL,
  proposed_by INT,
  validated_by INT,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  validated_at TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (proposed_by) REFERENCES users(id),
  FOREIGN KEY (validated_by) REFERENCES users(id)
);

-- Table : training_types
CREATE TABLE training_types (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 60,
  PRIMARY KEY (id)
);

-- Table : trainings
CREATE TABLE trainings (
  id INT NOT NULL AUTO_INCREMENT,
  training_type_id INT,
  date DATETIME NOT NULL,
  duration_minutes INT DEFAULT 60,
  location VARCHAR(100),
  description TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (training_type_id) REFERENCES training_types(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Table : training_participants
CREATE TABLE training_participants (
  id INT NOT NULL AUTO_INCREMENT,
  training_id INT,
  player_id INT,
  attendance ENUM('present','absent','late') DEFAULT 'present',
  performance_rating INT,
  notes TEXT,
  PRIMARY KEY (id),
  FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  CHECK (performance_rating >= 1 AND performance_rating <= 10)
);
-- Migration pour supporter deux équipes dans les matchs
USE basketball_management;

-- Ajouter les nouvelles colonnes
ALTER TABLE matches 
ADD COLUMN home_team_id INT AFTER opponent_team_id,
ADD COLUMN away_team_id INT AFTER home_team_id,
ADD COLUMN home_score INT DEFAULT 0 AFTER our_score,
ADD COLUMN away_score INT DEFAULT 0 AFTER home_score;

-- Ajouter les clés étrangères
ALTER TABLE matches 
ADD FOREIGN KEY (home_team_id) REFERENCES teams(id),
ADD FOREIGN KEY (away_team_id) REFERENCES teams(id);
