export class BasketballApp {
  constructor() {
    this.currentSection = "dashboard"
    this.currentUser = null
    this.allStatistics = []
    this.userPermissions = {}
  }

  async init() {
    // this.hideNavigationDuringLoad()

    await this.loadCurrentUser()
    this.setupRoleBasedUI()
    this.setupNavigation()
    this.showNavigationAfterLoad()

    this.loadDashboard()
    this.loadPlayers()
    this.loadMatches()
    this.loadTrainings()
    this.loadBudget()
    this.loadInjuries()
    this.loadAccountManagement()
  }

  // hideNavigationDuringLoad() {
  //   const navUl = document.querySelector("nav ul")
  //   if (navUl) {
  //     navUl.classList.add("nav-loading")
  //     navUl.style.display = "none"
  //   }
  // }

  showNavigationAfterLoad() {
    const navUl = document.querySelector("nav ul")
    if (navUl) {
      navUl.style.display = "flex"
      navUl.classList.remove("nav-loading")
      navUl.classList.add("nav-ready", "nav-loaded")
    }
  }

  async loadCurrentUser() {
    try {
      const response = await fetch("../auth/AuthController.php?action=getCurrentUser")
      this.currentUser = await response.json()
      console.log("Utilisateur actuel:", this.currentUser)
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
      coach: ["dashboard", "players", "trainings", "injuries", "strategies"],
      manager: [
        "dashboard",
        "new-account",
        "injuries",
        "players",
        "matches",
        "budget",
        "strategies",
        "team-management",
      ],
      analyste: ["dashboard", "statistics", "players", "performance"],
    }

    navItems.forEach((link) => {
      const section = link.getAttribute("href")?.substring(1) || ""
      if (link.classList.contains("logout-btn")) return
      link.style.display = "none"
      if (rolePermissions[role] && rolePermissions[role].includes(section)) {
        link.style.display = "flex"
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
        team: ["read", "manage"],
      },
      manager: {
        players: ["read", "create", "update_admin", "delete"],
        matches: ["read", "create", "update", "delete"],
        budget: ["read", "create", "update", "delete"],
        strategies: ["read", "validate"],
        statistics: ["read"],
        "new-account": ["read", "create", "update", "delete"],
        injuries: ["read"],
        team: ["read", "create", "update", "delete", "manage"],
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

  async fetchData(url) {
    try {
      console.log("Fetching from:", url)
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const text = await response.text()
      console.log("Raw response:", text)

      if (!text.trim()) {
        throw new Error("Réponse vide du serveur")
      }

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

      console.log("Response status:", response.status)
      console.log("Response headers:", response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const text = await response.text()
      console.log("Raw response:", text)

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
}
