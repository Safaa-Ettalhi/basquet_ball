export class BudgetManager {
  constructor(app) {
    this.app = app
  }

  async loadBudget() {
    try {
      const budgetItems = await this.app.fetchData("../controllers/BudgetController.php?action=getAll")
      const budgetSummary = await this.app.fetchData("../controllers/BudgetController.php?action=getSummary")
      this.displayBudgetSummary(budgetSummary)
      this.displayBudgetItems(budgetItems)
    } catch (error) {
      console.error("Erreur lors du chargement du budget:", error)
    }
  }

  displayBudgetSummary(summary) {
    document.getElementById("total-income").textContent =
      `${Number.parseInt(summary.total_income || 0).toLocaleString()} Dhs`
    document.getElementById("total-expenses").textContent =
      `${Number.parseInt(summary.total_expenses || 0).toLocaleString()} Dhs`
    document.getElementById("budget-total").textContent =
      `${Number.parseInt(summary.balance || 0).toLocaleString()} Dhs`
  }

displayBudgetItems(items) {
  const tbody = document.querySelector("#budget-table tbody")
  tbody.innerHTML = ""

  items.forEach((item) => {
    const row = document.createElement("tr")
    const itemDate = new Date(item.transaction_date).toLocaleDateString("fr-FR")

    const amount = item.transaction_type === "income"
      ? `+${Number.parseInt(item.amount).toLocaleString()} Dhs`
      : `-${Number.parseInt(item.amount).toLocaleString()} Dhs`

    let actionButtons = ""

    if (this.app.hasPermission("budget", "update")) {
      actionButtons += `
        <button class="btn btn-secondary " onclick="editBudgetItem(${item.id})" title="Modifier">
          <i data-lucide="edit"></i>
        </button>`
    }

    if (this.app.hasPermission("budget", "delete")) {
      actionButtons += `
        <button class="btn btn-danger" onclick="deleteBudgetItem(${item.id})" title="Supprimer">
          <i data-lucide="trash-2"></i>
        </button>`
    }

    row.innerHTML = `
      <td>${itemDate}</td>
      <td>${item.category}</td>
      <td>${item.description}</td>
      <td>${item.transaction_type}</td>
      <td class="${item.transaction_type === "income" ? "income" : "expense"}">${amount}</td>
      <td class="action-buttons">
        ${actionButtons}
      </td>
    `
    tbody.appendChild(row)
  })

  // Recharge les icônes Lucide après modification du DOM
  lucide.createIcons()
}


  showAddBudgetModal() {
    if (!this.app.hasPermission("budget", "create")) {
      alert("Vous n'avez pas les permissions pour ajouter une transaction")
      return
    }

    const content = `
      <form id="add-budget-form">
        <div class="form-row">
          <div class="form-group">
            <label for="category">Catégorie</label>
            <select id="category" name="category" required>
              <option value="">Sélectionner</option>
              <option value="salary">Salaire</option>
              <option value="equipment">Équipement</option>
              <option value="medical">Médical</option>
              <option value="travel">Voyage</option>
              <option value="facility">Installation</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div class="form-group">
            <label for="transaction_type">Type</label>
            <select id="transaction_type" name="transaction_type" required>
              <option value="">Sélectionner</option>
              <option value="income">Revenu</option>
              <option value="expense">Dépense</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <input type="text" id="description" name="description" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="amount">Montant (Dhs)</label>
            <input type="number" id="amount" name="amount" step="0.01" min="0" required>
          </div>
          <div class="form-group">
            <label for="transaction_date">Date</label>
            <input type="date" id="transaction_date" name="transaction_date" required>
          </div>
        </div>
        <div class="form-group">
          <button type="submit" class="btn btn-primary">Ajouter la transaction</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </form>
    `

    window.showModal("Ajouter une Transaction", content)

    document.getElementById("add-budget-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "create"
      data.created_by = this.app.currentUser.id

      try {
        const result = await this.app.postData("../controllers/BudgetController.php", data)
        if (result.success) {
          window.closeModal()
          this.loadBudget()
          this.app.loadDashboard()
          alert("Transaction ajoutée avec succès!")
        }
      } catch (error) {
        console.error("Erreur lors de l'ajout de la transaction:", error)
      }
    })
  }

  async editBudgetItem(id) {
    if (!this.app.hasPermission("budget", "update")) {
      alert("Vous n'avez pas les permissions pour modifier une transaction")
      return
    }

    try {
      const item = await this.app.fetchData(`../controllers/BudgetController.php?action=getOne&id=${id}`)
      const content = `
        <form id="edit-budget-form">
          <div class="form-row">
            <div class="form-group">
              <label for="category">Catégorie</label>
              <select id="category" name="category" required>
                <option value="salary" ${item.category === "salary" ? "selected" : ""}>Salaire</option>
                <option value="equipment" ${item.category === "equipment" ? "selected" : ""}>Équipement</option>
                <option value="medical" ${item.category === "medical" ? "selected" : ""}>Médical</option>
                <option value="travel" ${item.category === "travel" ? "selected" : ""}>Voyage</option>
                <option value="facility" ${item.category === "facility" ? "selected" : ""}>Installation</option>
                <option value="other" ${item.category === "other" ? "selected" : ""}>Autre</option>
              </select>
            </div>
            <div class="form-group">
              <label for="transaction_type">Type</label>
              <select id="transaction_type" name="transaction_type" required>
                <option value="income" ${item.transaction_type === "income" ? "selected" : ""}>Revenu</option>
                <option value="expense" ${item.transaction_type === "expense" ? "selected" : ""}>Dépense</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="description">Description</label>
            <input type="text" id="description" name="description" value="${item.description}" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="amount">Montant (Dhs)</label>
              <input type="number" id="amount" name="amount" value="${item.amount}" step="0.01" min="0" required>
            </div>
            <div class="form-group">
              <label for="transaction_date">Date</label>
              <input type="date" id="transaction_date" name="transaction_date" value="${item.transaction_date}" required>
            </div>
          </div>
          <div class="form-group">
            <button type="submit" class="btn btn-primary">Modifier la transaction</button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          </div>
        </form>
      `

      window.showModal("Modifier la Transaction", content)

      document.getElementById("edit-budget-form").addEventListener("submit", async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = Object.fromEntries(formData)
        data.action = "update"
        data.id = id

        try {
          const result = await this.app.postData("../controllers/BudgetController.php", data)
          if (result.success) {
            window.closeModal()
            this.loadBudget()
            this.app.loadDashboard()
            alert("Transaction modifiée avec succès!")
          }
        } catch (error) {
          console.error("Erreur lors de la modification de la transaction:", error)
        }
      })
    } catch (error) {
      console.error("Erreur lors du chargement de la transaction:", error)
    }
  }

  async deleteBudgetItem(id) {
    if (!this.app.hasPermission("budget", "delete")) {
      alert("Vous n'avez pas les permissions pour supprimer une transaction")
      return
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer cette transaction ?")) {
      try {
        const result = await this.app.postData("../controllers/BudgetController.php", {
          action: "delete",
          id: id,
        })
        if (result.success) {
          this.loadBudget()
          this.app.loadDashboard()
          alert("Transaction supprimée avec succès!")
        }
      } catch (error) {
        console.error("Erreur lors de la suppression de la transaction:", error)
      }
    }
  }
}
