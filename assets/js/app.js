// Main application for LEGO Catalog
import { CONFIG } from './config.js';
import { Utils } from './utils.js';
import { Storage } from './storage.js';
import { DataLoader } from './data-loader.js';

class LEGOCatalogApp {
  constructor() {
    this.isInitialized = false;
    this.loadingProgress = 0;
    this.currentView = 'catalog';
    this.currentSubView = 'parts';
    this.settings = Storage.getSettings();
  }

  // Initialize application
  async init() {
    if (this.isInitialized) return;

    try {
      console.log('🚀 LEGO Catalog App starting...');
      
      this.showLoadingScreen();
      this.setupGlobalErrorHandling();
      this.setupBeforeUnload();
      
      // Initialize components
      await this.initializeComponents();
      
      // Load data
      await this.loadData();
      
      // Setup UI
      this.setupUI();
      
      // Render initial UI
      this.renderUI();
      
      // Initialize analytics
      if (CONFIG.FEATURES.analytics) {
        // analytics.init();
      }
      
      // Hide loading screen
      this.hideLoadingScreen();
      
      this.isInitialized = true;
      console.log('✅ LEGO Catalog initialized successfully');
      
    } catch (error) {
      Utils.handleError(error, 'App initialization');
      this.showErrorScreen(error);
    }
  }

