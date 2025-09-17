// Catalog management for LEGO Catalog

class CatalogManager {
  constructor() {
    this.currentView = 'parts';
    this.currentPage = 1;
    this.itemsPerPage = CONFIG.UI.itemsPerPage;
    this.currentFilter = {};
    this.currentSort = { field: 'name', order: 'asc' };
    this.loadedItems = new Map();
    this.isLoading = false;
  }

  // Initialize catalog
  init() {
    this.setupEventListeners();
    this.loadInitialData();
  }

  // Setup event listeners
  setupEventListeners() {
    // Tab switching
    document.addEventListener('click', (e) => {
      if (e.target.matches('[id$="-tab"]')) {
        const tab = e.target.id.replace('-tab', '');
        this.switchTab(tab);
      }
    });

    // Filter changes
    document.addEventListener('change', (e) => {
      if (e.target.matches('#category-filter')) {
        this.setFilter('category', e.target.value);
      }
      if (e.target.matches('#sort-by')) {
        this.setSort(e.target.value);
      }
    });

    // Infinite scroll
    window.addEventListener('scroll', Utils.throttle(() => {
      this.handleScroll();
    }, 100));
  }

  // Load initial data
  async loadInitialData() {
    await this.loadItems();
  }

  // Switch tab
  switchTab(tab) {
    this.currentView = tab;
    this.currentPage = 1;
    this.loadedItems.clear();
    
    // Update UI
    this.updateTabButtons();
    this.updateFilters();
    this.loadItems();
  }

  // Update tab buttons
  updateTabButtons() {
    document.querySelectorAll('[id$="-tab"]').forEach(btn => {
      btn.classList.remove('bg-blue-600');
      btn.classList.add('bg-gray-600');
    });
    
    const activeTab = document.getElementById(`${this.currentView}-tab`);
    if (activeTab) {
      activeTab.classList.remove('bg-gray-600');
      activeTab.classList.add('bg-blue-600');
    }
  }

  // Update filters
  updateFilters() {
    this.updateCategoryFilter();
  }

