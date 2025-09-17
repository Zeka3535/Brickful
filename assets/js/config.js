// LEGO Catalog Configuration

// API Configuration
const REBRICKABLE_API_URL = 'https://rebrickable.com/api/v3/lego';
const REBRICKABLE_API_KEYS = [
  '20c78cc607d6059c8d2a61338d851590',
  '04a7405ad41f1dd484a562f6e0c57312',
  'd93f5c0989f63afa9b1c29ef8ad66002',
  'b4179c1b8bd3c022ec9fc0e713e96b77',
  'd32527bc33b575b8825a0ba04ba4add5'
];

// Proxy servers for CORS
const PROXY_SERVERS = [
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://yacdn.org/proxy/',
  'https://thingproxy.freeboard.io/fetch/',
  'https://cors-anywhere.herokuapp.com/',
  'https://corsproxy.org/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest='
];

// App Configuration
const CONFIG = {
  // Debug mode
  DEBUG: false,
  
  // Data paths
  DATA_PATH: 'data/',
  CSV_FILES: {
    colors: 'colors.csv',
    parts: 'parts.csv',
    sets: 'sets.csv',
    themes: 'themes.csv',
    minifigs: 'minifigs.csv',
    partCategories: 'part_categories.csv',
    inventories: 'inventories.csv',
    inventorySets: 'inventory_sets.csv',
    inventoryMinifigs: 'inventory_minifigs.csv',
    inventoryPartsSplit: 'inventory_parts_split/'
  },
  
  // UI Configuration
  UI: {
    itemsPerPage: 24,
    searchDebounceDelay: 300,
    animationDuration: 300,
    tooltipDelay: 500,
    loadingTimeout: 30000
  },
  
  // Storage keys
  STORAGE_KEYS: {
    collection: 'lego_collection',
    settings: 'lego_settings',
    cache: 'lego_cache',
    analytics: 'lego_analytics'
  },
  
  // Cache settings
  CACHE: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 50 * 1024 * 1024, // 50MB
    strategies: {
      cacheFirst: ['css', 'js', 'images'],
      networkFirst: ['api'],
      staleWhileRevalidate: ['csv']
    }
  },
  
  // Analytics
  ANALYTICS: {
    enabled: true,
    trackEvents: true,
    trackPerformance: true,
    trackErrors: true
  },
  
  // Features
  FEATURES: {
    cloudStorage: true,
    aiRecognition: true,
    dataMatrixScanner: true,
    wishlist: true,
    analytics: true,
    multiSelect: true,
    dragDrop: false, // Disabled for better mobile experience
    offlineMode: true
  }
};

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'dark',
  language: 'ru',
  itemsPerPage: 24,
  showImages: true,
  showColors: true,
  showCategories: true,
  searchType: 'all', // 'all', 'parts', 'sets', 'minifigs'
  sortBy: 'name',
  sortOrder: 'asc',
  multiSelectEnabled: true,
  preventAccidentalExit: true,
  cloudSync: false,
  analyticsEnabled: true,
  cacheEnabled: true,
  proxyEnabled: true,
  tooltipsEnabled: true,
  animationsEnabled: true
};

// Export for use in other modules
export const DEBUG_MODE = CONFIG.DEBUG;
export { CONFIG, DEFAULT_SETTINGS, REBRICKABLE_API_URL, REBRICKABLE_API_KEYS, PROXY_SERVERS };

// Also make available globally for backward compatibility
window.CONFIG = CONFIG;
window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
window.REBRICKABLE_API_URL = REBRICKABLE_API_URL;
window.REBRICKABLE_API_KEYS = REBRICKABLE_API_KEYS;
window.PROXY_SERVERS = PROXY_SERVERS;
window.DEBUG_MODE = DEBUG_MODE;
