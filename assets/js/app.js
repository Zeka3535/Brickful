<<<<<<< Updated upstream
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
    this.settings = Storage.getSettings();
  }
=======
// assets/js/app.js - Main application logic
import { Storage } from './storage.js';
import { DEBUG_MODE } from './config.js';
import { DataLoader } from './data-loader.js';

// Глобальное состояние приложения
window.S = {
    view: 'catalog',
    subView: 'parts',
    toolSubView: '',
    q: '',
    loading: false,
    err: null,
    gridStale: false,
    toDisplay: 50,
    increment: 50,
    selCatId: null,
    selThemeId: null,
    selCollThemeId: null,
    selFigNum: null,
    showRelatedSets: false,
    searchGroups: null,
    catGroups: null,
    coll: {},
    setColl: {},
    minifigColl: {},
    favThemeIds: new Set(),
    favCategoryIds: new Set(),
    expThemes: new Set(),
    multiSelect: {
        active: false,
        items: new Set(),
        justActivated: false
    },
    collectionMultiSelectEnabled: false,
    catalogMultiSelectEnabled: false,
    wishlistEnabled: false,
    sidebarLoading: false,
    totalSetsInCatalog: 0
};
>>>>>>> Stashed changes

// DOM элементы
let sidebarEl, headerEl, mainEl;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 LEGO Catalog App starting...');
    
    // Получаем DOM элементы
    sidebarEl = document.getElementById('sidebar-container');
    headerEl = document.getElementById('header-container');
    mainEl = document.getElementById('main-content');
    
    // Инициализируем хранилище
    Storage.initRemoteStorage();
    
    // Загружаем данные
    loadInitialData();
    
    if (DEBUG_MODE) {
        console.log('✅ App initialized successfully');
    }
<<<<<<< Updated upstream
  }

  // Show loading screen
  showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const appContent = document.getElementById('app-content');
    
    if (loadingScreen) {
      loadingScreen.classList.remove('hidden');
    }
    if (appContent) {
      appContent.classList.add('hidden');
    }
  }

  // Hide loading screen
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const appContent = document.getElementById('app-content');
    
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
    if (appContent) {
      appContent.classList.remove('hidden');
    }
  }

  // Show error screen
  showErrorScreen(error) {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="text-center">
          <div class="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 class="text-2xl font-bold text-white mb-4">Ошибка загрузки</h2>
          <p class="text-gray-400 mb-6">${error.message}</p>
          <button onclick="location.reload()" class="btn-primary">
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
      if (CONFIG.FEATURES.analytics) {
        analytics.trackError(event.error, 'Global error');
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      Utils.handleError(new Error(event.reason), 'Unhandled promise rejection');
      if (CONFIG.FEATURES.analytics) {
        analytics.trackError(new Error(event.reason), 'Unhandled promise rejection');
      }
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
    search.init();
    
    // Initialize catalog
    catalog.init();
    
    // Initialize collection
    collection.init();
    
    // Initialize UI components
    ui.createHeader();
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
    
    const progressText = document.getElementById('loading-progress');
    if (progressText) {
      progressText.textContent = current || `Загружено ${loaded} из ${total}`;
    }
    
    // Update progress bar if exists
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
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
      
      // Number keys for quick navigation
      if (e.key >= '1' && e.key <= '3' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const views = ['catalog', 'collection', 'analytics'];
        const viewIndex = parseInt(e.key) - 1;
        if (views[viewIndex]) {
          ui.switchView(views[viewIndex]);
        }
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
      const success = await storage.initCloudStorage();
      if (success) {
        // Sync data from cloud
        await storage.syncFromCloud();
        console.log('Cloud storage initialized');
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
      dataStats: dataLoader.getStatistics(),
      collectionStats: collection.getStats(),
      analyticsStats: analytics.getRealTimeStats()
    };
  }

  // Update settings
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    storage.setSettings(this.settings);
    
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
=======
});

// Загрузка начальных данных
async function loadInitialData() {
    try {
        updateLoadingStatus('Загрузка данных...', 0);
        
        // Здесь будет загрузка CSV данных
        // Пока что просто скрываем экран загрузки
        setTimeout(() => {
            hideLoadingScreen();
            renderUI();
        }, 2000);
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        updateLoadingStatus('Ошибка загрузки данных', 0);
    }
}

// Обновление статуса загрузки
function updateLoadingStatus(message, progress) {
    const statusEl = document.getElementById('loading-status');
    const progressEl = document.getElementById('loading-progress');
    
    if (statusEl) statusEl.textContent = message;
    if (progressEl) progressEl.style.width = `${progress}%`;
}

