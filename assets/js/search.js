// Search functionality for LEGO Catalog

class SearchManager {
  constructor() {
    this.searchHistory = [];
    this.searchSuggestions = [];
    this.currentQuery = '';
    this.searchResults = {
      parts: [],
      sets: [],
      minifigs: []
    };
  }

  // Initialize search
  init() {
    this.loadSearchHistory();
    this.setupSearchEvents();
  }

  // Setup search events
  setupSearchEvents() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    // Input event with debouncing
    searchInput.addEventListener('input', Utils.debounce((e) => {
      this.handleSearchInput(e.target.value);
    }, CONFIG.UI.searchDebounceDelay));

    // Key events
    searchInput.addEventListener('keydown', (e) => {
      this.handleSearchKeydown(e);
    });

    // Focus events
    searchInput.addEventListener('focus', () => {
      this.showSearchSuggestions();
    });

    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        this.hideSearchSuggestions();
      }, 200);
    });
  }

  // Handle search input
  handleSearchInput(query) {
    this.currentQuery = query.trim();
    
    if (this.currentQuery.length < 2) {
      this.hideSearchSuggestions();
      return;
    }

    this.performSearch(this.currentQuery);
  }

  // Handle search keydown
  handleSearchKeydown(e) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer || resultsContainer.classList.contains('hidden')) return;

    const items = resultsContainer.querySelectorAll('[data-search-item]');
    const currentActive = resultsContainer.querySelector('.bg-gray-700');
    let activeIndex = -1;

    if (currentActive) {
      activeIndex = Array.from(items).indexOf(currentActive);
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        this.setActiveSearchItem(items, activeIndex);
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        this.setActiveSearchItem(items, activeIndex);
        break;
      case 'Enter':
        e.preventDefault();
        if (currentActive) {
          currentActive.click();
        }
        break;
      case 'Escape':
        this.hideSearchSuggestions();
        break;
    }
  }

  // Set active search item
  setActiveSearchItem(items, index) {
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add('bg-gray-700');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('bg-gray-700');
      }
    });
  }

  // Perform search
  async performSearch(query) {
    try {
      // Search in local data
      const localResults = this.searchLocalData(query);
      
      // Search via API if needed
      const apiResults = await this.searchAPI(query);
      
      // Combine results
      this.searchResults = this.combineSearchResults(localResults, apiResults);
      
      // Display results
      this.displaySearchResults();
      
      // Add to search history
      this.addToSearchHistory(query);
      
    } catch (error) {
      Utils.handleError(error, 'performSearch');
    }
  }

  // Search local data
  searchLocalData(query) {
    const results = {
      parts: dataLoader.searchParts(query, 10),
      sets: dataLoader.searchSets(query, 10),
      minifigs: dataLoader.searchMinifigs(query, 10)
    };

    return results;
  }

  // Search via API
  async searchAPI(query) {
    try {
      const [parts, sets, minifigs] = await Promise.all([
        api.searchParts(query, { pageSize: 10 }),
        api.searchSets(query, { pageSize: 10 }),
        api.searchMinifigs(query, { pageSize: 10 })
      ]);

      return {
        parts: parts.results || [],
        sets: sets.results || [],
        minifigs: minifigs.results || []
      };
    } catch (error) {
      console.warn('API search failed:', error);
      return { parts: [], sets: [], minifigs: [] };
    }
  }

  // Combine search results
  combineSearchResults(localResults, apiResults) {
    const combined = {
      parts: [...localResults.parts, ...apiResults.parts],
      sets: [...localResults.sets, ...apiResults.sets],
      minifigs: [...localResults.minifigs, ...apiResults.minifigs]
    };

    // Remove duplicates based on ID
    combined.parts = this.removeDuplicates(combined.parts, 'partNum');
    combined.sets = this.removeDuplicates(combined.sets, 'setNum');
    combined.minifigs = this.removeDuplicates(combined.minifigs, 'figNum');

    return combined;
  }

  // Remove duplicates from array
  removeDuplicates(array, idKey) {
    const seen = new Set();
    return array.filter(item => {
      const id = item[idKey];
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }

  // Display search results
  displaySearchResults() {
    const container = document.getElementById('search-results');
    if (!container) return;

    const totalResults = this.searchResults.parts.length + 
                        this.searchResults.sets.length + 
                        this.searchResults.minifigs.length;

    if (totalResults === 0) {
      container.innerHTML = `
        <div class="p-4 text-gray-400 text-center">
          <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          Ничего не найдено
        </div>
      `;
      container.classList.remove('hidden');
      return;
    }

    let html = '<div class="p-4">';
    
    // Parts results
    if (this.searchResults.parts.length > 0) {
      html += this.createSearchSection('parts', 'Детали', this.searchResults.parts);
    }
    
    // Sets results
    if (this.searchResults.sets.length > 0) {
      html += this.createSearchSection('sets', 'Наборы', this.searchResults.sets);
    }
    
    // Minifigs results
    if (this.searchResults.minifigs.length > 0) {
      html += this.createSearchSection('minifigs', 'Минифигурки', this.searchResults.minifigs);
    }

    html += '</div>';
    container.innerHTML = html;
    container.classList.remove('hidden');
  }

  // Create search section
  createSearchSection(type, title, items) {
    let html = `
      <div class="mb-4">
        <h4 class="font-medium text-white mb-2 flex items-center">
          ${title}
          <span class="ml-2 text-sm text-gray-400">(${items.length})</span>
        </h4>
        <div class="space-y-1">
    `;

    items.slice(0, 5).forEach(item => {
      const id = item.partNum || item.setNum || item.figNum;
      const name = item.name;
      const imageUrl = this.getItemImageUrl(item, type);
      
      html += `
        <div 
          class="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer" 
          data-search-item
          onclick="search.selectSearchResult('${type}', '${id}')"
        >
          <img 
            src="${imageUrl}" 
            alt="${name}"
            class="w-8 h-8 object-contain rounded"
            onerror="this.style.display='none'"
          >
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-white truncate">${name}</div>
            <div class="text-xs text-gray-400">${id}</div>
          </div>
        </div>
      `;
    });

    if (items.length > 5) {
      html += `
        <div class="text-center py-2">
          <button 
            class="text-sm text-blue-400 hover:text-blue-300"
            onclick="search.showAllResults('${type}')"
          >
            Показать все (${items.length})
          </button>
        </div>
      `;
    }

    html += '</div></div>';
    return html;
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

  // Select search result
  selectSearchResult(type, id) {
    // Clear search
    document.getElementById('search-input').value = '';
    this.hideSearchSuggestions();
    
    // Switch to catalog view and show item
    ui.switchView('catalog');
    ui.switchCatalogTab(type);
    
    // Scroll to item (if visible)
    setTimeout(() => {
      const item = document.querySelector(`[data-id="${id}"][data-type="${type}"]`);
      if (item) {
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        item.classList.add('ring-2', 'ring-blue-500');
        setTimeout(() => {
          item.classList.remove('ring-2', 'ring-blue-500');
        }, 3000);
      }
    }, 100);
  }

  // Show all results
  showAllResults(type) {
    // Switch to catalog view and show all results
    ui.switchView('catalog');
    ui.switchCatalogTab(type);
    
    // Filter by current query
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = this.currentQuery;
    }
    
    this.hideSearchSuggestions();
  }

  // Show search suggestions
  showSearchSuggestions() {
    if (this.searchHistory.length === 0) return;

    const container = document.getElementById('search-results');
    if (!container) return;

    const html = `
      <div class="p-4">
        <h4 class="font-medium text-white mb-2">Недавние поиски</h4>
        <div class="space-y-1">
          ${this.searchHistory.slice(0, 5).map(query => `
            <div 
              class="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer"
              onclick="search.selectSearchHistory('${query}')"
            >
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-sm text-gray-300">${query}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
    container.classList.remove('hidden');
  }

  // Hide search suggestions
  hideSearchSuggestions() {
    const container = document.getElementById('search-results');
    if (container) {
      container.classList.add('hidden');
    }
  }

  // Select search history
  selectSearchHistory(query) {
    document.getElementById('search-input').value = query;
    this.handleSearchInput(query);
  }

  // Add to search history
  addToSearchHistory(query) {
    if (!query || query.length < 2) return;

    // Remove if already exists
    this.searchHistory = this.searchHistory.filter(item => item !== query);
    
    // Add to beginning
    this.searchHistory.unshift(query);
    
    // Keep only last 20 searches
    this.searchHistory = this.searchHistory.slice(0, 20);
    
    // Save to storage
    storage.setLocal('search_history', this.searchHistory);
  }

  // Load search history
  loadSearchHistory() {
    this.searchHistory = storage.getLocal('search_history', []);
  }

  // Clear search history
  clearSearchHistory() {
    this.searchHistory = [];
    storage.removeLocal('search_history');
    Utils.showNotification('История поиска очищена', 'success');
  }

  // Get search statistics
  getSearchStats() {
    return {
      totalSearches: this.searchHistory.length,
      recentSearches: this.searchHistory.slice(0, 10),
      currentQuery: this.currentQuery,
      lastSearchResults: {
        parts: this.searchResults.parts.length,
        sets: this.searchResults.sets.length,
        minifigs: this.searchResults.minifigs.length
      }
    };
  }
}

// Create global search instance
window.search = new SearchManager();

// Export for use in other modules
window.SearchManager = SearchManager;
