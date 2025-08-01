<?php

require_once '../config/Database.php';

class AuthController {
    private $db;
    private $table_name = "users";
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function createAccount($username, $password, $email, $role) {
        $query = "INSERT INTO " . $this->table_name . " (username, password, email, role) VALUES (:username, :password, :email, :role)";
        $checkQuery = "SELECT id FROM " . $this->table_name . " WHERE username = :username";
        $checkStmt = $this->db->prepare($checkQuery);
        $checkStmt->bindParam(":username", $username);
        $checkStmt->execute();
        if($checkStmt->rowCount() > 0) {
            return false;
        }
            if(empty($username) || empty($password) || empty($email) || empty($role)) {
                return false; 
            }

        
        $stmt = $this->db->prepare($query);
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $stmt->bindParam(":username", $username);
        $stmt->bindParam(":password", $hashedPassword);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":role", $role);
        
        if($stmt->execute()) {
            return true;
        }
        
        return false;
    }
    
    public function login($username, $password) {
        $query = "SELECT id, username, role, email FROM " . $this->table_name . " 
                  WHERE username = :username AND password = :password";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":username", $username);
        $stmt->bindParam(":password", $password);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($user) {
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['email'] = $user['email'];
            return $user;
        }
        
        return false;
    }
    
    public function logout() {
        session_start();
        session_destroy();
        return true;
    }
    
    public function isLoggedIn() {
        session_start();
        return isset($_SESSION['user_id']);
    }
    
    public function getCurrentUser() {
        session_start();
        if(isset($_SESSION['user_id'])) {
            return [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'role' => $_SESSION['role'],
                'email' => $_SESSION['email']
            ];
        }
        return null;
    }

    public function getAllUsers() {
        $query = "SELECT id, username, role, email FROM " . $this->table_name;
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
       public function updateAccount($id, $username, $email, $role) {
      
        $checkQuery = "SELECT id FROM " . $this->table_name . " WHERE username = :username AND id != :id";
        $checkStmt = $this->db->prepare($checkQuery);
        $checkStmt->bindParam(":username", $username);
        $checkStmt->bindParam(":id", $id);
        $checkStmt->execute();
        
        if($checkStmt->rowCount() > 0) {
            return false; 
        }

        $query = "UPDATE " . $this->table_name . " SET username = :username, email = :email, role = :role WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":username", $username);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":role", $role);
        $stmt->bindParam(":id", $id);
        
        return $stmt->execute();
    }

    public function deleteAccount($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":id", $id);
        
        return $stmt->execute();
    }
}

// API endpoints
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $auth = new AuthController();
    $data = json_decode(file_get_contents("php://input"), true);
    
    if(isset($data['action'])) {
        switch($data['action']) {
            case 'login':
                if(isset($data['username'], $data['password'])) {
                    $user = $auth->login($data['username'], $data['password']);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $user !== false, 'user' => $user]);
                }
                break;
                
            case 'logout':
                $result = $auth->logout();
                header('Content-Type: application/json');
                echo json_encode(['success' => $result]);
                break;

            case 'createAccount':
                if(isset($data['username'], $data['password'], $data['email'], $data['role'])) {
                    $result = $auth->createAccount($data['username'], $data['password'], $data['email'], $data['role']);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                } else {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'Missing parameters']);
                }
                break;
             case 'updateAccount':
            if(isset($data['id'], $data['username'], $data['email'], $data['role'])) {
                $result = $auth->updateAccount($data['id'], $data['username'], $data['email'], $data['role']);
                header('Content-Type: application/json');
                echo json_encode(['success' => $result]);
            } else {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'error' => 'Paramètres manquants']);
            }
            break;
            case 'deleteAccount':
            if(isset($data['id'])) {
                $result = $auth->deleteAccount($data['id']);
                header('Content-Type: application/json');
                echo json_encode(['success' => $result]);
            } else {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'error' => 'ID manquant']);
            }
            break;
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $auth = new AuthController();
    
    switch($_GET['action']) {
        case 'getCurrentUser':
            header('Content-Type: application/json');
            echo json_encode($auth->getCurrentUser());
            break;
            
        case 'checkAuth':
            header('Content-Type: application/json');
            echo json_encode(['authenticated' => $auth->isLoggedIn()]);
            break;

            case 'getAllUsers':
                if (true)
                {
                    $users = $auth->getAllUsers();
                    header('Content-Type: application/json');
                    echo json_encode(['success' => true, 'users' => $users]);
                } else {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                }
                break;
    }
}
?>