  // Show loading screen
  showLoadingScreen() {
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) {
      loadingContainer.style.display = 'flex';
    }
  }

  // Hide loading screen
  hideLoadingScreen() {
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }
  }

  // Show error screen
  showErrorScreen(error) {
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) {
      loadingContainer.innerHTML = `
        <div class="text-center">
          <div class="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 class="text-2xl font-bold text-white mb-4">Ошибка загрузки</h2>
          <p class="text-gray-400 mb-6">${error.message}</p>
          <button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Перезагрузить страницу
          </button>
        </div>
      `;
    }
  }

  // Setup global error handling
  setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      Utils.handleError(event.error, 'Global error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      Utils.handleError(new Error(event.reason), 'Unhandled promise rejection');
    });
  }

  // Setup before unload warning
  setupBeforeUnload() {
    if (!this.settings.preventAccidentalExit) return;

    window.addEventListener('beforeunload', (event) => {
      event.preventDefault();
      event.returnValue = 'Вы уверены, что хотите покинуть страницу? Несохраненные изменения могут быть потеряны.';
      return event.returnValue;
    });
  }

  // Initialize components
  async initializeComponents() {
    // Initialize search
    // search.init();
    
    // Initialize catalog
    // catalog.init();
    
    // Initialize collection
    // collection.init();
    
    // Initialize UI components
    // ui.createHeader();
  }

  // Load data
  async loadData() {
    this.updateLoadingProgress(0, 'Инициализация...');
    
    // Setup progress tracking
    DataLoader.onProgress((progress) => {
      this.updateLoadingProgress(progress.loaded, progress.total, progress.current);
    });
    
    // Load all data
    const success = await DataLoader.loadAllData();
    
    if (!success) {
      throw new Error('Не удалось загрузить данные каталога');
    }
    
    this.updateLoadingProgress(100, 'Загрузка завершена');
  }

  // Update loading progress
  updateLoadingProgress(loaded, total, current = '') {
    const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;
    this.loadingProgress = progress;
    
    const statusEl = document.getElementById('loading-status');
    const progressEl = document.getElementById('loading-progress');
    
    if (statusEl) statusEl.textContent = current || `Загружено ${loaded} из ${total}`;
    if (progressEl) progressEl.style.width = `${progress}%`;
  }

  // Setup UI
  setupUI() {
    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Setup service worker
    this.setupServiceWorker();
    
    // Setup cloud storage
    this.setupCloudStorage();
    
    // Setup tooltips
    this.setupTooltips();
    
    // Setup responsive handling
    this.setupResponsiveHandling();
  }

  // Render UI
  renderUI() {
    this.renderSidebar();
    this.renderHeader();
    this.renderMain();
  }

  // Render sidebar
  renderSidebar() {
    const sidebarEl = document.getElementById('sidebar-container');
    if (!sidebarEl) return;
    
    const viewButtons = [
      { id: 'catalog', label: 'Каталог', icon: '📚' },
      { id: 'collection', label: 'Коллекция', icon: '🏠' },
      { id: 'tools', label: 'Инструменты', icon: '🔧' }
    ];
    
    const subViewButtons = this.getSubViewButtons();
    
    sidebarEl.innerHTML = `
      <div class="space-y-4">
        <div class="space-y-2">
          ${viewButtons.map(btn => `
            <button 
              data-action="set-view" 
              data-view="${btn.id}"
              class="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                this.currentView === btn.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }"
            >
              <span class="text-xl">${btn.icon}</span>
              <span class="font-medium">${btn.label}</span>
            </button>
          `).join('')}
        </div>
        
        ${subViewButtons.length > 0 ? `
          <div class="space-y-1">
            ${subViewButtons.map(btn => `
              <button 
                data-action="set-subview" 
                data-subview="${btn.id}"
                class="w-full flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200 ${
                  this.currentSubView === btn.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }"
              >
                <span class="text-lg">${btn.icon}</span>
                <span class="text-sm font-medium">${btn.label}</span>
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
    
    this.setupSidebarHandlers();
  }

  // Get sub view buttons
  getSubViewButtons() {
    switch (this.currentView) {
      case 'catalog':
      case 'collection':
        return [
          { id: 'parts', label: 'Детали', icon: '🧩' },
          { id: 'sets', label: 'Наборы', icon: '📦' },
          { id: 'minifigs', label: 'Минифигурки', icon: '👤' }
        ];
      case 'tools':
        return [
          { id: 'analytics', label: 'Аналитика', icon: '📊' },
          { id: 'wishlist', label: 'Списки желаний', icon: '⭐' },
          { id: 'scanner', label: 'Сканер', icon: '📱' },
          { id: 'photo-search', label: 'Поиск по фото', icon: '📷' }
        ];
      default:
        return [];
    }
  }

  // Setup sidebar handlers
  setupSidebarHandlers() {
    const sidebarEl = document.getElementById('sidebar-container');
    if (!sidebarEl) return;

    sidebarEl.querySelectorAll('[data-action="set-view"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.currentView = view;
        this.currentSubView = this.getSubViewButtons()[0]?.id || '';
        this.renderUI();
      });
    });
    
    sidebarEl.querySelectorAll('[data-action="set-subview"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const subView = e.currentTarget.dataset.subview;
        this.currentSubView = subView;
        this.renderUI();
      });
    });
  }

  // Render header
  renderHeader() {
    const headerEl = document.getElementById('header-container');
    if (!headerEl) return;
    
    const searchContext = this.currentView === 'collection' ? 'в коллекции' : 'в каталоге';
    
    headerEl.innerHTML = `
      <div class="flex justify-between items-center gap-4">
        <div class="flex items-center">
          <button id="sidebar-toggle" class="sidebar-toggle-btn lg:hidden" title="Открыть/закрыть боковую панель навигации">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <h1 class="text-xl font-bold text-white hidden sm:block main-title">
            <span class="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent font-extrabold tracking-tight">LEGO® Catalog</span>
          </h1>
        </div>
        <div class="flex items-center space-x-2 w-full max-w-sm">
          <div class="relative flex-grow">
            <input id="search-input" type="search" placeholder="Поиск ${searchContext}..." class="w-full bg-gray-700 border border-gray-600 rounded-md pl-4 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" title="Поиск ${searchContext}" autocomplete="off" spellcheck="false" autocorrect="off" autocapitalize="off"/>
            <button id="clear-search" class="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-400 hover:text-white hidden" title="Очистить поисковый запрос">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <div id="search-icon" class="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-400" title="Поиск">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
          <button id="ai-search-button" class="px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-150 shadow-lg hover:shadow-blue-500/25 flex-shrink-0" aria-label="AI поиск" title="AI поиск по фотографии">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </button>
          <button id="filter-button" class="px-3 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors duration-150 shadow-lg hover:shadow-gray-500/25 flex-shrink-0" aria-label="Фильтры" title="Открыть панель фильтров и сортировки">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    this.setupHeaderHandlers();
  }

  // Setup header handlers
  setupHeaderHandlers() {
    const searchInput = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');
    const searchIcon = document.getElementById('search-icon');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const value = e.target.value;
        if (value) {
          clearSearch?.classList.remove('hidden');
          searchIcon?.classList.add('hidden');
        } else {
          clearSearch?.classList.add('hidden');
          searchIcon?.classList.remove('hidden');
        }
      });
    }
    
    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        clearSearch.classList.add('hidden');
        searchIcon?.classList.remove('hidden');
      });
    }
    
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        const sidebarEl = document.getElementById('sidebar-container');
        sidebarEl?.classList.toggle('-translate-x-full');
      });
    }
  }

  // Render main content
  renderMain() {
    const mainEl = document.getElementById('main-content');
    if (!mainEl) return;
    
    let content = '';
    
    switch (this.currentView) {
      case 'catalog':
        content = this.renderCatalogContent();
        break;
      case 'collection':
        content = this.renderCollectionContent();
        break;
      case 'tools':
        content = this.renderToolsContent();
        break;
      default:
        content = '<div class="p-8 text-center text-gray-400">Выберите раздел</div>';
    }
    
    mainEl.innerHTML = content;
  }

  // Render catalog content
  renderCatalogContent() {
    try {
      const stats = DataLoader.getStatistics();
      
      return `
        <div class="p-8">
          <h2 class="text-2xl font-bold text-white mb-6">Каталог LEGO</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-gray-800 p-4 rounded-lg">
              <h3 class="text-lg font-semibold text-white mb-2">Детали</h3>
              <p class="text-3xl font-bold text-blue-400">${(stats.parts || 0).toLocaleString()}</p>
            </div>
            <div class="bg-gray-800 p-4 rounded-lg">
              <h3 class="text-lg font-semibold text-white mb-2">Наборы</h3>
              <p class="text-3xl font-bold text-green-400">${(stats.sets || 0).toLocaleString()}</p>
            </div>
            <div class="bg-gray-800 p-4 rounded-lg">
              <h3 class="text-lg font-semibold text-white mb-2">Минифигурки</h3>
              <p class="text-3xl font-bold text-purple-400">${(stats.minifigs || 0).toLocaleString()}</p>
            </div>
            <div class="bg-gray-800 p-4 rounded-lg">
              <h3 class="text-lg font-semibold text-white mb-2">Цвета</h3>
              <p class="text-3xl font-bold text-yellow-400">${(stats.colors || 0).toLocaleString()}</p>
            </div>
          </div>
          
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-white mb-4">${this.getSubViewTitle()}</h3>
            <div id="catalog-items" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              ${this.renderCatalogItems()}
            </div>
          </div>
          
          <div class="text-gray-400 text-sm">
            <p>Раздел: ${this.currentSubView}</p>
            <p>Всего загружено: ${Object.values(stats || {}).reduce((a, b) => (a || 0) + (b || 0), 0).toLocaleString()} элементов</p>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error rendering catalog content:', error);
      return `
        <div class="p-8">
          <h2 class="text-2xl font-bold text-white mb-6">Каталог LEGO</h2>
          <div class="text-red-400">
            <p>Ошибка загрузки каталога. Попробуйте обновить страницу.</p>
          </div>
        </div>
      `;
    }
  }

  // Get sub view title
  getSubViewTitle() {
    switch (this.currentSubView) {
      case 'parts':
        return 'Детали';
      case 'sets':
        return 'Наборы';
      case 'minifigs':
        return 'Минифигурки';
      default:
        return 'Элементы';
    }
  }

  // Render catalog items
  renderCatalogItems() {
    try {
      const items = this.getCurrentSubViewItems();
      const limit = 24; // Показываем первые 24 элемента
      
      if (!items || items.length === 0) {
        return `
          <div class="col-span-full text-center text-gray-400 py-8">
            <p>Нет данных для отображения</p>
          </div>
        `;
      }
      
      return items.slice(0, limit).map(item => this.renderCatalogItem(item)).join('');
    } catch (error) {
      console.error('Error rendering catalog items:', error);
      return `
        <div class="col-span-full text-center text-red-400 py-8">
          <p>Ошибка загрузки элементов каталога</p>
        </div>
      `;
    }
  }

  // Get current sub view items
  getCurrentSubViewItems() {
    try {
      switch (this.currentSubView) {
        case 'parts':
          return DataLoader.getAllItems('parts') || [];
        case 'sets':
          return DataLoader.getAllItems('sets') || [];
        case 'minifigs':
          return DataLoader.getAllItems('minifigs') || [];
        default:
          return [];
      }
    } catch (error) {
      console.error('Error getting sub view items:', error);
      return [];
    }
  }

  // Render catalog item card
  renderCatalogItem(item) {
    try {
      if (!item) {
        return `
          <div class="bg-gray-800 rounded-lg p-4">
            <div class="aspect-square bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
              <span class="text-gray-400 text-sm">Нет данных</span>
            </div>
            <h4 class="text-sm font-medium text-white mb-1">Неизвестный элемент</h4>
            <p class="text-xs text-gray-400">Нет информации</p>
          </div>
        `;
      }
      
      const isPart = this.currentSubView === 'parts';
      const isSet = this.currentSubView === 'sets';
      const isMinifig = this.currentSubView === 'minifigs';
      
      let imageUrl = '';
      let title = '';
      let subtitle = '';
      let itemId = '';
      
      if (isPart) {
        imageUrl = `https://cdn.rebrickable.com/media/parts/ldraw/${item.part_num || 'unknown'}.png`;
        title = item.name || 'Неизвестная деталь';
        subtitle = item.part_num || 'N/A';
        itemId = item.part_num || 'unknown';
      } else if (isSet) {
        imageUrl = item.set_img_url || `https://cdn.rebrickable.com/media/sets/${item.set_num || 'unknown'}.jpg`;
        title = item.name || 'Неизвестный набор';
        subtitle = `${item.set_num || 'N/A'} • ${item.year || 'N/A'} • ${item.num_parts || 0} деталей`;
        itemId = item.set_num || 'unknown';
      } else if (isMinifig) {
        imageUrl = item.img_url || `https://cdn.rebrickable.com/media/minifigs/${item.fig_num || 'unknown'}.jpg`;
        title = item.name || 'Неизвестная минифигурка';
        subtitle = `${item.fig_num || 'N/A'} • ${item.num_parts || 0} деталей`;
        itemId = item.fig_num || 'unknown';
      }
      
      return `
        <div class="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors duration-200 cursor-pointer" 
             data-item-id="${itemId}"
             data-item-type="${this.currentSubView}">
          <div class="aspect-square bg-gray-700 rounded-lg mb-3 overflow-hidden">
            <img src="${imageUrl}" 
                 alt="${title}" 
                 class="w-full h-full object-contain"
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzM3NDE1MSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tk8gSU1BR0U8L3RleHQ+PC9zdmc+';">
          </div>
          <h4 class="text-sm font-medium text-white mb-1 line-clamp-2" title="${title}">${title}</h4>
          <p class="text-xs text-gray-400 line-clamp-1" title="${subtitle}">${subtitle}</p>
        </div>
      `;
    } catch (error) {
      console.error('Error rendering catalog item:', error);
      return `
        <div class="bg-gray-800 rounded-lg p-4">
          <div class="aspect-square bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
            <span class="text-red-400 text-sm">Ошибка</span>
          </div>
          <h4 class="text-sm font-medium text-white mb-1">Ошибка загрузки</h4>
          <p class="text-xs text-gray-400">Не удалось отобразить элемент</p>
        </div>
      `;
    }
  }

  // Render collection content
  renderCollectionContent() {
    return `
      <div class="p-8">
        <h2 class="text-2xl font-bold text-white mb-6">Моя коллекция</h2>
        <div class="text-gray-400">
          <p>Раздел: ${this.currentSubView}</p>
          <p>Функция коллекции будет добавлена в следующих версиях</p>
        </div>
      </div>
    `;
  }

  // Render tools content
  renderToolsContent() {
    return `
      <div class="p-8">
        <h2 class="text-2xl font-bold text-white mb-6">Инструменты</h2>
        <div class="text-gray-400">
          <p>Инструмент: ${this.currentSubView || 'Не выбран'}</p>
          <p>Функции инструментов будут добавлены в следующих версиях</p>
        </div>
      </div>
    `;
  }

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  // Setup service worker
  async setupServiceWorker() {
    if (!CONFIG.FEATURES.offlineMode || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available
            if (confirm('Доступна новая версия приложения. Перезагрузить страницу?')) {
              window.location.reload();
            }
          }
        });
      });
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }

  // Setup cloud storage
  async setupCloudStorage() {
    if (!CONFIG.FEATURES.cloudStorage) return;

    try {
      const success = await Storage.initCloudStorage();
      if (success) {
        // Sync data from cloud
        await Storage.syncFromCloud();
        console.log('Cloud storage initialized');
      } else {
        console.log('Cloud storage not available, using local storage only');
      }
    } catch (error) {
      console.warn('Cloud storage initialization failed:', error);
    }
  }

  // Setup tooltips
  setupTooltips() {
    if (!this.settings.tooltipsEnabled) return;

    // Simple tooltip implementation
    document.addEventListener('mouseover', (e) => {
      const element = e.target;
      const tooltip = element.getAttribute('data-tooltip');
      
      if (tooltip) {
        this.showTooltip(element, tooltip);
      }
    });

    document.addEventListener('mouseout', (e) => {
      const element = e.target;
      if (element.getAttribute('data-tooltip')) {
        this.hideTooltip();
      }
    });
  }

  // Show tooltip
  showTooltip(element, text) {
    this.hideTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.id = 'current-tooltip';
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 10}px`;
    tooltip.style.transform = 'translateX(-50%)';
  }

  // Hide tooltip
  hideTooltip() {
    const tooltip = document.getElementById('current-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  // Setup responsive handling
  setupResponsiveHandling() {
    const handleResize = Utils.throttle(() => {
      this.updateResponsiveLayout();
    }, 100);

    window.addEventListener('resize', handleResize);
    this.updateResponsiveLayout();
  }

  // Update responsive layout
  updateResponsiveLayout() {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    document.body.classList.toggle('mobile', isMobile);
    document.body.classList.toggle('tablet', isTablet);
    document.body.classList.toggle('desktop', !isMobile && !isTablet);
    
    // Update UI based on screen size
    this.updateMobileUI(isMobile);
  }

  // Update mobile UI
  updateMobileUI(isMobile) {
    // Hide/show mobile-specific elements
    const mobileElements = document.querySelectorAll('[data-mobile-only]');
    const desktopElements = document.querySelectorAll('[data-desktop-only]');
    
    mobileElements.forEach(el => {
      el.style.display = isMobile ? 'block' : 'none';
    });
    
    desktopElements.forEach(el => {
      el.style.display = isMobile ? 'none' : 'block';
    });
  }

  // Close all modals
  closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.classList.add('hidden');
    });
  }

  // Get app status
  getStatus() {
    return {
      initialized: this.isInitialized,
      loadingProgress: this.loadingProgress,
      currentView: this.currentView,
      settings: this.settings,
      dataStats: DataLoader.getStatistics()
    };
  }

  // Update settings
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    Storage.setSettings(this.settings);
    
    // Apply settings changes
    this.applySettings();
  }

  // Apply settings
  applySettings() {
    // Update theme
    if (this.settings.theme === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
    
    // Update animations
    document.body.classList.toggle('no-animations', !this.settings.animationsEnabled);
    
    // Update tooltips
    if (!this.settings.tooltipsEnabled) {
      this.hideTooltip();
    }
    
    // Update before unload warning
    this.setupBeforeUnload();
  }

  // Reset app
  reset() {
    if (confirm('Сбросить все настройки и данные? Это действие нельзя отменить.')) {
      Storage.clearLocal();
      location.reload();
    }
  }
}

// Create global app instance
const app = new LEGOCatalogApp();
window.app = app;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// Export for use in other modules
export { app, LEGOCatalogApp };