  // Update category filter
  updateCategoryFilter() {
    const filter = document.getElementById('category-filter');
    if (!filter) return;

    // Clear existing options
    filter.innerHTML = '<option value="">Все категории</option>';

    // Add category options based on current view
    let categories = [];
    
    switch (this.currentView) {
      case 'parts':
        categories = dataLoader.getAllItems('partCategories');
        break;
      case 'sets':
        categories = dataLoader.getAllItems('themes');
        break;
      case 'minifigs':
        // Minifigs don't have categories, hide filter
        filter.style.display = 'none';
        return;
    }

    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      filter.appendChild(option);
    });

    filter.style.display = 'block';
  }

  // Set filter
  setFilter(field, value) {
    if (value) {
      this.currentFilter[field] = value;
    } else {
      delete this.currentFilter[field];
    }
    
    this.currentPage = 1;
    this.loadedItems.clear();
    this.loadItems();
  }

  // Set sort
  setSort(field) {
    this.currentSort.field = field;
    this.currentPage = 1;
    this.loadedItems.clear();
    this.loadItems();
  }

  // Load items
  async loadItems() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoadingIndicator();

    try {
      let items = [];
      
      // Get items based on current view
      switch (this.currentView) {
        case 'parts':
          items = await this.loadParts();
          break;
        case 'sets':
          items = await this.loadSets();
          break;
        case 'minifigs':
          items = await this.loadMinifigs();
          break;
      }

      // Apply filters
      items = this.applyFilters(items);
      
      // Apply sorting
      items = this.applySorting(items);
      
      // Paginate
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const pageItems = items.slice(startIndex, endIndex);
      
      // Render items
      this.renderItems(pageItems);
      
      // Update pagination
      this.updatePagination(items.length);
      
    } catch (error) {
      Utils.handleError(error, 'loadItems');
      this.showError('Ошибка загрузки данных');
    } finally {
      this.isLoading = false;
      this.hideLoadingIndicator();
    }
  }

  // Load parts
  async loadParts() {
    let parts = dataLoader.getAllItems('parts');
    
    // Load additional data from API if needed
    const missingParts = parts.filter(part => !this.loadedItems.has(part.partNum));
    
    if (missingParts.length > 0) {
      try {
        const apiData = await Promise.all(
          missingParts.slice(0, 10).map(part => 
            api.getPart(part.partNum).catch(() => null)
          )
        );
        
        apiData.forEach((apiPart, index) => {
          if (apiPart) {
            const part = missingParts[index];
            this.loadedItems.set(part.partNum, { ...part, ...apiPart });
          }
        });
      } catch (error) {
        console.warn('Failed to load additional part data:', error);
      }
    }
    
    return parts.map(part => this.loadedItems.get(part.partNum) || part);
  }

  // Load sets
  async loadSets() {
    let sets = dataLoader.getAllItems('sets');
    
    // Load additional data from API if needed
    const missingSets = sets.filter(set => !this.loadedItems.has(set.setNum));
    
    if (missingSets.length > 0) {
      try {
        const apiData = await Promise.all(
          missingSets.slice(0, 10).map(set => 
            api.getSet(set.setNum).catch(() => null)
          )
        );
        
        apiData.forEach((apiSet, index) => {
          if (apiSet) {
            const set = missingSets[index];
            this.loadedItems.set(set.setNum, { ...set, ...apiSet });
          }
        });
      } catch (error) {
        console.warn('Failed to load additional set data:', error);
      }
    }
    
    return sets.map(set => this.loadedItems.get(set.setNum) || set);
  }

  // Load minifigs
  async loadMinifigs() {
    let minifigs = dataLoader.getAllItems('minifigs');
    
    // Load additional data from API if needed
    const missingMinifigs = minifigs.filter(minifig => !this.loadedItems.has(minifig.figNum));
    
    if (missingMinifigs.length > 0) {
      try {
        const apiData = await Promise.all(
          missingMinifigs.slice(0, 10).map(minifig => 
            api.getMinifig(minifig.figNum).catch(() => null)
          )
        );
        
        apiData.forEach((apiMinifig, index) => {
          if (apiMinifig) {
            const minifig = missingMinifigs[index];
            this.loadedItems.set(minifig.figNum, { ...minifig, ...apiMinifig });
          }
        });
      } catch (error) {
        console.warn('Failed to load additional minifig data:', error);
      }
    }
    
    return minifigs.map(minifig => this.loadedItems.get(minifig.figNum) || minifig);
  }

  // Apply filters
  applyFilters(items) {
    return items.filter(item => {
      // Category filter
      if (this.currentFilter.category) {
        const categoryId = parseInt(this.currentFilter.category);
        if (item.categoryId !== categoryId && item.themeId !== categoryId) {
          return false;
        }
      }
      
      // Add more filters as needed
      return true;
    });
  }

  // Apply sorting
  applySorting(items) {
    return items.sort((a, b) => {
      let aValue = a[this.currentSort.field];
      let bValue = b[this.currentSort.field];
      
      // Handle different data types
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

  // Render items
  renderItems(items) {
    const container = document.getElementById('catalog-content');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-8 text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          Нет данных для отображения
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(item => this.createItemCard(item)).join('');
  }

  // Create item card
  createItemCard(item) {
    const id = item.partNum || item.setNum || item.figNum;
    const name = item.name;
    const imageUrl = this.getItemImageUrl(item);
    const collectionQuantity = this.getCollectionQuantity(item);
    
    return `
      <div class="bg-gray-800 rounded-lg p-4 card-hover cursor-pointer group" data-id="${id}" data-type="${this.currentView}">
        <div class="aspect-square bg-gray-700 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
          <img 
            src="${imageUrl}" 
            alt="${name}"
            class="w-full h-full object-contain rounded-lg transition-transform group-hover:scale-105"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
          >
          <div class="hidden w-full h-full items-center justify-center text-gray-400">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
          
          ${collectionQuantity > 0 ? `
            <div class="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              ${collectionQuantity}
            </div>
          ` : ''}
        </div>
        
        <h3 class="font-medium text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
          ${name}
        </h3>
        
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-400 font-mono">${id}</span>
          <button 
            class="btn-primary text-sm px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onclick="catalog.addToCollection('${this.currentView}', '${id}')"
          >
            ${collectionQuantity > 0 ? 'Изменить' : 'Добавить'}
          </button>
        </div>
        
        ${this.getItemDetails(item)}
      </div>
    `;
  }

  // Get item image URL
  getItemImageUrl(item) {
    switch (this.currentView) {
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

  // Get collection quantity
  getCollectionQuantity(item) {
    const collection = storage.getCollection();
    const id = item.partNum || item.setNum || item.figNum;
    return collection[this.currentView]?.[id] || 0;
  }

  // Get item details
  getItemDetails(item) {
    let details = '';
    
    switch (this.currentView) {
      case 'parts':
        if (item.material) {
          details += `<div class="text-xs text-gray-500 mt-1">${item.material}</div>`;
        }
        break;
      case 'sets':
        if (item.year) {
          details += `<div class="text-xs text-gray-500 mt-1">${item.year} год</div>`;
        }
        if (item.numParts) {
          details += `<div class="text-xs text-gray-500">${item.numParts} деталей</div>`;
        }
        break;
      case 'minifigs':
        if (item.numParts) {
          details += `<div class="text-xs text-gray-500 mt-1">${item.numParts} деталей</div>`;
        }
        break;
    }
    
    return details;
  }

  // Add to collection
  addToCollection(type, id) {
    storage.addToCollection(type, id, 1);
    Utils.showNotification('Добавлено в коллекцию', 'success');
    
    // Update UI
    this.updateItemCard(id);
  }

  // Update item card
  updateItemCard(id) {
    const card = document.querySelector(`[data-id="${id}"]`);
    if (!card) return;

    // Update collection quantity display
    const collectionQuantity = this.getCollectionQuantity({ 
      partNum: id, 
      setNum: id, 
      figNum: id 
    });
    
    const quantityDisplay = card.querySelector('.absolute.top-2.right-2');
    if (quantityDisplay) {
      if (collectionQuantity > 0) {
        quantityDisplay.textContent = collectionQuantity;
        quantityDisplay.classList.remove('hidden');
      } else {
        quantityDisplay.classList.add('hidden');
      }
    } else if (collectionQuantity > 0) {
      // Add quantity display if it doesn't exist
      const imageContainer = card.querySelector('.aspect-square');
      if (imageContainer) {
        const quantityDiv = document.createElement('div');
        quantityDiv.className = 'absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full';
        quantityDiv.textContent = collectionQuantity;
        imageContainer.appendChild(quantityDiv);
      }
    }
  }

  // Handle scroll
  handleScroll() {
    if (this.isLoading) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Load more when 80% scrolled
    if (scrollTop + windowHeight >= documentHeight * 0.8) {
      this.loadMore();
    }
  }

  // Load more items
  async loadMore() {
    this.currentPage++;
    await this.loadItems();
  }

  // Show loading indicator
  showLoadingIndicator() {
    const indicator = document.getElementById('loading-more');
    if (indicator) {
      indicator.classList.remove('hidden');
    }
  }

  // Hide loading indicator
  hideLoadingIndicator() {
    const indicator = document.getElementById('loading-more');
    if (indicator) {
      indicator.classList.add('hidden');
    }
  }

  // Show error
  showError(message) {
    const container = document.getElementById('catalog-content');
    if (container) {
      container.innerHTML = `
        <div class="col-span-full text-center py-8 text-red-400">
          <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          ${message}
        </div>
      `;
    }
  }

  // Update pagination
  updatePagination(totalItems) {
    // Implementation for pagination controls
    // This would show page numbers, previous/next buttons, etc.
  }

  // Get catalog statistics
  getStats() {
    return {
      currentView: this.currentView,
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      loadedItems: this.loadedItems.size,
      currentFilter: this.currentFilter,
      currentSort: this.currentSort
    };
  }
}

// Create global catalog instance
window.catalog = new CatalogManager();

// Export for use in other modules
window.CatalogManager = CatalogManager;
