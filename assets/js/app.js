class BasketballApp {
  constructor() {
    this.currentSection = "dashboard"
    this.currentUser = null
    this.allStatistics = [] 
    this.init()
  }

  async init() {
    await this.loadCurrentUser()
    this.setupNavigation()
    this.setupRoleBasedUI()
    this.loadDashboard()
    this.loadPlayers()
    this.loadMatches()
    this.loadTrainings()
    this.loadBudget()
    this.loadInjuries()
    this.loadAccountManagement()
  }

  async loadCurrentUser() {
    try {
      const response = await fetch("../auth/AuthController.php?action=getCurrentUser")
      this.currentUser = await response.json();
      console.log("Utilisateur actuel:", this.currentUser);
      document.getElementById('loading-navs').classList.remove('loading-navs');
    } catch (error) {
      console.error("Erreur lors du chargement de l'utilisateur:", error)
    }
  }

  setupRoleBasedUI() {
    if (!this.currentUser) return

    const role = this.currentUser.role
    const navItems = document.querySelectorAll(".nav-link")

    // Permissions par rôle
    const rolePermissions = {
      coach: ["dashboard","players","trainings","injuries","strategies","team-management"],
      manager: ["dashboard", "new-account","injuries", "players", "matches", "budget",  "strategies","team-management"],
      analyste: ["dashboard", "statistics", "players", "performance"],
    }

    navItems.forEach((link) => {
      const section = link.getAttribute("href")?.substring(1) || ""
      if (link.classList.contains("logout-btn")) return 

      if (!rolePermissions[role] || !rolePermissions[role].includes(section)) {
        link.style.display = "none"
      }
    })

    this.setupButtonPermissions(role)
  }

  setupButtonPermissions(role) {
    const permissions = {
      coach: {
        players: ["read", "update_sports"],
        trainings: ["read", "create", "update", "delete"],
        matches: ["read"],
        budget: ["read"],
        strategies: ["read", "create", "update", "delete"],
        statistics: ["read"],
        injuries: ["read", "create", "update", "delete"], 
        team: ["read", "create", "update", "delete", "manage"],
      },
      manager: {
        players: ["read", "create", "update_admin", "delete"],
        matches: ["read", "create", "update", "delete"],
        budget: ["read", "create", "update", "delete"],
        strategies: ["read", "validate"],
        statistics: ["read"],
        "new-account": ["read", "create", "update", "delete"],
        injuries: ["read"], 
        team: ["read",  "manage"],
      },
      analyste: {
        players: ["read"],
        statistics: ["read", "create", "update", "delete"],
        performance: ["read", "analyze"],
        injuries: ["read"],
      },
    }

    this.userPermissions = permissions[role] || {}
  }

  hasPermission(resource, action) {
    return this.userPermissions[resource] && this.userPermissions[resource].includes(action)
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll(".nav-link")
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const href = link.getAttribute("href")
        if (!href || href === "#") return

        const targetSection = href.substring(1)
        this.showSection(targetSection)
      })
    })
  }

  showSection(sectionName) {
    document.querySelectorAll(".content-section").forEach((section) => {
      section.classList.remove("active")
    })

    const targetSection = document.getElementById(sectionName)
    if (targetSection) {
      targetSection.classList.add("active")
    }

    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active")
    })
    const activeLink = document.querySelector(`[href="#${sectionName}"]`)
    if (activeLink) activeLink.classList.add("active")

    this.currentSection = sectionName
    console.log(`Section active: ${this.currentSection}`)

    switch (sectionName) {
      case "injuries":
        this.loadInjuries()
        break
      case "simulator":
        this.loadSimulator()
        this.loadSimulationHistory()
        break
      case "strategies":
        this.loadStrategies()
        break
      case "new-account":
        this.loadAccountManagement()
        break
      case "performance":
        this.loadPerformanceAnalysis()
        break
      case "team-management":
        this.loadTeamManagement()
        break
      case "statistics":
        this.loadAllStatistics()
        this.populateStatisticsFilters()
        break
    }
  }

  async loadDashboard() {
    try {
      const players = await this.fetchData("../controllers/PlayerController.php?action=getAll")
      const matches = await this.fetchData("../controllers/MatchController.php?action=getAll")
      const budgetSummary = await this.fetchData("../controllers/BudgetController.php?action=getSummary")

      document.getElementById("total-players").textContent = players.length

      const upcomingMatches = matches.filter(
        (match) => match.status === "scheduled" && new Date(match.match_date) > new Date(),
      )
      document.getElementById("upcoming-matches").textContent = upcomingMatches.length

      const injuredPlayers = players.filter((player) => player.health_status === "injured")
      document.getElementById("injured-players").textContent = injuredPlayers.length

      document.getElementById("budget-balance").textContent =
        `${Number.parseInt(budgetSummary.balance || 0).toLocaleString()} Dhs`
    } catch (error) {
      console.error("Erreur lors du chargement du tableau de bord:", error)
    }
  }

  async loadPlayers() {
    try {
      const players = await this.fetchData("../controllers/PlayerController.php?action=getAll")
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
      // Permissions différentes selon le rôle
      if (this.hasPermission("players", "update_admin") || this.hasPermission("players", "update_sports")) {
        actionButtons += `<button class="btn btn-secondary" onclick="editPlayer(${player.id})">Modifier</button>`
      }
      if (this.hasPermission("players", "delete")) {
        actionButtons += `<button class="btn btn-danger" onclick="deletePlayer(${player.id})">Supprimer</button>`
      }
      actionButtons += `<button class="btn btn-info" onclick="viewPlayerStats(${player.id})">Stats</button>`

      // Bouton pour ajouter des statistiques (Coach et Analyste)
      if (this.hasPermission("statistics", "create")) {
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

  async loadMatches() {
    try {
      const matches = await this.fetchData("../controllers/MatchController.php?action=getAll")
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
      const score = match.status === "completed" ? `${match.our_score} - ${match.opponent_score}` : "-"

      let actionButtons = ""
      if (match.status === "scheduled" && this.hasPermission("matches", "update")) {
        actionButtons += `<button class="btn btn-success" onclick="updateMatchScore(${match.id})">Score</button>`
      }
      if (this.hasPermission("matches", "update")) {
        actionButtons += `<button class="btn btn-secondary" onclick="editMatch(${match.id})">Modifier</button>`
      }
      if (this.hasPermission("matches", "delete")) {
        actionButtons += `<button class="btn btn-danger" onclick="deleteMatch(${match.id})">Supprimer</button>`
      }
      actionButtons += `<button class="btn btn-info" onclick="viewMatchDetails(${match.id})">Détails</button>`

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
  }

  async loadTrainings() {
    try {
      const trainings = await this.fetchData("../controllers/TrainingController.php?action=getAll")
      this.displayTrainings(trainings)
    } catch (error) {
      console.error("Erreur lors du chargement des entraînements:", error)
    }
  }

  displayTrainings(trainings) {
    const tbody = document.querySelector("#trainings-table tbody")
    tbody.innerHTML = ""

    trainings.forEach((training) => {
      const row = document.createElement("tr")
      const trainingDate = new Date(training.date).toLocaleDateString("fr-FR")

      let actionButtons = ""
      if (this.hasPermission("trainings", "update")) {
        actionButtons += `<button class="btn btn-secondary" onclick="editTraining(${training.id})">Modifier</button>`
      }
      if (this.hasPermission("trainings", "delete")) {
        actionButtons += `<button class="btn btn-danger" onclick="deleteTraining(${training.id})">Supprimer</button>`
      }
      actionButtons += `<button class="btn btn-info" onclick="viewTrainingDetails(${training.id})">Détails</button>`

      row.innerHTML = `
        <td>${trainingDate}</td>
        <td>${training.training_type_name}</td>
        <td>${training.duration_minutes} min</td>
        <td>${training.location}</td>
        <td>${training.description}</td>
        <td class="action-buttons">
          ${actionButtons}
        </td>
      `
      tbody.appendChild(row)
    })
  }

  async loadBudget() {
    try {
      const budgetItems = await this.fetchData("../controllers/BudgetController.php?action=getAll")
      const budgetSummary = await this.fetchData("../controllers/BudgetController.php?action=getSummary")

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
      const amount =
        item.transaction_type === "income"
          ? `+${Number.parseInt(item.amount).toLocaleString()} Dhs`
          : `-${Number.parseInt(item.amount).toLocaleString()} Dhs`

      let actionButtons = ""
      if (this.hasPermission("budget", "update")) {
        actionButtons += `<button class="btn btn-secondary" onclick="editBudgetItem(${item.id})">Modifier</button>`
      }
      if (this.hasPermission("budget", "delete")) {
        actionButtons += `<button class="btn btn-danger" onclick="deleteBudgetItem(${item.id})">Supprimer</button>`
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
  }

  async loadStrategies() {
    try {
      const strategies = await this.fetchData("../controllers/StrategyController.php?action=getAll")
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
      const matchDate = strategy.match_date ? new Date(strategy.match_date).toLocaleDateString("fr-FR") : "N/A"

      let actionButtons = ""
      if (this.hasPermission("strategies", "validate") && strategy.status === "pending") {
        actionButtons += `
        <button class="btn btn-success" onclick="validateStrategy(${strategy.id}, 'approved')">Approuver</button>
        <button class="btn btn-danger" onclick="validateStrategy(${strategy.id}, 'rejected')">Rejeter</button>
      `
      }
      if (this.hasPermission("strategies", "update")) {
        actionButtons += `<button class="btn btn-secondary" onclick="editStrategy(${strategy.id})">Modifier</button>`
      }
      if (this.hasPermission("strategies", "delete")) {
        actionButtons += `<button class="btn btn-danger" onclick="deleteStrategy(${strategy.id})">Supprimer</button>`
      }

      row.innerHTML = `
      <td>${strategy.opponent_name || "N/A"} - ${matchDate}</td>
      <td>${strategy.strategy_name}</td>
      <td>${strategy.proposed_by_name}</td>
      <td><span class="status-badge status-${strategy.status}">${strategy.status}</span></td>
      <td>${strategy.comments}</td>
      <td class="action-buttons">
        ${actionButtons}
      </td>
    `
      tbody.appendChild(row)
    })
  }

  
  displayStrategies(strategies) {
    const container = document.getElementById("strategies-list")
    if (!container) return

    container.innerHTML = ""

    Object.entries(strategies).forEach(([key, strategy]) => {
      const strategyDiv = document.createElement("div")
      strategyDiv.className = "strategy-item"
      strategyDiv.innerHTML = `
        <h4>${strategy.name}</h4>
        <p>${strategy.description}</p>
        <div class="pros-cons">
          <div class="pros">
            <strong>Avantages:</strong>
            <ul>${strategy.pros.map((pro) => `<li>${pro}</li>`).join("")}</ul>
          </div>
          <div class="cons">
            <strong>Inconvénients:</strong>
            <ul>${strategy.cons.map((con) => `<li>${con}</li>`).join("")}</ul>
          </div>
        </div>
      `
      container.appendChild(strategyDiv)
    })
  }

  async loadAccountManagement() {
    try {
      const accounts = await this.fetchData("../auth/AuthController.php?action=getAllUsers")
      this.displayAccountsTable(accounts?.users)
    } catch (error) {
      console.error("Erreur lors du chargement des comptes:", error)
    }
  }

  displayAccountsTable(accounts) {
    const tbody = document.querySelector("#accounts-table tbody")
    if (!tbody) return
    tbody.innerHTML = ""
    if (accounts.length === 0) {
      tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: #6c757d; font-style: italic; padding: 2rem;">
          Aucun compte trouvé. Cliquez sur "Ajouter un compte" pour commencer.
        </td>

      </tr>
    `
      return
    }
    accounts.forEach((account) => {
      const row = document.createElement("tr")
      let actionButtons = ""
      if (this.hasPermission("new-account", "update")) {
        actionButtons += `<button class="btn btn-secondary" onclick="editAccount(${account.id})">Modifier</button>`
      }
      if (this.hasPermission("new-account", "delete")) {
        actionButtons += `<button class="btn btn-danger" onclick="deleteAccount(${account.id})">Supprimer</button>`
      }

      row.innerHTML = `
      <td>${account.username}</td>
      <td>${account.email}</td>
      <td>${account.role}</td>
      <td class="action-buttons">
        ${actionButtons}
      </td>
    `
      tbody.appendChild(row)
    })
  }


  async loadPerformanceAnalysis() {
    if (!this.hasPermission("performance", "analyze")) return

    try {
      const teamOverview = await this.fetchData("../controllers/PerformanceController.php?action=getTeamOverview")
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

    async loadTeamManagement() {
    if (!this.hasPermission("team", "manage")) return

    try {
      const teams = await this.fetchData("../controllers/TeamController.php?action=getAll")
      console.log("Teams loaded:", teams) 
      this.displayTeams(teams)
    } catch (error) {
      console.error("Erreur lors du chargement de la gestion d'équipe:", error)
      // Afficher un message d'erreur dans le tableau
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
      if (this.hasPermission("team", "update")) {
        actionButtons += `<button class="btn btn-secondary btn-sm" onclick="editTeam(${team.id})" title="Modifier l'équipe">✏️ Modifier</button>`
      }
      if (this.hasPermission("team", "delete")) {
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

    // Charger toutes les statistiques
  async loadAllStatistics() {
    try {
      console.log("Chargement de toutes les statistiques...")
      const statistics = await this.fetchData("../controllers/StatisticsController.php?action=getAll")
      console.log("Statistiques chargées:", statistics)
      this.allStatistics = statistics
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

  //  Afficher toutes les statistiques
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
      if (this.hasPermission("statistics", "update")) {
        actionButtons += `<button class="btn btn-secondary btn-sm" onclick="editStatistic(${stat.id})">✏️ Modifier</button>`
      }
      if (this.hasPermission("statistics", "delete")) {
        actionButtons += `<button class="btn btn-danger btn-sm" onclick="deleteStatistic(${stat.id})">🗑️ Supprimer</button>`
      }
      actionButtons += `<button class="btn btn-info btn-sm" onclick="viewStatisticDetails(${stat.id})">👁️ Détails</button>`

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
  }

  // Peupler les filtres de statistiques
  async populateStatisticsFilters() {
    try {
      const players = await this.fetchData("../controllers/PlayerController.php?action=getAll")
      const matches = await this.fetchData("../controllers/MatchController.php?action=getAll")

      // Peupler le filtre des joueurs
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

      // Peupler le filtre des matchs
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
  async fetchData(url) {
    try {
      console.log("Fetching from:", url) // Debug
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      console.log("Raw response:", text) // Debug

      // Vérifier si la réponse est vide
      if (!text.trim()) {
        throw new Error("Réponse vide du serveur")
      }

      // Vérifier si la réponse est du JSON valide
      try {
        const data = JSON.parse(text)
        return data
      } catch (jsonError) {
        console.error("Réponse non-JSON reçue:", text)
        throw new Error("Réponse serveur invalide")
      }
    } catch (error) {
      console.error("Erreur fetchData:", error)
      throw error
    }
  }


  async postData(url, data) {
     try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    // Log de debug
    console.log("Response status:", response.status)
    console.log("Response headers:", response.headers)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error response:", errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const text = await response.text()
    console.log("Raw response:", text)

    // Vérifier si la réponse est du JSON valide
    try {
      return JSON.parse(text)
    } catch (jsonError) {
      console.error("Réponse non-JSON reçue:", text)
      throw new Error("Réponse serveur invalide: " + text)
    }
  } catch (error) {
    console.error("Erreur postData:", error)
    throw error
  }
  }

  

  async loadInjuries() {
    try {
      const injuries = await this.fetchData("../controllers/InjuryController.php?action=getAll")
      this.displayInjuries(injuries)
    } catch (error) {
      console.error("Erreur lors du chargement des blessures:", error)
    }
  }

   displayInjuries(injuries) {
    const tbody = document.querySelector("#injuries-table tbody")
    tbody.innerHTML = ""

    injuries.forEach((injury) => {
      const row = document.createElement("tr")
      const injuryDate = new Date(injury.injury_date).toLocaleDateString("fr-FR")
      const expectedRecovery = injury.expected_recovery_date
        ? new Date(injury.expected_recovery_date).toLocaleDateString("fr-FR")
        : "Non définie"

      let actionButtons = ""

      // Seuls les coaches peuvent gérer les blessures (guérir, modifier, supprimer)
      if (this.hasPermission("injuries", "update")) {
        actionButtons += `<button class="btn btn-success" onclick="markAsRecovered(${injury.id}, ${injury.player_id})">Guéri</button>`
        actionButtons += `<button class="btn btn-secondary" onclick="editInjury(${injury.id})">Modifier</button>`
      }
      if (this.hasPermission("injuries", "delete")) {
        actionButtons += `<button class="btn btn-danger" onclick="deleteInjury(${injury.id})">Supprimer</button>`
      }

      // Tous les rôles peuvent voir les détails
      actionButtons += `<button class="btn btn-info" onclick="viewInjuryDetails(${injury.id})">Détails</button>`

      row.innerHTML = `
        <td>${injury.first_name} ${injury.last_name}</td>
        <td>${injury.position || "N/A"}</td>
        <td>${injury.injury_type}</td>
        <td><span class="status-badge status-${injury.severity}">${injury.severity}</span></td>
        <td>${injuryDate}</td>
        <td>${expectedRecovery}</td>
        <td>${injury.treatment || "Aucun"}</td>
        <td>${injury.description || "Aucune"}</td>
        <td class="action-buttons">
          ${actionButtons}
        </td>
      `
      tbody.appendChild(row)
    })
  }

  
}
// : Filtrer les statistiques
function filterStatistics() {
  const playerFilter = document.getElementById("filter-player-select").value
  const matchFilter = document.getElementById("filter-match-select").value

  let filteredStats = app.allStatistics

  if (playerFilter) {
    filteredStats = filteredStats.filter((stat) => stat.player_id == playerFilter)
  }

  if (matchFilter) {
    filteredStats = filteredStats.filter((stat) => stat.match_id == matchFilter)
  }

  app.displayAllStatistics(filteredStats)
}

// Gestion des statistiques individuelles
async function editStatistic(id) {
  if (!app.hasPermission("statistics", "update")) {
    alert("Vous n'avez pas les permissions pour modifier une statistique")
    return
  }

  try {
    const stat = await app.fetchData(`../controllers/StatisticsController.php?action=getOne&id=${id}`)

    const content = `
  <form id="edit-statistic-form">
    <div class="form-row">
      <div class="form-group">
        <label for="points">Points</label>
        <input type="number" id="points" name="points" value="${stat.points || 0}" min="0" required>
      </div>
      <div class="form-group">
        <label for="rebounds">Rebonds</label>
        <input type="number" id="rebounds" name="rebounds" value="${stat.rebounds || 0}" min="0" required>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="assists">Passes</label>
        <input type="number" id="assists" name="assists" value="${stat.assists || 0}" min="0" required>
      </div>
      <div class="form-group">
        <label for="steals">Interceptions</label>
        <input type="number" id="steals" name="steals" value="${stat.steals || 0}" min="0" required>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="blocks">Contres</label>
        <input type="number" id="blocks" name="blocks" value="${stat.blocks || 0}" min="0" required>
      </div>
      <div class="form-group">
        <label for="turnovers">Balles perdues</label>
        <input type="number" id="turnovers" name="turnovers" value="${stat.turnovers || 0}" min="0" required>
      </div>
    </div>
    <div class="form-group">
      <label for="minutes_played">Minutes jouées</label>
      <input type="number" id="minutes_played" name="minutes_played" value="${stat.minutes_played || 0}" min="0" max="48" required>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="field_goals_made">Tirs réussis</label>
        <input type="number" id="field_goals_made" name="field_goals_made" value="${stat.field_goals_made || 0}" min="0" required>
      </div>
      <div class="form-group">
        <label for="field_goals_attempted">Tirs tentés</label>
        <input type="number" id="field_goals_attempted" name="field_goals_attempted" value="${stat.field_goals_attempted || 0}" min="0" required>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="three_points_made">3 points réussis</label>
        <input type="number" id="three_points_made" name="three_points_made" value="${stat.three_points_made || 0}" min="0" required>
      </div>
      <div class="form-group">
        <label for="three_points_attempted">3 points tentés</label>
        <input type="number" id="three_points_attempted" name="three_points_attempted" value="${stat.three_points_attempted || 0}" min="0" required>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="free_throws_made">LF réussis</label>
        <input type="number" id="free_throws_made" name="free_throws_made" value="${stat.free_throws_made || 0}" min="0" required>
      </div>
      <div class="form-group">
        <label for="free_throws_attempted">LF tentés</label>
        <input type="number" id="free_throws_attempted" name="free_throws_attempted" value="${stat.free_throws_attempted || 0}" min="0" required>
      </div>
    </div>
    <div class="form-group">
      <button type="submit" class="btn btn-primary">Modifier la statistique</button>
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
    </div>
  </form>
`

    showModal("Modifier la Statistique", content)

    document.getElementById("edit-statistic-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "update"
      data.id = id

      // Validation des valeurs numériques
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
        data[field] = Number.parseInt(data[field]) // Convertir en entier
      }

      // Validation logique
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
        const result = await app.postData("../controllers/StatisticsController.php", data)
        if (result.success) {
          closeModal()
          app.loadAllStatistics()
          alert("Statistique modifiée avec succès!")
        } else {
          alert("Erreur lors de la modification: " + (result.error || "Erreur inconnue"))
        }
      } catch (error) {
        console.error("Erreur lors de la modification de la statistique:", error)
        alert("Erreur lors de la modification de la statistique")
      }
    })
  } catch (error) {
    console.error("Erreur lors du chargement de la statistique:", error)
    alert("Erreur lors du chargement de la statistique")
  }
}

async function deleteStatistic(id) {
  if (!app.hasPermission("statistics", "delete")) {
    alert("Vous n'avez pas les permissions pour supprimer une statistique")
    return
  }

  if (confirm("Êtes-vous sûr de vouloir supprimer cette statistique ?")) {
    try {
      const result = await app.postData("../controllers/StatisticsController.php", {
        action: "delete",
        id: id,
      })

      if (result.success) {
        app.loadAllStatistics()
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

async function viewStatisticDetails(id) {
  try {
    const stat = await app.fetchData(`../controllers/StatisticsController.php?action=getOne&id=${id}`)

    const detailsHtml = `
      <div class="statistic-details">
        <h4>Détails de la statistique</h4>
        <div class="detail-item">
          <strong>Joueur:</strong>
          <span>${stat.first_name} ${stat.last_name}</span>
        </div>
        <div class="detail-item">
          <strong>Match:</strong>
          <span>${stat.opponent_name} - ${new Date(stat.match_date).toLocaleDateString("fr-FR")}</span>
        </div>
        <div class="detail-item">
          <strong>Points:</strong>
          <span>${stat.points}</span>
        </div>
        <div class="detail-item">
          <strong>Rebonds:</strong>
          <span>${stat.rebounds}</span>
        </div>
        <div class="detail-item">
          <strong>Passes:</strong>
          <span>${stat.assists}</span>
        </div>
        <div class="detail-item">
          <strong>Minutes jouées:</strong>
          <span>${stat.minutes_played}'</span>
        </div>
        <div class="detail-item">
          <strong>% aux tirs:</strong>
          <span>${stat.fg_percentage || 0}%</span>
        </div>
        <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
      </div>
    `

    showModal("Détails de la Statistique", detailsHtml)
  } catch (error) {
    console.error("Erreur lors du chargement des détails:", error)
    alert("Erreur lors du chargement des détails")
  }
}
// Vérification de l'authentification
async function checkAuthentication() {
  try {
    const response = await fetch("../auth/AuthController.php?action=checkAuth")
    const result = await response.json()

    if (!result.authenticated) {
      window.location.href = "login.html"
      return false
    }

    const userResponse = await fetch("../auth/AuthController.php?action=getCurrentUser")
    const user = await userResponse.json()

    if (user) {
      document.querySelector("header h1").innerHTML = `🏀 Basketball Manager - ${user.role.toUpperCase()}`
    }

    return true
  } catch (error) {
    console.error("Erreur d'authentification:", error)
    window.location.href = "login.html"
    return false
  }
}

// Fonctions globales
function showModal(title, content) {
  document.getElementById("modal-title").textContent = title
  document.getElementById("modal-body").innerHTML = content
  document.getElementById("modal-overlay").style.display = "block"
}

function closeModal() {
  document.getElementById("modal-overlay").style.display = "none"
}

// Fonction pour charger les statistiques d'un joueur
async function loadPlayerStats() {
  const playerId = document.getElementById("player-select").value
  if (!playerId) {
    document.getElementById("player-stats-display").innerHTML = ""
    return
  }

  try {
    const stats = await app.fetchData(
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

// Fonction pour afficher le modal d'ajout de statistiques
function showAddStatsModal() {
  const playerId = document.getElementById("stats-player-select").value
  if (!playerId) {
    alert("Veuillez sélectionner un joueur")
    return
  }

  if (!app.hasPermission("statistics", "create")) {
    alert("Vous n'avez pas les permissions pour ajouter des statistiques")
    return
  }

  addPlayerStats(playerId)
}

// Fonction pour ajouter un joueur
function showAddPlayerModal() {
  if (!app.hasPermission("players", "create")) {
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

  showModal("Ajouter un Joueur", content)

  document.getElementById("add-player-form").addEventListener("submit", async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    data.action = "create"

    try {
      const result = await app.postData("../controllers/PlayerController.php", data)
      if (result.success) {
        closeModal()
        app.loadPlayers()
        app.loadDashboard()
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

// Fonction pour éditer un joueur
async function editPlayer(id) {
  if (!app.hasPermission("players", "update_admin") && !app.hasPermission("players", "update_sports")) {
    alert("Vous n'avez pas les permissions pour modifier un joueur")
    return
  }

  try {
    const player = await app.fetchData(`../controllers/PlayerController.php?action=getOne&id=${id}`)

    let content = ""

    // Formulaire pour le Manager (données administratives seulement)
    if (app.hasPermission("players", "update_admin")) {
      content = `
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
    // Formulaire pour le Coach (données sportives seulement)
    else if (app.hasPermission("players", "update_sports")) {
      content = `
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

    showModal("Modifier le Joueur", content)

    document.getElementById("edit-player-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "update"
      data.id = id

      // Ajouter le type de modification selon les permissions
      if (app.hasPermission("players", "update_admin")) {
        data.update_type = "admin"
      } else if (app.hasPermission("players", "update_sports")) {
        data.update_type = "sports"
      }

      try {
        const result = await app.postData("../controllers/PlayerController.php", data)
        if (result.success) {
          closeModal()
          app.loadPlayers()
          app.loadDashboard()
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

// Fonction pour supprimer un joueur
async function deletePlayer(id) {
  if (!app.hasPermission("players", "delete")) {
    alert("Vous n'avez pas les permissions pour supprimer un joueur")
    return
  }

  if (confirm("Êtes-vous sûr de vouloir supprimer ce joueur ?")) {
    try {
      const result = await app.postData("../controllers/PlayerController.php", {
        action: "delete",
        id: id,
      })

      if (result.success) {
        app.loadPlayers()
        app.loadDashboard()
        alert("Joueur supprimé avec succès!")
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du joueur:", error)
    }
  }
}

// Fonction pour ajouter des statistiques à un joueur 
function addPlayerStats(playerId) {
  if (!playerId) {
    alert("ID du joueur manquant")
    return
  }

  if (!app.hasPermission("statistics", "create")) {
    alert("Vous n'avez pas les permissions pour ajouter des statistiques")
    return
  }

  const content = `
    <form id="add-stats-form">
      <div class="form-group">
        <label for="match_id">Match</label>
        <select id="match_id" name="match_id" required>
          <option value="">Sélectionner un match</option>
        </select>
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

  showModal("Ajouter des Statistiques", content)

  // Charger les matchs terminés
  app
    .fetchData("../controllers/MatchController.php?action=getAll")
    .then((matches) => {
      const select = document.getElementById("match_id")
      const completedMatches = matches.filter((match) => match.status === "completed")

      if (completedMatches.length === 0) {
        select.innerHTML = '<option value="">Aucun match terminé disponible</option>'
        return
      }

      completedMatches.forEach((match) => {
        const option = document.createElement("option")
        option.value = match.id
        option.textContent = `${match.opponent_name || "Adversaire"} - ${new Date(match.match_date).toLocaleDateString()}`
        select.appendChild(option)
      })
    })
    .catch((error) => {
      console.error("Erreur lors du chargement des matchs:", error)
      const select = document.getElementById("match_id")
      select.innerHTML = '<option value="">Erreur lors du chargement des matchs</option>'
    })

  document.getElementById("add-stats-form").addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    data.action = "addStats"
    data.player_id = playerId

    // Validation côté client améliorée
    if (!data.match_id) {
      alert("Veuillez sélectionner un match")
      return
    }

    // Validation des valeurs numériques
    const numericFields = ['points', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers', 'minutes_played', 
                          'field_goals_made', 'field_goals_attempted', 'three_points_made', 
                          'three_points_attempted', 'free_throws_made', 'free_throws_attempted']
    
    for (let field of numericFields) {
      if (data[field] === '' || isNaN(data[field]) || data[field] < 0) {
        alert(`Valeur invalide pour ${field}`)
        return
      }
      data[field] = parseInt(data[field]) // Convertir en entier
    }

    // Validation logique
    if (parseInt(data.field_goals_made) > parseInt(data.field_goals_attempted)) {
      alert("Les tirs réussis ne peuvent pas être supérieurs aux tirs tentés")
      return
    }

    if (parseInt(data.three_points_made) > parseInt(data.three_points_attempted)) {
      alert("Les 3 points réussis ne peuvent pas être supérieurs aux 3 points tentés")
      return
    }

    if (parseInt(data.free_throws_made) > parseInt(data.free_throws_attempted)) {
      alert("Les lancers francs réussis ne peuvent pas être supérieurs aux lancers francs tentés")
      return
    }

    if (parseInt(data.minutes_played) > 48) {
      alert("Les minutes jouées ne peuvent pas dépasser 48")
      return
    }

    try {
      console.log("Envoi des données:", data) // Debug
      
      const response = await fetch("../controllers/StatisticsController.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      // Vérifier le statut de la réponse
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("Résultat reçu:", result) // Debug

      if (result.success) {
        closeModal()
        alert("Statistiques ajoutées avec succès!")
        // Recharger les stats si on est sur la page statistiques
        if (app.currentSection === "statistics") {
          loadPlayerStats()
        }
      } else {
        alert("Erreur lors de l'ajout des statistiques: " + (result.error || "Erreur inconnue"))
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout des statistiques:", error)
      alert("Erreur lors de l'ajout des statistiques: " + error.message)
    }
  })
}
// Fonction pour déclarer une blessure depuis le sélecteur
function declareInjuryFromSelect() {
  const playerId = document.getElementById("injury-player-select").value
  if (!playerId) {
    alert("Veuillez sélectionner un joueur")
    return
  }
  declareInjury(playerId)
}

// Fonction pour déclarer une blessure 
function declareInjury(playerId) {
  if (!playerId) {
    alert("ID du joueur manquant")
    return
  }

  if (!app.hasPermission("injuries", "create")) {
    alert("Vous n'avez pas les permissions pour déclarer une blessure")
    return
  }

  const today = new Date().toISOString().split("T")[0]

  const content = `
    <form id="declare-injury-form">
      <div class="form-row">
        <div class="form-group">
          <label for="injury_type">Type de blessure</label>
          <select id="injury_type" name="injury_type" required>
            <option value="">Sélectionner</option>
            <option value="muscle">Blessure musculaire</option>
            <option value="joint">Blessure articulaire</option>
            <option value="bone">Fracture</option>
            <option value="ligament">Blessure ligamentaire</option>
            <option value="concussion">Commotion</option>
            <option value="other">Autre</option>
          </select>
        </div>
        <div class="form-group">
          <label for="severity">Gravité</label>
          <select id="severity" name="severity" required>
            <option value="">Sélectionner</option>
            <option value="minor">Mineure</option>
            <option value="moderate">Modérée</option>
            <option value="major">Majeure</option>
            <option value="severe">Sévère</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label for="description">Description</label>
        <textarea id="description" name="description" rows="3" required placeholder="Décrivez la blessure..."></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="injury_date">Date de la blessure</label>
          <input type="date" id="injury_date" name="injury_date" value="${today}" required>
        </div>
        <div class="form-group">
          <label for="expected_recovery_date">Date de récupération prévue</label>
          <input type="date" id="expected_recovery_date" name="expected_recovery_date">
        </div>
      </div>
      <div class="form-group">
        <label for="treatment">Traitement</label>
        <textarea id="treatment" name="treatment" rows="2" placeholder="Traitement prescrit..."></textarea>
      </div>
      <div class="form-group">
        <button type="submit" class="btn btn-primary">Déclarer la blessure</button>
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
      </div>
    </form>
  `

  showModal("🏥 Déclarer une Blessure", content)

  document.getElementById("declare-injury-form").addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    data.action = "create"
    data.player_id = playerId

    // Validation côté client
    if (!data.injury_type || !data.severity || !data.description || !data.injury_date) {
      alert("Veuillez remplir tous les champs obligatoires")
      return
    }

    try {
      console.log("Envoi des données blessure:", data) // Debug
      const result = await app.postData("../controllers/InjuryController.php", data)
      console.log("Résultat blessure:", result) // Debug

      if (result.success) {
        closeModal()
        app.loadInjuries()
        app.loadPlayers()
        app.loadDashboard()
        alert("Blessure déclarée avec succès!")
      } else {
        alert("Erreur lors de la déclaration de la blessure: " + (result.error || "Erreur inconnue"))
      }
    } catch (error) {
      console.error("Erreur lors de la déclaration de la blessure:", error)
      alert("Erreur lors de la déclaration de la blessure: " + error.message)
    }
  })
}

// Fonction pour marquer un joueur comme guéri
async function markAsRecovered(injuryId, playerId) {
  if (confirm("Marquer ce joueur comme guéri ?")) {
    try {
      const result = await app.postData("../controllers/InjuryController.php", {
        action: "markRecovered",
        id: injuryId,
        player_id: playerId,
      })

      if (result.success) {
        app.loadInjuries()
        app.loadPlayers()
        app.loadDashboard()
        alert("Joueur marqué comme guéri!")
      }
    } catch (error) {
      console.error("Erreur lors de la récupération:", error)
    }
  }
}

// Fonction pour voir les détails d'une blessure
async function viewInjuryDetails(id) {
  try {
    const injury = await app.fetchData(`../controllers/InjuryController.php?action=getOne&id=${id}`)

    const injuryDate = new Date(injury.injury_date).toLocaleDateString("fr-FR")
    const expectedRecovery = injury.expected_recovery_date
      ? new Date(injury.expected_recovery_date).toLocaleDateString("fr-FR")
      : "Non définie"

    const detailsHtml = `
      <div class="injury-details">
        <h4>Détails de la blessure</h4>
        <div class="detail-item">
          <strong>Joueur:</strong>
          <span>${injury.first_name} ${injury.last_name}</span>
        </div>
        <div class="detail-item">
          <strong>Type de blessure:</strong>
          <span>${injury.injury_type}</span>
        </div>
        <div class="detail-item">
          <strong>Gravité:</strong>
          <span class="status-badge status-${injury.severity}">${injury.severity}</span>
        </div>
        <div class="detail-item">
          <strong>Date de la blessure:</strong>
          <span>${injuryDate}</span>
        </div>
        <div class="detail-item">
          <strong>Récupération prévue:</strong>
          <span>${expectedRecovery}</span>
        </div>
        <div class="detail-item">
          <strong>Description:</strong>
          <span>${injury.description}</span>
        </div>
        <div class="detail-item">
          <strong>Traitement:</strong>
          <span>${injury.treatment || "Aucun traitement spécifié"}</span>
        </div>
        <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
      </div>
    `

    showModal("Détails de la Blessure", detailsHtml)
  } catch (error) {
    console.error("Erreur lors du chargement des détails:", error)
  }
}

// Fonction pour éditer une blessure
async function editInjury(id) {
  if (!app.hasPermission("injuries", "update")) {
    alert("Vous n'avez pas les permissions pour modifier une blessure")
    return
  }

  try {
    const injury = await app.fetchData(`../controllers/InjuryController.php?action=getOne&id=${id}`)

    const content = `
      <form id="edit-injury-form">
        <div class="form-row">
          <div class="form-group">
            <label for="injury_type">Type de blessure</label>
            <select id="injury_type" name="injury_type" required>
              <option value="muscle" ${injury.injury_type === "muscle" ? "selected" : ""}>Blessure musculaire</option>
              <option value="joint" ${injury.injury_type === "joint" ? "selected" : ""}>Blessure articulaire</option>
              <option value="bone" ${injury.injury_type === "bone" ? "selected" : ""}>Fracture</option>
              <option value="ligament" ${injury.injury_type === "ligament" ? "selected" : ""}>Blessure ligamentaire</option>
              <option value="concussion" ${injury.injury_type === "concussion" ? "selected" : ""}>Commotion</option>
              <option value="other" ${injury.injury_type === "other" ? "selected" : ""}>Autre</option>
            </select>
          </div>
          <div class="form-group">
            <label for="severity">Gravité</label>
            <select id="severity" name="severity" required>
              <option value="minor" ${injury.severity === "minor" ? "selected" : ""}>Mineure</option>
              <option value="moderate" ${injury.severity === "moderate" ? "selected" : ""}>Modérée</option>
              <option value="major" ${injury.severity === "major" ? "selected" : ""}>Majeure</option>
              <option value="severe" ${injury.severity === "severe" ? "selected" : ""}>Sévère</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" rows="3" required>${injury.description}</textarea>
        </div>
        <div class="form-group">
          <label for="expected_recovery_date">Date de récupération prévue</label>
          <input type="date" id="expected_recovery_date" name="expected_recovery_date" value="${injury.expected_recovery_date}">
        </div>
        <div class="form-group">
          <label for="treatment">Traitement</label>
          <textarea id="treatment" name="treatment" rows="2">${injury.treatment || ""}</textarea>
        </div>
        <div class="form-group">
          <button type="submit" class="btn btn-primary">Modifier la blessure</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </form>
    `

    showModal("Modifier la Blessure", content)

    document.getElementById("edit-injury-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "update"
      data.id = id

      try {
        const result = await app.postData("../controllers/InjuryController.php", data)
        if (result.success) {
          closeModal()
          app.loadInjuries()
          alert("Blessure modifiée avec succès!")
        }
      } catch (error) {
        console.error("Erreur lors de la modification de la blessure:", error)
      }
    })
  } catch (error) {
    console.error("Erreur lors du chargement de la blessure:", error)
  }
}

// Fonction pour supprimer une blessure
async function deleteInjury(id) {
  if (!app.hasPermission("injuries", "delete")) {
    alert("Vous n'avez pas les permissions pour supprimer une blessure")
    return
  }

  if (confirm("Êtes-vous sûr de vouloir supprimer cette blessure ?")) {
    try {
      const result = await app.postData("../controllers/InjuryController.php", {
        action: "delete",
        id: id,
      })

      if (result.success) {
        app.loadInjuries()
        alert("Blessure supprimée avec succès!")
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la blessure:", error)
    }
  }
}

// Fonctions pour la gestion d'équipe 
function showAddTeamModal() {
  if (!app.hasPermission("team", "create")) {
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

  showModal("Créer une Équipe", content)

  document.getElementById("add-team-form").addEventListener("submit", async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    data.action = "create"

    try {
      const result = await app.postData("../controllers/TeamController.php", data)
      if (result.success) {
        closeModal()
        app.loadTeamManagement()
        alert("Équipe créée avec succès!")
      }
    } catch (error) {
      console.error("Erreur lors de la création de l'équipe:", error)
    }
  })
}

async function editTeam(id) {
  if (!app.hasPermission("team", "update")) {
    alert("Vous n'avez pas les permissions pour modifier une équipe")
    return
  }

  try {
    const team = await app.fetchData(`../controllers/TeamController.php?action=getOne&id=${id}`)
    const teamPlayers = await app.fetchData(`../controllers/TeamController.php?action=getTeamPlayers&team_id=${id}`)

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

    showModal("Modifier l'Équipe", content)

    // Charger tous les joueurs et marquer ceux qui sont dans l'équipe
    const players = await app.fetchData("../controllers/PlayerController.php?action=getAll")
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

      // Récupérer les joueurs sélectionnés
      const selectedPlayers = []
      const checkboxes = document.querySelectorAll('input[name="team_players[]"]:checked')
      checkboxes.forEach((checkbox) => {
        selectedPlayers.push(Number.parseInt(checkbox.value))
      })

      data.action = "update"
      data.id = id

      try {
        const result = await app.postData("../controllers/TeamController.php", data)
        if (result.success) {
          // Mettre à jour les joueurs assignés
          await app.postData("../controllers/TeamController.php", {
            action: "assignPlayers",
            team_id: id,
            player_ids: selectedPlayers,
          })

          closeModal()
          app.loadTeamManagement()
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

async function deleteTeam(id) {
  if (!app.hasPermission("team", "delete")) {
    alert("Vous n'avez pas les permissions pour supprimer une équipe")
    return
  }

  if (confirm("Êtes-vous sûr de vouloir supprimer cette équipe ?")) {
    try {
      const result = await app.postData("../controllers/TeamController.php", {
        action: "delete",
        id: id,
      })

      if (result.success) {
        app.loadTeamManagement()
        alert("Équipe supprimée avec succès!")
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'équipe:", error)
    }
  }
}
function clearAllTeamPlayers() {
  const checkboxes = document.querySelectorAll('input[name="team_players[]"]')
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false
  })
}
async function viewTeamDetails(id) {
  try {
    const teams = await app.fetchData("../controllers/TeamController.php?action=getAll")
    const team = teams.find((t) => t.id == id)

    // Charger les joueurs de cette équipe
    const players = await app.fetchData("../controllers/PlayerController.php?action=getAll")
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

    showModal("Détails de l'Équipe", detailsHtml)
  } catch (error) {
    console.error("Erreur lors du chargement des détails:", error)
  }
}

async function manageTeamPlayers(teamId) {
  if (!app.hasPermission("team", "manage")) {
    alert("Vous n'avez pas les permissions pour gérer les joueurs d'équipe")
    return
  }

  try {
    const players = await app.fetchData("../controllers/PlayerController.php?action=getAll")
    const team = await app.fetchData(`../controllers/TeamController.php?action=getOne&id=${teamId}`)
    const teamPlayers = await app.fetchData(`../controllers/TeamController.php?action=getTeamPlayers&team_id=${teamId}`)

    if (!team) {
      alert("Équipe non trouvée")
      return
    }

    // Créer un Set des IDs des joueurs actuellement dans l'équipe pour faciliter la vérification
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

    showModal("Gérer les Joueurs", content)
  } catch (error) {
    console.error("Erreur lors du chargement de la gestion des joueurs:", error)
    alert("Erreur lors du chargement de la gestion des joueurs")
  }
}

async function saveTeamPlayers(teamId) {
  const checkboxes = document.querySelectorAll('input[name="team_players[]"]')
  const selectedPlayers = []

  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      selectedPlayers.push(Number.parseInt(checkbox.value))
    }
  })

  try {
    const result = await app.postData("../controllers/TeamController.php", {
      action: "assignPlayers",
      team_id: teamId,
      player_ids: selectedPlayers,
    })

    if (result.success) {
      closeModal()
      app.loadTeamManagement()
      alert("Joueurs assignés avec succès!")
    }
  } catch (error) {
    console.error("Erreur lors de l'assignation des joueurs:", error)
  }
}

// Fonction pour voir les statistiques d'un joueur
async function viewPlayerStats(playerId) {
  try {
    const stats = await app.fetchData(
      `../controllers/StatisticsController.php?action=getPlayerStats&player_id=${playerId}`,
    )
    const player = await app.fetchData(`../controllers/PlayerController.php?action=getOne&id=${playerId}`)

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

    showModal("Statistiques du Joueur", statsHtml)
  } catch (error) {
    console.error("Erreur lors du chargement des statistiques:", error)
  }
}

// Fonctions utilitaires pour la gestion des joueurs d'équipe
function selectAllTeamPlayers() {
  const checkboxes = document.querySelectorAll('input[name="team_players[]"]')
  checkboxes.forEach((checkbox) => {
    checkbox.checked = true
  })
}

// Fonction pour voir les détails d'un match
async function viewMatchDetails(matchId) {
  try {
    const stats = await app.fetchData(
      `../controllers/StatisticsController.php?action=getMatchStats&match_id=${matchId}`,
    )
    const match = await app.fetchData(`../controllers/MatchController.php?action=getOne&id=${matchId}`)

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

    showModal("Détails du match", statsHtml)
  } catch (error) {
    console.error("Erreur lors du chargement des détails:", error)
  }
}
//fonctions pour acount 
async function showCreateAccountModal () {
  if (!app.hasPermission("new-account", "create")) {
    alert("Vous n'avez pas les permissions pour créer un compte utilisateur")
    return
  }
  const content = `
    <form id="create-user-form">
      <div class="form-group">
        <label for="username">Nom d'utilisateur</label>
        <input type="text" id="username" name="username" required>
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required>
      </div>
      <div class="form-group">
        <label for="password">Mot de passe</label>
        <input type="password" id="password" name="password" required>
      </div>
      <div class="form-group">
        <label for="role">Rôle</label>
        <select id="role" name="role" required>
          <option value="analyste">Analyste</option>
          <option value="manager">Manager</option>
          <option value="coach">Entraîneur</option>
        </select>
      </div>
      <div class="form-group">
        <button type="submit" class="btn btn-primary">Créer le compte</button>
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
      </div>
    </form>
  `
  showModal("Créer un Compte Utilisateur", content)

  document.getElementById("create-user-form").addEventListener("submit", async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    data.action = "createAccount"
    try {
      const result = await app.postData("../auth/AuthController.php?action=createAccount", data)
      if (result.success) {
        closeModal();
        app.loadAccountManagement();
        alert("Compte utilisateur créé avec succès!")
      } else {
        alert("Erreur lors de la création du compte: " + (result.error || "Erreur inconnue"))
      }
    } catch (error) {
      console.error("Erreur lors de la création du compte:", error)
    }
  })
}

async function editAccount(id) {
  if (!app.hasPermission("new-account", "update")) {
    alert("Vous n'avez pas les permissions pour modifier un compte")
    return
  }

  try {
    const users = await app.fetchData("../auth/AuthController.php?action=getAllUsers")
    const account = users.users.find((u) => u.id == id)

    if (!account) {
      alert("Compte non trouvé")
      return
    }

    const content = `
      <form id="edit-account-form">
        <div class="form-group">
          <label for="username">Nom d'utilisateur</label>
          <input type="text" id="username" name="username" value="${account.username}" required>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" value="${account.email}" required>
        </div>
        <div class="form-group">
          <label for="role">Rôle</label>
          <select id="role" name="role" required>
            <option value="analyste" ${account.role === "analyste" ? "selected" : ""}>Analyste</option>
            <option value="manager" ${account.role === "manager" ? "selected" : ""}>Manager</option>
            <option value="coach" ${account.role === "coach" ? "selected" : ""}>Entraîneur</option>
          </select>
        </div>
        <div class="form-group">
          <button type="submit" class="btn btn-primary">Modifier le compte</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </form>
    `

    showModal("Modifier le Compte", content)

    document.getElementById("edit-account-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "updateAccount"
      data.id = id

      try {
        const result = await app.postData("../auth/AuthController.php", data)
        if (result.success) {
          closeModal()
          app.loadAccountManagement()
          alert("Compte modifié avec succès!")
        } else {
          alert("Erreur lors de la modification: " + (result.error || "Erreur inconnue"))
        }
      } catch (error) {
        console.error("Erreur lors de la modification du compte:", error)
        alert("Erreur lors de la modification du compte")
      }
    })
  } catch (error) {
    console.error("Erreur lors du chargement du compte:", error)
    alert("Erreur lors du chargement du compte")
  }
}

async function deleteAccount(id) {
  if (!app.hasPermission("new-account", "delete")) {
    alert("Vous n'avez pas les permissions pour supprimer un compte")
    return
  }

  if (confirm("Êtes-vous sûr de vouloir supprimer ce compte ?")) {
    try {
      const result = await app.postData("../auth/AuthController.php", {
        action: "deleteAccount",
        id: id,
      })

      if (result.success) {
        app.loadAccountManagement()
        alert("Compte supprimé avec succès!")
      } else {
        alert("Erreur lors de la suppression: " + (result.error || "Erreur inconnue"))
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du compte:", error)
      alert("Erreur lors de la suppression du compte")
    }
  }
}


// Fonctions pour les matchs (Manager)
function showAddMatchModal() {
  if (!app.hasPermission("matches", "create")) {
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

  showModal("Programmer un Match", content)

  // Charger les équipes
  app
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
      const result = await app.postData("../controllers/MatchController.php", data)
      if (result.success) {
        closeModal()
        app.loadMatches()
        app.loadDashboard()
        alert("Match programmé avec succès!")
      }
    } catch (error) {
      console.error("Erreur lors de la programmation du match:", error)
    }
  })
}


async function editMatch(id) {
  if (!app.hasPermission("matches", "update")) {
    alert("Vous n'avez pas les permissions pour modifier un match")
    return
  }

  try {
    const match = await app.fetchData(`../controllers/MatchController.php?action=getOne&id=${id}`)

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

    showModal("Modifier le Match", content)

    // Charger les équipes
    app.fetchData("../controllers/TeamController.php?action=getAll").then((teams) => {
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
        const result = await app.postData("../controllers/MatchController.php", data)
        if (result.success) {
          closeModal()
          app.loadMatches()
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

async function deleteMatch(id) {
  if (!app.hasPermission("matches", "delete")) {
    alert("Vous n'avez pas les permissions pour supprimer un match")
    return
  }

  if (confirm("Êtes-vous sûr de vouloir supprimer ce match ?")) {
    try {
      const result = await app.postData("../controllers/MatchController.php", {
        action: "delete",
        id: id,
      })

      if (result.success) {
        app.loadMatches()
        app.loadDashboard()
        alert("Match supprimé avec succès!")
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du match:", error)
    }
  }
}

async function updateMatchScore(matchId) {
  if (!app.hasPermission("matches", "update")) {
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

  showModal("Mettre à jour le Score", content)

  document.getElementById("update-score-form").addEventListener("submit", async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    data.action = "updateScore"
    data.id = matchId

    try {
      const result = await app.postData("../controllers/MatchController.php", data)
      if (result.success) {
        closeModal()
        app.loadMatches()
        app.loadDashboard()
        alert("Score mis à jour avec succès!")
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du score:", error)
    }
  })
}

// Fonctions pour le budget (Manager)
function showAddBudgetModal() {
  if (!app.hasPermission("budget", "create")) {
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

  showModal("Ajouter une Transaction", content)

  document.getElementById("add-budget-form").addEventListener("submit", async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    data.action = "create"
    data.created_by = app.currentUser.id

    try {
      const result = await app.postData("../controllers/BudgetController.php", data)
      if (result.success) {
        closeModal()
        app.loadBudget()
        app.loadDashboard()
        alert("Transaction ajoutée avec succès!")
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la transaction:", error)
    }
  })
}

async function editBudgetItem(id) {
  if (!app.hasPermission("budget", "update")) {
    alert("Vous n'avez pas les permissions pour modifier une transaction")
    return
  }

  try {
    const item = await app.fetchData(`../controllers/BudgetController.php?action=getOne&id=${id}`)

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

    showModal("Modifier la Transaction", content)

    document.getElementById("edit-budget-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "update"
      data.id = id

      try {
        const result = await app.postData("../controllers/BudgetController.php", data)
        if (result.success) {
          closeModal()
          app.loadBudget()
          app.loadDashboard()
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

async function deleteBudgetItem(id) {
  if (!app.hasPermission("budget", "delete")) {
    alert("Vous n'avez pas les permissions pour supprimer une transaction")
    return
  }

  if (confirm("Êtes-vous sûr de vouloir supprimer cette transaction ?")) {
    try {
      const result = await app.postData("../controllers/BudgetController.php", {
        action: "delete",
        id: id,
      })

      if (result.success) {
        app.loadBudget()
        app.loadDashboard()
        alert("Transaction supprimée avec succès!")
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la transaction:", error)
    }
  }
}

// Fonctions pour les stratégies
function showProposeStrategyModal() {
  if (!app.hasPermission("strategies", "create")) {
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

  showModal("📋 Proposer une Stratégie", content)

  // Charger les matchs à venir
  app.fetchData("../controllers/MatchController.php?action=getAll").then((matches) => {
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
    data.proposed_by = app.currentUser.id

    try {
      const result = await app.postData("../controllers/StrategyController.php", data)
      if (result.success) {
        closeModal()
        app.loadStrategies()
        alert("Stratégie proposée avec succès!")
      }
    } catch (error) {
      console.error("Erreur lors de la proposition de stratégie:", error)
    }
  })
}

async function validateStrategy(strategyId, status) {
  if (!app.hasPermission("strategies", "validate")) {
    alert("Vous n'avez pas les permissions pour valider une stratégie")
    return
  }

  const comments = prompt(`Commentaires pour ${status === "approved" ? "approuver" : "rejeter"} cette stratégie:`)

  try {
    const result = await app.postData("../controllers/StrategyController.php", {
      action: "validate",
      id: strategyId,
      status: status,
      validated_by: app.currentUser.id,
      comments: comments || "",
    })

    if (result.success) {
      app.loadStrategies()
      alert(`Stratégie ${status === "approved" ? "approuvée" : "rejetée"} avec succès!`)
    }
  } catch (error) {
    console.error("Erreur lors de la validation:", error)
  }
}

async function editStrategy(id) {
  if (!app.hasPermission("strategies", "update")) {
    alert("Vous n'avez pas les permissions pour modifier une stratégie")
    return
  }

  try {
    const strategies = await app.fetchData("../controllers/StrategyController.php?action=getAll")
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

    showModal("Modifier la Stratégie", content)

    document.getElementById("edit-strategy-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "update"
      data.id = id

      try {
        const result = await app.postData("../controllers/StrategyController.php", data)
        if (result.success) {
          closeModal()
          app.loadStrategies()
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

async function deleteStrategy(id) {
  if (!app.hasPermission("strategies", "delete")) {
    alert("Vous n'avez pas les permissions pour supprimer une stratégie")
    return
  }

  if (confirm("Êtes-vous sûr de vouloir supprimer cette stratégie ?")) {
    try {
      const result = await app.postData("../controllers/StrategyController.php", {
        action: "delete",
        id: id,
      })

      if (result.success) {
        app.loadStrategies()
        alert("Stratégie supprimée avec succès!")
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la stratégie:", error)
    }
  }
}

// Fonctions pour les entraînements
function showAddTrainingModal() {
  if (!app.hasPermission("trainings", "create")) {
    alert("Vous n'avez pas les permissions pour programmer un entraînement")
    return
  }

  const content = `
    <form id="add-training-form">
      <div class="form-group">
        <label for="training_type_id">Type d'entraînement</label>
        <select id="training_type_id" name="training_type_id" required>
          <option value="">Sélectionner</option>
          <option value="1">Cardio</option>
          <option value="2">Technique</option>
          <option value="3">Tactique</option>
          <option value="4">Musculation</option>
          <option value="5">Tirs</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="date">Date et heure</label>
          <input type="datetime-local" id="date" name="date" required>
        </div>
        <div class="form-group">
          <label for="duration_minutes">Durée (minutes)</label>
          <input type="number" id="duration_minutes" name="duration_minutes" value="60" min="15" max="180" required>
        </div>
      </div>
      <div class="form-group">
        <label for="location">Lieu</label>
        <input type="text" id="location" name="location" required>
      </div>
      <div class="form-group">
        <label for="description">Description</label>
        <textarea id="description" name="description" rows="3" required></textarea>
      </div>
      <div class="form-group">
        <label>Participants</label>
        <div class="participants-selection">
          <button type="button" class="btn btn-secondary" onclick="selectAllPlayers()">Tous les joueurs</button>
          <button type="button" class="btn btn-secondary" onclick="clearPlayerSelection()">Aucun</button>
        </div>
        <div id="players-checkboxes" class="players-checkboxes">
          <!-- Les joueurs seront chargés ici -->
        </div>
      </div>
      <div class="form-group">
        <button type="submit" class="btn btn-primary">Programmer l'entraînement</button>
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
      </div>
    </form>
  `

  showModal("Programmer un Entraînement", content)

  // Charger les joueurs pour la sélection
  app
    .fetchData("../controllers/PlayerController.php?action=getAll")
    .then((players) => {
      const container = document.getElementById("players-checkboxes")
      players.forEach((player) => {
        const div = document.createElement("div")
        div.className = "player-checkbox"
        div.innerHTML = `
        <label>
          <input type="checkbox" name="participants[]" value="${player.id}">
          ${player.first_name} ${player.last_name} (${player.position})
        </label>
      `
        container.appendChild(div)
      })
    })
    .catch((error) => {
      console.error("Erreur lors du chargement des joueurs:", error)
    })

  document.getElementById("add-training-form").addEventListener("submit", async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    data.action = "create"
    data.created_by = app.currentUser.id

    // Récupérer les participants sélectionnés
    const participants = []
    const checkboxes = document.querySelectorAll('input[name="participants[]"]:checked')
    checkboxes.forEach((checkbox) => {
      participants.push(Number.parseInt(checkbox.value))
    })
    data.participants = participants

    try {
      const result = await app.postData("../controllers/TrainingController.php", data)
      if (result.success) {
        closeModal()
        app.loadTrainings()
        alert("Entraînement programmé avec succès!")
      }
    } catch (error) {
      console.error("Erreur lors de la programmation de l'entraînement:", error)
    }
  })
}

// Fonctions utilitaires pour la sélection de joueurs
function selectAllPlayers() {
  const checkboxes = document.querySelectorAll('input[name="participants[]"]')
  checkboxes.forEach((checkbox) => {
    checkbox.checked = true
  })
}

function clearPlayerSelection() {
  const checkboxes = document.querySelectorAll('input[name="participants[]"]')
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false
  })
}

async function editTraining(id) {
  if (!app.hasPermission("trainings", "update")) {
    alert("Vous n'avez pas les permissions pour modifier un entraînement")
    return
  }

  try {
    const training = await app.fetchData(`../controllers/TrainingController.php?action=getOne&id=${id}`)

    const content = `
      <form id="edit-training-form">
        <div class="form-group">
          <label for="training_type_id">Type d'entraînement</label>
          <select id="training_type_id" name="training_type_id" required>
            <option value="1" ${training.training_type_id == 1 ? "selected" : ""}>Cardio</option>
            <option value="2" ${training.training_type_id == 2 ? "selected" : ""}>Technique</option>
            <option value="3" ${training.training_type_id == 3 ? "selected" : ""}>Tactique</option>
            <option value="4" ${training.training_type_id == 4 ? "selected" : ""}>Musculation</option>
            <option value="5" ${training.training_type_id == 5 ? "selected" : ""}>Tirs</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="date">Date et heure</label>
            <input type="datetime-local" id="date" name="date" value="${training.date.replace(" ", "T")}" required>
          </div>
          <div class="form-group">
            <label for="duration_minutes">Durée (minutes)</label>
            <input type="number" id="duration_minutes" name="duration_minutes" value="${training.duration_minutes}" min="15" max="180" required>
          </div>
        </div>
        <div class="form-group">
          <label for="location">Lieu</label>
          <input type="text" id="location" name="location" value="${training.location}" required>
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" rows="3" required>${training.description}</textarea>
        </div>
        <div class="form-group">
          <button type="submit" class="btn btn-primary">Modifier l'entraînement</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </form>
    `

    showModal("Modifier l'Entraînement", content)

    document.getElementById("edit-training-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "update"
      data.id = id

      try {
        const result = await app.postData("../controllers/TrainingController.php", data)
        if (result.success) {
          closeModal()
          app.loadTrainings()
          alert("Entraînement modifié avec succès!")
        }
      } catch (error) {
        console.error("Erreur lors de la modification de l'entraînement:", error)
      }
    })
  } catch (error) {
    console.error("Erreur lors du chargement de l'entraînement:", error)
  }
}

async function deleteTraining(id) {
  if (!app.hasPermission("trainings", "delete")) {
    alert("Vous n'avez pas les permissions pour supprimer un entraînement")
    return
  }

  if (confirm("Êtes-vous sûr de vouloir supprimer cet entraînement ?")) {
    try {
      const result = await app.postData("../controllers/TrainingController.php", {
        action: "delete",
        id: id,
      })

      if (result.success) {
        app.loadTrainings()
        alert("Entraînement supprimé avec succès!")
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'entraînement:", error)
    }
  }
}

async function viewTrainingDetails(id) {
  try {
    const training = await app.fetchData(`../controllers/TrainingController.php?action=getOne&id=${id}`)

    const detailsHtml = `
      <div class="training-details">
        <h4>Détails de l'entraînement</h4>
        <div class="detail-item">
          <strong>Type:</strong>
          <span>${training.training_type_name}</span>
        </div>
        <div class="detail-item">
          <strong>Date:</strong>
          <span>${new Date(training.date).toLocaleDateString("fr-FR")} à ${new Date(training.date).toLocaleTimeString("fr-FR")}</span>
        </div>
        <div class="detail-item">
          <strong>Durée:</strong>
          <span>${training.duration_minutes} minutes</span>
        </div>
        <div class="detail-item">
          <strong>Lieu:</strong>
          <span>${training.location}</span>
        </div>
        <div class="detail-item">
          <strong>Description:</strong>
          <span>${training.description}</span>
        </div>
        <div class="detail-item">
          <strong>Créé par:</strong>
          <span>${training.created_by_name}</span>
        </div>
        ${
          training.participants
            ? `
        <div class="detail-item">
          <strong>Participants:</strong>
          <span>${training.participants}</span>
        </div>
        `
            : ""
        }
        <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
      </div>
    `

    showModal("Détails de l'Entraînement", detailsHtml)
  } catch (error) {
    console.error("Erreur lors du chargement des détails:", error)
  }
}


// Fonction pour voir l'analyse détaillée de performance depuis le sélecteur
function viewDetailedPerformanceFromSelect() {
  const playerId = document.getElementById("performance-player-select").value
  if (!playerId) {
    alert("Veuillez sélectionner un joueur")
    return
  }
  viewDetailedPerformance(playerId)
}

// Fonction pour voir l'analyse détaillée de performance (Analyste)
async function viewDetailedPerformance(playerId) {
  if (!app.hasPermission("performance", "analyze")) {
    alert("Vous n'avez pas les permissions pour voir l'analyse détaillée")
    return
  }

  try {
    const analysis = await app.fetchData(
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

    showModal("Analyse de Performance", analysisHtml)
  } catch (error) {
    console.error("Erreur lors du chargement de l'analyse:", error)
    alert("Erreur lors du chargement de l'analyse de performance")
  }
}


// Fonction de déconnexion
async function logout() {
  try {
    const response = await fetch("../auth/AuthController.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "logout" }),
    })

    const result = await response.json()
    if (result.success) {
      window.location.href = "login.html"
    }
  } catch (error) {
    console.error("Erreur de déconnexion:", error)
    // Forcer la redirection même en cas d'erreur
    window.location.href = "login.html"
  }
}

// Initialisation de l'application
let app
document.addEventListener("DOMContentLoaded", async () => {
  const isAuthenticated = await checkAuthentication()
  if (isAuthenticated) {
    app = new BasketballApp()
  }
})

// Fermer le modal en cliquant à l'extérieur
document.addEventListener("click", (e) => {
  if (e.target.id === "modal-overlay") {
    closeModal()
  }
})




