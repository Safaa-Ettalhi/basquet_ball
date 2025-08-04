export class ModalManager {
  static showModal(title, content) {
    document.getElementById("modal-title").textContent = title
    document.getElementById("modal-body").innerHTML = content
    document.getElementById("modal-overlay").style.display = "block"
  }

  static closeModal() {
    document.getElementById("modal-overlay").style.display = "none"
  }

  static init() {
   
    document.addEventListener("click", (e) => {
      if (e.target.id === "modal-overlay") {
        ModalManager.closeModal()
      }
    })
  }
}


window.showModal = ModalManager.showModal
window.closeModal = ModalManager.closeModal
