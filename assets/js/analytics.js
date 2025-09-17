// Analytics for LEGO Catalog

class AnalyticsManager {
  constructor() {
    this.analytics = storage.getAnalytics();
    this.sessionStart = Date.now();
    this.pageViews = 0;
    this.events = [];
    this.performance = [];
  }

  // Initialize analytics
  init() {
    this.trackPageView();
    this.setupEventTracking();
    this.setupPerformanceTracking();
  }

  // Track page view
  trackPageView() {
    this.pageViews++;
    this.trackEvent('page_view', {
      page: window.location.pathname,
      timestamp: Date.now()
    });
  }

  // Track event
  trackEvent(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };

    this.events.push(event);
    this.analytics.events.push(event);

    // Keep only last 1000 events
    if (this.analytics.events.length > 1000) {
      this.analytics.events = this.analytics.events.slice(-1000);
    }

    storage.setAnalytics(this.analytics);

    if (CONFIG.DEBUG) {
      console.log('Analytics Event:', event);
    }
  }

  // Track performance
  trackPerformance(name, duration, metadata = {}) {
    const perf = {
      name,
      duration,
      metadata,
      timestamp: Date.now()
    };

    this.performance.push(perf);
    this.analytics.performance.push(perf);

    // Keep only last 100 performance entries
    if (this.analytics.performance.length > 100) {
      this.analytics.performance = this.analytics.performance.slice(-100);
    }

    storage.setAnalytics(this.analytics);
  }

  // Setup event tracking
  setupEventTracking() {
    // Track button clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('button')) {
        this.trackEvent('button_click', {
          buttonText: e.target.textContent.trim(),
          buttonId: e.target.id,
          buttonClass: e.target.className
        });
      }
    });

    // Track search queries
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let lastQuery = '';
      searchInput.addEventListener('input', Utils.debounce((e) => {
        const query = e.target.value.trim();
        if (query && query !== lastQuery) {
          this.trackEvent('search', {
            query,
            queryLength: query.length
          });
          lastQuery = query;
        }
      }, 1000));
    }

    // Track collection changes
    const originalAddToCollection = storage.addToCollection;
    storage.addToCollection = (type, id, quantity) => {
      const result = originalAddToCollection.call(storage, type, id, quantity);
      if (result) {
        this.trackEvent('collection_add', {
          type,
          id,
          quantity
        });
      }
      return result;
    };

    const originalRemoveFromCollection = storage.removeFromCollection;
    storage.removeFromCollection = (type, id, quantity) => {
      const result = originalRemoveFromCollection.call(storage, type, id, quantity);
      if (result) {
        this.trackEvent('collection_remove', {
          type,
          id,
          quantity
        });
      }
      return result;
    };

    // Track view changes
    const originalSwitchView = ui.switchView;
    ui.switchView = (view) => {
      this.trackEvent('view_change', {
        from: this.currentView,
        to: view
      });
      this.currentView = view;
      return originalSwitchView.call(ui, view);
    };
  }

  // Setup performance tracking
  setupPerformanceTracking() {
    // Track page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.trackPerformance('page_load', loadTime);
    });

    // Track data loading
    const originalLoadAllData = dataLoader.loadAllData;
    dataLoader.loadAllData = async () => {
      const start = performance.now();
      const result = await originalLoadAllData.call(dataLoader);
      const duration = performance.now() - start;
      this.trackPerformance('data_load', duration, {
        success: result
      });
      return result;
    };

    // Track API requests
    const originalMakeRequest = api.makeRequest;
    api.makeRequest = async (endpoint, options) => {
      const start = performance.now();
      try {
        const result = await originalMakeRequest.call(api, endpoint, options);
        const duration = performance.now() - start;
        this.trackPerformance('api_request', duration, {
          endpoint,
          success: true
        });
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        this.trackPerformance('api_request', duration, {
          endpoint,
          success: false,
          error: error.message
        });
        throw error;
      }
    };
  }

  // Get session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = Utils.generateId();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  // Get analytics dashboard data
  getDashboardData() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    // Filter events by time period
    const recentEvents = this.analytics.events.filter(e => now - e.timestamp < oneDay);
    const weeklyEvents = this.analytics.events.filter(e => now - e.timestamp < oneWeek);
    const monthlyEvents = this.analytics.events.filter(e => now - e.timestamp < oneMonth);

    // Get collection stats
    const collection = storage.getCollection();
    const collectionStats = {
      parts: Object.keys(collection.parts).length,
      sets: Object.keys(collection.sets).length,
      minifigs: Object.keys(collection.minifigs).length,
      total: Object.keys(collection.parts).length + 
             Object.keys(collection.sets).length + 
             Object.keys(collection.minifigs).length
    };

    // Get search stats
    const searchEvents = this.analytics.events.filter(e => e.name === 'search');
    const uniqueSearches = new Set(searchEvents.map(e => e.properties.query)).size;

    // Get performance stats
    const avgLoadTime = this.calculateAveragePerformance('page_load');
    const avgDataLoadTime = this.calculateAveragePerformance('data_load');
    const avgApiTime = this.calculateAveragePerformance('api_request');

    return {
      overview: {
        totalEvents: this.analytics.events.length,
        totalSessions: this.getUniqueSessions().length,
        currentSessionDuration: now - this.sessionStart,
        pageViews: this.pageViews
      },
      timeframes: {
        today: {
          events: recentEvents.length,
          searches: searchEvents.filter(e => now - e.timestamp < oneDay).length
        },
        week: {
          events: weeklyEvents.length,
          searches: searchEvents.filter(e => now - e.timestamp < oneWeek).length
        },
        month: {
          events: monthlyEvents.length,
          searches: searchEvents.filter(e => now - e.timestamp < oneMonth).length
        }
      },
      collection: collectionStats,
      search: {
        totalSearches: searchEvents.length,
        uniqueSearches,
        popularQueries: this.getPopularQueries(searchEvents)
      },
      performance: {
        avgLoadTime,
        avgDataLoadTime,
        avgApiTime,
        totalApiRequests: this.analytics.performance.filter(p => p.name === 'api_request').length
      },
      events: {
        byType: this.getEventsByType(this.analytics.events),
        recent: this.analytics.events.slice(-10)
      }
    };
  }

  // Calculate average performance
  calculateAveragePerformance(name) {
    const perfEvents = this.analytics.performance.filter(p => p.name === name);
    if (perfEvents.length === 0) return 0;
    
    const total = perfEvents.reduce((sum, p) => sum + p.duration, 0);
    return Math.round(total / perfEvents.length);
  }

  // Get unique sessions
  getUniqueSessions() {
    const sessions = new Set(this.analytics.events.map(e => e.sessionId));
    return Array.from(sessions);
  }

  // Get popular queries
  getPopularQueries(searchEvents) {
    const queryCounts = {};
    searchEvents.forEach(e => {
      const query = e.properties.query;
      queryCounts[query] = (queryCounts[query] || 0) + 1;
    });

    return Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
  }

  // Get events by type
  getEventsByType(events) {
    const eventTypes = {};
    events.forEach(e => {
      eventTypes[e.name] = (eventTypes[e.name] || 0) + 1;
    });
    return eventTypes;
  }

  // Export analytics data
  exportAnalytics() {
    const data = {
      analytics: this.analytics,
      dashboard: this.getDashboardData(),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    const json = JSON.stringify(data, null, 2);
    const filename = `lego-analytics-${new Date().toISOString().split('T')[0]}.json`;
    
    Utils.downloadFile(json, filename, 'application/json');
    Utils.showNotification('Аналитика экспортирована', 'success');
  }

  // Clear analytics data
  clearAnalytics() {
    const confirmed = confirm('Очистить все данные аналитики? Это действие нельзя отменить.');
    if (!confirmed) return;

    this.analytics = {
      events: [],
      performance: [],
      errors: [],
      sessions: [],
      lastReset: Date.now()
    };

    storage.setAnalytics(this.analytics);
    this.events = [];
    this.performance = [];
    
    Utils.showNotification('Данные аналитики очищены', 'success');
  }

  // Get real-time stats
  getRealTimeStats() {
    return {
      currentSession: {
        duration: Date.now() - this.sessionStart,
        events: this.events.length,
        pageViews: this.pageViews
      },
      collection: {
        parts: Object.keys(storage.getCollection().parts).length,
        sets: Object.keys(storage.getCollection().sets).length,
        minifigs: Object.keys(storage.getCollection().minifigs).length
      },
      performance: {
        memoryUsage: this.getMemoryUsage(),
        loadTime: performance.now()
      }
    };
  }

  // Get memory usage (approximate)
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  }

  // Track error
  trackError(error, context = '') {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };

    this.analytics.errors.push(errorData);

    // Keep only last 100 errors
    if (this.analytics.errors.length > 100) {
      this.analytics.errors = this.analytics.errors.slice(-100);
    }

    storage.setAnalytics(this.analytics);

    this.trackEvent('error', {
      message: error.message,
      context
    });
  }

  // Get analytics summary
  getSummary() {
    const dashboard = this.getDashboardData();
    const realTime = this.getRealTimeStats();

    return {
      ...dashboard,
      realTime,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Create global analytics instance
window.analytics = new AnalyticsManager();

// Export for use in other modules
window.AnalyticsManager = AnalyticsManager;
