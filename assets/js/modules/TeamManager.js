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
        actionButtons += `
          <button class="btn btn-secondary" onclick="editTeam(${team.id})" title="Modifier l'équipe">
            <i data-lucide="edit"></i>
          </button>`
      }

      if (this.app.hasPermission("team", "delete")) {
        actionButtons += `
          <button class="btn btn-danger" onclick="deleteTeam(${team.id})" title="Supprimer l'équipe">
            <i data-lucide="trash-2"></i>
          </button>`
      }

      actionButtons += `
        <button class="btn btn-info" onclick="viewTeamDetails(${team.id})" title="Voir les détails">
          <i data-lucide="eye"></i>
        </button>
        <button class="btn btn-success" onclick="manageTeamPlayers(${team.id})" title="Gérer les joueurs">
          <i data-lucide="users"></i>
        </button>`

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

    // Recharge les icônes Lucide
    lucide.createIcons()
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
          await this.loadTeamManagement()
          // Rafraîchir le tableau des joueurs
          await this.app.playerManager.loadPlayers()
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

      const players = await this.app.fetchData("../controllers/PlayerController.php?action=getAll")
      const currentPlayerIds = new Set(teamPlayers.map((p) => Number.parseInt(p.id)))

      // Filtrer pour n'afficher que les joueurs disponibles + ceux déjà dans l'équipe
      const availablePlayers = players.filter(
        (player) => !player.team_id || player.team_id === null || currentPlayerIds.has(Number.parseInt(player.id)),
      )

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
          <label>Joueurs de l'équipe (seuls les joueurs disponibles sont affichés)</label>
          <div class="selection-controls" style="display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); flex-wrap: wrap; background: var(--surface-bg); padding: var(--spacing-md); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
            <button type="button" class="btn btn-secondary btn-sm" onclick="selectAllTeamPlayers()">
              <i data-lucide="check-square" style="width: 14px; height: 14px;"></i>
              Tout sélectionner
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="clearAllTeamPlayers()">
              <i data-lucide="square" style="width: 14px; height: 14px;"></i>
              Tout désélectionner
            </button>
            <div class="selected-count" style="margin-left: auto; padding: var(--spacing-sm) var(--spacing-md); background: var(--card-bg); border-radius: var(--radius-md); font-size: 0.875rem; color: var(--text-secondary); display: flex; align-items: center; gap: var(--spacing-xs);">
              👥 <span id="edit-selected-players-count">${currentPlayerIds.size}</span> joueur(s) sélectionné(s)
            </div>
          </div>
          
          <div class="players-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-md); max-height: 400px; overflow-y: auto; padding: var(--spacing-sm);">
            ${availablePlayers
              .map((player) => {
                const isSelected = currentPlayerIds.has(Number.parseInt(player.id))
                const isCurrentlyInTeam = currentPlayerIds.has(Number.parseInt(player.id))
                const healthColor =
                  player.health_status === "healthy"
                    ? "var(--success)"
                    : player.health_status === "injured"
                      ? "var(--error)"
                      : "var(--warning)"

                return `
                    <div class="player-card" style="
                      background: var(--card-bg);
                      border: 2px solid ${isSelected ? "var(--primary-orange)" : "var(--border-color)"};
                      border-radius: var(--radius-lg);
                      padding: var(--spacing-md);
                      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                      cursor: pointer;
                      position: relative;
                      ${isSelected ? "box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);" : ""}
                    " onclick="toggleEditPlayerSelection(this, ${player.id})">
                      
                      <input type="checkbox" name="team_players[]" value="${player.id}" 
                             ${isSelected ? "checked" : ""} 
                             style="position: absolute; top: var(--spacing-md); right: var(--spacing-md); width: 18px; height: 18px; cursor: pointer;"
                             onchange="updateEditSelectedCount()">
                      
                      <div class="player-info">
                        <div class="player-header" style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm);">
                          <div class="player-avatar" style="
                            width: 36px; 
                            height: 36px; 
                            background: linear-gradient(135deg, var(--primary-orange), var(--secondary-orange)); 
                            border-radius: 50%; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            color: white; 
                            font-weight: 600;
                            font-size: 0.8rem;
                          ">
                            ${player.first_name.charAt(0)}${player.last_name.charAt(0)}
                          </div>
                          <div class="player-name" style="flex: 1;">
                            <div style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">
                              ${player.first_name} ${player.last_name}
                              ${isCurrentlyInTeam ? '<span style="color: var(--primary-orange); font-size: 0.7rem;">(Actuel)</span>' : ""}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">
                              ${player.position} • #${player.jersey_number}
                            </div>
                          </div>
                        </div>
                        
                        <div class="player-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm); margin-top: var(--spacing-sm);">
                          <div class="stat-item" style="text-align: center; padding: var(--spacing-xs); background: var(--surface-bg); border-radius: var(--radius-sm);">
                            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Taille</div>
                            <div style="font-weight: 600; color: var(--text-primary); font-size: 0.8rem;">${player.height || "N/A"}</div>
                          </div>
                          <div class="stat-item" style="text-align: center; padding: var(--spacing-xs); background: var(--surface-bg); border-radius: var(--radius-sm);">
                            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Poids</div>
                            <div style="font-weight: 600; color: var(--text-primary); font-size: 0.8rem;">${player.weight || "N/A"}</div>
                          </div>
                        </div>
                        
                        <div class="player-status" style="margin-top: var(--spacing-sm); text-align: center;">
                          <span class="status-badge" style="
                            background: rgba(${healthColor === "var(--success)" ? "74, 222, 128" : healthColor === "var(--error)" ? "239, 68, 68" : "251, 191, 36"}, 0.2);
                            color: ${healthColor};
                            padding: var(--spacing-xs) var(--spacing-sm);
                            border-radius: var(--radius-sm);
                            font-size: 0.7rem;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            display: inline-flex;
                            align-items: center;
                            gap: var(--spacing-xs);
                          ">
                            <i data-lucide="${player.health_status === "healthy" ? "heart" : player.health_status === "injured" ? "heart-crack" : "heart-pulse"}" style="width: 10px; height: 10px;"></i>
                            ${player.health_status === "healthy" ? "En forme" : player.health_status === "injured" ? "Blessé" : "Récupération"}
                          </span>
                        </div>
                      </div>
                    </div>
                  `
              })
              .join("")}
          </div>
        </div>
        
        <div class="form-group" style="margin-top: var(--spacing-xl); padding-top: var(--spacing-lg); border-top: 1px solid var(--border-color);">
          <div style="display: flex; gap: var(--spacing-md); justify-content: center; flex-wrap: wrap;">
            <button type="submit" class="btn btn-primary" style="min-width: 180px;">
              <i data-lucide="save" style="width: 16px; height: 16px;"></i>
              Modifier l'équipe
            </button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()" style="min-width: 120px;">
              <i data-lucide="x" style="width: 16px; height: 16px;"></i>
              Annuler
            </button>
          </div>
        </div>
      </form>
    `

      window.showModal("Modifier l'Équipe", content, "large")

      // Initialiser les icônes Lucide après avoir ajouté le contenu
      setTimeout(() => {
        lucide.createIcons()
      }, 100)

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
            await this.loadTeamManagement()

            // CORRECTION: Rafraîchir le tableau des joueurs ET les selects
            await this.app.playerManager.loadPlayers()
            await this.app.playerManager.refreshPlayerSelects()

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

    if (confirm("Êtes-vous sûr de vouloir supprimer cette équipe ? Les joueurs seront libérés.")) {
      try {
        const result = await this.app.postData("../controllers/TeamController.php", {
          action: "delete",
          id: id,
        })
        if (result.success) {
          await this.loadTeamManagement()

          // CORRECTION: Rafraîchir le tableau des joueurs ET les selects
          await this.app.playerManager.loadPlayers()
          await this.app.playerManager.refreshPlayerSelects()

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

      // Filtrer pour n'afficher que les joueurs disponibles + ceux déjà dans l'équipe
      const availablePlayers = players.filter(
        (player) => !player.team_id || player.team_id === null || currentPlayerIds.has(Number.parseInt(player.id)),
      )

      const content = `
      <div class="team-player-management">
        <div class="section-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: var(--spacing-lg); margin-bottom: var(--spacing-xl);">
          <h4 style="color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: var(--spacing-sm);">
            <i data-lucide="users" style="width: 20px; height: 20px;"></i>
            Gérer les joueurs - ${team.name}
          </h4>
          <p style="color: var(--text-secondary); margin: var(--spacing-sm) 0 0 0; font-size: 0.9rem;">
            Sélectionnez les joueurs disponibles qui feront partie de cette équipe
          </p>
        </div>
        
        <div class="player-assignment">
          <div class="form-group">
            <div class="selection-controls" style="display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); flex-wrap: wrap; background: var(--surface-bg); padding: var(--spacing-md); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
              <button type="button" class="btn btn-secondary btn-sm" onclick="selectAllTeamPlayers()">
                <i data-lucide="check-square" style="width: 14px; height: 14px;"></i>
                Tout sélectionner
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="clearAllTeamPlayers()">
                <i data-lucide="square" style="width: 14px; height: 14px;"></i>
                Tout désélectionner
              </button>
              <div class="selected-count" style="margin-left: auto; padding: var(--spacing-sm) var(--spacing-md); background: var(--card-bg); border-radius: var(--radius-md); font-size: 0.875rem; color: var(--text-secondary); display: flex; align-items: center; gap: var(--spacing-xs);">
                👥 <span id="selected-players-count">${currentPlayerIds.size}</span> joueur(s) sélectionné(s)
              </div>
            </div>
          </div>
          
          <div class="players-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--spacing-md); max-height: 500px; overflow-y: auto; padding: var(--spacing-sm);">
            ${availablePlayers
              .map((player) => {
                const isSelected = currentPlayerIds.has(Number.parseInt(player.id))
                const isCurrentlyInTeam = currentPlayerIds.has(Number.parseInt(player.id))
                const healthColor =
                  player.health_status === "healthy"
                    ? "var(--success)"
                    : player.health_status === "injured"
                      ? "var(--error)"
                      : "var(--warning)"

                return `
                    <div class="player-card" style="
                      background: var(--card-bg);
                      border: 2px solid ${isSelected ? "var(--primary-orange)" : "var(--border-color)"};
                      border-radius: var(--radius-lg);
                      padding: var(--spacing-md);
                      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                      cursor: pointer;
                      position: relative;
                      ${isSelected ? "box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);" : ""}
                    " onclick="togglePlayerSelection(this, ${player.id})">
                      
                      <input type="checkbox" name="team_players[]" value="${player.id}" 
                             ${isSelected ? "checked" : ""} 
                             style="position: absolute; top: var(--spacing-md); right: var(--spacing-md); width: 18px; height: 18px; cursor: pointer;"
                             onchange="updateSelectedCount()">
                      
                      <div class="player-info">
                        <div class="player-header" style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm);">
                          <div class="player-avatar" style="
                            width: 40px; 
                            height: 40px; 
                            background: linear-gradient(135deg, var(--primary-orange), var(--secondary-orange)); 
                            border-radius: 50%; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            color: white; 
                            font-weight: 600;
                            font-size: 0.9rem;
                          ">
                            ${player.first_name.charAt(0)}${player.last_name.charAt(0)}
                          </div>
                          <div class="player-name" style="flex: 1;">
                            <div style="font-weight: 600; color: var(--text-primary); font-size: 1rem;">
                              ${player.first_name} ${player.last_name}
                              ${isCurrentlyInTeam ? '<span style="color: var(--primary-orange); font-size: 0.8rem;">(Actuel)</span>' : ""}
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">
                              ${player.position} • Numéro #${player.jersey_number}
                            </div>
                          </div>
                        </div>
                        
                        <div class="player-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm); margin-top: var(--spacing-md);">
                          <div class="stat-item" style="text-align: center; padding: var(--spacing-xs); background: var(--surface-bg); border-radius: var(--radius-sm);">
                            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Taille</div>
                            <div style="font-weight: 600; color: var(--text-primary);">${player.height || "N/A"}</div>
                          </div>
                          <div class="stat-item" style="text-align: center; padding: var(--spacing-xs); background: var(--surface-bg); border-radius: var(--radius-sm);">
                            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Poids</div>
                            <div style="font-weight: 600; color: var(--text-primary);">${player.weight || "N/A"}</div>
                          </div>
                        </div>
                        
                        <div class="player-status" style="margin-top: var(--spacing-md); text-align: center;">
                          <span class="status-badge" style="
                            background: rgba(${healthColor === "var(--success)" ? "74, 222, 128" : healthColor === "var(--error)" ? "239, 68, 68" : "251, 191, 36"}, 0.2);
                            color: ${healthColor};
                            padding: var(--spacing-xs) var(--spacing-sm);
                            border-radius: var(--radius-sm);
                            font-size: 0.75rem;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            display: inline-flex;
                            align-items: center;
                            gap: var(--spacing-xs);
                          ">
                            <i data-lucide="${player.health_status === "healthy" ? "heart" : player.health_status === "injured" ? "heart-crack" : "heart-pulse"}" style="width: 12px; height: 12px;"></i>
                            ${player.health_status === "healthy" ? "En forme" : player.health_status === "injured" ? "Blessé" : "En récupération"}
                          </span>
                        </div>
                      </div>
                    </div>
                  `
              })
              .join("")}
          </div>
        </div>
        
        <div class="form-actions" style="
          margin-top: var(--spacing-xl); 
          padding-top: var(--spacing-lg); 
          border-top: 1px solid var(--border-color); 
          display: flex; 
          gap: var(--spacing-md); 
          justify-content: center;
          flex-wrap: wrap;
        ">
          <button class="btn btn-primary" onclick="saveTeamPlayers(${teamId})" style="min-width: 200px;">
            <i data-lucide="save" style="width: 16px; height: 16px;"></i>
            Sauvegarder les changements
          </button>
          <button class="btn btn-secondary" onclick="closeModal()" style="min-width: 120px;">
            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
            Annuler
          </button>
        </div>
      </div>
    `

      window.showModal("Gérer les Joueurs", content, "large")

      // Initialiser les icônes Lucide après avoir ajouté le contenu
      setTimeout(() => {
        lucide.createIcons()
      }, 100)
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
        await this.loadTeamManagement()

        // CORRECTION: Rafraîchir le tableau des joueurs ET les selects
        await this.app.playerManager.loadPlayers()
        await this.app.playerManager.refreshPlayerSelects()

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
