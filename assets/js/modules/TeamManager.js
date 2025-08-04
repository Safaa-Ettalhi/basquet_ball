export class TeamManager {
  constructor(app) {
    this.app = app
  }

  async loadTeamManagement() {
    if (!this.app.hasPermission("team", "manage")) return

    try {
      const teams = await this.app.fetchData("../controllers/TeamController.php?action=getAll")
      console.log("Teams loaded:", teams)
      this.displayTeams(teams)
    } catch (error) {
      console.error("Erreur lors du chargement de la gestion d'équipe:", error)
      const tbody = document.querySelector("#teams-table tbody")
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; color: #dc3545; padding: 2rem;">
              Erreur lors du chargement des équipes. Vérifiez la console pour plus de détails.
            </td>
          </tr>
        `
      }
    }
  }

  displayTeams(teams) {
    const tbody = document.querySelector("#teams-table tbody")
    if (!tbody) return

    tbody.innerHTML = ""
    if (teams.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: #6c757d; font-style: italic; padding: 2rem;">
            Aucune équipe créée. Cliquez sur "Ajouter une équipe" pour commencer.
          </td>
        </tr>
      `
      return
    }

    teams.forEach((team) => {
      const row = document.createElement("tr")
      let actionButtons = ""

      if (this.app.hasPermission("team", "update")) {
        actionButtons += `<button class="btn btn-secondary btn-sm" onclick="editTeam(${team.id})" title="Modifier l'équipe">✏️ Modifier</button>`
      }
      if (this.app.hasPermission("team", "delete")) {
        actionButtons += `<button class="btn btn-danger btn-sm" onclick="deleteTeam(${team.id})" title="Supprimer l'équipe">🗑️ Supprimer</button>`
      }
      actionButtons += `<button class="btn btn-info btn-sm" onclick="viewTeamDetails(${team.id})" title="Voir les détails">👁️ Détails</button>`
      actionButtons += `<button class="btn btn-success btn-sm" onclick="manageTeamPlayers(${team.id})" title="Gérer les joueurs">👥 Gérer Joueurs</button>`

      row.innerHTML = `
        <td style="font-weight: 500;">${team.name}</td>
        <td>${team.city}</td>
        <td>
          <span class="badge" style="background-color: ${team.player_count > 0 ? "#28a745" : "#6c757d"}; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">
            ${team.player_count || 0} joueur(s)
          </span>
        </td>
        <td class="action-buttons">
          ${actionButtons}
        </td>
      `
      tbody.appendChild(row)
    })
  }

  showAddTeamModal() {
    if (!this.app.hasPermission("team", "create")) {
      alert("Vous n'avez pas les permissions pour créer une équipe")
      return
    }

    const content = `
      <form id="add-team-form">
        <div class="form-group">
          <label for="name">Nom de l'équipe</label>
          <input type="text" id="name" name="name" required>
        </div>
        <div class="form-group">
          <label for="city">Ville</label>
          <input type="text" id="city" name="city" required>
        </div>
        <div class="form-group">
          <button type="submit" class="btn btn-primary">Créer l'équipe</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </form>
    `

    window.showModal("Créer une Équipe", content)

    document.getElementById("add-team-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "create"

      try {
        const result = await this.app.postData("../controllers/TeamController.php", data)
        if (result.success) {
          window.closeModal()
          this.loadTeamManagement()
          alert("Équipe créée avec succès!")
        }
      } catch (error) {
        console.error("Erreur lors de la création de l'équipe:", error)
      }
    })
  }

  async editTeam(id) {
    if (!this.app.hasPermission("team", "update")) {
      alert("Vous n'avez pas les permissions pour modifier une équipe")
      return
    }

    try {
      const team = await this.app.fetchData(`../controllers/TeamController.php?action=getOne&id=${id}`)
      const teamPlayers = await this.app.fetchData(
        `../controllers/TeamController.php?action=getTeamPlayers&team_id=${id}`,
      )

      if (!team) {
        alert("Équipe non trouvée")
        return
      }

      const content = `
        <form id="edit-team-form">
          <div class="form-group">
            <label for="name">Nom de l'équipe</label>
            <input type="text" id="name" name="name" value="${team.name}" required>
          </div>
          <div class="form-group">
            <label for="city">Ville</label>
            <input type="text" id="city" name="city" value="${team.city}" required>
          </div>
          <div class="form-group">
            <label>Joueurs de l'équipe</label>
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="selectAllTeamPlayers()">Tout sélectionner</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="clearAllTeamPlayers()">Tout désélectionner</button>
            </div>
            <div class="players-list" style="max-height: 300px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 5px; padding: 1rem;">
              <div id="edit-team-players-checkboxes">
                <!-- Les joueurs seront chargés ici -->
              </div>
            </div>
          </div>
          <div class="form-group">
            <button type="submit" class="btn btn-primary">Modifier l'équipe</button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          </div>
        </form>
      `

      window.showModal("Modifier l'Équipe", content)

      
      const players = await this.app.fetchData("../controllers/PlayerController.php?action=getAll")
      const currentPlayerIds = new Set(teamPlayers.map((p) => Number.parseInt(p.id)))
      const container = document.getElementById("edit-team-players-checkboxes")

      players.forEach((player) => {
        const div = document.createElement("div")
        div.className = "player-checkbox"
        div.style.marginBottom = "0.75rem"
        div.innerHTML = `
          <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; padding: 0.5rem; border-radius: 5px; transition: background-color 0.2s;"
                 onmouseover="this.style.backgroundColor='#f8f9fa'"
                 onmouseout="this.style.backgroundColor='transparent'">
            <input type="checkbox" name="team_players[]" value="${player.id}"
                   ${currentPlayerIds.has(Number.parseInt(player.id)) ? "checked" : ""} style="margin: 0;">
            <div style="flex: 1;">
              <div style="font-weight: 500;">${player.first_name} ${player.last_name}</div>
              <div style="font-size: 0.85rem; color: #6c757d;">
                ${player.position} • #${player.jersey_number} •
                <span style="color: ${player.health_status === "healthy" ? "#28a745" : player.health_status === "injured" ? "#dc3545" : "#ffc107"};">
                  ${player.health_status}
                </span>
              </div>
            </div>
          </label>
        `
        container.appendChild(div)
      })

      document.getElementById("edit-team-form").addEventListener("submit", async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = Object.fromEntries(formData)

       
        const selectedPlayers = []
        const checkboxes = document.querySelectorAll('input[name="team_players[]"]:checked')
        checkboxes.forEach((checkbox) => {
          selectedPlayers.push(Number.parseInt(checkbox.value))
        })

        data.action = "update"
        data.id = id

        try {
          const result = await this.app.postData("../controllers/TeamController.php", data)
          if (result.success) {
            await this.app.postData("../controllers/TeamController.php", {
              action: "assignPlayers",
              team_id: id,
              player_ids: selectedPlayers,
            })

            window.closeModal()
            this.loadTeamManagement()
            alert(`Équipe modifiée avec succès! ${selectedPlayers.length} joueur(s) assigné(s).`)
          } else {
            alert("Erreur lors de la modification de l'équipe: " + (result.error || "Erreur inconnue"))
          }
        } catch (error) {
          console.error("Erreur lors de la modification de l'équipe:", error)
          alert("Erreur lors de la modification de l'équipe: " + error.message)
        }
      })
    } catch (error) {
      console.error("Erreur lors du chargement de l'équipe:", error)
      alert("Erreur lors du chargement de l'équipe")
    }
  }

  async deleteTeam(id) {
    if (!this.app.hasPermission("team", "delete")) {
      alert("Vous n'avez pas les permissions pour supprimer une équipe")
      return
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer cette équipe ?")) {
      try {
        const result = await this.app.postData("../controllers/TeamController.php", {
          action: "delete",
          id: id,
        })
        if (result.success) {
          this.loadTeamManagement()
          alert("Équipe supprimée avec succès!")
        }
      } catch (error) {
        console.error("Erreur lors de la suppression de l'équipe:", error)
      }
    }
  }

  async viewTeamDetails(id) {
    try {
      const teams = await this.app.fetchData("../controllers/TeamController.php?action=getAll")
      const team = teams.find((t) => t.id == id)

      const players = await this.app.fetchData("../controllers/PlayerController.php?action=getAll")
      const teamPlayers = players.filter((p) => p.team_id == id)

      const detailsHtml = `
        <div class="team-details">
          <h4>Détails de l'équipe</h4>
          <div class="detail-item">
            <strong>Nom:</strong>
            <span>${team.name}</span>
          </div>
          <div class="detail-item">
            <strong>Ville:</strong>
            <span>${team.city}</span>
          </div>
          <div class="detail-item">
            <strong>Nombre de joueurs:</strong>
            <span>${teamPlayers.length}</span>
          </div>
          <h5>Joueurs de l'équipe:</h5>
          <div class="team-players">
            ${
              teamPlayers.length > 0
                ? teamPlayers
                    .map(
                      (player) => `
                <div class="player-item">
                  <span>${player.first_name} ${player.last_name}</span>
                  <span class="player-position">${player.position}</span>
                  <span class="player-number">#${player.jersey_number}</span>
                </div>
              `,
                    )
                    .join("")
                : "<p>Aucun joueur dans cette équipe</p>"
            }
          </div>
          <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
        </div>
      `
      window.showModal("Détails de l'Équipe", detailsHtml)
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
    }
  }

  async manageTeamPlayers(teamId) {
    if (!this.app.hasPermission("team", "manage")) {
      alert("Vous n'avez pas les permissions pour gérer les joueurs d'équipe")
      return
    }

    try {
      const players = await this.app.fetchData("../controllers/PlayerController.php?action=getAll")
      const team = await this.app.fetchData(`../controllers/TeamController.php?action=getOne&id=${teamId}`)
      const teamPlayers = await this.app.fetchData(
        `../controllers/TeamController.php?action=getTeamPlayers&team_id=${teamId}`,
      )

      if (!team) {
        alert("Équipe non trouvée")
        return
      }

     
      const currentPlayerIds = new Set(teamPlayers.map((p) => Number.parseInt(p.id)))

      const content = `
        <div class="team-player-management">
          <h4>Gérer les joueurs - ${team.name}</h4>
          <p style="color: #6c757d; margin-bottom: 1rem;">Sélectionnez les joueurs qui feront partie de cette équipe</p>
          <div class="player-assignment">
            <div class="form-group">
              <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="selectAllTeamPlayers()">Tout sélectionner</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="clearAllTeamPlayers()">Tout désélectionner</button>
              </div>
            </div>
            <div class="players-list" style="max-height: 400px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 5px; padding: 1rem;">
              ${players
                .map(
                  (player) => `
                <div class="player-checkbox" style="margin-bottom: 0.75rem;">
                  <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; padding: 0.5rem; border-radius: 5px; transition: background-color 0.2s;"
                          onmouseover="this.style.backgroundColor='#f8f9fa'"
                          onmouseout="this.style.backgroundColor='transparent'">
                    <input type="checkbox" name="team_players[]" value="${player.id}"
                            ${currentPlayerIds.has(Number.parseInt(player.id)) ? "checked" : ""}
                           style="margin: 0;">
                    <div style="flex: 1;">
                      <div style="font-weight: 500;">${player.first_name} ${player.last_name}</div>
                      <div style="font-size: 0.85rem; color: #6c757d;">
                        ${player.position} • #${player.jersey_number} •
                         <span style="color: ${player.health_status === "healthy" ? "#28a745" : player.health_status === "injured" ? "#dc3545" : "#ffc107"};">
                          ${player.health_status}
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          <div class="form-actions" style="margin-top: 1.5rem; text-align: center;">
            <button class="btn btn-primary" onclick="saveTeamPlayers(${teamId})">💾 Sauvegarder les changements</button>
            <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          </div>
        </div>
      `

      window.showModal("Gérer les Joueurs", content)
    } catch (error) {
      console.error("Erreur lors du chargement de la gestion des joueurs:", error)
      alert("Erreur lors du chargement de la gestion des joueurs")
    }
  }

  async saveTeamPlayers(teamId) {
    const checkboxes = document.querySelectorAll('input[name="team_players[]"]')
    const selectedPlayers = []
    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        selectedPlayers.push(Number.parseInt(checkbox.value))
      }
    })

    try {
      const result = await this.app.postData("../controllers/TeamController.php", {
        action: "assignPlayers",
        team_id: teamId,
        player_ids: selectedPlayers,
      })
      if (result.success) {
        window.closeModal()
        this.loadTeamManagement()
        alert("Joueurs assignés avec succès!")
      }
    } catch (error) {
      console.error("Erreur lors de l'assignation des joueurs:", error)
    }
  }

  selectAllTeamPlayers() {
    const checkboxes = document.querySelectorAll('input[name="team_players[]"]')
    checkboxes.forEach((checkbox) => {
      checkbox.checked = true
    })
  }

  clearAllTeamPlayers() {
    const checkboxes = document.querySelectorAll('input[name="team_players[]"]')
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false
    })
  }
}
