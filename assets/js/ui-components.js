// UI Components for LEGO Catalog

class UIComponents {
  constructor() {
    this.modals = new Map();
    this.tooltips = new Map();
    this.currentView = 'catalog';
    this.currentSubView = 'parts';
  }

  // Create header
  createHeader() {
    const header = document.getElementById('header-container');
    header.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-bold text-white">LEGO Каталог</h1>
          <div class="hidden md:flex items-center space-x-2">
            <button id="catalog-btn" class="btn-primary">Каталог</button>
            <button id="collection-btn" class="btn-secondary">Коллекция</button>
            <button id="analytics-btn" class="btn-secondary">Аналитика</button>
          </div>
        </div>
        
        <div class="flex items-center space-x-4">
          <div class="relative">
            <input 
              id="search-input" 
              type="text" 
              placeholder="Поиск деталей, наборов, минифигурок..." 
              class="w-64 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
            <div id="search-results" class="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-lg z-50 hidden"></div>
          </div>
          
          <button id="settings-btn" class="p-2 text-gray-400 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    this.attachHeaderEvents();
  }

  // Attach header events
  attachHeaderEvents() {
    // Navigation buttons
    document.getElementById('catalog-btn')?.addEventListener('click', () => {
      this.switchView('catalog');
    });

    document.getElementById('collection-btn')?.addEventListener('click', () => {
      this.switchView('collection');
    });

    document.getElementById('analytics-btn')?.addEventListener('click', () => {
      this.switchView('analytics');
    });

    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.handleSearch(e.target.value);
      }, CONFIG.UI.searchDebounceDelay));

      searchInput.addEventListener('focus', () => {
        document.getElementById('search-results')?.classList.remove('hidden');
      });

      searchInput.addEventListener('blur', () => {
        setTimeout(() => {
          document.getElementById('search-results')?.classList.add('hidden');
        }, 200);
      });
    }

    // Settings button
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      this.showSettingsModal();
    });
  }

  // Switch view
  switchView(view) {
    this.currentView = view;
    
    // Update button states
    document.querySelectorAll('#header-container button').forEach(btn => {
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-secondary');
    });
    
    const activeBtn = document.getElementById(`${view}-btn`);
    if (activeBtn) {
      activeBtn.classList.remove('btn-secondary');
      activeBtn.classList.add('btn-primary');
    }

    // Update main content
    this.updateMainContent();
  }

  // Update main content based on current view
  updateMainContent() {
    const mainContent = document.getElementById('app-content');
    
    switch (this.currentView) {
      case 'catalog':
        this.renderCatalogView();
        break;
      case 'collection':
        this.renderCollectionView();
        break;
      case 'analytics':
        this.renderAnalyticsView();
        break;
    }
  }

  // Render catalog view
  renderCatalogView() {
    const mainContent = document.getElementById('app-content');
    mainContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-3xl font-bold">Каталог LEGO</h2>
          <div class="flex items-center space-x-4">
            <select id="category-filter" class="px-4 py-2 bg-gray-700 text-white rounded-lg">
              <option value="">Все категории</option>
            </select>
            <select id="sort-by" class="px-4 py-2 bg-gray-700 text-white rounded-lg">
              <option value="name">По названию</option>
              <option value="year">По году</option>
              <option value="parts">По количеству деталей</option>
            </select>
          </div>
        </div>
        
        <div class="flex space-x-4 mb-6">
          <button id="parts-tab" class="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">Детали</button>
          <button id="sets-tab" class="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium">Наборы</button>
          <button id="minifigs-tab" class="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium">Минифигурки</button>
        </div>
        
        <div id="catalog-content" class="grid-responsive">
          <!-- Content will be loaded here -->
        </div>
        
        <div id="loading-more" class="hidden text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    `;

    this.attachCatalogEvents();
    this.loadCatalogData();
  }

  // Attach catalog events
  attachCatalogEvents() {
    // Tab switching
    document.getElementById('parts-tab')?.addEventListener('click', () => {
      this.switchCatalogTab('parts');
    });

    document.getElementById('sets-tab')?.addEventListener('click', () => {
      this.switchCatalogTab('sets');
    });

    document.getElementById('minifigs-tab')?.addEventListener('click', () => {
      this.switchCatalogTab('minifigs');
    });

    // Filters
    document.getElementById('category-filter')?.addEventListener('change', (e) => {
      this.filterCatalog(e.target.value);
    });

    document.getElementById('sort-by')?.addEventListener('change', (e) => {
      this.sortCatalog(e.target.value);
    });
  }

  // Switch catalog tab
  switchCatalogTab(tab) {
    this.currentSubView = tab;
    
    // Update tab buttons
    document.querySelectorAll('[id$="-tab"]').forEach(btn => {
      btn.classList.remove('bg-blue-600');
      btn.classList.add('bg-gray-600');
    });
    
    const activeTab = document.getElementById(`${tab}-tab`);
    if (activeTab) {
      activeTab.classList.remove('bg-gray-600');
      activeTab.classList.add('bg-blue-600');
    }

    this.loadCatalogData();
  }

  // Load catalog data
  async loadCatalogData() {
    const content = document.getElementById('catalog-content');
    if (!content) return;

    content.innerHTML = '<div class="col-span-full text-center py-8">Загрузка...</div>';

    try {
      let items = [];
      
      switch (this.currentSubView) {
        case 'parts':
          items = dataLoader.getAllItems('parts').slice(0, CONFIG.UI.itemsPerPage);
          break;
        case 'sets':
          items = dataLoader.getAllItems('sets').slice(0, CONFIG.UI.itemsPerPage);
          break;
        case 'minifigs':
          items = dataLoader.getAllItems('minifigs').slice(0, CONFIG.UI.itemsPerPage);
          break;
      }

      this.renderCatalogItems(items);
    } catch (error) {
      Utils.handleError(error, 'loadCatalogData');
      content.innerHTML = '<div class="col-span-full text-center py-8 text-red-400">Ошибка загрузки данных</div>';
    }
  }

  // Render catalog items
  renderCatalogItems(items) {
    const content = document.getElementById('catalog-content');
    if (!content) return;

    if (items.length === 0) {
      content.innerHTML = '<div class="col-span-full text-center py-8 text-gray-400">Нет данных</div>';
      return;
    }

    content.innerHTML = items.map(item => this.createCatalogItem(item)).join('');
  }

  // Create catalog item card
  createCatalogItem(item) {
    const type = this.currentSubView;
    const id = item.partNum || item.setNum || item.figNum;
    const name = item.name;
    const imageUrl = this.getItemImageUrl(item, type);
    
    return `
      <div class="bg-gray-800 rounded-lg p-4 card-hover cursor-pointer" data-id="${id}" data-type="${type}">
        <div class="aspect-square bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
          <img 
            src="${imageUrl}" 
            alt="${name}"
            class="w-full h-full object-contain rounded-lg"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
          >
          <div class="hidden w-full h-full items-center justify-center text-gray-400">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>
        
        <h3 class="font-medium text-white mb-2 line-clamp-2">${name}</h3>
        
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-400">${id}</span>
          <button class="btn-primary text-sm px-3 py-1" onclick="ui.addToCollection('${type}', '${id}')">
            Добавить
          </button>
        </div>
      </div>
    `;
  }

  // Get item image URL
  getItemImageUrl(item, type) {
    switch (type) {
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

  // Add item to collection
  addToCollection(type, id) {
    storage.addToCollection(type, id, 1);
    Utils.showNotification('Добавлено в коллекцию', 'success');
    
    // Update UI if on collection view
    if (this.currentView === 'collection') {
      this.updateMainContent();
    }
  }

  // Handle search
  handleSearch(query) {
    if (!query || query.length < 2) {
      document.getElementById('search-results')?.classList.add('hidden');
      return;
    }

    const results = this.performSearch(query);
    this.displaySearchResults(results);
  }

  // Perform search
  performSearch(query) {
    const results = {
      parts: dataLoader.searchParts(query, 5),
      sets: dataLoader.searchSets(query, 5),
      minifigs: dataLoader.searchMinifigs(query, 5)
    };

    return results;
  }

  // Display search results
  displaySearchResults(results) {
    const container = document.getElementById('search-results');
    if (!container) return;

    const totalResults = results.parts.length + results.sets.length + results.minifigs.length;
    
    if (totalResults === 0) {
      container.innerHTML = '<div class="p-4 text-gray-400">Ничего не найдено</div>';
      container.classList.remove('hidden');
      return;
    }

    let html = '<div class="p-4">';
    
    if (results.parts.length > 0) {
      html += '<div class="mb-4"><h4 class="font-medium text-white mb-2">Детали</h4>';
      html += results.parts.map(part => `
        <div class="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer" onclick="ui.selectSearchResult('parts', '${part.partNum}')">
          <img src="${api.getPartImageUrl(part.partNum)}" class="w-8 h-8 object-contain">
          <span class="text-sm">${part.name}</span>
        </div>
      `).join('');
      html += '</div>';
    }

    if (results.sets.length > 0) {
      html += '<div class="mb-4"><h4 class="font-medium text-white mb-2">Наборы</h4>';
      html += results.sets.map(set => `
        <div class="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer" onclick="ui.selectSearchResult('sets', '${set.setNum}')">
          <img src="${api.getSetImageUrl(set.setNum)}" class="w-8 h-8 object-contain">
          <span class="text-sm">${set.name}</span>
        </div>
      `).join('');
      html += '</div>';
    }

    if (results.minifigs.length > 0) {
      html += '<div class="mb-4"><h4 class="font-medium text-white mb-2">Минифигурки</h4>';
      html += results.minifigs.map(minifig => `
        <div class="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer" onclick="ui.selectSearchResult('minifigs', '${minifig.figNum}')">
          <img src="${api.getMinifigImageUrl(minifig.figNum)}" class="w-8 h-8 object-contain">
          <span class="text-sm">${minifig.name}</span>
        </div>
      `).join('');
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
    container.classList.remove('hidden');
  }

  // Select search result
  selectSearchResult(type, id) {
    // Clear search
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').classList.add('hidden');
    
    // Switch to catalog view and show item
    this.switchView('catalog');
    this.switchCatalogTab(type);
    
    // Scroll to item (if visible)
    const item = document.querySelector(`[data-id="${id}"][data-type="${type}"]`);
    if (item) {
      item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Render collection view
  renderCollectionView() {
    const mainContent = document.getElementById('app-content');
    mainContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-3xl font-bold">Моя коллекция</h2>
          <div class="flex items-center space-x-4">
            <button id="export-collection" class="btn-primary">Экспорт</button>
            <button id="import-collection" class="btn-secondary">Импорт</button>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-xl font-semibold mb-2">Детали</h3>
            <p class="text-3xl font-bold text-blue-400" id="parts-count">0</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-xl font-semibold mb-2">Наборы</h3>
            <p class="text-3xl font-bold text-green-400" id="sets-count">0</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-xl font-semibold mb-2">Минифигурки</h3>
            <p class="text-3xl font-bold text-yellow-400" id="minifigs-count">0</p>
          </div>
        </div>
        
        <div id="collection-content">
          <!-- Collection items will be loaded here -->
        </div>
      </div>
    `;

    this.loadCollectionData();
  }

  // Load collection data
  loadCollectionData() {
    const collection = storage.getCollection();
    
    // Update counts
    document.getElementById('parts-count').textContent = Object.keys(collection.parts).length;
    document.getElementById('sets-count').textContent = Object.keys(collection.sets).length;
    document.getElementById('minifigs-count').textContent = Object.keys(collection.minifigs).length;
    
    // Load collection items
    this.renderCollectionItems(collection);
  }

  // Render collection items
  renderCollectionItems(collection) {
    const content = document.getElementById('collection-content');
    if (!content) return;

    const allItems = [];
    
    // Add parts
    Object.entries(collection.parts).forEach(([id, quantity]) => {
      const part = dataLoader.getItem('parts', id);
      if (part) {
        allItems.push({ ...part, type: 'parts', quantity });
      }
    });
    
    // Add sets
    Object.entries(collection.sets).forEach(([id, quantity]) => {
      const set = dataLoader.getItem('sets', id);
      if (set) {
        allItems.push({ ...set, type: 'sets', quantity });
      }
    });
    
    // Add minifigs
    Object.entries(collection.minifigs).forEach(([id, quantity]) => {
      const minifig = dataLoader.getItem('minifigs', id);
      if (minifig) {
        allItems.push({ ...minifig, type: 'minifigs', quantity });
      }
    });

    if (allItems.length === 0) {
      content.innerHTML = '<div class="text-center py-8 text-gray-400">Коллекция пуста</div>';
      return;
    }

    content.innerHTML = `
      <div class="grid-responsive">
        ${allItems.map(item => this.createCollectionItem(item)).join('')}
      </div>
    `;
  }

  // Create collection item
  createCollectionItem(item) {
    const id = item.partNum || item.setNum || item.figNum;
    const name = item.name;
    const imageUrl = this.getItemImageUrl(item, item.type);
    
    return `
      <div class="bg-gray-800 rounded-lg p-4 card-hover">
        <div class="aspect-square bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
          <img 
            src="${imageUrl}" 
            alt="${name}"
            class="w-full h-full object-contain rounded-lg"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
          >
          <div class="hidden w-full h-full items-center justify-center text-gray-400">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>
        
        <h3 class="font-medium text-white mb-2 line-clamp-2">${name}</h3>
        
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-400">Количество: ${item.quantity}</span>
          <button class="btn-danger text-sm px-3 py-1" onclick="ui.removeFromCollection('${item.type}', '${id}')">
            Удалить
          </button>
        </div>
      </div>
    `;
  }

  // Remove from collection
  removeFromCollection(type, id) {
    storage.removeFromCollection(type, id);
    Utils.showNotification('Удалено из коллекции', 'success');
    this.loadCollectionData();
  }

  // Render analytics view
  renderAnalyticsView() {
    const mainContent = document.getElementById('app-content');
    mainContent.innerHTML = `
      <div class="p-6">
        <h2 class="text-3xl font-bold mb-6">Аналитика коллекции</h2>
        <div class="text-center py-8 text-gray-400">
          Аналитика в разработке...
        </div>
      </div>
    `;
  }

  // Show settings modal
  showSettingsModal() {
    // Implementation for settings modal
    Utils.showNotification('Настройки в разработке', 'info');
  }

  // Filter catalog
  filterCatalog(categoryId) {
    // Implementation for filtering
    console.log('Filter by category:', categoryId);
  }

  // Sort catalog
  sortCatalog(sortBy) {
    // Implementation for sorting
    console.log('Sort by:', sortBy);
  }
}

// Create global UI instance
window.ui = new UIComponents();

// Export for use in other modules
window.UIComponents = UIComponents;
