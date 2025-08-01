-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: basketball_management
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `budget_items`
--

DROP TABLE IF EXISTS `budget_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` enum('salary','equipment','medical','travel','facility','other') NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `transaction_type` enum('income','expense') NOT NULL,
  `transaction_date` date NOT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `budget_items_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget_items`
--

LOCK TABLES `budget_items` WRITE;
/*!40000 ALTER TABLE `budget_items` DISABLE KEYS */;
INSERT INTO `budget_items` VALUES (1,'medical','Adipisicing amet esjk',31.04,'income','2019-01-31',1,'2025-07-22 00:00:07'),(2,'medical','Odit nihil non exerc',32.99,'expense','1993-08-22',2,'2025-07-22 01:09:00'),(5,'facility','Numquam non nostrum ',65.00,'income','1994-02-19',2,'2025-07-22 02:11:30');
/*!40000 ALTER TABLE `budget_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `injuries`
--

DROP TABLE IF EXISTS `injuries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `injuries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `player_id` int DEFAULT NULL,
  `injury_type` enum('muscle','bone','joint','ligament','concussion','other') NOT NULL,
  `description` text,
  `severity` enum('minor','moderate','major','severe') NOT NULL,
  `injury_date` date NOT NULL,
  `expected_recovery_date` date DEFAULT NULL,
  `actual_recovery_date` date DEFAULT NULL,
  `treatment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `player_id` (`player_id`),
  CONSTRAINT `injuries_ibfk_1` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `injuries`
--

LOCK TABLES `injuries` WRITE;
/*!40000 ALTER TABLE `injuries` DISABLE KEYS */;
INSERT INTO `injuries` VALUES (1,3,'joint','Corporis et minima p','severe','1983-06-02','1973-10-11','2025-07-22','Ut nisi eveniet nul','2025-07-22 00:02:01'),(2,3,'bone','Modi ut cumque qui u ','severe','2018-07-31','2016-11-08','2025-07-22','Et accusamus tempore','2025-07-22 00:02:16'),(4,4,'bone','Reiciendis sed dolor','severe','1983-10-26','2005-05-27','2025-07-22','Eligendi vel incidun','2025-07-22 03:11:34'),(5,4,'muscle','hv','minor','2025-07-23','2025-07-24',NULL,'hgv ','2025-07-23 22:55:28'),(6,4,'muscle','hv','minor','2025-07-23','2025-07-25',NULL,'hv','2025-07-23 22:55:51');
/*!40000 ALTER TABLE `injuries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matches`
--

DROP TABLE IF EXISTS `matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `opponent_team_id` int DEFAULT NULL,
  `match_date` datetime NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `match_type` enum('friendly','official') NOT NULL,
  `our_score` int DEFAULT '0',
  `opponent_score` int DEFAULT '0',
  `status` enum('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `opponent_team_id` (`opponent_team_id`),
  CONSTRAINT `matches_ibfk_1` FOREIGN KEY (`opponent_team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matches`
--

LOCK TABLES `matches` WRITE;
/*!40000 ALTER TABLE `matches` DISABLE KEYS */;
INSERT INTO `matches` VALUES (2,2,'2025-01-28 20:30:00','Away Arena','official',0,0,'scheduled','2025-07-21 23:26:31'),(3,3,'2025-02-01 18:00:00','Home Arena','friendly',2,1,'completed','2025-07-21 23:26:31'),(6,3,'2000-08-08 09:11:00','Enim ut necessitatibHJ','official',1,1,'completed','2025-07-22 01:35:01'),(7,5,'2025-08-01 03:07:00','jkb','friendly',0,0,'scheduled','2025-07-22 02:09:55'),(8,3,'2020-04-16 12:56:00','Temporibus rerum tem','official',1,1,'completed','2025-07-22 03:02:01');
/*!40000 ALTER TABLE `matches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player_statistics`
--

DROP TABLE IF EXISTS `player_statistics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_statistics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `player_id` int DEFAULT NULL,
  `match_id` int DEFAULT NULL,
  `points` int DEFAULT '0',
  `rebounds` int DEFAULT '0',
  `assists` int DEFAULT '0',
  `steals` int DEFAULT '0',
  `blocks` int DEFAULT '0',
  `turnovers` int DEFAULT '0',
  `minutes_played` int DEFAULT '0',
  `field_goals_made` int DEFAULT '0',
  `field_goals_attempted` int DEFAULT '0',
  `three_points_made` int DEFAULT '0',
  `three_points_attempted` int DEFAULT '0',
  `free_throws_made` int DEFAULT '0',
  `free_throws_attempted` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `player_id` (`player_id`),
  KEY `match_id` (`match_id`),
  CONSTRAINT `player_statistics_ibfk_1` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  CONSTRAINT `player_statistics_ibfk_2` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_statistics`
--

LOCK TABLES `player_statistics` WRITE;
/*!40000 ALTER TABLE `player_statistics` DISABLE KEYS */;
INSERT INTO `player_statistics` VALUES (30,4,6,99,90,14,39,100,17,43,30,41,30,56,99,100,'2025-07-24 02:20:21'),(31,35,3,2,2,2,3,2,2,11,1,2,2,3,1,2,'2025-07-26 03:07:21'),(32,8,3,1,2,2,3,2,4,2,2,4,2,3,1,3,'2025-07-27 22:10:30');
/*!40000 ALTER TABLE `player_statistics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `players`
--

DROP TABLE IF EXISTS `players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `players` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `position` enum('PG','SG','SF','PF','C') NOT NULL,
  `jersey_number` int DEFAULT NULL,
  `height` decimal(3,2) DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `team_id` int DEFAULT NULL,
  `health_status` enum('healthy','injured','recovering') DEFAULT 'healthy',
  `role` enum('player','captain','vice_captain','rookie','veteran') DEFAULT 'player',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `jersey_number` (`jersey_number`),
  KEY `idx_player_team` (`team_id`),
  CONSTRAINT `fk_player_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `players`
--

LOCK TABLES `players` WRITE;
/*!40000 ALTER TABLE `players` DISABLE KEYS */;
INSERT INTO `players` VALUES (1,'LeBron','James','SF',23,1.60,113.40,'1984-12-30',450.00,NULL,'injured','captain','2025-07-21 23:26:20'),(2,'Stephen','Curry','PG',30,1.91,84.80,'1988-03-14',48000.00,NULL,'healthy','vice_captain','2025-07-21 23:26:20'),(3,'Kevin','Durant','SF',35,2.11,108.90,'1988-09-29',42000000.00,21,'healthy','veteran','2025-07-21 23:26:20'),(4,'Giannis','Antetokounmpo','PF',34,2.10,109.70,'1994-12-06',4500.00,NULL,'injured','rookie','2025-07-21 23:26:20'),(6,'Randall','Gallegos','SF',9,1.50,80.00,'2005-03-06',25.00,NULL,'healthy','player','2025-07-21 23:56:13'),(7,'Brielle','Clemons','PG',55,2.00,108.00,'2019-09-28',50.00,NULL,'healthy','player','2025-07-21 23:56:33'),(8,'Hammett','Calhoun','PF',43,2.00,193.00,'1975-06-22',32.00,21,'healthy','captain','2025-07-22 00:44:22'),(27,'Alexa','Frazier','PG',86,2.00,83.00,'1976-12-23',82.00,NULL,'healthy','rookie','2025-07-22 01:26:54'),(30,'Melvin','Franks','SG',28,2.00,188.00,'1975-08-01',79.00,NULL,'healthy','rookie','2025-07-22 01:49:07'),(31,'safaa','et','PG',2,1.70,56.00,'2005-02-02',23.00,NULL,'healthy','player','2025-07-22 01:59:51'),(34,'Isaiah','Nielsen','PG',91,1.99,117.90,'2002-01-11',70.00,NULL,'healthy','veteran','2025-07-22 03:01:34'),(35,'Remedios','Gallegos','SG',20,2.00,156.00,'1979-01-09',22.00,NULL,'healthy','rookie','2025-07-22 03:10:11');
/*!40000 ALTER TABLE `players` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `strategy_validations`
--

DROP TABLE IF EXISTS `strategy_validations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `strategy_validations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `match_id` int DEFAULT NULL,
  `strategy_name` varchar(100) NOT NULL,
  `proposed_by` int DEFAULT NULL,
  `validated_by` int DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `comments` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `validated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `match_id` (`match_id`),
  KEY `proposed_by` (`proposed_by`),
  KEY `validated_by` (`validated_by`),
  CONSTRAINT `strategy_validations_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `strategy_validations_ibfk_2` FOREIGN KEY (`proposed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `strategy_validations_ibfk_3` FOREIGN KEY (`validated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `strategy_validations`
--

LOCK TABLES `strategy_validations` WRITE;
/*!40000 ALTER TABLE `strategy_validations` DISABLE KEYS */;
INSERT INTO `strategy_validations` VALUES (2,2,'Stratégie défensive',1,NULL,'approved','Approuvé par le manager','2025-07-21 23:28:09',NULL),(3,3,'Jeu rapide',1,2,'rejected','','2025-07-21 23:28:09','2025-07-22 03:04:39'),(5,2,'Ferdinand Pugh',1,2,'approved','hjv ','2025-07-22 01:25:10','2025-07-22 01:40:00'),(6,2,'zertyui,;',1,2,'rejected','gv;','2025-07-22 01:39:16','2025-07-22 01:39:54'),(8,7,'kk',1,2,'rejected','bjk','2025-07-22 02:10:21','2025-07-22 02:11:07'),(9,7,'tes',1,2,'approved','b','2025-07-22 02:57:18','2025-07-22 03:04:35'),(11,7,'bj',1,NULL,'pending',';n','2025-07-27 23:00:02',NULL);
/*!40000 ALTER TABLE `strategy_validations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `city` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES (1,'Lakers','Los Angeles','2025-07-21 23:26:24'),(2,'Warriors','San Francisco','2025-07-21 23:26:24'),(3,'Celtics','Boston','2025-07-21 23:26:24'),(4,'Heat','Miami','2025-07-21 23:26:24'),(5,'Nets','Brooklyn','2025-07-21 23:26:24'),(21,'sf','sfk','2025-07-26 02:56:29');
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `training_participants`
--

DROP TABLE IF EXISTS `training_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `training_participants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `training_id` int DEFAULT NULL,
  `player_id` int DEFAULT NULL,
  `attendance` enum('present','absent','late') DEFAULT 'present',
  `performance_rating` int DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `training_id` (`training_id`),
  KEY `player_id` (`player_id`),
  CONSTRAINT `training_participants_ibfk_1` FOREIGN KEY (`training_id`) REFERENCES `trainings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `training_participants_ibfk_2` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  CONSTRAINT `training_participants_chk_1` CHECK (((`performance_rating` >= 1) and (`performance_rating` <= 10)))
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `training_participants`
--

LOCK TABLES `training_participants` WRITE;
/*!40000 ALTER TABLE `training_participants` DISABLE KEYS */;
INSERT INTO `training_participants` VALUES (1,2,8,'present',NULL,NULL),(2,2,7,'present',NULL,NULL),(22,13,31,'present',NULL,NULL);
/*!40000 ALTER TABLE `training_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `training_types`
--

DROP TABLE IF EXISTS `training_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `training_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  `duration_minutes` int DEFAULT '60',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `training_types`
--

LOCK TABLES `training_types` WRITE;
/*!40000 ALTER TABLE `training_types` DISABLE KEYS */;
INSERT INTO `training_types` VALUES (1,'Cardio','Entraînement cardiovasculaire',45),(2,'Technique','Travail technique individuel',90),(3,'Tactique','Entraînement tactique collectif',120),(4,'Musculation','Renforcement musculaire',60),(5,'Tirs','Entraînement aux tirs',75);
/*!40000 ALTER TABLE `training_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trainings`
--

DROP TABLE IF EXISTS `trainings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trainings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `training_type_id` int DEFAULT NULL,
  `date` datetime NOT NULL,
  `duration_minutes` int DEFAULT '60',
  `location` varchar(100) DEFAULT NULL,
  `description` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `training_type_id` (`training_type_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `trainings_ibfk_1` FOREIGN KEY (`training_type_id`) REFERENCES `training_types` (`id`),
  CONSTRAINT `trainings_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trainings`
--

LOCK TABLES `trainings` WRITE;
/*!40000 ALTER TABLE `trainings` DISABLE KEYS */;
INSERT INTO `trainings` VALUES (1,2,'2012-01-17 22:54:00',132,'Voluptate dolor faci','Cillum saepe cupida',1,'2025-07-21 23:59:34'),(2,2,'1995-10-26 01:09:00',180,'Et laborum fugiat o','Aperiam voluptates u',1,'2025-07-22 00:53:16'),(3,4,'2025-07-19 03:00:00',60,'casa','lkas',1,'2025-07-22 02:00:35'),(9,1,'2025-01-20 10:00:00',45,'Salle principale','Entraînement cardio matinal',1,'2025-07-23 23:45:41'),(10,2,'2025-01-21 14:00:00',90,'Terrain A','Travail technique individuel',1,'2025-07-23 23:45:41'),(11,3,'2025-01-22 16:00:00',120,'Terrain principal','Tactique pour le prochain match',1,'2025-07-23 23:45:41'),(13,1,'2025-07-23 17:12:00',60,'jkq','j',1,'2025-07-28 16:12:52');
/*!40000 ALTER TABLE `trainings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('coach','manager','analyste') NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'coach_john','password','coach','coach@team.com','2025-07-21 23:26:16'),(2,'manager_sarah','password','manager','manager@team.com','2025-07-21 23:26:16'),(3,'analyst_mike','password','analyste','analyst@team.com','2025-07-21 23:26:16'),(9,'qinikuh','$2y$10$L2odAYBx87h4Kd877PesY.blcwz407KSXch0kXrvr04xQG7GEElh.','manager','batefov@mailinator.com','2025-07-27 19:24:29');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'basketball_management'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-28 20:22:46
