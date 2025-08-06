export class StatisticsManager {
  constructor(app) {
    this.app = app
    this.lucide = window.lucide 
  }

  async loadAllStatistics() {
    try {
      console.log("Chargement de toutes les statistiques...")
      const statistics = await this.app.fetchData("../controllers/StatisticsController.php?action=getAll")
      console.log("Statistiques chargées:", statistics)
      this.app.allStatistics = statistics
      this.displayAllStatistics(statistics)
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error)
      const tbody = document.querySelector("#statistics-table tbody")
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" style="text-align: center; color: #dc3545; padding: 2rem;">
              Erreur lors du chargement des statistiques. Vérifiez la console pour plus de détails.
            </td>
          </tr>
        `
      }
    }
  }

  displayAllStatistics(statistics) {
    const tbody = document.querySelector("#statistics-table tbody")
    if (!tbody) return

    tbody.innerHTML = ""
    if (statistics.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: #6c757d; font-style: italic; padding: 2rem;">
            Aucune statistique disponible. Ajoutez des statistiques pour les voir ici.
          </td>
        </tr>
      `
      return
    }

    statistics.forEach((stat) => {
      const row = document.createElement("tr")
      const matchDate = new Date(stat.match_date).toLocaleDateString("fr-FR")
      let actionButtons = ""

      if (this.app.hasPermission("statistics", "update")) {
        actionButtons += `
          <button class="btn btn-secondary" onclick="editStatistic(${stat.id})" title="Modifier">
            <i data-lucide="edit"></i>
          </button>`
      }
      if (this.app.hasPermission("statistics", "delete")) {
        actionButtons += `
          <button class="btn btn-danger" onclick="deleteStatistic(${stat.id})" title="Supprimer">
            <i data-lucide="trash-2"></i>
          </button>`
      }

      actionButtons += `
        <button class="btn btn-info" onclick="viewStatisticDetails(${stat.id})" title="Détails">
          <i data-lucide="eye"></i>
        </button>`

      row.innerHTML = `
        <td style="font-weight: 500;">${stat.first_name} ${stat.last_name}</td>
        <td>${stat.opponent_name}</td>
        <td>${matchDate}</td>
        <td><span style="font-weight: bold; color: #e74c3c;">${stat.points}</span></td>
        <td><span style="font-weight: bold; color: #27ae60;">${stat.rebounds}</span></td>
        <td><span style="font-weight: bold; color: #3498db;">${stat.assists}</span></td>
        <td>${stat.minutes_played}'</td>
        <td><span style="font-weight: bold; color: #f39c12;">${stat.fg_percentage}%</span></td>
        <td class="action-buttons">
          ${actionButtons}
        </td>
      `

      tbody.appendChild(row)
    })

    // Recharge les icônes Lucide après injection
    if (this.lucide) {
      this.lucide.createIcons()
    }
  }

  async populateStatisticsFilters() {
    try {
      const players = await this.app.fetchData("../controllers/PlayerController.php?action=getAll")
      const matches = await this.app.fetchData("../controllers/MatchController.php?action=getAll")
      const playerSelect = document.getElementById("filter-player-select")
      if (playerSelect) {
        playerSelect.innerHTML = '<option value="">Tous les joueurs</option>'
        players.forEach((player) => {
          const option = document.createElement("option")
          option.value = player.id
          option.textContent = `${player.first_name} ${player.last_name}`
          playerSelect.appendChild(option)
        })
      }
      const matchSelect = document.getElementById("filter-match-select")
      if (matchSelect) {
        matchSelect.innerHTML = '<option value="">Tous les matchs</option>'
        matches.forEach((match) => {
          const option = document.createElement("option")
          option.value = match.id
          const matchDate = new Date(match.match_date).toLocaleDateString("fr-FR")
          option.textContent = `${match.opponent_name || "Adversaire"} - ${matchDate}`
          matchSelect.appendChild(option)
        })
      }
    } catch (error) {
      console.error("Erreur lors du chargement des filtres:", error)
    }
  }

  filterStatistics() {
    const playerFilter = document.getElementById("filter-player-select").value
    const matchFilter = document.getElementById("filter-match-select").value
    let filteredStats = this.app.allStatistics

    if (playerFilter) {
      filteredStats = filteredStats.filter((stat) => stat.player_id == playerFilter)
    }
    if (matchFilter) {
      filteredStats = filteredStats.filter((stat) => stat.match_id == matchFilter)
    }

    this.displayAllStatistics(filteredStats)
  }

  async addPlayerStats(playerId) {
    if (!playerId) {
      alert("ID du joueur manquant")
      return
    }
    if (!this.app.hasPermission("statistics", "create")) {
      alert("Vous n'avez pas les permissions pour ajouter des statistiques")
      return
    }

    try {
      // Charger les matchs terminés et les statistiques existantes
      const [matches, existingStats] = await Promise.all([
        this.app.fetchData("../controllers/MatchController.php?action=getAll"),
        this.app.fetchData(`../controllers/StatisticsController.php?action=getAll&player_id=${playerId}`),
      ])

      const completedMatches = matches.filter((match) => match.status === "completed")

      if (completedMatches.length === 0) {
        alert("Aucun match terminé disponible pour ajouter des statistiques")
        return
      }

      // Filtrer les matchs pour lesquels le joueur n'a pas encore de statistiques
      const availableMatches = completedMatches.filter(
        (match) => !existingStats.some((stat) => stat.match_id == match.id),
      )

      if (availableMatches.length === 0) {
        alert("Ce joueur a déjà des statistiques pour tous les matchs terminés")
        return
      }

      const content = `
        <form id="add-stats-form">
          <div class="form-group">
            <label for="match_id">Match disponible</label>
            <select id="match_id" name="match_id" required>
              <option value="">Sélectionner un match</option>
              ${availableMatches
                .map(
                  (match) => `
                <option value="${match.id}">
                  ${match.opponent_name || "Adversaire"} - ${new Date(match.match_date).toLocaleDateString("fr-FR")}
                </option>
              `,
                )
                .join("")}
            </select>
            <small class="form-text text-muted">
              ${availableMatches.length} match(s) disponible(s) pour ce joueur
            </small>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="points">Points</label>
              <input type="number" id="points" name="points" min="0" value="0" required>
            </div>
            <div class="form-group">
              <label for="rebounds">Rebonds</label>
              <input type="number" id="rebounds" name="rebounds" min="0" value="0" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="assists">Passes</label>
              <input type="number" id="assists" name="assists" min="0" value="0" required>
            </div>
            <div class="form-group">
              <label for="steals">Interceptions</label>
              <input type="number" id="steals" name="steals" min="0" value="0" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="blocks">Contres</label>
              <input type="number" id="blocks" name="blocks" min="0" value="0" required>
            </div>
            <div class="form-group">
              <label for="turnovers">Balles perdues</label>
              <input type="number" id="turnovers" name="turnovers" min="0" value="0" required>
            </div>
          </div>
          <div class="form-group">
            <label for="minutes_played">Minutes jouées</label>
            <input type="number" id="minutes_played" name="minutes_played" min="0" max="48" value="0" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="field_goals_made">Tirs réussis</label>
              <input type="number" id="field_goals_made" name="field_goals_made" min="0" value="0" required>
            </div>
            <div class="form-group">
              <label for="field_goals_attempted">Tirs tentés</label>
              <input type="number" id="field_goals_attempted" name="field_goals_attempted" min="0" value="0" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="three_points_made">3 points réussis</label>
              <input type="number" id="three_points_made" name="three_points_made" min="0" value="0" required>
            </div>
            <div class="form-group">
              <label for="three_points_attempted">3 points tentés</label>
              <input type="number" id="three_points_attempted" name="three_points_attempted" min="0" value="0" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="free_throws_made">LF réussis</label>
              <input type="number" id="free_throws_made" name="free_throws_made" min="0" value="0" required>
            </div>
            <div class="form-group">
              <label for="free_throws_attempted">LF tentés</label>
              <input type="number" id="free_throws_attempted" name="free_throws_attempted" min="0" value="0" required>
            </div>
          </div>
          <div class="form-group">
            <button type="submit" class="btn btn-primary">Ajouter les statistiques</button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          </div>
        </form>
      `

      window.showModal("Ajouter des Statistiques", content)

      document.getElementById("add-stats-form").addEventListener("submit", async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = Object.fromEntries(formData)
        data.action = "addStats"
        data.player_id = playerId

        
        if (!data.match_id) {
          alert("Veuillez sélectionner un match")
          return
        }

        const numericFields = [
          "points",
          "rebounds",
          "assists",
          "steals",
          "blocks",
          "turnovers",
          "minutes_played",
          "field_goals_made",
          "field_goals_attempted",
          "three_points_made",
          "three_points_attempted",
          "free_throws_made",
          "free_throws_attempted",
        ]

        for (const field of numericFields) {
          if (data[field] === "" || isNaN(data[field]) || data[field] < 0) {
            alert(`Valeur invalide pour ${field}`)
            return
          }
          data[field] = Number.parseInt(data[field])
        }

        // Validations
        if (Number.parseInt(data.field_goals_made) > Number.parseInt(data.field_goals_attempted)) {
          alert("Les tirs réussis ne peuvent pas être supérieurs aux tirs tentés")
          return
        }
        if (Number.parseInt(data.three_points_made) > Number.parseInt(data.three_points_attempted)) {
          alert("Les 3 points réussis ne peuvent pas être supérieurs aux 3 points tentés")
          return
        }
        if (Number.parseInt(data.free_throws_made) > Number.parseInt(data.free_throws_attempted)) {
          alert("Les lancers francs réussis ne peuvent pas être supérieurs aux lancers francs tentés")
          return
        }
        if (Number.parseInt(data.minutes_played) > 48) {
          alert("Les minutes jouées ne peuvent pas dépasser 48")
          return
        }

        try {
          console.log("Envoi des données:", data)
          const response = await fetch("../controllers/StatisticsController.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()
          console.log("Résultat reçu:", result)

          if (result.success) {
            window.closeModal()
            alert("Statistiques ajoutées avec succès!")
            if (this.app.currentSection === "statistics") {
              this.loadAllStatistics()
            }
          } else {
            alert("Erreur lors de l'ajout des statistiques: " + (result.error || "Erreur inconnue"))
          }
        } catch (error) {
          console.error("Erreur lors de l'ajout des statistiques:", error)
          alert("Erreur lors de l'ajout des statistiques: " + error.message)
        }
      })
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      alert("Erreur lors du chargement des matchs disponibles")
    }
  }

  // Méthode pour vérifier les matchs disponibles pour un joueur
  async getAvailableMatchesForPlayer(playerId) {
    try {
      const [matches, existingStats] = await Promise.all([
        this.app.fetchData("../controllers/MatchController.php?action=getAll"),
        this.app.fetchData(`../controllers/StatisticsController.php?action=getAll&player_id=${playerId}`),
      ])

      const completedMatches = matches.filter((match) => match.status === "completed")

      return completedMatches.filter((match) => !existingStats.some((stat) => stat.match_id == match.id))
    } catch (error) {
      console.error("Erreur lors du chargement des matchs disponibles:", error)
      return []
    }
  }

  async loadPlayerStats() {
    const playerId = document.getElementById("player-select").value
    if (!playerId) {
      document.getElementById("player-stats-display").innerHTML = ""
      return
    }

    try {
      const stats = await this.app.fetchData(
        `../controllers/StatisticsController.php?action=getPlayerStats&player_id=${playerId}`,
      )
      const statsHtml = `
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
          <span>% aux tirs:</span>
          <span>${Number.parseFloat(stats.fg_percentage || 0).toFixed(1)}%</span>
        </div>
        <div class="stat-item">
          <span>% à 3 points:</span>
          <span>${Number.parseFloat(stats.three_point_percentage || 0).toFixed(1)}%</span>
        </div>
      `
      document.getElementById("player-stats-display").innerHTML = statsHtml
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error)
      document.getElementById("player-stats-display").innerHTML = "<p>Erreur lors du chargement des statistiques</p>"
    }
  }

  async editStatistic(id) {
    if (!this.app.hasPermission("statistics", "update")) {
      alert("Vous n'avez pas les permissions pour modifier une statistique")
      return
    }

    try {
      const statistic = await this.app.fetchData(`../controllers/StatisticsController.php?action=getOne&id=${id}`)
      const content = `
      <form id="edit-statistic-form">
        <div class="form-row">
          <div class="form-group">
            <label for="points">Points</label>
            <input type="number" id="points" name="points" value="${statistic.points}" min="0" required>
          </div>
          <div class="form-group">
            <label for="rebounds">Rebonds</label>
            <input type="number" id="rebounds" name="rebounds" value="${statistic.rebounds}" min="0" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="assists">Passes</label>
            <input type="number" id="assists" name="assists" value="${statistic.assists}" min="0" required>
          </div>
          <div class="form-group">
            <label for="steals">Interceptions</label>
            <input type="number" id="steals" name="steals" value="${statistic.steals}" min="0" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="blocks">Contres</label>
            <input type="number" id="blocks" name="blocks" value="${statistic.blocks}" min="0" required>
          </div>
          <div class="form-group">
            <label for="turnovers">Balles perdues</label>
            <input type="number" id="turnovers" name="turnovers" value="${statistic.turnovers}" min="0" required>
          </div>
        </div>
        <div class="form-group">
          <label for="minutes_played">Minutes jouées</label>
          <input type="number" id="minutes_played" name="minutes_played" value="${statistic.minutes_played}" min="0" max="48" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="field_goals_made">Tirs réussis</label>
            <input type="number" id="field_goals_made" name="field_goals_made" value="${statistic.field_goals_made}" min="0" required>
          </div>
          <div class="form-group">
            <label for="field_goals_attempted">Tirs tentés</label>
            <input type="number" id="field_goals_attempted" name="field_goals_attempted" value="${statistic.field_goals_attempted}" min="0" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="three_points_made">3 points réussis</label>
            <input type="number" id="three_points_made" name="three_points_made" value="${statistic.three_points_made}" min="0" required>
          </div>
          <div class="form-group">
            <label for="three_points_attempted">3 points tentés</label>
            <input type="number" id="three_points_attempted" name="three_points_attempted" value="${statistic.three_points_attempted}" min="0" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="free_throws_made">LF réussis</label>
            <input type="number" id="free_throws_made" name="free_throws_made" value="${statistic.free_throws_made}" min="0" required>
          </div>
          <div class="form-group">
            <label for="free_throws_attempted">LF tentés</label>
            <input type="number" id="free_throws_attempted" name="free_throws_attempted" value="${statistic.free_throws_attempted}" min="0" required>
          </div>
        </div>
        <div class="form-group">
          <button type="submit" class="btn btn-primary">Modifier les statistiques</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </form>
    `

      window.showModal("Modifier les Statistiques", content)

      document.getElementById("edit-statistic-form").addEventListener("submit", async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = Object.fromEntries(formData)
        data.action = "update"
        data.id = id


        const numericFields = [
          "points",
          "rebounds",
          "assists",
          "steals",
          "blocks",
          "turnovers",
          "minutes_played",
          "field_goals_made",
          "field_goals_attempted",
          "three_points_made",
          "three_points_attempted",
          "free_throws_made",
          "free_throws_attempted",
        ]

        for (const field of numericFields) {
          if (data[field] === "" || isNaN(data[field]) || data[field] < 0) {
            alert(`Valeur invalide pour ${field}`)
            return
          }
          data[field] = Number.parseInt(data[field])
        }

        // Validations
        if (Number.parseInt(data.field_goals_made) > Number.parseInt(data.field_goals_attempted)) {
          alert("Les tirs réussis ne peuvent pas être supérieurs aux tirs tentés")
          return
        }
        if (Number.parseInt(data.three_points_made) > Number.parseInt(data.three_points_attempted)) {
          alert("Les 3 points réussis ne peuvent pas être supérieurs aux 3 points tentés")
          return
        }
        if (Number.parseInt(data.free_throws_made) > Number.parseInt(data.free_throws_attempted)) {
          alert("Les lancers francs réussis ne peuvent pas être supérieurs aux lancers francs tentés")
          return
        }
        if (Number.parseInt(data.minutes_played) > 48) {
          alert("Les minutes jouées ne peuvent pas dépasser 48")
          return
        }

        try {
          const result = await this.app.postData("../controllers/StatisticsController.php", data)
          if (result.success) {
            window.closeModal()
            this.loadAllStatistics()
            alert("Statistiques modifiées avec succès!")
          } else {
            alert("Erreur lors de la modification: " + (result.error || "Erreur inconnue"))
          }
        } catch (error) {
          console.error("Erreur lors de la modification des statistiques:", error)
          alert("Erreur lors de la modification des statistiques: " + error.message)
        }
      })
    } catch (error) {
      console.error("Erreur lors du chargement de la statistique:", error)
      alert("Erreur lors du chargement de la statistique")
    }
  }

  async deleteStatistic(id) {
    if (!this.app.hasPermission("statistics", "delete")) {
      alert("Vous n'avez pas les permissions pour supprimer une statistique")
      return
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer cette statistique ?")) {
      try {
        const result = await this.app.postData("../controllers/StatisticsController.php", {
          action: "delete",
          id: id,
        })
        if (result.success) {
          this.loadAllStatistics()
          alert("Statistique supprimée avec succès!")
        } else {
          alert("Erreur lors de la suppression: " + (result.error || "Erreur inconnue"))
        }
      } catch (error) {
        console.error("Erreur lors de la suppression de la statistique:", error)
        alert("Erreur lors de la suppression de la statistique")
      }
    }
  }

  async viewStatisticDetails(id) {
    try {
      const statistic = await this.app.fetchData(`../controllers/StatisticsController.php?action=getOne&id=${id}`)
      const player = await this.app.fetchData(
        `../controllers/PlayerController.php?action=getOne&id=${statistic.player_id}`,
      )
      const match = await this.app.fetchData(
        `../controllers/MatchController.php?action=getOne&id=${statistic.match_id}`,
      )

      // Calculer les pourcentages
      const fgPercentage =
        statistic.field_goals_attempted > 0
          ? ((statistic.field_goals_made / statistic.field_goals_attempted) * 100).toFixed(1)
          : "0.0"
      const threePointPercentage =
        statistic.three_points_attempted > 0
          ? ((statistic.three_points_made / statistic.three_points_attempted) * 100).toFixed(1)
          : "0.0"
      const ftPercentage =
        statistic.free_throws_attempted > 0
          ? ((statistic.free_throws_made / statistic.free_throws_attempted) * 100).toFixed(1)
          : "0.0"

      const detailsHtml = `
      <div class="statistic-details">
        <h4>Détails des Statistiques</h4>
        <div class="detail-section">
          <h5>Informations générales</h5>
          <div class="detail-item">
            <strong>Joueur:</strong>
            <span>${player.first_name} ${player.last_name}</span>
          </div>
          <div class="detail-item">
            <strong>Match:</strong>
            <span>${match.opponent_name} - ${new Date(match.match_date).toLocaleDateString("fr-FR")}</span>
          </div>
          <div class="detail-item">
            <strong>Minutes jouées:</strong>
            <span>${statistic.minutes_played}'</span>
          </div>
        </div>

        <div class="detail-section">
          <h5>Statistiques offensives</h5>
          <div class="stats-grid">
            <div class="stat-item">
              <span>Points:</span>
              <span style="font-weight: bold; color: #e74c3c;">${statistic.points}</span>
            </div>
            <div class="stat-item">
              <span>Passes décisives:</span>
              <span style="font-weight: bold; color: #3498db;">${statistic.assists}</span>
            </div>
            <div class="stat-item">
              <span>Rebonds:</span>
              <span style="font-weight: bold; color: #27ae60;">${statistic.rebounds}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h5>Tirs</h5>
          <div class="stats-grid">
            <div class="stat-item">
              <span>Tirs du terrain:</span>
              <span>${statistic.field_goals_made}/${statistic.field_goals_attempted} (${fgPercentage}%)</span>
            </div>
            <div class="stat-item">
              <span>Tirs à 3 points:</span>
              <span>${statistic.three_points_made}/${statistic.three_points_attempted} (${threePointPercentage}%)</span>
            </div>
            <div class="stat-item">
              <span>Lancers francs:</span>
              <span>${statistic.free_throws_made}/${statistic.free_throws_attempted} (${ftPercentage}%)</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h5>Statistiques défensives</h5>
          <div class="stats-grid">
            <div class="stat-item">
              <span>Interceptions:</span>
              <span>${statistic.steals}</span>
            </div>
            <div class="stat-item">
              <span>Contres:</span>
              <span>${statistic.blocks}</span>
            </div>
            <div class="stat-item">
              <span>Balles perdues:</span>
              <span>${statistic.turnovers}</span>
            </div>
          </div>
        </div>

        <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
      </div>
    `
      window.showModal("Détails des Statistiques", detailsHtml)
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
      alert("Erreur lors du chargement des détails de la statistique")
    }
  }
}
