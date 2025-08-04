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
    
    public function getAllBudgetItems() {
        $stmt = $this->budget->readAll();
        $items = array();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $items[] = $row;
        }
        
        return $items;
    }
    
    public function getBudgetItem($id) {
        $query = "SELECT b.*, u.username as created_by_name
                  FROM budget_items b
                  LEFT JOIN users u ON b.created_by = u.id
                  WHERE b.id = :id";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function getBudgetSummary() {
        return $this->budget->getTotalBudget();
    }
    
    public function createBudgetItem($data) {
        $this->budget->category = $data['category'];
        $this->budget->description = $data['description'];
        $this->budget->amount = $data['amount'];
        $this->budget->transaction_type = $data['transaction_type'];
        $this->budget->transaction_date = $data['transaction_date'];
        $this->budget->created_by = $data['created_by'];
        
        return $this->budget->create();
    }
    
    public function updateBudgetItem($id, $data) {
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
    }
    
    public function deleteBudgetItem($id) {
        $query = "DELETE FROM budget_items WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }
}

// API endpoints
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $controller = new BudgetController();
    
    switch($_GET['action']) {
        case 'getAll':
            header('Content-Type: application/json');
            echo json_encode($controller->getAllBudgetItems());
            break;
            
        case 'getOne':
            if(isset($_GET['id'])) {
                header('Content-Type: application/json');
                echo json_encode($controller->getBudgetItem($_GET['id']));
            }
            break;
            
        case 'getSummary':
            header('Content-Type: application/json');
            echo json_encode($controller->getBudgetSummary());
            break;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller = new BudgetController();
    $data = json_decode(file_get_contents("php://input"), true);
    
    if(isset($data['action'])) {
        switch($data['action']) {
            case 'create':
                $result = $controller->createBudgetItem($data);
                header('Content-Type: application/json');
                echo json_encode(['success' => $result]);
                break;
                
            case 'update':
                if(isset($data['id'])) {
                    $result = $controller->updateBudgetItem($data['id'], $data);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                }
                break;
                
            case 'delete':
                if(isset($data['id'])) {
                    $result = $controller->deleteBudgetItem($data['id']);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => $result]);
                }
                break;
        }
    }
}
?>
