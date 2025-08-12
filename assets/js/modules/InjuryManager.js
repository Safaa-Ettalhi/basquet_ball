export class InjuryManager {
  constructor(app) {
    this.app = app
  }

  async loadInjuries() {
    try {
      const injuries = await this.app.fetchData("../controllers/InjuryController.php?action=getAll")
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

    if (this.app.hasPermission("injuries", "update")) {
      actionButtons += `
        <button class="btn btn-success" onclick="markAsRecovered(${injury.id}, ${injury.player_id})" title="Marquer comme guéri">
          <i data-lucide="heart-pulse"></i>
        </button>
        <button class="btn btn-secondary" onclick="editInjury(${injury.id})" title="Modifier">
          <i data-lucide="edit"></i>
        </button>`
    }

    if (this.app.hasPermission("injuries", "delete")) {
      actionButtons += `
        <button class="btn btn-danger" onclick="deleteInjury(${injury.id})" title="Supprimer">
          <i data-lucide="trash-2"></i>
        </button>`
        
    }

    actionButtons += `
      <button class="btn btn-info" onclick="viewInjuryDetails(${injury.id})" title="Voir les détails">
        <i data-lucide="info"></i>
      </button>`

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

  // Recharge les icônes Lucide
  lucide.createIcons()
}

  getTodayDate() {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  getTomorrowDate() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }
  declareInjury(playerId) {
    if (!playerId) {
      alert("ID du joueur manquant")
      return
    }
    if (!this.app.hasPermission("injuries", "create")) {
      alert("Vous n'avez pas les permissions pour déclarer une blessure")
      return
    }

    const todayDate = this.getTodayDate()
    const tomorrowDate = this.getTomorrowDate()
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
            <input type="date" id="injury_date" name="injury_date" min="${todayDate}" value="${todayDate}" required>
          </div>
          <div class="form-group">
            <label for="expected_recovery_date">Date de récupération prévue</label>
            <input type="date" id="expected_recovery_date" name="expected_recovery_date" min="${tomorrowDate}">
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

    window.showModal("🏥 Déclarer une Blessure", content)
   
    document.getElementById("injury_date").addEventListener("change", (e) => {
      const injuryDate = new Date(e.target.value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (injuryDate < today) {
        alert("La date de blessure ne peut pas être antérieure à aujourd'hui")
        e.target.value = todayDate
      }
      
      const recoveryInput = document.getElementById("expected_recovery_date")
      const minRecoveryDate = new Date(injuryDate)
      minRecoveryDate.setDate(minRecoveryDate.getDate() + 1)
      recoveryInput.min = minRecoveryDate.toISOString().split('T')[0]
      
      if (recoveryInput.value && new Date(recoveryInput.value) <= injuryDate) {
        recoveryInput.value = minRecoveryDate.toISOString().split('T')[0]
      }
    })

    document.getElementById("expected_recovery_date").addEventListener("change", (e) => {
      const recoveryDate = new Date(e.target.value)
      const injuryDate = new Date(document.getElementById("injury_date").value)
      
      if (recoveryDate <= injuryDate) {
        alert("La date de récupération doit être postérieure à la date de blessure")
        const minRecoveryDate = new Date(injuryDate)
        minRecoveryDate.setDate(minRecoveryDate.getDate() + 1)
        e.target.value = minRecoveryDate.toISOString().split('T')[0]
      }
    })
    document.getElementById("declare-injury-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const injuryDate = new Date(document.getElementById("injury_date").value)
      const recoveryDate = new Date(document.getElementById("expected_recovery_date").value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (injuryDate < today) {
        alert("La date de blessure ne peut pas être antérieure à aujourd'hui")
        return
      }
      
      if (recoveryDate <= injuryDate) {
        alert("La date de récupération doit être postérieure à la date de blessure")
        return
      }
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "create"
      data.player_id = playerId

      
      if (!data.injury_type || !data.severity || !data.description || !data.injury_date) {
        alert("Veuillez remplir tous les champs obligatoires")
        return
      }

      try {
        console.log("Envoi des données blessure:", data)
        const result = await this.app.postData("../controllers/InjuryController.php", data)
        console.log("Résultat blessure:", result)

        if (result.success) {
          window.closeModal()
          this.loadInjuries()
          this.app.loadPlayers()
          this.app.loadDashboard()
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

  async markAsRecovered(injuryId, playerId) {
    if (confirm("Marquer ce joueur comme guéri ?")) {
      try {
        const result = await this.app.postData("../controllers/InjuryController.php", {
          action: "markRecovered",
          id: injuryId,
          player_id: playerId,
        })
        if (result.success) {
          this.loadInjuries()
          this.app.loadPlayers()
          this.app.loadDashboard()
          alert("Joueur marqué comme guéri!")
        }
      } catch (error) {
        console.error("Erreur lors de la récupération:", error)
      }
    }
  }

  async viewInjuryDetails(id) {
    try {
      const injury = await this.app.fetchData(`../controllers/InjuryController.php?action=getOne&id=${id}`)
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
      window.showModal("Détails de la Blessure", detailsHtml)
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
    }
  }

async editInjury(id) {
  if (!this.app.hasPermission("injuries", "update")) {
    alert("Vous n'avez pas les permissions pour modifier une blessure")
    return
  }

  try {
    const injury = await this.app.fetchData(`../controllers/InjuryController.php?action=getOne&id=${id}`)
    
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
          <input type="date" id="expected_recovery_date" name="expected_recovery_date" value="${injury.expected_recovery_date || ''}">
          <small class="form-help">Doit être supérieure à la date de blessure (${new Date(injury.injury_date).toLocaleDateString('fr-FR')})</small>
          <div id="recovery-alert" class="alert alert-warning" style="display: none; margin-top: 5px;">
            ⚠️ La date de récupération doit être postérieure à la date de blessure
          </div>
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

    window.showModal("Modifier la Blessure", content)

    const showAlert = (show) => {
      const alert = document.getElementById("recovery-alert")
      if (alert) {
        alert.style.display = show ? "block" : "none"
      }
    }

    document.getElementById("expected_recovery_date").addEventListener("change", (e) => {
      if (e.target.value) {
        const recoveryDate = new Date(e.target.value)
        const injuryDate = new Date(injury.injury_date)
        
        if (recoveryDate <= injuryDate) {
          showAlert(true)
          setTimeout(() => {
            e.target.focus()
          }, 100)
        } else {
          showAlert(false)
        }
      } else {
        showAlert(false)
      }
    })

    document.getElementById("edit-injury-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      
      // Validation finale avant soumission
      const recoveryDateValue = document.getElementById("expected_recovery_date").value
      if (recoveryDateValue) {
        const recoveryDate = new Date(recoveryDateValue)
        const injuryDate = new Date(injury.injury_date)
        
        if (recoveryDate <= injuryDate) {
          alert("La date de récupération prévue doit être postérieure à la date de blessure")
          showAlert(true)
          return
        }
      }
      
      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "update"
      data.id = id

      try {
        const result = await this.app.postData("../controllers/InjuryController.php", data)
        if (result.success) {
          window.closeModal()
          this.loadInjuries()
          alert("Blessure modifiée avec succès!")
        } else {
          alert("Erreur lors de la modification: " + (result.error || "Erreur inconnue"))
        }
      } catch (error) {
        console.error("Erreur lors de la modification de la blessure:", error)
        alert("Erreur lors de la modification de la blessure")
      }
    })
  } catch (error) {
    console.error("Erreur lors du chargement de la blessure:", error)
  }
}

  async deleteInjury(id) {
    if (!this.app.hasPermission("injuries", "delete")) {
      alert("Vous n'avez pas les permissions pour supprimer une blessure")
      return
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer cette blessure ?")) {
      try {
        const result = await this.app.postData("../controllers/InjuryController.php", {
          action: "delete",
          id: id,
        })
        if (result.success) {
          this.loadInjuries()
          alert("Blessure supprimée avec succès!")
        }
      } catch (error) {
        console.error("Erreur lors de la suppression de la blessure:", error)
      }
    }
  }
}
