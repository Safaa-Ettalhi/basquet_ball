// // Utilitaire pour charger et initialiser les icônes Lucide
// class LucideManager {
//   constructor() {
//     this.isLoaded = false
//     this.loadPromise = null
//   }

//   async loadLucide() {
//     if (this.isLoaded) {
//       return Promise.resolve()
//     }

//     if (this.loadPromise) {
//       return this.loadPromise
//     }

//     this.loadPromise = new Promise((resolve, reject) => {
//       // Vérifier si Lucide est déjà chargé
//       if (window.lucide) {
//         this.isLoaded = true
//         resolve()
//         return
//       }

//       // Charger le script Lucide
//       const script = document.createElement("script")
//       script.src = "https://unpkg.com/lucide@latest/dist/umd/lucide.js"
//       script.onload = () => {
//         this.isLoaded = true
//         // Initialiser les icônes après le chargement
//         if (window.lucide) {
//           window.lucide.createIcons()
//         }
//         resolve()
//       }
//       script.onerror = () => {
//         console.error("Erreur lors du chargement de Lucide")
//         reject(new Error("Failed to load Lucide"))
//       }
//       document.head.appendChild(script)
//     })

//     return this.loadPromise
//   }

//   // Méthode pour créer les icônes après ajout de contenu dynamique
//   createIcons() {
//     if (window.lucide) {
//       window.lucide.createIcons()
//     }
//   }

//   // Méthode pour créer une icône spécifique
//   createIcon(name, element) {
//     if (window.lucide && window.lucide.icons[name]) {
//       const icon = window.lucide.icons[name]
//       element.innerHTML = icon.toSvg()
//     }
//   }
// }

// // Instance globale
// window.lucideManager = new LucideManager()

// // Fonction globale pour basculer les dropdowns d'actions
// window.toggleActionDropdown = (button) => {
//   const dropdown = button.nextElementSibling
//   const isOpen = dropdown.classList.contains("show")

//   // Fermer tous les autres dropdowns
//   document.querySelectorAll(".action-dropdown-menu.show").forEach((menu) => {
//     menu.classList.remove("show")
//   })

//   // Basculer le dropdown actuel
//   if (!isOpen) {
//     dropdown.classList.add("show")
//   }
// }

// // Fermer les dropdowns en cliquant ailleurs
// document.addEventListener("click", (event) => {
//   if (!event.target.closest(".action-dropdown")) {
//     document.querySelectorAll(".action-dropdown-menu.show").forEach((menu) => {
//       menu.classList.remove("show")
//     })
//   }
// })

// // Charger Lucide au démarrage
// document.addEventListener("DOMContentLoaded", () => {
//   window.lucideManager.loadLucide().catch((error) => {
//     console.error("Impossible de charger Lucide:", error)
//   })
// })

// export const lucide = window.lucideManager
