import { BasketballApp } from "./core/BasketballApp.js"
import { PlayerManager } from "./modules/PlayerManager.js"
import { MatchManager } from "./modules/MatchManager.js"
import { StatisticsManager } from "./modules/StatisticsManager.js"
import { InjuryManager } from "./modules/InjuryManager.js"
import { TeamManager } from "./modules/TeamManager.js"
import { TrainingManager } from "./modules/TrainingManager.js"
import { BudgetManager } from "./modules/BudgetManager.js"
import { StrategyManager } from "./modules/StrategyManager.js"
import { AccountManager } from "./modules/AccountManager.js"
import { PerformanceManager } from "./modules/PerformanceManager.js"
import { ModalManager } from "./utils/ModalManager.js"
import { AuthManager } from "./utils/AuthManager.js"

class BasketballAppExtended extends BasketballApp {
  constructor() {
    super()
    this.playerManager = new PlayerManager(this)
    this.matchManager = new MatchManager(this)
    this.statisticsManager = new StatisticsManager(this)
    this.injuryManager = new InjuryManager(this)
    this.teamManager = new TeamManager(this)
    this.trainingManager = new TrainingManager(this)
    this.budgetManager = new BudgetManager(this)
    this.strategyManager = new StrategyManager(this)
    this.accountManager = new AccountManager(this)
    this.performanceManager = new PerformanceManager(this)
  }

 
  async loadPlayers() {
    return this.playerManager.loadPlayers()
  }

  async loadMatches() {
    return this.matchManager.loadMatches()
  }

  async loadAllStatistics() {
    return this.statisticsManager.loadAllStatistics()
  }

  async populateStatisticsFilters() {
    return this.statisticsManager.populateStatisticsFilters()
  }

  async loadInjuries() {
    return this.injuryManager.loadInjuries()
  }

  async loadTeamManagement() {
    return this.teamManager.loadTeamManagement()
  }

  async loadTrainings() {
    return this.trainingManager.loadTrainings()
  }

  async loadBudget() {
    return this.budgetManager.loadBudget()
  }

  async loadStrategies() {
    return this.strategyManager.loadStrategies()
  }

  async loadAccountManagement() {
    return this.accountManager.loadAccountManagement()
  }

  async loadPerformanceAnalysis() {
    return this.performanceManager.loadPerformanceAnalysis()
  }
}

// Fonctions globales pour compatibilité avec l'ancien code
window.filterStatistics = () => {
  const playerFilter = document.getElementById("filter-player-select").value
  const matchFilter = document.getElementById("filter-match-select").value
  let filteredStats = window.app.allStatistics

  if (playerFilter) {
    filteredStats = filteredStats.filter((stat) => stat.player_id == playerFilter)
  }
  if (matchFilter) {
    filteredStats = filteredStats.filter((stat) => stat.match_id == matchFilter)
  }

  window.app.statisticsManager.displayAllStatistics(filteredStats)
}

// Fonctions pour les joueurs
window.showAddPlayerModal = () => window.app.playerManager.showAddPlayerModal()
window.editPlayer = (id) => window.app.playerManager.editPlayer(id)
window.deletePlayer = (id) => window.app.playerManager.deletePlayer(id)
window.viewPlayerStats = (id) => window.app.playerManager.viewPlayerStats(id)
window.addPlayerStats = (id) => window.app.statisticsManager.addPlayerStats(id)

// Fonctions pour les matchs
window.showAddMatchModal = () => window.app.matchManager.showAddMatchModal()
window.editMatch = (id) => window.app.matchManager.editMatch(id)
window.deleteMatch = (id) => window.app.matchManager.deleteMatch(id)
window.updateMatchScore = (id) => window.app.matchManager.updateMatchScore(id)
window.viewMatchDetails = (id) => window.app.matchManager.viewMatchDetails(id)

