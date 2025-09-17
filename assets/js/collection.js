// Collection management for LEGO Catalog

class CollectionManager {
  constructor() {
    this.collection = storage.getCollection();
    this.currentView = 'all';
    this.currentFilter = {};
    this.currentSort = { field: 'name', order: 'asc' };
    this.selectedItems = new Set();
    this.isMultiSelectMode = false;
  }

  // Initialize collection
  init() {
    this.setupEventListeners();
    this.loadCollection();
  }

  // Setup event listeners
  setupEventListeners() {
    // Export/Import buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('#export-collection')) {
        this.exportCollection();
      }
      if (e.target.matches('#import-collection')) {
        this.importCollection();
      }
    });

    // Multi-select toggle
    document.addEventListener('click', (e) => {
      if (e.target.matches('#multi-select-toggle')) {
        this.toggleMultiSelect();
      }
    });

    // Select all
    document.addEventListener('click', (e) => {
      if (e.target.matches('#select-all')) {
        this.selectAll();
      }
    });

    // Clear selection
    document.addEventListener('click', (e) => {
      if (e.target.matches('#clear-selection')) {
        this.clearSelection();
      }
    });

    // Delete selected
    document.addEventListener('click', (e) => {
      if (e.target.matches('#delete-selected')) {
        this.deleteSelected();
      }
    });
  }

  // Load collection
  loadCollection() {
    this.collection = storage.getCollection();
    this.updateStats();
    this.renderCollection();
  }

  // Update statistics
  updateStats() {
    const partsCount = Object.keys(this.collection.parts).length;
    const setsCount = Object.keys(this.collection.sets).length;
    const minifigsCount = Object.keys(this.collection.minifigs).length;

    // Update count displays
    const partsCountEl = document.getElementById('parts-count');
    const setsCountEl = document.getElementById('sets-count');
    const minifigsCountEl = document.getElementById('minifigs-count');

    if (partsCountEl) partsCountEl.textContent = partsCount;
    if (setsCountEl) setsCountEl.textContent = setsCount;
    if (minifigsCountEl) minifigsCountEl.textContent = minifigsCount;

    // Update total count
    const totalCount = partsCount + setsCount + minifigsCount;
    const totalCountEl = document.getElementById('total-count');
    if (totalCountEl) totalCountEl.textContent = totalCount;
  }

  // Render collection
  renderCollection() {
    const container = document.getElementById('collection-content');
    if (!container) return;

    const items = this.getAllCollectionItems();
    
    if (items.length === 0) {
      container.innerHTML = this.createEmptyState();
      return;
    }

    // Apply filters
    const filteredItems = this.applyFilters(items);
    
    // Apply sorting
    const sortedItems = this.applySorting(filteredItems);

    container.innerHTML = `
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold">Элементы коллекции (${sortedItems.length})</h3>
          <div class="flex items-center space-x-2">
            <button id="multi-select-toggle" class="btn-secondary text-sm">
              ${this.isMultiSelectMode ? 'Отменить выбор' : 'Выбрать несколько'}
            </button>
            ${this.isMultiSelectMode ? `
              <button id="select-all" class="btn-secondary text-sm">Выбрать все</button>
              <button id="clear-selection" class="btn-secondary text-sm">Очистить</button>
              <button id="delete-selected" class="btn-danger text-sm">Удалить выбранные</button>
            ` : ''}
          </div>
        </div>
        
        <div class="flex items-center space-x-4 mb-4">
          <select id="collection-filter" class="px-4 py-2 bg-gray-700 text-white rounded-lg">
            <option value="all">Все элементы</option>
            <option value="parts">Детали</option>
            <option value="sets">Наборы</option>
            <option value="minifigs">Минифигурки</option>
          </select>
          
          <select id="collection-sort" class="px-4 py-2 bg-gray-700 text-white rounded-lg">
            <option value="name">По названию</option>
            <option value="quantity">По количеству</option>
            <option value="date">По дате добавления</option>
          </select>
        </div>
      </div>
      
      <div class="grid-responsive">
        ${sortedItems.map(item => this.createCollectionItemCard(item)).join('')}
      </div>
    `;

    this.attachCollectionEvents();
  }

  // Create empty state
  createEmptyState() {
    return `
      <div class="text-center py-12">
        <svg class="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
        </svg>
        <h3 class="text-xl font-semibold text-gray-300 mb-2">Коллекция пуста</h3>
        <p class="text-gray-400 mb-6">Начните добавлять элементы из каталога</p>
        <button onclick="ui.switchView('catalog')" class="btn-primary">
          Перейти к каталогу
        </button>
      </div>
    `;
  }

  // Get all collection items
  getAllCollectionItems() {
    const items = [];
    
    // Add parts
    Object.entries(this.collection.parts).forEach(([id, quantity]) => {
      const part = dataLoader.getItem('parts', id);
      if (part) {
        items.push({
          ...part,
          type: 'parts',
          quantity,
          id: part.partNum,
          addedDate: this.getAddedDate('parts', id)
        });
      }
    });
    
    // Add sets
    Object.entries(this.collection.sets).forEach(([id, quantity]) => {
      const set = dataLoader.getItem('sets', id);
      if (set) {
        items.push({
          ...set,
          type: 'sets',
          quantity,
          id: set.setNum,
          addedDate: this.getAddedDate('sets', id)
        });
      }
    });
    
    // Add minifigs
    Object.entries(this.collection.minifigs).forEach(([id, quantity]) => {
      const minifig = dataLoader.getItem('minifigs', id);
      if (minifig) {
        items.push({
          ...minifig,
          type: 'minifigs',
          quantity,
          id: minifig.figNum,
          addedDate: this.getAddedDate('minifigs', id)
        });
      }
    });

    return items;
  }

  // Get added date (placeholder - would need to track this)
  getAddedDate(type, id) {
    // This would need to be implemented to track when items were added
    return new Date();
  }

  // Apply filters
  applyFilters(items) {
    return items.filter(item => {
      // Type filter
      if (this.currentFilter.type && this.currentFilter.type !== 'all') {
        if (item.type !== this.currentFilter.type) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Apply sorting
  applySorting(items) {
    return items.sort((a, b) => {
      let aValue = a[this.currentSort.field];
      let bValue = b[this.currentSort.field];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) {
        return this.currentSort.order === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.currentSort.order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Create collection item card
  createCollectionItemCard(item) {
    const isSelected = this.selectedItems.has(`${item.type}-${item.id}`);
    const imageUrl = this.getItemImageUrl(item);
    
    return `
      <div class="bg-gray-800 rounded-lg p-4 card-hover ${isSelected ? 'ring-2 ring-blue-500' : ''}" 
           data-item-id="${item.type}-${item.id}">
        <div class="aspect-square bg-gray-700 rounded-lg mb-4 flex items-center justify-center relative">
          <img 
            src="${imageUrl}" 
            alt="${item.name}"
            class="w-full h-full object-contain rounded-lg"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
          >
          <div class="hidden w-full h-full items-center justify-center text-gray-400">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
          
          ${this.isMultiSelectMode ? `
            <div class="absolute top-2 left-2">
              <input 
                type="checkbox" 
                class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                ${isSelected ? 'checked' : ''}
                onchange="collection.toggleItemSelection('${item.type}', '${item.id}')"
              >
            </div>
          ` : ''}
          
          <div class="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            ${item.quantity}
          </div>
        </div>
        
        <h3 class="font-medium text-white mb-2 line-clamp-2">${item.name}</h3>
        
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-400 font-mono">${item.id}</span>
          <span class="text-xs text-gray-500 capitalize">${item.type}</span>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <button 
              class="text-sm text-blue-400 hover:text-blue-300"
              onclick="collection.decreaseQuantity('${item.type}', '${item.id}')"
            >
              -
            </button>
            <span class="text-sm font-medium">${item.quantity}</span>
            <button 
              class="text-sm text-blue-400 hover:text-blue-300"
              onclick="collection.increaseQuantity('${item.type}', '${item.id}')"
            >
              +
            </button>
          </div>
          
          <button 
            class="text-sm text-red-400 hover:text-red-300"
            onclick="collection.removeItem('${item.type}', '${item.id}')"
          >
            Удалить
          </button>
        </div>
      </div>
    `;
  }

  // Get item image URL
  getItemImageUrl(item) {
    switch (item.type) {
      case 'parts':
        return api.getPartImageUrl(item.partNum);
      case 'sets':
        return api.getSetImageUrl(item.setNum);
      case 'minifigs':
        return api.getMinifigImageUrl(item.figNum);
      default:
        return '';
    }
  }

  // Attach collection events
  attachCollectionEvents() {
    // Filter change
    const filterSelect = document.getElementById('collection-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.currentFilter.type = e.target.value;
        this.renderCollection();
      });
    }

    // Sort change
    const sortSelect = document.getElementById('collection-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort.field = e.target.value;
        this.renderCollection();
      });
    }
  }

  // Toggle multi-select mode
  toggleMultiSelect() {
    this.isMultiSelectMode = !this.isMultiSelectMode;
    this.selectedItems.clear();
    this.renderCollection();
  }

  // Toggle item selection
  toggleItemSelection(type, id) {
    const itemId = `${type}-${id}`;
    if (this.selectedItems.has(itemId)) {
      this.selectedItems.delete(itemId);
    } else {
      this.selectedItems.add(itemId);
    }
    
    // Update UI
    const card = document.querySelector(`[data-item-id="${itemId}"]`);
    if (card) {
      if (this.selectedItems.has(itemId)) {
        card.classList.add('ring-2', 'ring-blue-500');
      } else {
        card.classList.remove('ring-2', 'ring-blue-500');
      }
    }
  }

  // Select all items
  selectAll() {
    const items = this.getAllCollectionItems();
    items.forEach(item => {
      this.selectedItems.add(`${item.type}-${item.id}`);
    });
    this.renderCollection();
  }

  // Clear selection
  clearSelection() {
    this.selectedItems.clear();
    this.renderCollection();
  }

  // Delete selected items
  deleteSelected() {
    if (this.selectedItems.size === 0) return;

    const confirmed = confirm(`Удалить ${this.selectedItems.size} элементов из коллекции?`);
    if (!confirmed) return;

    this.selectedItems.forEach(itemId => {
      const [type, id] = itemId.split('-');
      storage.removeFromCollection(type, id);
    });

    this.selectedItems.clear();
    this.loadCollection();
    Utils.showNotification(`Удалено ${this.selectedItems.size} элементов`, 'success');
  }

  // Increase quantity
  increaseQuantity(type, id) {
    storage.addToCollection(type, id, 1);
    this.loadCollection();
  }

  // Decrease quantity
  decreaseQuantity(type, id) {
    const currentQuantity = storage.getCollectionItem(type, id);
    if (currentQuantity > 1) {
      storage.addToCollection(type, id, -1);
    } else {
      storage.removeFromCollection(type, id);
    }
    this.loadCollection();
  }

  // Remove item
  removeItem(type, id) {
    const confirmed = confirm('Удалить элемент из коллекции?');
    if (!confirmed) return;

    storage.removeFromCollection(type, id);
    this.loadCollection();
    Utils.showNotification('Элемент удален из коллекции', 'success');
  }

  // Export collection
  exportCollection() {
    try {
      const data = this.collection;
      const csv = this.collectionToCSV(data);
      const filename = `lego-collection-${new Date().toISOString().split('T')[0]}.csv`;
      
      Utils.downloadFile(csv, filename, 'text/csv');
      Utils.showNotification('Коллекция экспортирована', 'success');
    } catch (error) {
      Utils.handleError(error, 'exportCollection');
    }
  }

  // Import collection
  importCollection() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target.result;
          const data = this.csvToCollection(csv);
          
          // Merge with existing collection
          const existingCollection = storage.getCollection();
          const mergedCollection = this.mergeCollections(existingCollection, data);
          
          storage.setCollection(mergedCollection);
          this.loadCollection();
          Utils.showNotification('Коллекция импортирована', 'success');
        } catch (error) {
          Utils.handleError(error, 'importCollection');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // Convert collection to CSV
  collectionToCSV(collection) {
    const rows = [];
    rows.push(['Type', 'ID', 'Name', 'Quantity']);

    // Add parts
    Object.entries(collection.parts).forEach(([id, quantity]) => {
      const part = dataLoader.getItem('parts', id);
      if (part) {
        rows.push(['parts', id, part.name, quantity]);
      }
    });

    // Add sets
    Object.entries(collection.sets).forEach(([id, quantity]) => {
      const set = dataLoader.getItem('sets', id);
      if (set) {
        rows.push(['sets', id, set.name, quantity]);
      }
    });

    // Add minifigs
    Object.entries(collection.minifigs).forEach(([id, quantity]) => {
      const minifig = dataLoader.getItem('minifigs', id);
      if (minifig) {
        rows.push(['minifigs', id, minifig.name, quantity]);
      }
    });

    return rows.map(row => row.join(',')).join('\n');
  }

  // Convert CSV to collection
  csvToCollection(csv) {
    const lines = csv.split('\n').filter(line => line.trim());
    const collection = { parts: {}, sets: {}, minifigs: {} };

    for (let i = 1; i < lines.length; i++) {
      const [type, id, name, quantity] = lines[i].split(',');
      if (type && id && quantity) {
        collection[type][id] = parseInt(quantity) || 1;
      }
    }

    return collection;
  }

  // Merge collections
  mergeCollections(existing, imported) {
    const merged = { ...existing };

    ['parts', 'sets', 'minifigs'].forEach(type => {
      merged[type] = { ...merged[type] };
      Object.entries(imported[type] || {}).forEach(([id, quantity]) => {
        const existingQuantity = merged[type][id] || 0;
        merged[type][id] = existingQuantity + quantity;
      });
    });

    return merged;
  }

  // Get collection statistics
  getStats() {
    const items = this.getAllCollectionItems();
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    
    const byType = {
      parts: items.filter(item => item.type === 'parts').length,
      sets: items.filter(item => item.type === 'sets').length,
      minifigs: items.filter(item => item.type === 'minifigs').length
    };

    return {
      totalItems,
      totalQuantity,
      byType,
      selectedItems: this.selectedItems.size,
      isMultiSelectMode: this.isMultiSelectMode
    };
  }
}

// Create global collection instance
window.collection = new CollectionManager();

// Export for use in other modules
window.CollectionManager = CollectionManager;
