// Part Modal for LEGO Catalog
import { DataLoader } from './data-loader.js';
import { ModalManager } from './modal-manager.js';
import { Utils } from './utils.js';

class PartModal {
  constructor() {
    this.currentPartId = null;
    this.currentColorId = null;
    this.quantity = 0;
    this.variants = [];
    this.imageUrl = '';
    this.isOpen = false;
  }

  // Open part modal
  open(partId, colorId = null) {
    if (!partId) return;

    this.currentPartId = partId;
    this.currentColorId = colorId;
    this.quantity = 0;
    this.isOpen = true;

    const part = DataLoader.getItem('parts', partId);
    if (!part) return;

    // Get part variants and colors
    this.loadPartData(part);

    // Render and show modal
    this.render();
    ModalManager.openModal('modal-container');
  }

  // Load part data
  async loadPartData(part) {
    try {
      // Get part colors from inventory
      const inventory = DataLoader.getSetInventory(part.part_num);
      const colors = new Map();
      
      if (inventory.parts) {
        inventory.parts.forEach(partData => {
          if (partData.partNum === part.part_num) {
            const color = DataLoader.getItem('colors', partData.colorId);
            if (color) {
              colors.set(partData.colorId, {
                id: partData.colorId,
                name: color.name,
                rgb: color.rgb,
                quantity: partData.quantity
              });
            }
          }
        });
      }

      // Set variants (for now, just the part itself)
      this.variants = [{
        id: part.part_num,
        name: part.name,
        imageUrl: `https://cdn.rebrickable.com/media/parts/ldraw/${part.part_num}.png`
      }];

      // Set image URL
      this.imageUrl = this.variants[0].imageUrl;

      // Set default color if not specified
      if (!this.currentColorId && colors.size > 0) {
        this.currentColorId = Array.from(colors.keys())[0];
      }

    } catch (error) {
      console.error('Error loading part data:', error);
    }
  }