// Fonctions pour les blessures
window.declareInjury = (id) => window.app.injuryManager.declareInjury(id)
window.declareInjuryFromSelect = () => {
  const playerId = document.getElementById("injury-player-select").value
  if (!playerId) {
    alert("Veuillez sélectionner un joueur")
    return
  }
  window.app.injuryManager.declareInjury(playerId)
}
window.markAsRecovered = (injuryId, playerId) => window.app.injuryManager.markAsRecovered(injuryId, playerId)
window.viewInjuryDetails = (id) => window.app.injuryManager.viewInjuryDetails(id)
window.editInjury = (id) => window.app.injuryManager.editInjury(id)
window.deleteInjury = (id) => window.app.injuryManager.deleteInjury(id)

// Fonctions pour les équipes
window.showAddTeamModal = () => window.app.teamManager.showAddTeamModal()
window.editTeam = (id) => window.app.teamManager.editTeam(id)
window.deleteTeam = (id) => window.app.teamManager.deleteTeam(id)
window.viewTeamDetails = (id) => window.app.teamManager.viewTeamDetails(id)
window.manageTeamPlayers = (id) => window.app.teamManager.manageTeamPlayers(id)
window.saveTeamPlayers = (id) => window.app.teamManager.saveTeamPlayers(id)
window.selectAllTeamPlayers = () => window.app.teamManager.selectAllTeamPlayers()
window.clearAllTeamPlayers = () => window.app.teamManager.clearAllTeamPlayers()

// Fonctions pour les entraînements
window.showAddTrainingModal = () => window.app.trainingManager.showAddTrainingModal()
window.editTraining = (id) => window.app.trainingManager.editTraining(id)
window.deleteTraining = (id) => window.app.trainingManager.deleteTraining(id)
window.viewTrainingDetails = (id) => window.app.trainingManager.viewTrainingDetails(id)
window.selectAllPlayers = () => window.app.trainingManager.selectAllPlayers()
window.clearPlayerSelection = () => window.app.trainingManager.clearPlayerSelection()

// Fonctions pour le budget
window.showAddBudgetModal = () => window.app.budgetManager.showAddBudgetModal()
window.editBudgetItem = (id) => window.app.budgetManager.editBudgetItem(id)
window.deleteBudgetItem = (id) => window.app.budgetManager.deleteBudgetItem(id)

// Fonctions pour les stratégies
window.showProposeStrategyModal = () => window.app.strategyManager.showProposeStrategyModal()
window.validateStrategy = (id, status) => window.app.strategyManager.validateStrategy(id, status)
window.editStrategy = (id) => window.app.strategyManager.editStrategy(id)
window.deleteStrategy = (id) => window.app.strategyManager.deleteStrategy(id)

// Fonctions pour les comptes
window.showCreateAccountModal = () => window.app.accountManager.showCreateAccountModal()
window.editAccount = (id) => window.app.accountManager.editAccount(id)
window.deleteAccount = (id) => window.app.accountManager.deleteAccount(id)

// Fonctions pour les statistiques
window.loadPlayerStats = () => window.app.statisticsManager.loadPlayerStats()
window.showAddStatsModal = () => {
  const playerId = document.getElementById("stats-player-select").value
  if (!playerId) {
    alert("Veuillez sélectionner un joueur")
    return
  }
  window.app.statisticsManager.addPlayerStats(playerId)
}
window.editStatistic = (id) => window.app.statisticsManager.editStatistic(id)
window.deleteStatistic = (id) => window.app.statisticsManager.deleteStatistic(id)
window.viewStatisticDetails = (id) => window.app.statisticsManager.viewStatisticDetails(id)

// Fonctions pour la performance
window.viewDetailedPerformance = (id) => window.app.performanceManager.viewDetailedPerformance(id)
window.viewDetailedPerformanceFromSelect = () => window.app.performanceManager.viewDetailedPerformanceFromSelect()

// Initialisation de l'application
let app

document.addEventListener("DOMContentLoaded", async () => {
  // Initialiser les utilitaires
  ModalManager.init()

  // Vérifier l'authentification
  const isAuthenticated = await AuthManager.checkAuthentication()
  if (isAuthenticated) {
    app = new BasketballAppExtended()
    window.app = app // Rendre l'application accessible globalement
    await app.init()
  }
})
