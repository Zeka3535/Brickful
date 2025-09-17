// API management for LEGO Catalog

class APIManager {
  constructor() {
    this.currentProxyIndex = 0;
    this.failedProxies = new Set();
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.rateLimitDelay = 1000; // 1 second between requests
  }

  // Get current API key
  getCurrentApiKey() {
    const keys = REBRICKABLE_API_KEYS;
    return keys[Math.floor(Math.random() * keys.length)];
  }

  // Get current proxy
  getCurrentProxy() {
    if (!CONFIG.FEATURES.proxyEnabled || PROXY_SERVERS.length === 0) {
      return null;
    }

    // Find a proxy that hasn't failed recently
    const availableProxies = PROXY_SERVERS.filter((_, index) => !this.failedProxies.has(index));
    
    if (availableProxies.length === 0) {
      // Reset failed proxies if all are marked as failed
      this.failedProxies.clear();
      return PROXY_SERVERS[0];
    }

    return availableProxies[this.currentProxyIndex % availableProxies.length];
  }

  // Mark proxy as failed
  markProxyFailed(proxyIndex) {
    this.failedProxies.add(proxyIndex);
    
    // Remove from failed list after 5 minutes
    setTimeout(() => {
      this.failedProxies.delete(proxyIndex);
    }, 5 * 60 * 1000);
  }

  // Build request URL
  buildRequestUrl(endpoint, useProxy = true) {
    const baseUrl = `${REBRICKABLE_API_URL}${endpoint}`;
    
    if (!useProxy) {
      return baseUrl;
    }

    const proxy = this.getCurrentProxy();
    if (!proxy) {
      return baseUrl;
    }

    return `${proxy}${encodeURIComponent(baseUrl)}`;
  }

  // Make API request
  async makeRequest(endpoint, options = {}) {
    const {
      useProxy = true,
      retries = 3,
      timeout = 10000,
      cache = true
    } = options;

    // Check cache first
    if (cache) {
      const cacheKey = `api_${endpoint}_${JSON.stringify(options)}`;
      const cached = storage.getCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const requestId = Utils.generateId();
    this.requestQueue.push({ requestId, endpoint, options });

    if (!this.isProcessingQueue) {
      this.processQueue();
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      const handleResponse = (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      };

      const handleError = (error) => {
        clearTimeout(timeoutId);
        reject(error);
      };

      // Store handlers for this request
      this.requestHandlers = this.requestHandlers || new Map();
      this.requestHandlers.set(requestId, { handleResponse, handleError });
    });
  }

  // Process request queue
  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { requestId, endpoint, options } = this.requestQueue.shift();
      
      try {
        const response = await this.executeRequest(endpoint, options);
        const handlers = this.requestHandlers?.get(requestId);
        if (handlers) {
          handlers.handleResponse(response);
          this.requestHandlers.delete(requestId);
        }
      } catch (error) {
        const handlers = this.requestHandlers?.get(requestId);
        if (handlers) {
          handlers.handleError(error);
          this.requestHandlers.delete(requestId);
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
    }

    this.isProcessingQueue = false;
  }

  // Execute actual request
  async executeRequest(endpoint, options) {
    const { useProxy = true, retries = 3 } = options;
    let lastError;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const url = this.buildRequestUrl(endpoint, useProxy);
        const apiKey = this.getCurrentApiKey();
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `key ${apiKey}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          ...options
        });

        if (!response.ok) {
          if (response.status === 429) {
            // Rate limited, wait longer
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          if (response.status >= 500) {
            // Server error, try different proxy
            if (useProxy) {
              this.currentProxyIndex = (this.currentProxyIndex + 1) % PROXY_SERVERS.length;
            }
            continue;
          }

          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Cache successful response
        if (options.cache !== false) {
          const cacheKey = `api_${endpoint}_${JSON.stringify(options)}`;
          storage.setCache(cacheKey, data);
        }

        return data;

      } catch (error) {
        lastError = error;
        
        if (useProxy && attempt < retries - 1) {
          // Try different proxy
          this.currentProxyIndex = (this.currentProxyIndex + 1) % PROXY_SERVERS.length;
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  // Get part details
  async getPart(partNum) {
    return this.makeRequest(`/parts/${partNum}/`);
  }

  // Get set details
  async getSet(setNum) {
    return this.makeRequest(`/sets/${setNum}/`);
  }

  // Get minifig details
  async getMinifig(figNum) {
    return this.makeRequest(`/minifigs/${figNum}/`);
  }

  // Get part colors
  async getPartColors(partNum) {
    return this.makeRequest(`/parts/${partNum}/colors/`);
  }

  // Get set parts
  async getSetParts(setNum) {
    return this.makeRequest(`/sets/${setNum}/parts/`);
  }

  // Get minifig parts
  async getMinifigParts(figNum) {
    return this.makeRequest(`/minifigs/${figNum}/parts/`);
  }

  // Search parts
  async searchParts(query, options = {}) {
    const params = new URLSearchParams({
      search: query,
      page: options.page || 1,
      page_size: options.pageSize || 20,
      ...options
    });
    
    return this.makeRequest(`/parts/?${params}`);
  }

  // Search sets
  async searchSets(query, options = {}) {
    const params = new URLSearchParams({
      search: query,
      page: options.page || 1,
      page_size: options.pageSize || 20,
      ...options
    });
    
    return this.makeRequest(`/sets/?${params}`);
  }

  // Search minifigs
  async searchMinifigs(query, options = {}) {
    const params = new URLSearchParams({
      search: query,
      page: options.page || 1,
      page_size: options.pageSize || 20,
      ...options
    });
    
    return this.makeRequest(`/minifigs/?${params}`);
  }

  // Get colors
  async getColors() {
    return this.makeRequest('/colors/');
  }

  // Get themes
  async getThemes() {
    return this.makeRequest('/themes/');
  }

  // Get part categories
  async getPartCategories() {
    return this.makeRequest('/part_categories/');
  }

  // Get part image URL
  getPartImageUrl(partNum, colorId = null) {
    const baseUrl = `https://cdn.rebrickable.com/media/parts/ldraw/${partNum}.png`;
    return colorId ? `${baseUrl}?color=${colorId}` : baseUrl;
  }

  // Get set image URL
  getSetImageUrl(setNum) {
    return `https://cdn.rebrickable.com/media/sets/${setNum}.jpg`;
  }

  // Get minifig image URL
  getMinifigImageUrl(figNum) {
    return `https://cdn.rebrickable.com/media/minifigs/${figNum}.jpg`;
  }

  // Preload image
  async preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  // Batch preload images
  async preloadImages(urls, maxConcurrent = 5) {
    const results = [];
    
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      const batch = urls.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(url => 
        this.preloadImage(url).catch(error => ({ error, url }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  // Get API status
  getStatus() {
    return {
      currentProxy: this.currentProxyIndex,
      failedProxies: Array.from(this.failedProxies),
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessingQueue,
      rateLimitDelay: this.rateLimitDelay
    };
  }

  // Reset API state
  reset() {
    this.currentProxyIndex = 0;
    this.failedProxies.clear();
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.requestHandlers?.clear();
  }
}

// Create global API instance
window.api = new APIManager();

// Export for use in other modules
window.APIManager = APIManager;