  // Render modal
  render() {
    const modalEl = document.getElementById('modal-container');
    if (!modalEl) return;

    const part = DataLoader.getItem('parts', this.currentPartId);
    if (!part) return;

    const category = DataLoader.getItem('partCategories', part.categoryId);
    const currentColor = this.currentColorId ? DataLoader.getItem('colors', this.currentColorId) : null;

    modalEl.innerHTML = `
      <div id="modal-content" class="bg-gray-800 rounded-lg shadow-xl w-[calc(100%-2rem)] max-w-lg lg:max-w-4xl flex flex-col max-h-[calc(100vh-2rem)] modal-content-enter">
        
        <div class="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 class="text-xl lg:text-2xl font-bold text-white truncate pr-8">${part.name}</h2>
          <div class="flex items-center gap-2">
            <button data-action="share-part" class="text-gray-300 hover:text-white transition-colors duration-150" title="Поделиться деталью">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
              </svg>
            </button>
            <button id="modal-close" class="modal-close-btn" title="Закрыть модальное окно">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div id="modal-scroll-area" class="flex-grow flex flex-col lg:flex-row overflow-y-auto no-scrollbar">
          <div class="lg:w-1/2 p-4 sm:p-6 bg-gray-900/30 flex items-center justify-center flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-700">
            <div id="modal-image-container" data-action="view-image-fullscreen" data-image-url="${this.imageUrl}" class="w-48 h-48 sm:w-64 sm:h-64 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-lg relative cursor-pointer group">
              <img src="${this.imageUrl}" alt="${part.name}" class="max-w-full max-h-full object-contain" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzM3NDE1MSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tk8gSU1BR0U8L3RleHQ+PC9zdmc+';">
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div class="lg:w-1/2 p-4 sm:p-6 flex flex-col">
            <div class="space-y-6">
              <div>
                <h3 class="text-md font-semibold text-gray-300 mb-3">Детали</h3>
                <div class="space-y-1 text-sm text-gray-400">
                  <p><span class="font-semibold text-gray-300">Название:</span> ${part.name}</p>
                  <p>ID: ${part.part_num}</p>
                  ${category ? `<p>Категория: ${category.name}</p>` : ''}
                </div>
              </div>
              
              ${this.renderColorSelector()}
              ${this.renderQuantityControls()}
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  // Render color selector
  renderColorSelector() {
    const colors = DataLoader.getAllItems('colors');
    const selectedColor = this.currentColorId ? DataLoader.getItem('colors', this.currentColorId) : null;

    return `
      <div>
        <h3 class="text-md font-semibold text-gray-300 mb-3">Цвета</h3>
        <div class="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
          ${colors.slice(0, 24).map(color => `
            <button data-action="select-color" data-color-id="${color.id}" 
              class="w-8 h-8 rounded border-2 ${this.currentColorId === color.id ? 'border-white' : 'border-gray-600'} hover:border-blue-400 transition-colors duration-200"
              style="background-color: ${color.rgb || '#cccccc'}"
              title="${color.name}">
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Render quantity controls
  renderQuantityControls() {
    const selectedColor = this.currentColorId ? DataLoader.getItem('colors', this.currentColorId) : null;
    const inCollection = 0; // TODO: Get from collection

    return `
      <div class="bg-gray-700/50 rounded-lg p-4">
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-semibold text-white flex items-center gap-2">
              <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              <span>${selectedColor ? selectedColor.name : 'Выберите цвет'}</span>
            </h3>
            <span class="text-xs text-gray-400">
              (В коллекции: <span class="font-bold text-white">${inCollection}</span>)
            </span>
          </div>
          
          <div class="flex items-center justify-center gap-3">
            <button data-action="decrease-qty" 
              class="p-2 rounded-full ${this.quantity > 0 ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-700 cursor-not-allowed'} text-white transition-all duration-150"
              ${this.quantity <= 0 ? 'disabled' : ''}>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
              </svg>
            </button>
            
            <input id="modal-quantity-input" 
              type="number" 
              value="${this.quantity}" 
              readonly 
              class="w-16 text-center bg-gray-900 text-white font-bold rounded-lg py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"/>
            
            <button data-action="increase-qty" 
              class="p-2 rounded-full bg-gray-600 hover:bg-gray-500 text-white transition-all duration-150">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </button>
          </div>
          
          <button id="modal-update-collection-btn" data-action="update-collection" 
            class="w-full flex items-center justify-center gap-2 ${selectedColor ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'} text-white font-bold py-3 px-4 rounded-lg transition-all duration-150"
            ${!selectedColor ? 'disabled' : ''}>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Обновить коллекцию
          </button>
        </div>
      </div>
    `;
  }

  // Setup event listeners
  setupEventListeners() {
    const modalEl = document.getElementById('modal-container');
    if (!modalEl) return;

    // Close modal
    modalEl.querySelector('#modal-close')?.addEventListener('click', () => {
      this.close();
    });

    // Color selection
    modalEl.querySelectorAll('[data-action="select-color"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const colorId = e.currentTarget.dataset.colorId;
        this.selectColor(colorId);
      });
    });

    // Quantity controls
    modalEl.querySelector('[data-action="decrease-qty"]')?.addEventListener('click', () => {
      this.decreaseQuantity();
    });

    modalEl.querySelector('[data-action="increase-qty"]')?.addEventListener('click', () => {
      this.increaseQuantity();
    });

    // Update collection
    modalEl.querySelector('[data-action="update-collection"]')?.addEventListener('click', () => {
      this.updateCollection();
    });

    // Image fullscreen
    modalEl.querySelector('[data-action="view-image-fullscreen"]')?.addEventListener('click', (e) => {
      const imageUrl = e.currentTarget.dataset.imageUrl;
      this.viewImageFullscreen(imageUrl);
    });

    // Close on backdrop click
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) {
        this.close();
      }
    });
  }

  // Select color
  selectColor(colorId) {
    this.currentColorId = colorId;
    this.render();
  }

  // Decrease quantity
  decreaseQuantity() {
    if (this.quantity > 0) {
      this.quantity--;
      this.updateQuantityDisplay();
    }
  }

  // Increase quantity
  increaseQuantity() {
    this.quantity++;
    this.updateQuantityDisplay();
  }

  // Update quantity display
  updateQuantityDisplay() {
    const input = document.getElementById('modal-quantity-input');
    if (input) {
      input.value = this.quantity;
    }
  }

  // Update collection
  updateCollection() {
    if (!this.currentPartId || !this.currentColorId) return;

    // TODO: Implement collection update
    console.log('Update collection:', {
      partId: this.currentPartId,
      colorId: this.currentColorId,
      quantity: this.quantity
    });

    Utils.showNotification('Коллекция обновлена', 'success');
  }

  // View image fullscreen
  viewImageFullscreen(imageUrl) {
    const viewer = document.getElementById('image-viewer-container');
    const img = document.getElementById('fullscreen-image');
    
    if (viewer && img) {
      img.src = imageUrl;
      viewer.classList.remove('viewer-hidden');
    }
  }

  // Close modal
  close() {
    this.isOpen = false;
    this.currentPartId = null;
    this.currentColorId = null;
    this.quantity = 0;
    ModalManager.closeModal('modal-container');
  }
}

// Create global part modal instance
const partModal = new PartModal();
window.partModal = partModal;

// Export for use in other modules
export { partModal as PartModal };