// Скрытие экрана загрузки
function hideLoadingScreen() {
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) {
        loadingContainer.style.display = 'none';
    }
}

// Рендеринг UI
function renderUI() {
    renderSidebar();
    renderHeader();
    renderMain();
}

// Рендеринг сайдбара
function renderSidebar() {
    if (!sidebarEl) return;
    
    const viewButtons = [
        { id: 'catalog', label: 'Каталог', icon: '📚' },
        { id: 'collection', label: 'Коллекция', icon: '🏠' },
        { id: 'tools', label: 'Инструменты', icon: '🔧' }
    ];
    
    const subViewButtons = getSubViewButtons();
    
    sidebarEl.innerHTML = `
        <div class="space-y-4">
            <div class="space-y-2">
                ${viewButtons.map(btn => `
                    <button 
                        data-action="set-view" 
                        data-view="${btn.id}"
                        class="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                            S.view === btn.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
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
                                S.subView === btn.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
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
    
    setupSidebarHandlers();
}

// Получение кнопок подразделов
function getSubViewButtons() {
    switch (S.view) {
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

// Настройка обработчиков сайдбара
function setupSidebarHandlers() {
    sidebarEl.querySelectorAll('[data-action="set-view"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            S.view = view;
            S.subView = getSubViewButtons()[0]?.id || '';
            S.toolSubView = '';
            renderUI();
        });
    });
    
    sidebarEl.querySelectorAll('[data-action="set-subview"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const subView = e.currentTarget.dataset.subview;
            S.subView = subView;
            S.toolSubView = '';
            renderUI();
        });
    });
}

// Рендеринг заголовка
function renderHeader() {
    if (!headerEl) return;
    
    const searchContext = S.view === 'collection' ? 'в коллекции' : 'в каталоге';
    
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
                    <input id="search-input" type="search" placeholder="Поиск ${searchContext}..." value="${S.q}" class="w-full bg-gray-700 border border-gray-600 rounded-md pl-4 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" title="Поиск ${searchContext}" autocomplete="off" spellcheck="false" autocorrect="off" autocapitalize="off"/>
                    <button id="clear-search" class="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-400 hover:text-white ${S.q ? '' : 'hidden'}" title="Очистить поисковый запрос">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    <div id="search-icon" class="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-400 ${S.q ? 'hidden' : ''}" title="Поиск">
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
    
    setupHeaderHandlers();
}

// Настройка обработчиков заголовка
function setupHeaderHandlers() {
    const searchInput = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');
    const searchIcon = document.getElementById('search-icon');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            S.q = e.target.value;
            if (S.q) {
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
            S.q = '';
            if (searchInput) searchInput.value = '';
            clearSearch.classList.add('hidden');
            searchIcon?.classList.remove('hidden');
        });
    }
    
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebarEl?.classList.toggle('-translate-x-full');
        });
    }
}

// Рендеринг основного контента
function renderMain() {
    if (!mainEl) return;
    
    let content = '';
    
    switch (S.view) {
        case 'catalog':
            content = renderCatalogContent();
            break;
        case 'collection':
            content = renderCollectionContent();
            break;
        case 'tools':
            content = renderToolsContent();
            break;
        default:
            content = '<div class="p-8 text-center text-gray-400">Выберите раздел</div>';
    }
    
    mainEl.innerHTML = content;
}

// Рендеринг контента каталога
function renderCatalogContent() {
    return `
        <div class="p-8">
            <h2 class="text-2xl font-bold text-white mb-6">Каталог LEGO</h2>
            <div class="text-gray-400">
                <p>Раздел: ${S.subView}</p>
                <p>Поиск: ${S.q || 'Нет'}</p>
            </div>
        </div>
    `;
}

// Рендеринг контента коллекции
function renderCollectionContent() {
    return `
        <div class="p-8">
            <h2 class="text-2xl font-bold text-white mb-6">Моя коллекция</h2>
            <div class="text-gray-400">
                <p>Раздел: ${S.subView}</p>
                <p>Поиск: ${S.q || 'Нет'}</p>
            </div>
        </div>
    `;
}

// Рендеринг контента инструментов
function renderToolsContent() {
    return `
        <div class="p-8">
            <h2 class="text-2xl font-bold text-white mb-6">Инструменты</h2>
            <div class="text-gray-400">
                <p>Инструмент: ${S.toolSubView || 'Не выбран'}</p>
            </div>
        </div>
    `;
}
>>>>>>> Stashed changes
