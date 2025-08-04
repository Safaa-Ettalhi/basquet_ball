export class AuthManager {
  static async checkAuthentication() {
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

  static async logout() {
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
      
      window.location.href = "login.html"
    }
  }
}

window.logout = AuthManager.logout
