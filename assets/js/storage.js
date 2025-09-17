// Storage management for LEGO Catalog
import { CONFIG, DEFAULT_SETTINGS } from './config.js';
import { Utils } from './utils.js';

class StorageManager {
  constructor() {
    this.cache = new Map();
    this.cacheSize = 0;
    this.maxCacheSize = CONFIG.CACHE.maxSize;
  }

  // Local Storage methods
  setLocal(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      Utils.handleError(error, 'setLocal');
      return false;
    }
  }

  getLocal(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      Utils.handleError(error, 'getLocal');
      return defaultValue;
    }
  }

  removeLocal(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      Utils.handleError(error, 'removeLocal');
      return false;
    }
  }

  clearLocal() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      Utils.handleError(error, 'clearLocal');
      return false;
    }
  }

  // Session Storage methods
  setSession(key, value) {
    try {
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      Utils.handleError(error, 'setSession');
      return false;
    }
  }

  getSession(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      Utils.handleError(error, 'getSession');
      return defaultValue;
    }
  }

  removeSession(key) {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      Utils.handleError(error, 'removeSession');
      return false;
    }
  }

  // Cache methods
  setCache(key, value, ttl = CONFIG.CACHE.maxAge) {
    const now = Date.now();
    const item = {
      value,
      timestamp: now,
      ttl
    };

    // Check cache size
    const itemSize = JSON.stringify(item).length;
    if (this.cacheSize + itemSize > this.maxCacheSize) {
      this.cleanCache();
    }

    this.cache.set(key, item);
    this.cacheSize += itemSize;
  }

  getCache(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  removeCache(key) {
    const item = this.cache.get(key);
    if (item) {
      this.cacheSize -= JSON.stringify(item).length;
    }
    return this.cache.delete(key);
  }

  cleanCache() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.removeCache(key));

    // If still over limit, remove oldest items
    if (this.cacheSize > this.maxCacheSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      for (const [key] of sortedEntries) {
        this.removeCache(key);
        if (this.cacheSize <= this.maxCacheSize * 0.8) break;
      }
    }
  }

  // Collection management
  getCollection() {
    return this.getLocal(CONFIG.STORAGE_KEYS.collection, {
      parts: {},
      sets: {},
      minifigs: {},
      wishlist: []
    });
  }

  setCollection(collection) {
    return this.setLocal(CONFIG.STORAGE_KEYS.collection, collection);
  }

  addToCollection(type, id, quantity = 1) {
    const collection = this.getCollection();
    if (!collection[type]) collection[type] = {};

    if (collection[type][id]) {
      collection[type][id] += quantity;
    } else {
      collection[type][id] = quantity;
    }

    return this.setCollection(collection);
  }

  removeFromCollection(type, id, quantity = null) {
    const collection = this.getCollection();
    if (!collection[type] || !collection[type][id]) return false;

    if (quantity === null || collection[type][id] <= quantity) {
      delete collection[type][id];
    } else {
      collection[type][id] -= quantity;
    }

    return this.setCollection(collection);
  }

  getCollectionItem(type, id) {
    const collection = this.getCollection();
    return collection[type]?.[id] || 0;
  }

  // Settings management
  getSettings() {
    return this.getLocal(CONFIG.STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  }

  setSettings(settings) {
    const currentSettings = this.getSettings();
    const mergedSettings = Utils.deepMerge(currentSettings, settings);
    return this.setLocal(CONFIG.STORAGE_KEYS.settings, mergedSettings);
  }

  updateSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    return this.setSettings(settings);
  }

  // Analytics data
  getAnalytics() {
    return this.getLocal(CONFIG.STORAGE_KEYS.analytics, {
      events: [],
      performance: [],
      errors: [],
      sessions: [],
      lastReset: Date.now()
    });
  }

  setAnalytics(analytics) {
    return this.setLocal(CONFIG.STORAGE_KEYS.analytics, analytics);
  }

  addAnalyticsEvent(event) {
    const analytics = this.getAnalytics();
    analytics.events.push({
      ...event,
      timestamp: Date.now()
    });

    // Keep only last 1000 events
    if (analytics.events.length > 1000) {
      analytics.events = analytics.events.slice(-1000);
    }

    return this.setAnalytics(analytics);
  }

  // Cloud storage integration
  async initCloudStorage() {
    return this.initRemoteStorage();
  }

  async initRemoteStorage() {
    if (!window.remoteStorageAvailable) return false;

    try {
      const remoteStorage = new RemoteStorage({
        cache: true,
        logging: CONFIG.DEBUG
      });

      // Initialize the client
      await remoteStorage.access.claim('lego-catalog', 'rw');
      
      // Wait for the client to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('RemoteStorage initialization timeout'));
        }, 5000);
        
        if (remoteStorage.remote) {
          // Client is already ready
          clearTimeout(timeout);
          resolve();
        } else {
          remoteStorage.on('ready', () => {
            clearTimeout(timeout);
            resolve();
          });
          
          remoteStorage.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        }
      });
      
      this.cloudStorage = remoteStorage;
      return true;
    } catch (error) {
      console.warn('RemoteStorage initialization failed:', error);
      return false;
    }
  }

  async syncToCloud() {
    if (!this.cloudStorage) return false;

    try {
      const collection = this.getCollection();
      const settings = this.getSettings();
      
      // Use the correct RemoteStorage API methods
      await this.cloudStorage.storeObject('lego-catalog/collection', collection);
      await this.cloudStorage.storeObject('lego-catalog/settings', settings);
      
      return true;
    } catch (error) {
      console.warn('Cloud sync failed:', error);
      return false;
    }
  }

  async syncFromCloud() {
    if (!this.cloudStorage) return false;

    try {
      // Check if the cloudStorage has the correct methods
      if (typeof this.cloudStorage.getObject !== 'function') {
        console.warn('RemoteStorage getObject method not available');
        return false;
      }
      
      // Use the correct RemoteStorage API methods
      const collection = await this.cloudStorage.getObject('lego-catalog/collection');
      const settings = await this.cloudStorage.getObject('lego-catalog/settings');
      
      if (collection) this.setCollection(collection);
      if (settings) this.setSettings(settings);
      
      return true;
    } catch (error) {
      console.warn('Cloud sync failed:', error);
      return false;
    }
  }

  // Export/Import
  exportData() {
    const data = {
      collection: this.getCollection(),
      settings: this.getSettings(),
      analytics: this.getAnalytics(),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(data, null, 2);
  }

  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.collection) this.setCollection(data.collection);
      if (data.settings) this.setSettings(data.settings);
      if (data.analytics) this.setAnalytics(data.analytics);
      
      return true;
    } catch (error) {
      Utils.handleError(error, 'importData');
      return false;
    }
  }

  // Storage info
  getStorageInfo() {
    const info = {
      localStorage: this.getStorageSize(localStorage),
      sessionStorage: this.getStorageSize(sessionStorage),
      cache: {
        size: this.cacheSize,
        items: this.cache.size,
        maxSize: this.maxCacheSize
      }
    };

    return info;
  }

  getStorageSize(storage) {
    let total = 0;
    for (let key in storage) {
      if (storage.hasOwnProperty(key)) {
        total += storage[key].length + key.length;
      }
    }
    return total;
  }

  // Cleanup
  cleanup() {
    this.cleanCache();
    
    // Clean old analytics data (older than 30 days)
    const analytics = this.getAnalytics();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    analytics.events = analytics.events.filter(event => event.timestamp > thirtyDaysAgo);
    analytics.performance = analytics.performance.filter(perf => perf.timestamp > thirtyDaysAgo);
    analytics.errors = analytics.errors.filter(error => error.timestamp > thirtyDaysAgo);
    
    this.setAnalytics(analytics);
  }
}

// Create global storage instance
const storage = new StorageManager();
window.storage = storage;

// Export for use in other modules
export { storage as Storage };

// Initialize cloud storage on load
window.addEventListener('load', async () => {
  if (CONFIG.FEATURES.cloudStorage) {
    await storage.initCloudStorage();
  }
});
