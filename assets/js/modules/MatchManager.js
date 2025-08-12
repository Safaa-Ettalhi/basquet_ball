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
      const matchTime = new Date(match.match_date).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
      const score = match.status === "completed" && (match.home_score != 0 || match.away_score != 0)
        ? `${match.home_score || match.our_score} - ${match.away_score || match.opponent_score}`
        : "-"

      const teamsDisplay = `${match.home_team_name || 'TBD'} vs ${match.away_team_name || match.opponent_name || 'TBD'}`

      const hasScore = match.status === "completed" && (match.home_score != 0 || match.away_score != 0)
      const matchDateTime = new Date(match.match_date)
      const now = new Date()
      const isMatchPast = matchDateTime <= now

      let actionButtons = ""

      
      if (match.status === "completed" && !hasScore && this.app.hasPermission("matches", "update")) {
        actionButtons += `
          <button class="btn btn-success" onclick="updateMatchScore(${match.id})" title="Entrer le score">
            <i data-lucide="trophy"></i>
          </button>`
      }

      if (!hasScore && this.app.hasPermission("matches", "update")) {
        actionButtons += `
          <button class="btn btn-secondary" onclick="editMatch(${match.id})" title="Modifier le match">
            <i data-lucide="edit"></i>
          </button>`
      }

      if (hasScore) {
        actionButtons += `
          <span class="text-muted" title="Modification impossible - Score saisi">
            <i data-lucide="lock"></i>
          </span>`
      } else if (match.status === "completed" && !hasScore) {
        actionButtons += `
          <span class="text-success" title="Prêt pour la saisie du score">
            <i data-lucide="check-circle"></i>
          </span>`
      } else if (isMatchPast && match.status !== "completed") {
        actionButtons += `
          <span class="text-warning" title="Match terminé - Changer le statut à 'Terminé' pour saisir le score">
            <i data-lucide="alert-circle"></i>
          </span>`
      } else if (!isMatchPast) {
        actionButtons += `
          <span class="text-info" title="Match à venir">
            <i data-lucide="clock"></i>
          </span>`
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
        <td>${matchDate}<br><small class="text-muted">${matchTime}</small></td>
        <td>${teamsDisplay}</td>
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

    lucide.createIcons()
  }

  getCurrentDateTime() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  /**
   * Vérifier la disponibilité d'une équipe pour un jour donné
   */
  async checkTeamDayAvailability(teamId, matchDate, excludeMatchId = null) {
    try {
      let url = `../controllers/MatchController.php?action=checkTeamDayAvailability&team_id=${teamId}&match_date=${encodeURIComponent(matchDate)}`
      if (excludeMatchId) {
        url += `&exclude_match_id=${excludeMatchId}`
      }
      
      const result = await this.app.fetchData(url)
      return result
    } catch (error) {
      console.error("Erreur lors de la vérification de disponibilité:", error)
      return { available: true, conflict: null }
    }
  }

  showAddMatchModal() {
    if (!this.app.hasPermission("matches", "create")) {
      alert("Vous n'avez pas les permissions pour créer un match")
      return
    }
    const currentDateTime = this.getCurrentDateTime()
  
    const content = `
      <form id="add-match-form">
        <div class="form-group">
          <label for="match_date">Date et heure</label>
          <input type="datetime-local" id="match_date" name="match_date" min="${currentDateTime}" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="home_team_id">Équipe à domicile</label>
            <select id="home_team_id" name="home_team_id" required>
              <option value="">Sélectionner l'équipe à domicile</option>
            </select>
            <small id="home_team_warning" class="form-help text-warning" style="display: none;"></small>
          </div>
          <div class="form-group">
            <label for="away_team_id">Équipe visiteur</label>
            <select id="away_team_id" name="away_team_id" required>
              <option value="">Sélectionner l'équipe visiteur</option>
            </select>
            <small id="away_team_warning" class="form-help text-warning" style="display: none;"></small>
          </div>
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

    document.getElementById("match_date").addEventListener("change", (e) => {
      const selectedDateTime = new Date(e.target.value)
      const now = new Date()
      
      if (selectedDateTime <= now) {
        alert("Le match ne peut pas être programmé dans le passé")
        e.target.value = currentDateTime
        return
      }

      checkTeamConflictsOnDateChange()
    })

    const checkTeamConflictsOnDateChange = async () => {
      const matchDate = document.getElementById("match_date").value
      const homeTeamId = document.getElementById("home_team_id").value
      const awayTeamId = document.getElementById("away_team_id").value
      
      if (matchDate && homeTeamId) {
        const homeAvailability = await this.checkTeamDayAvailability(homeTeamId, matchDate)
        const homeWarning = document.getElementById("home_team_warning")
        if (!homeAvailability.available) {
          const conflictDate = new Date(homeAvailability.conflict.match_date).toLocaleDateString("fr-FR")
          const conflictTime = new Date(homeAvailability.conflict.match_date).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
          homeWarning.textContent = `⚠️ Cette équipe a déjà un match le ${conflictDate} à ${conflictTime}`
          homeWarning.style.display = "block"
        } else {
          homeWarning.style.display = "none"
        }
      }
      
      if (matchDate && awayTeamId) {
        const awayAvailability = await this.checkTeamDayAvailability(awayTeamId, matchDate)
        const awayWarning = document.getElementById("away_team_warning")
        if (!awayAvailability.available) {
          const conflictDate = new Date(awayAvailability.conflict.match_date).toLocaleDateString("fr-FR")
          const conflictTime = new Date(awayAvailability.conflict.match_date).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
          awayWarning.textContent = `⚠️ Cette équipe a déjà un match le ${conflictDate} à ${conflictTime}`
          awayWarning.style.display = "block"
        } else {
          awayWarning.style.display = "none"
        }
      }
    }

    const validateTeams = () => {
      const homeTeam = document.getElementById("home_team_id").value
      const awayTeam = document.getElementById("away_team_id").value
      
      if (homeTeam && awayTeam && homeTeam === awayTeam) {
        alert("Les deux équipes doivent être différentes")
        document.getElementById("away_team_id").value = ""
        return false
      }
      return true
    }

    this.app
      .fetchData("../controllers/TeamController.php?action=getAll")
      .then((teams) => {
        const homeSelect = document.getElementById("home_team_id")
        const awaySelect = document.getElementById("away_team_id")
        
        teams.forEach((team) => {
          const homeOption = document.createElement("option")
          homeOption.value = team.id
          homeOption.textContent = `${team.name} (${team.city})`
          homeSelect.appendChild(homeOption)
          
          const awayOption = document.createElement("option")
          awayOption.value = team.id
          awayOption.textContent = `${team.name} (${team.city})`
          awaySelect.appendChild(awayOption)
        })

        homeSelect.addEventListener("change", () => {
          validateTeams()
          checkTeamConflictsOnDateChange()
        })
        awaySelect.addEventListener("change", () => {
          validateTeams()
          checkTeamConflictsOnDateChange()
        })
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des équipes:", error)
      })

    document.getElementById("add-match-form").addEventListener("submit", async (e) => {
      e.preventDefault()

      const matchDateTime = new Date(document.getElementById("match_date").value)
      const now = new Date()
      
      if (matchDateTime <= now) {
        alert("Le match ne peut pas être programmé dans le passé")
        return
      }

      if (!validateTeams()) {
        return
      }
      
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
        } else {
          alert("Erreur lors de la programmation: " + (result.error || "Erreur inconnue"))
        }
      } catch (error) {
        console.error("Erreur lors de la programmation du match:", error)
        alert("Erreur lors de la programmation du match")
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
      
      const hasScore = match.status === "completed" && (match.home_score != 0 || match.away_score != 0)
      
      if (hasScore) {
        alert("Impossible de modifier ce match car le score a déjà été saisi")
        return
      }

      const matchDateTime = new Date(match.match_date)
      const now = new Date()
      const isMatchPast = matchDateTime <= now
      
      const content = `
        <form id="edit-match-form">
          <div class="form-group">
            <label for="match_date">Date et heure</label>
            <input type="datetime-local" id="match_date" name="match_date" 
                   value="${match.match_date.replace(" ", "T")}">
            <small class="form-help">Choisissez une date future</small>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="home_team_id">Équipe à domicile</label>
              <select id="home_team_id" name="home_team_id" required>
                <option value="">Sélectionner l'équipe à domicile</option>
              </select>
              <small id="home_team_warning" class="form-help text-warning" style="display: none;"></small>
            </div>
            <div class="form-group">
              <label for="away_team_id">Équipe visiteur</label>
              <select id="away_team_id" name="away_team_id" required>
                <option value="">Sélectionner l'équipe visiteur</option>
              </select>
              <small id="away_team_warning" class="form-help text-warning" style="display: none;"></small>
            </div>
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
              <option value="completed" ${match.status === "completed" ? "selected" : ""} ${!isMatchPast ? "disabled" : ""}>Terminé${!isMatchPast ? " (date non passée)" : ""}</option>
              <option value="cancelled" ${match.status === "cancelled" ? "selected" : ""}>Annulé</option>
            </select>
            ${!isMatchPast ? '<small class="form-help text-warning">Le statut "Terminé" n\'est disponible qu\'après la date du match</small>' : ''}
            ${isMatchPast && match.status !== "completed" ? '<small class="form-help text-info">Changez le statut à "Terminé" pour pouvoir saisir le score</small>' : ''}
          </div>
          <div class="form-group">
            <button type="submit" class="btn btn-primary">Modifier le match</button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          </div>
        </form>
      `

      window.showModal("Modifier le Match", content)

      const checkTeamConflictsOnDateChange = async () => {
        const matchDate = document.getElementById("match_date").value
        const homeTeamId = document.getElementById("home_team_id").value
        const awayTeamId = document.getElementById("away_team_id").value
        
        if (matchDate && homeTeamId) {
          const homeAvailability = await this.checkTeamDayAvailability(homeTeamId, matchDate, id)
          const homeWarning = document.getElementById("home_team_warning")
          if (!homeAvailability.available) {
            const conflictDate = new Date(homeAvailability.conflict.match_date).toLocaleDateString("fr-FR")
            const conflictTime = new Date(homeAvailability.conflict.match_date).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
            homeWarning.textContent = `⚠️ Cette équipe a déjà un match le ${conflictDate} à ${conflictTime}`
            homeWarning.style.display = "block"
          } else {
            homeWarning.style.display = "none"
          }
        }
        
        if (matchDate && awayTeamId) {
          const awayAvailability = await this.checkTeamDayAvailability(awayTeamId, matchDate, id)
          const awayWarning = document.getElementById("away_team_warning")
          if (!awayAvailability.available) {
            const conflictDate = new Date(awayAvailability.conflict.match_date).toLocaleDateString("fr-FR")
            const conflictTime = new Date(awayAvailability.conflict.match_date).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
            awayWarning.textContent = `⚠️ Cette équipe a déjà un match le ${conflictDate} à ${conflictTime}`
            awayWarning.style.display = "block"
          } else {
            awayWarning.style.display = "none"
          }
        }
      }

      document.getElementById("match_date").addEventListener("change", (e) => {
        if (e.target.value) {
          const selectedDateTime = new Date(e.target.value)
          const now = new Date()
          const statusSelect = document.getElementById("status")
          const completedOption = statusSelect.querySelector('option[value="completed"]')
          
          if (selectedDateTime <= now) {
            completedOption.disabled = false
            completedOption.textContent = "Terminé"
          } else {
            completedOption.disabled = true
            completedOption.textContent = "Terminé (date non passée)"
            if (statusSelect.value === "completed") {
              statusSelect.value = "scheduled"
            }
          }

          checkTeamConflictsOnDateChange()
        }
      })
      const validateTeams = () => {
        const homeTeam = document.getElementById("home_team_id").value
        const awayTeam = document.getElementById("away_team_id").value
        
        if (homeTeam && awayTeam && homeTeam === awayTeam) {
          alert("Les deux équipes doivent être différentes")
          return false
        }
        return true
      }

      this.app.fetchData("../controllers/TeamController.php?action=getAll").then((teams) => {
        const homeSelect = document.getElementById("home_team_id")
        const awaySelect = document.getElementById("away_team_id")
        
        teams.forEach((team) => {
          const homeOption = document.createElement("option")
          homeOption.value = team.id
          homeOption.textContent = `${team.name} (${team.city})`
          if (team.id == (match.home_team_id || match.opponent_team_id)) {
            homeOption.selected = true
          }
          homeSelect.appendChild(homeOption)

          const awayOption = document.createElement("option")
          awayOption.value = team.id
          awayOption.textContent = `${team.name} (${team.city})`
          if (team.id == (match.away_team_id || match.opponent_team_id)) {
            awayOption.selected = true
          }
          awaySelect.appendChild(awayOption)
        })

        homeSelect.addEventListener("change", () => {
          validateTeams()
          checkTeamConflictsOnDateChange()
        })
        awaySelect.addEventListener("change", () => {
          validateTeams()
          checkTeamConflictsOnDateChange()
        })
        
        checkTeamConflictsOnDateChange()
      })

      document.getElementById("edit-match-form").addEventListener("submit", async (e) => {
        e.preventDefault()

        if (!validateTeams()) {
          return
        }

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
          } else {
            alert("Erreur lors de la modification: " + (result.error || "Erreur inconnue"))
          }
        } catch (error) {
          console.error("Erreur lors de la modification du match:", error)
          alert("Erreur lors de la modification du match")
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

    try {
      const match = await this.app.fetchData(`../controllers/MatchController.php?action=getOne&id=${matchId}`)

      if (match.status !== "completed") {
        alert("Impossible d'ajouter le score : le match doit d'abord être marqué comme 'Terminé'")
        return
      }

      if ((match.home_score != 0 || match.away_score != 0)) {
        alert("Le score a déjà été saisi pour ce match")
        return
      }
      
      const content = `
        <form id="update-score-form">
          <h4>Saisie du score :</h4>
          <div class="match-info" style="margin-bottom: 1rem; padding: 1rem; background: #252545;color: white; border-radius: 0.5rem;">
            <h5>${match.home_team_name || 'Équipe 1'} vs ${match.away_team_name || match.opponent_name || 'Équipe 2'}</h5>
            <p><strong>Date:</strong> ${new Date(match.match_date).toLocaleDateString("fr-FR")}</p>
            <p><strong>Heure:</strong> ${new Date(match.match_date).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Lieu:</strong> ${match.location}</p>
            <p><strong>Statut:</strong> <span class="text-success">Terminé</span></p>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="home_score">${match.home_team_name || 'Équipe à domicile'}</label>
              <input type="number" id="home_score" name="home_score" min="0" required>
            </div>
            <div class="form-group">
              <label for="away_score">${match.away_team_name || match.opponent_name || 'Équipe visiteur'}</label>
              <input type="number" id="away_score" name="away_score" min="0" required>
            </div>
          </div>
          <div class="form-group">
            <button type="submit" class="btn btn-primary">Enregistrer le score</button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          </div>
        </form>
      `

      window.showModal("Saisir le Score", content)

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
            alert("Score enregistré avec succès!")
          } else {
            alert("Erreur: " + (result.error || "Erreur inconnue"))
          }
        } catch (error) {
          console.error("Erreur lors de l'enregistrement du score:", error)
          alert("Erreur lors de l'enregistrement du score")
        }
      })
    } catch (error) {
      console.error("Erreur lors du chargement du match:", error)
    }
  }

  async viewMatchDetails(matchId) {
    try {
      const stats = await this.app.fetchData(
        `../controllers/StatisticsController.php?action=getMatchStats&match_id=${matchId}`
      )
      const match = await this.app.fetchData(
        `../controllers/MatchController.php?action=getOne&id=${matchId}`
      )

      let statsHtml = `
        <div class="match-details">
          <h4>Détails du match</h4>
          <div class="match-info">
            <p><strong>Équipes:</strong> ${match.home_team_name || 'Équipe 1'} vs ${match.away_team_name || match.opponent_name || 'Équipe 2'}</p>
            <p><strong>Date:</strong> ${new Date(match.match_date).toLocaleDateString("fr-FR")}</p>
            <p><strong>Heure:</strong> ${new Date(match.match_date).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Lieu:</strong> ${match.location}</p>
            <p><strong>Score:</strong> ${match.status === 'completed' && (match.home_score != 0 || match.away_score != 0) ? `${match.home_score || match.our_score} - ${match.away_score || match.opponent_score}` : 'Match non joué'}</p>
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