export class MatchManager {
  constructor(app) {
    this.app = app
  }

  async loadMatches() {
    try {
      const matches = await this.app.fetchData("../controllers/MatchController.php?action=getAll")
      this.displayMatches(matches)
    } catch (error) {
      console.error("Erreur lors du chargement des matchs:", error)
    }
  }

displayMatches(matches) {
  const tbody = document.querySelector("#matches-table tbody")
  tbody.innerHTML = ""

  matches.forEach((match) => {
    const row = document.createElement("tr")
    const matchDate = new Date(match.match_date).toLocaleDateString("fr-FR")
    const score = match.status === "completed"
      ? `${match.our_score} - ${match.opponent_score}`
      : "-"

    let actionButtons = ""

    if (match.status === "scheduled" && this.app.hasPermission("matches", "update")) {
      actionButtons += `
        <button class="btn btn-success" onclick="updateMatchScore(${match.id})" title="Entrer le score">
          <i data-lucide="trophy"></i>
        </button>`
    }

    if (this.app.hasPermission("matches", "update")) {
      actionButtons += `
        <button class="btn btn-secondary" onclick="editMatch(${match.id})" title="Modifier le match">
          <i data-lucide="edit"></i>
        </button>`
    }

    if (this.app.hasPermission("matches", "delete")) {
      actionButtons += `
        <button class="btn btn-danger" onclick="deleteMatch(${match.id})" title="Supprimer le match">
          <i data-lucide="trash-2"></i>
        </button>`
    }

    actionButtons += `
      <button class="btn btn-info" onclick="viewMatchDetails(${match.id})" title="Voir les détails">
        <i data-lucide="info"></i>
      </button>`

    row.innerHTML = `
      <td>${matchDate}</td>
      <td>${match.opponent_name || "TBD"}</td>
      <td>${match.location}</td>
      <td>${match.match_type}</td>
      <td>${score}</td>
      <td><span class="status-badge status-${match.status}">${match.status}</span></td>
      <td class="action-buttons">
        ${actionButtons}
      </td>
    `
    tbody.appendChild(row)
  })

  // Recharge les icônes Lucide après DOM update
  lucide.createIcons()
}

