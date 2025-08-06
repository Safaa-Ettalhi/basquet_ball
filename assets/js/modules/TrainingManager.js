export class TrainingManager {
  constructor(app) {
    this.app = app
  }

  async loadTrainings() {
    try {
      const trainings = await this.app.fetchData("../controllers/TrainingController.php?action=getAll")
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

    if (this.app.hasPermission("trainings", "update")) {
      actionButtons += `
        <button class="btn btn-secondary" onclick="editTraining(${training.id})" title="Modifier">
          <i data-lucide="edit"></i>
        </button>`
    }

    if (this.app.hasPermission("trainings", "delete")) {
      actionButtons += `
        <button class="btn btn-danger" onclick="deleteTraining(${training.id})" title="Supprimer">
          <i data-lucide="trash-2"></i>
        </button>`
    }

    actionButtons += `
      <button class="btn btn-info" onclick="viewTrainingDetails(${training.id})" title="Détails">
        <i data-lucide="eye"></i>
      </button>`

    row.innerHTML = `
      <td>${trainingDate}</td>
      <td>${training.training_type_name}</td>
      <td>${training.duration_minutes} min</td>
      <td>${training.location}</td>
      <td>${training.description || ""}</td>
      <td class="action-buttons">
        ${actionButtons}
      </td>
    `

    tbody.appendChild(row)
  })

  // Recharge les icônes Lucide après injection
  lucide.createIcons()
}


  showAddTrainingModal() {
    if (!this.app.hasPermission("trainings", "create")) {
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

    window.showModal("Programmer un Entraînement", content)

  
    this.app
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
      data.created_by = this.app.currentUser.id

  
      const participants = []
      const checkboxes = document.querySelectorAll('input[name="participants[]"]:checked')
      checkboxes.forEach((checkbox) => {
        participants.push(Number.parseInt(checkbox.value))
      })
      data.participants = participants

      try {
        const result = await this.app.postData("../controllers/TrainingController.php", data)
        if (result.success) {
          window.closeModal()
          this.loadTrainings()
          alert("Entraînement programmé avec succès!")
        }
      } catch (error) {
        console.error("Erreur lors de la programmation de l'entraînement:", error)
      }
    })
  }

  async editTraining(id) {
    if (!this.app.hasPermission("trainings", "update")) {
      alert("Vous n'avez pas les permissions pour modifier un entraînement")
      return
    }

    try {
      const training = await this.app.fetchData(`../controllers/TrainingController.php?action=getOne&id=${id}`)
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

      window.showModal("Modifier l'Entraînement", content)

      document.getElementById("edit-training-form").addEventListener("submit", async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = Object.fromEntries(formData)
        data.action = "update"
        data.id = id

        try {
          const result = await this.app.postData("../controllers/TrainingController.php", data)
          if (result.success) {
            window.closeModal()
            this.loadTrainings()
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

  async deleteTraining(id) {
    if (!this.app.hasPermission("trainings", "delete")) {
      alert("Vous n'avez pas les permissions pour supprimer un entraînement")
      return
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer cet entraînement ?")) {
      try {
        const result = await this.app.postData("../controllers/TrainingController.php", {
          action: "delete",
          id: id,
        })
        if (result.success) {
          this.loadTrainings()
          alert("Entraînement supprimé avec succès!")
        }
      } catch (error) {
        console.error("Erreur lors de la suppression de l'entraînement:", error)
      }
    }
  }

  async viewTrainingDetails(id) {
    try {
      const training = await this.app.fetchData(`../controllers/TrainingController.php?action=getOne&id=${id}`)
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
      window.showModal("Détails de l'Entraînement", detailsHtml)
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
    }
  }

  
  selectAllPlayers() {
    const checkboxes = document.querySelectorAll('input[name="participants[]"]')
    checkboxes.forEach((checkbox) => {
      checkbox.checked = true
    })
  }

  clearPlayerSelection() {
    const checkboxes = document.querySelectorAll('input[name="participants[]"]')
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false
    })
  }
}
