// Modal Manager for LEGO Catalog
import { DataLoader } from './data-loader.js';
import { Utils } from './utils.js';

class ModalManager {
  constructor() {
    this.activeModals = new Set();
    this.zIndexCounter = 100;
    this.currentModal = null;
  }

  // Open modal with z-index management
  openModal(modalId, zIndex = null) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Close any existing modal of the same type
    this.closeModal(modalId);

    // Set z-index
    const finalZIndex = zIndex || this.getNextZIndex();
    modal.style.zIndex = finalZIndex;
    
    // Add to active modals
    this.activeModals.add(modalId);
    this.currentModal = modalId;

    // Show modal
    modal.classList.remove('modal-hidden');
    document.body.classList.add('overflow-hidden');
    
    // Trigger animation
    requestAnimationFrame(() => {
      modal.classList.add('visible');
    });

    return finalZIndex;
  }

  // Close modal
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('modal-hidden');
    modal.classList.remove('visible');
    this.activeModals.delete(modalId);
    
    if (this.currentModal === modalId) {
      this.currentModal = null;
    }

    // Remove body overflow if no modals are open
    if (this.activeModals.size === 0) {
      document.body.classList.remove('overflow-hidden');
    }
  }

  // Close all modals
  closeAllModals() {
    this.activeModals.forEach(modalId => {
      this.closeModal(modalId);
    });
  }

  // Get next z-index
  getNextZIndex() {
    return ++this.zIndexCounter;
  }

  // Check if modal is open
  isModalOpen(modalId) {
    return this.activeModals.has(modalId);
  }

  // Get current modal
  getCurrentModal() {
    return this.currentModal;
  }
}

// Create global modal manager instance
const modalManager = new ModalManager();
window.modalManager = modalManager;

// Export for use in other modules
export { modalManager as ModalManager };
