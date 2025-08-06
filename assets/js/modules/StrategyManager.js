export class StrategyManager {
  constructor(app) {
    this.app = app
  }

  async loadStrategies() {
    try {
      const strategies = await this.app.fetchData("../controllers/StrategyController.php?action=getAll")
      this.displayStrategiesTable(strategies)
    } catch (error) {
      console.error("Erreur lors du chargement des stratégies:", error)
    }
  }

displayStrategiesTable(strategies) {
  const tbody = document.querySelector("#strategies-table tbody")
  if (!tbody) return

  tbody.innerHTML = ""

  strategies.forEach((strategy) => {
    const row = document.createElement("tr")
    const matchDate = strategy.match_date
      ? new Date(strategy.match_date).toLocaleDateString("fr-FR")
      : "N/A"

    let actionButtons = ""

    if (
      this.app.hasPermission("strategies", "validate") &&
      strategy.status === "pending"
    ) {
      actionButtons += `
        <button class="btn btn-success" onclick="validateStrategy(${strategy.id}, 'approved')" title="Approuver">
          <i data-lucide="check-circle"></i>
        </button>
        <button class="btn btn-danger" onclick="validateStrategy(${strategy.id}, 'rejected')" title="Rejeter">
          <i data-lucide="x-circle"></i>
        </button>
      `
    }

    if (this.app.hasPermission("strategies", "update")) {
      actionButtons += `
        <button class="btn btn-secondary" onclick="editStrategy(${strategy.id})" title="Modifier">
          <i data-lucide="edit"></i>
        </button>`
    }

    if (this.app.hasPermission("strategies", "delete")) {
      actionButtons += `
        <button class="btn btn-danger" onclick="deleteStrategy(${strategy.id})" title="Supprimer">
          <i data-lucide="trash-2"></i>
        </button>`
    }

    row.innerHTML = `
      <td>${strategy.opponent_name || "N/A"} - ${matchDate}</td>
      <td>${strategy.strategy_name}</td>
      <td>${strategy.proposed_by_name}</td>
      <td><span class="status-badge status-${strategy.status}">${strategy.status}</span></td>
      <td>${strategy.comments || ""}</td>
      <td class="action-buttons">
        ${actionButtons}
      </td>
    `

    tbody.appendChild(row)
  })

  lucide.createIcons()
}


  showProposeStrategyModal() {
    if (!this.app.hasPermission("strategies", "create")) {
      alert("Vous n'avez pas les permissions pour proposer une stratégie")
      return
    }

    const content = `
      <form id="propose-strategy-form">
        <div class="form-group">
          <label for="match_id">Match</label>
          <select id="match_id" name="match_id" required>
            <option value="">Sélectionner un match</option>
          </select>
        </div>
        <div class="form-group">
          <label for="strategy_name">Nom de la stratégie</label>
          <input type="text" id="strategy_name" name="strategy_name" required>
        </div>
        <div class="form-group">
          <label for="comments">Description/Commentaires</label>
          <textarea id="comments" name="comments" rows="4" required></textarea>
        </div>
        <div class="form-group">
          <button type="submit" class="btn btn-primary">Proposer la Stratégie</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </form>
    `

    window.showModal("📋 Proposer une Stratégie", content)

    
    this.app.fetchData("../controllers/MatchController.php?action=getAll").then((matches) => {
      const select = document.getElementById("match_id")
      const upcomingMatches = matches.filter((match) => match.status === "scheduled")
      upcomingMatches.forEach((match) => {
        const option = document.createElement("option")
        option.value = match.id
        option.textContent = `${match.opponent_name} - ${new Date(match.match_date).toLocaleDateString()}`
        select.appendChild(option)
      })
    })

    document.getElementById("propose-strategy-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "propose"
      data.proposed_by = this.app.currentUser.id

      try {
        const result = await this.app.postData("../controllers/StrategyController.php", data)
        if (result.success) {
          window.closeModal()
          this.loadStrategies()
          alert("Stratégie proposée avec succès!")
        }
      } catch (error) {
        console.error("Erreur lors de la proposition de stratégie:", error)
      }
    })
  }

  async validateStrategy(strategyId, status) {
    if (!this.app.hasPermission("strategies", "validate")) {
      alert("Vous n'avez pas les permissions pour valider une stratégie")
      return
    }

    const comments = prompt(`Commentaires pour ${status === "approved" ? "approuver" : "rejeter"} cette stratégie:`)
    try {
      const result = await this.app.postData("../controllers/StrategyController.php", {
        action: "validate",
        id: strategyId,
        status: status,
        validated_by: this.app.currentUser.id,
        comments: comments || "",
      })
      if (result.success) {
        this.loadStrategies()
        alert(`Stratégie ${status === "approved" ? "approuvée" : "rejetée"} avec succès!`)
      }
    } catch (error) {
      console.error("Erreur lors de la validation:", error)
    }
  }

  async editStrategy(id) {
    if (!this.app.hasPermission("strategies", "update")) {
      alert("Vous n'avez pas les permissions pour modifier une stratégie")
      return
    }

    try {
      const strategies = await this.app.fetchData("../controllers/StrategyController.php?action=getAll")
      const strategy = strategies.find((s) => s.id == id)
      const content = `
        <form id="edit-strategy-form">
          <div class="form-group">
            <label for="strategy_name">Nom de la stratégie</label>
            <input type="text" id="strategy_name" name="strategy_name" value="${strategy.strategy_name}" required>
          </div>
          <div class="form-group">
            <label for="comments">Description/Commentaires</label>
            <textarea id="comments" name="comments" rows="4" required>${strategy.comments}</textarea>
          </div>
          <div class="form-group">
            <button type="submit" class="btn btn-primary">Modifier la Stratégie</button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          </div>
        </form>
      `

      window.showModal("Modifier la Stratégie", content)

      document.getElementById("edit-strategy-form").addEventListener("submit", async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = Object.fromEntries(formData)
        data.action = "update"
        data.id = id

        try {
          const result = await this.app.postData("../controllers/StrategyController.php", data)
          if (result.success) {
            window.closeModal()
            this.loadStrategies()
            alert("Stratégie modifiée avec succès!")
          }
        } catch (error) {
          console.error("Erreur lors de la modification de la stratégie:", error)
        }
      })
    } catch (error) {
      console.error("Erreur lors du chargement de la stratégie:", error)
    }
  }

  async deleteStrategy(id) {
    if (!this.app.hasPermission("strategies", "delete")) {
      alert("Vous n'avez pas les permissions pour supprimer une stratégie")
      return
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer cette stratégie ?")) {
      try {
        const result = await this.app.postData("../controllers/StrategyController.php", {
          action: "delete",
          id: id,
        })
        if (result.success) {
          this.loadStrategies()
          alert("Stratégie supprimée avec succès!")
        }
      } catch (error) {
        console.error("Erreur lors de la suppression de la stratégie:", error)
      }
    }
  }
}
