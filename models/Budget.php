<?php

class Budget {
    private $conn;
    private $table_name = "budget_items";
    
    public $id;
    public $category;
    public $description;
    public $amount;
    public $transaction_type;
    public $transaction_date;
    public $created_by;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET category=:category, description=:description,
                      amount=:amount, transaction_type=:transaction_type,
                      transaction_date=:transaction_date, created_by=:created_by";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":amount", $this->amount);
        $stmt->bindParam(":transaction_type", $this->transaction_type);
        $stmt->bindParam(":transaction_date", $this->transaction_date);
        $stmt->bindParam(":created_by", $this->created_by);
        
        return $stmt->execute();
    }
    
    public function getTotalBudget() {
        $query = "SELECT 
                    SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
                    SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expenses
                  FROM " . $this->table_name;
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $result['balance'] = $result['total_income'] - $result['total_expenses'];
        
        return $result;
    }
    
    public function getBudgetByCategory() {
        $query = "SELECT 
                    category,
                    SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as income,
                    SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as expenses
                  FROM " . $this->table_name . "
                  GROUP BY category";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function readAll() {
        $query = "SELECT b.*, u.username as created_by_name
                  FROM " . $this->table_name . " b
                  LEFT JOIN users u ON b.created_by = u.id
                  ORDER BY b.transaction_date DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
}
?>
