// Main application for LEGO Catalog

class LEGOCatalogApp {
  constructor() {
    this.isInitialized = false;
    this.loadingProgress = 0;
    this.currentView = 'catalog';
    this.settings = storage.getSettings();
  }

  // Initialize application
  async init() {
    if (this.isInitialized) return;

    try {
      this.showLoadingScreen();
      this.setupGlobalErrorHandling();
      this.setupBeforeUnload();
      
      // Initialize components
      await this.initializeComponents();
      
      // Load data
      await this.loadData();
      
      // Setup UI
      this.setupUI();
      
      // Initialize analytics
      if (CONFIG.FEATURES.analytics) {
        analytics.init();
      }
      
      // Hide loading screen
      this.hideLoadingScreen();
      
      this.isInitialized = true;
      console.log('LEGO Catalog initialized successfully');
      
    } catch (error) {
      Utils.handleError(error, 'App initialization');
      this.showErrorScreen(error);
    }
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
    dataLoader.onProgress((progress) => {
      this.updateLoadingProgress(progress.loaded, progress.total, progress.current);
    });
    
    // Load all data
    const success = await dataLoader.loadAllData();
    
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
      storage.clearLocal();
      location.reload();
    }
  }
}

// Create global app instance
window.app = new LEGOCatalogApp();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// Export for use in other modules
window.LEGOCatalogApp = LEGOCatalogApp;
