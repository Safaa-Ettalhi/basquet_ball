export class PlayerManager {
  constructor(app) {
    this.app = app
  }

  async loadPlayers() {
    try {
      const players = await this.app.fetchData("../controllers/PlayerController.php?action=getAll")
      this.displayPlayers(players)
      this.populatePlayerSelect(players)
    } catch (error) {
      console.error("Erreur lors du chargement des joueurs:", error)
    }
  }

  displayPlayers(players) {
    const tbody = document.querySelector("#players-table tbody")
    tbody.innerHTML = ""
    players.forEach((player) => {
      const row = document.createElement("tr")
      let actionButtons = ""

      if (this.app.hasPermission("players", "update_admin") || this.app.hasPermission("players", "update_sports")) {
        actionButtons += `<button class="btn btn-secondary" onclick="editPlayer(${player.id})">Modifier</button>`
      }
      if (this.app.hasPermission("players", "delete")) {
        actionButtons += `<button class="btn btn-danger" onclick="deletePlayer(${player.id})">Supprimer</button>`
      }
      actionButtons += `<button class="btn btn-info" onclick="viewPlayerStats(${player.id})">Stats</button>`

      if (this.app.hasPermission("statistics", "create")) {
        actionButtons += `<button class="btn btn-success" onclick="addPlayerStats(${player.id})">+ Stats</button>`
      }

      row.innerHTML = `
        <td>${player.first_name} ${player.last_name}</td>
        <td>${player.position}</td>
        <td>${player.jersey_number}</td>
        <td>${player.height}m</td>
        <td>${player.weight}kg</td>
        <td>${Number.parseInt(player.salary).toLocaleString()} Dhs</td>
        <td><span class="status-badge status-${player.health_status}">${player.health_status}</span></td>
        <td><span class="status-badge status-${player.role || "player"}">${player.role || "player"}</span></td>
        <td class="action-buttons">
          ${actionButtons}
        </td>
      `
      tbody.appendChild(row)
    })
  }

  populatePlayerSelect(players) {
    const selects = document.querySelectorAll(
      "#player-select, #performance-player-select, #stats-player-select, #injury-player-select",
    )
    selects.forEach((select) => {
      if (select) {
        select.innerHTML = '<option value="">Sélectionner un joueur</option>'
        players.forEach((player) => {
          const option = document.createElement("option")
          option.value = player.id
          option.textContent = `${player.first_name} ${player.last_name}`
          select.appendChild(option)
        })
      }
    })
  }

  showAddPlayerModal() {
    if (!this.app.hasPermission("players", "create")) {
      alert("Vous n'avez pas les permissions pour ajouter un joueur")
      return
    }

    const content = `
      <form id="add-player-form">
        <div class="form-row">
          <div class="form-group">
            <label for="first_name">Prénom</label>
            <input type="text" id="first_name" name="first_name" required>
          </div>
          <div class="form-group">
            <label for="last_name">Nom</label>
            <input type="text" id="last_name" name="last_name" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="position">Position</label>
            <select id="position" name="position" required>
              <option value="">Sélectionner</option>
              <option value="PG">Meneur (PG)</option>
              <option value="SG">Arrière (SG)</option>
              <option value="SF">Ailier (SF)</option>
              <option value="PF">Ailier Fort (PF)</option>
              <option value="C">Pivot (C)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="jersey_number">Numéro</label>
            <input type="number" id="jersey_number" name="jersey_number" min="1" max="99" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="height">Taille (m)</label>
            <input type="number" id="height" name="height" step="0.01" min="1.5" max="2.5" required>
          </div>
          <div class="form-group">
            <label for="weight">Poids (kg)</label>
            <input type="number" id="weight" name="weight" step="0.1" min="50" max="200" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="birth_date">Date de naissance</label>
            <input type="date" id="birth_date" name="birth_date" required>
          </div>
          <div class="form-group">
            <label for="role">Rôle</label>
            <select id="role" name="role" required>
              <option value="player">Joueur</option>
              <option value="captain">Capitaine</option>
              <option value="vice_captain">Vice-Capitaine</option>
              <option value="rookie">Rookie</option>
              <option value="veteran">Vétéran</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="salary">Salaire annuel (Dhs)</label>
          <input type="number" id="salary" name="salary" min="0" required>
        </div>
        <div class="form-group">
          <button type="submit" class="btn btn-primary">Ajouter le joueur</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </form>
    `

    window.showModal("Ajouter un Joueur", content)

    document.getElementById("add-player-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "create"

      try {
        const result = await this.app.postData("../controllers/PlayerController.php", data)
        if (result.success) {
          window.closeModal()
          this.loadPlayers()
          this.app.loadDashboard()
          alert("Joueur ajouté avec succès!")
        } else {
          alert("Erreur lors de l'ajout du joueur")
        }
      } catch (error) {
        console.error("Erreur lors de l'ajout du joueur:", error)
        alert("Erreur lors de l'ajout du joueur")
      }
    })
  }

  async editPlayer(id) {
    if (!this.app.hasPermission("players", "update_admin") && !this.app.hasPermission("players", "update_sports")) {
      alert("Vous n'avez pas les permissions pour modifier un joueur")
      return
    }

    try {
      const player = await this.app.fetchData(`../controllers/PlayerController.php?action=getOne&id=${id}`)
      let content = ""

      if (this.app.hasPermission("players", "update_admin")) {
        content = this.getAdminEditForm(player)
      } else if (this.app.hasPermission("players", "update_sports")) {
        content = this.getSportsEditForm(player)
      }

      window.showModal("Modifier le Joueur", content)

      document.getElementById("edit-player-form").addEventListener("submit", async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = Object.fromEntries(formData)
        data.action = "update"
        data.id = id

        if (this.app.hasPermission("players", "update_admin")) {
          data.update_type = "admin"
        } else if (this.app.hasPermission("players", "update_sports")) {
          data.update_type = "sports"
        }

        try {
          const result = await this.app.postData("../controllers/PlayerController.php", data)
          if (result.success) {
            window.closeModal()
            this.loadPlayers()
            this.app.loadDashboard()
            alert("Joueur modifié avec succès!")
          } else {
            alert("Erreur lors de la modification: " + (result.error || "Erreur inconnue"))
          }
        } catch (error) {
          console.error("Erreur lors de la modification du joueur:", error)
          alert("Erreur lors de la modification du joueur")
        }
      })
    } catch (error) {
      console.error("Erreur lors du chargement du joueur:", error)
      alert("Erreur lors du chargement du joueur")
    }
  }

  getAdminEditForm(player) {
    return `
      <form id="edit-player-form">
        <h4>Modification des données administratives</h4>
        <div class="form-row">
          <div class="form-group">
            <label for="first_name">Prénom</label>
            <input type="text" id="first_name" name="first_name" value="${player.first_name}" required>
          </div>
          <div class="form-group">
            <label for="last_name">Nom</label>
            <input type="text" id="last_name" name="last_name" value="${player.last_name}" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="birth_date">Date de naissance</label>
            <input type="date" id="birth_date" name="birth_date" value="${player.birth_date}" required>
          </div>
          <div class="form-group">
            <label for="salary">Salaire annuel (Dhs)</label>
            <input type="number" id="salary" name="salary" value="${player.salary}" min="0" required>
          </div>
        </div>
        <div class="form-group">
          <label for="role">Rôle dans l'équipe</label>
          <select id="role" name="role" required>
            <option value="player" ${player.role === "player" ? "selected" : ""}>Joueur</option>
            <option value="captain" ${player.role === "captain" ? "selected" : ""}>Capitaine</option>
            <option value="vice_captain" ${player.role === "vice_captain" ? "selected" : ""}>Vice-Capitaine</option>
            <option value="rookie" ${player.role === "rookie" ? "selected" : ""}>Rookie</option>
            <option value="veteran" ${player.role === "veteran" ? "selected" : ""}>Vétéran</option>
          </select>
        </div>
        <div class="form-group">
          <button type="submit" class="btn btn-primary">Modifier les données administratives</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </form>
    `
  }

  getSportsEditForm(player) {
    return `
      <form id="edit-player-form">
        <h4>Modification des informations sportives</h4>
        <div class="form-row">
          <div class="form-group">
            <label for="position">Position</label>
            <select id="position" name="position" required>
              <option value="PG" ${player.position === "PG" ? "selected" : ""}>Meneur (PG)</option>
              <option value="SG" ${player.position === "SG" ? "selected" : ""}>Arrière (SG)</option>
              <option value="SF" ${player.position === "SF" ? "selected" : ""}>Ailier (SF)</option>
              <option value="PF" ${player.position === "PF" ? "selected" : ""}>Ailier Fort (PF)</option>
              <option value="C" ${player.position === "C" ? "selected" : ""}>Pivot (C)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="jersey_number">Numéro de maillot</label>
            <input type="number" id="jersey_number" name="jersey_number" value="${player.jersey_number}" min="1" max="99" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="height">Taille (m)</label>
            <input type="number" id="height" name="height" value="${player.height}" step="0.01" min="1.5" max="2.5" required>
          </div>
          <div class="form-group">
            <label for="weight">Poids (kg)</label>
            <input type="number" id="weight" name="weight" value="${player.weight}" step="0.1" min="50" max="200" required>
          </div>
        </div>
        <div class="form-group">
          <label for="health_status">Statut de santé</label>
          <select id="health_status" name="health_status" required>
            <option value="healthy" ${player.health_status === "healthy" ? "selected" : ""}>En bonne santé</option>
            <option value="injured" ${player.health_status === "injured" ? "selected" : ""}>Blessé</option>
            <option value="recovering" ${player.health_status === "recovering" ? "selected" : ""}>En récupération</option>
          </select>
        </div>
        <div class="form-group">
          <button type="submit" class="btn btn-primary">Modifier les informations sportives</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </form>
    `
  }

  async deletePlayer(id) {
    if (!this.app.hasPermission("players", "delete")) {
      alert("Vous n'avez pas les permissions pour supprimer un joueur")
      return
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer ce joueur ?")) {
      try {
        const result = await this.app.postData("../controllers/PlayerController.php", {
          action: "delete",
          id: id,
        })
        if (result.success) {
          this.loadPlayers()
          this.app.loadDashboard()
          alert("Joueur supprimé avec succès!")
        }
      } catch (error) {
        console.error("Erreur lors de la suppression du joueur:", error)
      }
    }
  }

  async viewPlayerStats(playerId) {
    try {
      const stats = await this.app.fetchData(
        `../controllers/StatisticsController.php?action=getPlayerStats&player_id=${playerId}`,
      )
      const player = await this.app.fetchData(`../controllers/PlayerController.php?action=getOne&id=${playerId}`)

      const statsHtml = `
        <div class="player-stats">
          <h4>${player.first_name} ${player.last_name} - Statistiques</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span>Matchs joués:</span>
              <span>${stats.games_played || 0}</span>
            </div>
            <div class="stat-item">
              <span>Points par match:</span>
              <span>${Number.parseFloat(stats.avg_points || 0).toFixed(1)}</span>
            </div>
            <div class="stat-item">
              <span>Rebonds par match:</span>
              <span>${Number.parseFloat(stats.avg_rebounds || 0).toFixed(1)}</span>
            </div>
            <div class="stat-item">
              <span>Passes par match:</span>
              <span>${Number.parseFloat(stats.avg_assists || 0).toFixed(1)}</span>
            </div>
            <div class="stat-item">
              <span>Interceptions par match:</span>
              <span>${Number.parseFloat(stats.avg_steals || 0).toFixed(1)}</span>
            </div>
            <div class="stat-item">
              <span>Contres par match:</span>
              <span>${Number.parseFloat(stats.avg_blocks || 0).toFixed(1)}</span>
            </div>
            <div class="stat-item">
              <span>Minutes par match:</span>
              <span>${Number.parseFloat(stats.avg_minutes || 0).toFixed(1)}</span>
            </div>
            <div class="stat-item">
              <span>% aux tirs:</span>
              <span>${Number.parseFloat(stats.fg_percentage || 0).toFixed(1)}%</span>
            </div>
            <div class="stat-item">
              <span>% à 3 points:</span>
              <span>${Number.parseFloat(stats.three_point_percentage || 0).toFixed(1)}%</span>
            </div>
          </div>
          <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
        </div>
      `
      window.showModal("Statistiques du Joueur", statsHtml)
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error)
    }
  }
}