  showAddMatchModal() {
    if (!this.app.hasPermission("matches", "create")) {
      alert("Vous n'avez pas les permissions pour créer un match")
      return
    }

    const content = `
      <form id="add-match-form">
        <div class="form-group">
          <label for="match_date">Date et heure</label>
          <input type="datetime-local" id="match_date" name="match_date" required>
        </div>
        <div class="form-group">
          <label for="opponent_team_id">Équipe adverse</label>
          <select id="opponent_team_id" name="opponent_team_id" required>
            <option value="">Sélectionner</option>
          </select>
        </div>
        <div class="form-group">
          <label for="location">Lieu</label>
          <input type="text" id="location" name="location" required>
        </div>
        <div class="form-group">
          <label for="match_type">Type de match</label>
          <select id="match_type" name="match_type" required>
            <option value="">Sélectionner</option>
            <option value="friendly">Match amical</option>
            <option value="official">Match officiel</option>
          </select>
        </div>
        <div class="form-group">
          <button type="submit" class="btn btn-primary">Programmer le match</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </form>
    `

    window.showModal("Programmer un Match", content)

    this.app
      .fetchData("../controllers/TeamController.php?action=getAll")
      .then((teams) => {
        const select = document.getElementById("opponent_team_id")
        teams.forEach((team) => {
          const option = document.createElement("option")
          option.value = team.id
          option.textContent = `${team.name} (${team.city})`
          select.appendChild(option)
        })
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des équipes:", error)
      })

    document.getElementById("add-match-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "create"

      try {
        const result = await this.app.postData("../controllers/MatchController.php", data)
        if (result.success) {
          window.closeModal()
          this.loadMatches()
          this.app.loadDashboard()
          alert("Match programmé avec succès!")
        }
      } catch (error) {
        console.error("Erreur lors de la programmation du match:", error)
      }
    })
  }

  async editMatch(id) {
    if (!this.app.hasPermission("matches", "update")) {
      alert("Vous n'avez pas les permissions pour modifier un match")
      return
    }

    try {
      const match = await this.app.fetchData(`../controllers/MatchController.php?action=getOne&id=${id}`)
      const content = `
        <form id="edit-match-form">
          <div class="form-group">
            <label for="match_date">Date et heure</label>
            <input type="datetime-local" id="match_date" name="match_date" value="${match.match_date.replace(" ", "T")}" required>
          </div>
          <div class="form-group">
            <label for="opponent_team_id">Équipe adverse</label>
            <select id="opponent_team_id" name="opponent_team_id" required>
              <option value="">Sélectionner</option>
            </select>
          </div>
          <div class="form-group">
            <label for="location">Lieu</label>
            <input type="text" id="location" name="location" value="${match.location}" required>
          </div>
          <div class="form-group">
            <label for="match_type">Type de match</label>
            <select id="match_type" name="match_type" required>
              <option value="friendly" ${match.match_type === "friendly" ? "selected" : ""}>Match amical</option>
              <option value="official" ${match.match_type === "official" ? "selected" : ""}>Match officiel</option>
            </select>
          </div>
          <div class="form-group">
            <label for="status">Statut</label>
            <select id="status" name="status" required>
              <option value="scheduled" ${match.status === "scheduled" ? "selected" : ""}>Programmé</option>
              <option value="in_progress" ${match.status === "in_progress" ? "selected" : ""}>En cours</option>
              <option value="completed" ${match.status === "completed" ? "selected" : ""}>Terminé</option>
              <option value="cancelled" ${match.status === "cancelled" ? "selected" : ""}>Annulé</option>
            </select>
          </div>
          <div class="form-group">
            <button type="submit" class="btn btn-primary">Modifier le match</button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          </div>
        </form>
      `

      window.showModal("Modifier le Match", content)

      this.app.fetchData("../controllers/TeamController.php?action=getAll").then((teams) => {
        const select = document.getElementById("opponent_team_id")
        teams.forEach((team) => {
          const option = document.createElement("option")
          option.value = team.id
          option.textContent = `${team.name} (${team.city})`
          if (team.id == match.opponent_team_id) {
            option.selected = true
          }
          select.appendChild(option)
        })
      })

      document.getElementById("edit-match-form").addEventListener("submit", async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = Object.fromEntries(formData)
        data.action = "update"
        data.id = id

        try {
          const result = await this.app.postData("../controllers/MatchController.php", data)
          if (result.success) {
            window.closeModal()
            this.loadMatches()
            alert("Match modifié avec succès!")
          }
        } catch (error) {
          console.error("Erreur lors de la modification du match:", error)
        }
      })
    } catch (error) {
      console.error("Erreur lors du chargement du match:", error)
    }
  }

  async deleteMatch(id) {
    if (!this.app.hasPermission("matches", "delete")) {
      alert("Vous n'avez pas les permissions pour supprimer un match")
      return
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer ce match ?")) {
      try {
        const result = await this.app.postData("../controllers/MatchController.php", {
          action: "delete",
          id: id,
        })
        if (result.success) {
          this.loadMatches()
          this.app.loadDashboard()
          alert("Match supprimé avec succès!")
        }
      } catch (error) {
        console.error("Erreur lors de la suppression du match:", error)
      }
    }
  }

  async updateMatchScore(matchId) {
    if (!this.app.hasPermission("matches", "update")) {
      alert("Vous n'avez pas les permissions pour modifier le score")
      return
    }

    const content = `
      <form id="update-score-form">
        <div class="form-row">
          <div class="form-group">
            <label for="our_score">Notre score</label>
            <input type="number" id="our_score" name="our_score" min="0" required>
          </div>
          <div class="form-group">
            <label for="opponent_score">Score adversaire</label>
            <input type="number" id="opponent_score" name="opponent_score" min="0" required>
          </div>
        </div>
        <div class="form-group">
          <button type="submit" class="btn btn-primary">Mettre à jour le score</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </form>
    `

    window.showModal("Mettre à jour le Score", content)

    document.getElementById("update-score-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "updateScore"
      data.id = matchId

      try {
        const result = await this.app.postData("../controllers/MatchController.php", data)
        if (result.success) {
          window.closeModal()
          this.loadMatches()
          this.app.loadDashboard()
          alert("Score mis à jour avec succès!")
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour du score:", error)
      }
    })
  }

  async viewMatchDetails(matchId) {
    try {
      const stats = await this.app.fetchData(
        `../controllers/StatisticsController.php?action=getMatchStats&match_id=${matchId}`,
      )
      const match = await this.app.fetchData(`../controllers/MatchController.php?action=getOne&id=${matchId}`)

      let statsHtml = `
        <div class="match-details">
          <h4>Détails du match</h4>
          <div class="match-info">
            <p><strong>Adversaire:</strong> ${match.opponent_name}</p>
            <p><strong>Date:</strong> ${new Date(match.match_date).toLocaleDateString("fr-FR")}</p>
            <p><strong>Lieu:</strong> ${match.location}</p>
            <p><strong>Score:</strong> ${match.our_score} - ${match.opponent_score}</p>
          </div>
        </div>
      `

      if (stats.length > 0) {
        statsHtml += `
          <div class="match-stats">
            <h5>Statistiques des joueurs</h5>
            <table style="width: 100%; margin-top: 1rem;">
              <thead>
                <tr>
                  <th>Joueur</th>
                  <th>Points</th>
                  <th>Rebonds</th>
                  <th>Passes</th>
                  <th>Minutes</th>
                </tr>
              </thead>
              <tbody>
        `
        stats.forEach((stat) => {
          statsHtml += `
            <tr>
              <td>${stat.first_name} ${stat.last_name}</td>
              <td>${stat.points}</td>
              <td>${stat.rebounds}</td>
              <td>${stat.assists}</td>
              <td>${stat.minutes_played}</td>
            </tr>
          `
        })
        statsHtml += `
              </tbody>
            </table>
          </div>
        `
      } else {
        statsHtml += "<p>Aucune statistique disponible pour ce match.</p>"
      }

      statsHtml += `<button class="btn btn-secondary" onclick="closeModal()">Fermer</button>`
      window.showModal("Détails du match", statsHtml)
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
    }
  }
}
