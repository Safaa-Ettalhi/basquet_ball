export class PerformanceManager {
  constructor(app) {
    this.app = app
  }

  async loadPerformanceAnalysis() {
    if (!this.app.hasPermission("performance", "analyze")) return

    try {
      const teamOverview = await this.app.fetchData("../controllers/PerformanceController.php?action=getTeamOverview")
      this.displayTeamPerformance(teamOverview)
    } catch (error) {
      console.error("Erreur lors du chargement de l'analyse:", error)
    }
  }

  displayTeamPerformance(players) {
    const container = document.getElementById("team-performance")
    if (!container) return

    container.innerHTML = ""
    players.forEach((player) => {
      const playerDiv = document.createElement("div")
      playerDiv.className = "performance-card"
      playerDiv.innerHTML = `
        <h4>${player.first_name} ${player.last_name}</h4>
        <p>Position: ${player.position}</p>
        <div class="performance-stats">
          <span>Points: ${Number.parseFloat(player.avg_points || 0).toFixed(1)}</span>
          <span>Rebonds: ${Number.parseFloat(player.avg_rebounds || 0).toFixed(1)}</span>
          <span>Passes: ${Number.parseFloat(player.avg_assists || 0).toFixed(1)}</span>
          <span>Matchs: ${player.games_played || 0}</span>
        </div>
        <button class="btn btn-info" onclick="viewDetailedPerformance(${player.id})">Analyse détaillée</button>
      `
      container.appendChild(playerDiv)
    })
  }

  async viewDetailedPerformance(playerId) {
    if (!this.app.hasPermission("performance", "analyze")) {
      alert("Vous n'avez pas les permissions pour voir l'analyse détaillée")
      return
    }

    try {
      const analysis = await this.app.fetchData(
        `../controllers/PerformanceController.php?action=getPlayerAnalysis&player_id=${playerId}`,
      )
      if (!analysis || Object.keys(analysis).length === 0) {
        alert("Aucune donnée d'analyse disponible pour ce joueur")
        return
      }

      const analysisHtml = `
        <div class="performance-analysis">
          <h4>Analyse de Performance - ${analysis.first_name} ${analysis.last_name}</h4>
          <div class="performance-rating">
            <h5>Note de Performance: ${Number.parseFloat(analysis.performance_rating || 0).toFixed(1)}/100</h5>
          </div>
          <div class="stats-section">
            <h5>Statistiques</h5>
            <div class="stats-grid">
              <div class="stat-item">
                <span>Points/match:</span>
                <span>${Number.parseFloat(analysis.avg_points || 0).toFixed(1)}</span>
              </div>
              <div class="stat-item">
                <span>Rebonds/match:</span>
                <span>${Number.parseFloat(analysis.avg_rebounds || 0).toFixed(1)}</span>
              </div>
              <div class="stat-item">
                <span>Passes/match:</span>
                <span>${Number.parseFloat(analysis.avg_assists || 0).toFixed(1)}</span>
              </div>
              <div class="stat-item">
                <span>% Tirs:</span>
                <span>${Number.parseFloat(analysis.fg_percentage || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <div class="strengths-section">
            <h5>Points Forts</h5>
            <ul>
              ${(analysis.strengths || []).map((strength) => `<li>${strength}</li>`).join("")}
            </ul>
          </div>
          <div class="weaknesses-section">
            <h5>Points à Améliorer</h5>
            <ul>
              ${(analysis.weaknesses || []).map((weakness) => `<li>${weakness}</li>`).join("")}
            </ul>
          </div>
          <div class="recommendations-section">
            <h5>Recommandations</h5>
            <ul>
              ${(analysis.recommendations || []).map((rec) => `<li>${rec}</li>`).join("")}
            </ul>
          </div>
          <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
        </div>
      `
      window.showModal("Analyse de Performance", analysisHtml)
    } catch (error) {
      console.error("Erreur lors du chargement de l'analyse:", error)
      alert("Erreur lors du chargement de l'analyse de performance")
    }
  }

  viewDetailedPerformanceFromSelect() {
    const playerId = document.getElementById("performance-player-select").value
    if (!playerId) {
      alert("Veuillez sélectionner un joueur")
      return
    }
    this.viewDetailedPerformance(playerId)
  }
}
