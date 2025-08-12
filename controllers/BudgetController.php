<?php

require_once '../config/Database.php';
require_once '../models/Budget.php';

class BudgetController {
    private $db;
    private $budget;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->budget = new Budget($this->db);
    }
    
    private function validateAmount($amount) {
        if (!is_numeric($amount) || $amount < 0) {
            throw new Exception("Le montant doit être un nombre positif");
        }
    }

    private function validateBudgetData($data) {
        $required = ['category', 'description', 'amount', 'transaction_type'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("Le champ $field est requis");
            }
        }
        
        $this->validateAmount($data['amount']);
        
        $validTypes = ['income', 'expense'];
        if (!in_array($data['transaction_type'], $validTypes)) {
            throw new Exception("Type de transaction invalide. Valeurs acceptées: " . implode(', ', $validTypes));
        }
    }
    
    public function getAllBudgetItems() {
        try {
            $stmt = $this->budget->readAll();
            $items = array();
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $items[] = $row;
            }
            
            return $items;
        } catch (Exception $e) {
            error_log("Erreur getAllBudgetItems: " . $e->getMessage());
            return [];
        }
    }
    
    public function getBudgetItem($id) {
        try {
            $query = "SELECT b.*, u.username as created_by_name
                      FROM budget_items b
                      LEFT JOIN users u ON b.created_by = u.id
                      WHERE b.id = :id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(":id", $id);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Erreur getBudgetItem: " . $e->getMessage());
            return null;
        }
    }
    
    public function getBudgetSummary() {
        try {
            return $this->budget->getTotalBudget();
        } catch (Exception $e) {
            error_log("Erreur getBudgetSummary: " . $e->getMessage());
            return [];
        }
    }
    
    public function createBudgetItem($data) {
        try {
            $this->validateBudgetData($data);
            
            $this->budget->category = $data['category'];
            $this->budget->description = $data['description'];
            $this->budget->amount = $data['amount'];
            $this->budget->transaction_type = $data['transaction_type'];
            $this->budget->transaction_date = $data['transaction_date'] ?? date('Y-m-d');
            $this->budget->created_by = $data['created_by'] ?? 1;
            
            return $this->budget->create();
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    public function updateBudgetItem($id, $data) {
        try {
            $existing = $this->getBudgetItem($id);
            if (!$existing) {
                throw new Exception("Élément de budget introuvable");
            }
            
            $this->validateBudgetData($data);
            
            $query = "UPDATE budget_items 
                      SET category=:category, description=:description,
                          amount=:amount, transaction_type=:transaction_type,
                          transaction_date=:transaction_date
                      WHERE id=:id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':category', $data['category']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':amount', $data['amount']);
            $stmt->bindParam(':transaction_type', $data['transaction_type']);
            $stmt->bindParam(':transaction_date', $data['transaction_date']);
            $stmt->bindParam(':id', $id);
            
            return $stmt->execute();
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    public function deleteBudgetItem($id) {
        try {
            $query = "DELETE FROM budget_items WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id);
            
            return $stmt->execute();
        } catch (Exception $e) {
            throw $e;
        }
    }
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
        $controller = new BudgetController();
        
        switch($_GET['action']) {
            case 'getAll':
                echo json_encode($controller->getAllBudgetItems());
                break;
                
            case 'getOne':
                if(isset($_GET['id'])) {
                    echo json_encode($controller->getBudgetItem($_GET['id']));
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID manquant']);
                }
                break;
                
            case 'getSummary':
                echo json_encode($controller->getBudgetSummary());
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Action non reconnue']);
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $controller = new BudgetController();
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'JSON invalide']);
            exit;
        }
        
        if(isset($data['action'])) {
            switch($data['action']) {
                case 'create':
                    try {
                        $result = $controller->createBudgetItem($data);
                        echo json_encode(['success' => $result]);
                    } catch (Exception $e) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                    }
                    break;
                    
                case 'update':
                    if(isset($data['id'])) {
                        try {
                            $result = $controller->updateBudgetItem($data['id'], $data);
                            echo json_encode(['success' => $result]);
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
                            $result = $controller->deleteBudgetItem($data['id']);
                            echo json_encode(['success' => $result]);
                        } catch (Exception $e) {
                            http_response_code(400);
                            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                        }
                    } else {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'ID manquant']);
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
    error_log("Erreur BudgetController: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur']);
}
?>
