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

    lucide.createIcons()
  }

  getCurrentDateTime() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  showAddTrainingModal() {
    if (!this.app.hasPermission("trainings", "create")) {
      alert("Vous n'avez pas les permissions pour programmer un entraînement")
      return
    }
    
    const currentDateTime = this.getCurrentDateTime()
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
            <input type="datetime-local" id="date" name="date" min="${currentDateTime}" required>
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
        
         Section Participants 
        <div class="form-group">
         
          <div class="participants-selection" style="margin-bottom: 1rem;">
            <button type="button" class="btn btn-secondary" onclick="selectAllPlayers()">Tous les joueurs</button>
            <button type="button" class="btn btn-secondary" onclick="clearPlayerSelection()">Aucun</button>
          </div>
          <div id="players-cards-container" class="players-cards-container" style="max-height: 400px; overflow-y: auto;">
             Les cartes de joueurs EN FORME seront chargées ici 
          </div>
          <div id="no-healthy-players" style="display: none; text-align: center; padding: 2rem; color: #666;">
            <i data-lucide="alert-circle" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
            <p>Aucun joueur en forme disponible pour l'entraînement</p>
          </div>
        </div>

        <div class="form-group">
          <button type="submit" class="btn btn-primary">Programmer l'entraînement</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </form>

      <style>
        .player-card {
          background: #2a2d47;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        
        .player-card:hover {
          background: #323659;
          transform: translateY(-1px);
        }
        
        .player-card.selected {
          border-color: #4f46e5;
          background: #323659;
        }
        
        .player-info {
          display: flex;
          align-items: center;
          flex: 1;
        }
        
        .player-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #ff6b35;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 16px;
          margin-right: 16px;
        }
        
        .player-details {
          flex: 1;
        }
        
        .player-name {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .player-position {
          color: #9ca3af;
          font-size: 14px;
          margin-bottom: 8px;
        }
        
        .player-stats {
          display: flex;
          gap: 24px;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
        }
        
        .stat-label {
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        
        .stat-value {
          color: white;
          font-size: 16px;
          font-weight: 600;
        }
        
        .player-status {
          margin-left: 16px;
          margin-right: 16px;
        }
        
        .status-badge {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-healthy {
          background: #10b981;
          color: white;
        }
        
        .player-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #6b7280;
          border-radius: 4px;
          background: transparent;
          cursor: pointer;
          position: relative;
        }
        
        .player-checkbox:checked {
          background: #4f46e5;
          border-color: #4f46e5;
        }
        
        .player-checkbox:checked::after {
          content: '✓';
          position: absolute;
          top: -2px;
          left: 2px;
          color: white;
          font-size: 14px;
          font-weight: bold;
        }
      </style>
    `

    window.showModal("Programmer un Entraînement", content)

    document.getElementById("date").addEventListener("change", (e) => {
      const selectedDateTime = new Date(e.target.value)
      const now = new Date()
      
      if (selectedDateTime <= now) {
        alert("L'entraînement ne peut pas être programmé dans le passé")
        e.target.value = currentDateTime
      }
    })

    this.loadHealthyPlayersCards()

    document.getElementById("add-training-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      
      const trainingDateTime = new Date(document.getElementById("date").value)
      const now = new Date()
      
      if (trainingDateTime <= now) {
        alert("L'entraînement ne peut pas être programmé dans le passé")
        return
      }

      const formData = new FormData(e.target)
      const data = Object.fromEntries(formData)
      data.action = "create"
      data.created_by = this.app.currentUser.id

      const participants = []
      const checkboxes = document.querySelectorAll('input[name="participants[]"]:checked')
      checkboxes.forEach((checkbox) => {
        participants.push(parseInt(checkbox.value))
      })
      
      if (participants.length === 0) {
        alert("Veuillez sélectionner au moins un participant")
        return
      }
      
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

  async loadHealthyPlayersCards() {
    try {
      const allPlayers = await this.app.fetchData("../controllers/PlayerController.php?action=getAll")

      const healthyPlayers = allPlayers.filter(player => player.health_status === 'healthy')
      
      if (healthyPlayers.length === 0) {

        document.getElementById("players-cards-container").style.display = "none"
        document.getElementById("no-healthy-players").style.display = "block"

        const buttons = document.querySelectorAll('.participants-selection button')
        buttons.forEach(button => {
          button.disabled = true
          button.style.opacity = "0.5"
        })
        
        lucide.createIcons()
        return
      }
      
      this.displayPlayersCards(healthyPlayers)
    } catch (error) {
      console.error("Erreur lors du chargement des joueurs:", error)
      document.getElementById("players-cards-container").innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #666;">
          Erreur lors du chargement des joueurs
        </div>
      `
    }
  }

  displayPlayersCards(players) {
    const container = document.getElementById("players-cards-container")
    if (!container) return

    container.innerHTML = ""
    container.style.display = "block"
    document.getElementById("no-healthy-players").style.display = "none"

    players.forEach((player) => {
      const initials = `${player.first_name.charAt(0)}${player.last_name.charAt(0)}`.toUpperCase()

      const playerCard = document.createElement("div")
      playerCard.className = "player-card"
      playerCard.innerHTML = `
        <div class="player-info">
          <div class="player-avatar">${initials}</div>
          <div class="player-details">
            <div class="player-name">${player.first_name} ${player.last_name}</div>
            <div class="player-position">${player.position} • #${player.jersey_number}</div>
            <div class="player-stats">
              <div class="stat-item">
                <div class="stat-label">TAILLE</div>
                <div class="stat-value">${player.height}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">POIDS</div>
                <div class="stat-value">${player.weight}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="player-status">
          <div class="status-badge status-healthy">EN FORME</div>
        </div>
        <input type="checkbox" name="participants[]" value="${player.id}" class="player-checkbox">
      `

      playerCard.addEventListener('click', (e) => {
        if (e.target.type !== 'checkbox') {
          const checkbox = playerCard.querySelector('input[type="checkbox"]')
          checkbox.checked = !checkbox.checked
          playerCard.classList.toggle('selected', checkbox.checked)
        }
      })

      const checkbox = playerCard.querySelector('input[type="checkbox"]')
      checkbox.addEventListener('change', (e) => {
        playerCard.classList.toggle('selected', e.target.checked)
      })

      container.appendChild(playerCard)
    })
  }

  selectAllPlayers() {
    const checkboxes = document.querySelectorAll('input[name="participants[]"]')
    const cards = document.querySelectorAll('.player-card')
    
    checkboxes.forEach((checkbox, index) => {
      checkbox.checked = true
      if (cards[index]) {
        cards[index].classList.add('selected')
      }
    })
  }

  clearPlayerSelection() {
    const checkboxes = document.querySelectorAll('input[name="participants[]"]')
    const cards = document.querySelectorAll('.player-card')
    
    checkboxes.forEach((checkbox, index) => {
      checkbox.checked = false
      if (cards[index]) {
        cards[index].classList.remove('selected')
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
      const currentDateTime = this.getCurrentDateTime()
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
              <input type="datetime-local" id="date" name="date" value="${training.date.replace(" ", "T")}" min="${currentDateTime}" required>
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
      
      document.getElementById("date").addEventListener("change", (e) => {
        const selectedDateTime = new Date(e.target.value)
        const now = new Date()
        
        if (selectedDateTime <= now) {
          alert("L'entraînement ne peut pas être programmé dans le passé")
          e.target.value = currentDateTime
        }
      })

      document.getElementById("edit-training-form").addEventListener("submit", async (e) => {
        e.preventDefault()
        
        const trainingDateTime = new Date(document.getElementById("date").value)
        const now = new Date()
        
        if (trainingDateTime <= now) {
          alert("L'entraînement ne peut pas être programmé dans le passé")
          return
        }

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
          ${training.participants ? `
            <div class="detail-item">
              <strong>Participants:</strong>
              <span>${training.participants}</span>
            </div>
          ` : ""}
          <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
        </div>
      `
      window.showModal("Détails de l'Entraînement", detailsHtml)
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
    }
  }
}

function selectAllPlayers() {
  const manager = window.trainingManager
  if (manager) manager.selectAllPlayers()
}

function clearPlayerSelection() {
  const manager = window.trainingManager
  if (manager) manager.clearPlayerSelection()
}
