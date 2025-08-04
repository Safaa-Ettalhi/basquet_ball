export class AccountManager {
  constructor(app) {
    this.app = app
  }

  async loadAccountManagement() {
    try {
      const accounts = await this.app.fetchData("../auth/AuthController.php?action=getAllUsers")
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

      if (this.app.hasPermission("new-account", "update")) {
        actionButtons += `<button class="btn btn-secondary" onclick="editAccount(${account.id})">Modifier</button>`
      }
      if (this.app.hasPermission("new-account", "delete")) {
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

  async showCreateAccountModal() {
    if (!this.app.hasPermission("new-account", "create")) {
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

    window.showModal("Créer un Compte Utilisateur", content)

    document.getElementById("create-user-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "createAccount"

      try {
        const result = await this.app.postData("../auth/AuthController.php?action=createAccount", data)
        if (result.success) {
          window.closeModal()
          this.loadAccountManagement()
          alert("Compte utilisateur créé avec succès!")
        } else {
          alert("Erreur lors de la création du compte: " + (result.error || "Erreur inconnue"))
        }
      } catch (error) {
        console.error("Erreur lors de la création du compte:", error)
      }
    })
  }

  async editAccount(id) {
    if (!this.app.hasPermission("new-account", "update")) {
      alert("Vous n'avez pas les permissions pour modifier un compte")
      return
    }

    try {
      const users = await this.app.fetchData("../auth/AuthController.php?action=getAllUsers")
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

      window.showModal("Modifier le Compte", content)

      document.getElementById("edit-account-form").addEventListener("submit", async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = Object.fromEntries(formData)
        data.action = "updateAccount"
        data.id = id

        try {
          const result = await this.app.postData("../auth/AuthController.php", data)
          if (result.success) {
            window.closeModal()
            this.loadAccountManagement()
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

  async deleteAccount(id) {
    if (!this.app.hasPermission("new-account", "delete")) {
      alert("Vous n'avez pas les permissions pour supprimer un compte")
      return
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer ce compte ?")) {
      try {
        const result = await this.app.postData("../auth/AuthController.php", {
          action: "deleteAccount",
          id: id,
        })
        if (result.success) {
          this.loadAccountManagement()
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
}
