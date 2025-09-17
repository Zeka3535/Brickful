// Data loading and management for LEGO Catalog

class DataLoader {
  constructor() {
    this.data = {
      colors: new Map(),
      parts: new Map(),
      sets: new Map(),
      minifigs: new Map(),
      themes: new Map(),
      partCategories: new Map(),
      inventories: new Map(),
      inventorySets: new Map(),
      inventoryMinifigs: new Map(),
      inventoryParts: new Map()
    };
    
    this.loadingProgress = {
      total: 0,
      loaded: 0,
      current: ''
    };
    
    this.loadingCallbacks = [];
  }

  // Add loading progress callback
  onProgress(callback) {
    this.loadingCallbacks.push(callback);
  }

  // Update loading progress
  updateProgress(loaded, total, current = '') {
    this.loadingProgress = { loaded, total, current };
    this.loadingCallbacks.forEach(callback => callback(this.loadingProgress));
  }

  // Load CSV file
  async loadCSV(filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      return Utils.csvToJson(csvText);
    } catch (error) {
      Utils.handleError(error, `loadCSV(${filePath})`);
      return [];
    }
  }

  // Load all data
  async loadAllData() {
    this.updateProgress(0, 10, 'Инициализация...');
    
    try {
      // Load basic data first
      await this.loadColors();
      this.updateProgress(1, 10, 'Цвета загружены');
      
      await this.loadThemes();
      this.updateProgress(2, 10, 'Темы загружены');
      
      await this.loadPartCategories();
      this.updateProgress(3, 10, 'Категории деталей загружены');
      
      await this.loadParts();
      this.updateProgress(4, 10, 'Детали загружены');
      
      await this.loadSets();
      this.updateProgress(5, 10, 'Наборы загружены');
      
      await this.loadMinifigs();
      this.updateProgress(6, 10, 'Минифигурки загружены');
      
      await this.loadInventories();
      this.updateProgress(7, 10, 'Инвентари загружены');
      
      await this.loadInventorySets();
      this.updateProgress(8, 10, 'Инвентари наборов загружены');
      
      await this.loadInventoryMinifigs();
      this.updateProgress(9, 10, 'Инвентари минифигурок загружены');
      
      await this.loadInventoryParts();
      this.updateProgress(10, 10, 'Инвентари деталей загружены');
      
      // Build indexes
      this.buildIndexes();
      
      return true;
    } catch (error) {
      Utils.handleError(error, 'loadAllData');
      return false;
    }
  }

  // Load colors
  async loadColors() {
    const colors = await this.loadCSV(`${CONFIG.DATA_PATH}${CONFIG.CSV_FILES.colors}`);
    
    colors.forEach(color => {
      this.data.colors.set(color.id, {
        id: parseInt(color.id),
        name: color.name,
        rgb: color.rgb,
        isTrans: color.is_trans === 'True',
        numParts: parseInt(color.num_parts) || 0,
        numSets: parseInt(color.num_sets) || 0,
        yearFrom: parseInt(color.y1) || 0,
        yearTo: parseInt(color.y2) || 0
      });
    });
  }

  // Load themes
  async loadThemes() {
    const themes = await this.loadCSV(`${CONFIG.DATA_PATH}${CONFIG.CSV_FILES.themes}`);
    
    themes.forEach(theme => {
      this.data.themes.set(theme.id, {
        id: parseInt(theme.id),
        name: theme.name,
        parentId: theme.parent_id ? parseInt(theme.parent_id) : null
      });
    });
  }

  // Load part categories
  async loadPartCategories() {
    const categories = await this.loadCSV(`${CONFIG.DATA_PATH}${CONFIG.CSV_FILES.partCategories}`);
    
    categories.forEach(category => {
      this.data.partCategories.set(category.id, {
        id: parseInt(category.id),
        name: category.name
      });
    });
  }

  // Load parts
  async loadParts() {
    const parts = await this.loadCSV(`${CONFIG.DATA_PATH}${CONFIG.CSV_FILES.parts}`);
    
    parts.forEach(part => {
      this.data.parts.set(part.part_num, {
        partNum: part.part_num,
        name: part.name,
        categoryId: parseInt(part.part_cat_id),
        material: part.part_material
      });
    });
  }

  // Load sets
  async loadSets() {
    const sets = await this.loadCSV(`${CONFIG.DATA_PATH}${CONFIG.CSV_FILES.sets}`);
    
    sets.forEach(set => {
      this.data.sets.set(set.set_num, {
        setNum: set.set_num,
        name: set.name,
        year: parseInt(set.year),
        themeId: parseInt(set.theme_id),
        numParts: parseInt(set.num_parts) || 0,
        imgUrl: set.img_url
      });
    });
  }

  // Load minifigs
  async loadMinifigs() {
    const minifigs = await this.loadCSV(`${CONFIG.DATA_PATH}${CONFIG.CSV_FILES.minifigs}`);
    
    minifigs.forEach(minifig => {
      this.data.minifigs.set(minifig.fig_num, {
        figNum: minifig.fig_num,
        name: minifig.name,
        numParts: parseInt(minifig.num_parts) || 0,
        imgUrl: minifig.img_url
      });
    });
  }

  // Load inventories
  async loadInventories() {
    const inventories = await this.loadCSV(`${CONFIG.DATA_PATH}${CONFIG.CSV_FILES.inventories}`);
    
    inventories.forEach(inventory => {
      this.data.inventories.set(inventory.id, {
        id: parseInt(inventory.id),
        version: parseInt(inventory.version),
        setNum: inventory.set_num
      });
    });
  }

  // Load inventory sets
  async loadInventorySets() {
    const inventorySets = await this.loadCSV(`${CONFIG.DATA_PATH}${CONFIG.CSV_FILES.inventorySets}`);
    
    inventorySets.forEach(invSet => {
      const setId = invSet.set_num;
      if (!this.data.inventorySets.has(setId)) {
        this.data.inventorySets.set(setId, []);
      }
      this.data.inventorySets.get(setId).push({
        inventoryId: parseInt(invSet.inventory_id),
        setNum: invSet.set_num,
        quantity: parseInt(invSet.quantity)
      });
    });
  }

  // Load inventory minifigs
  async loadInventoryMinifigs() {
    const inventoryMinifigs = await this.loadCSV(`${CONFIG.DATA_PATH}${CONFIG.CSV_FILES.inventoryMinifigs}`);
    
    inventoryMinifigs.forEach(invMinifig => {
      const setId = invMinifig.set_num;
      if (!this.data.inventoryMinifigs.has(setId)) {
        this.data.inventoryMinifigs.set(setId, []);
      }
      this.data.inventoryMinifigs.get(setId).push({
        inventoryId: parseInt(invMinifig.inventory_id),
        setNum: invMinifig.set_num,
        figNum: invMinifig.fig_num,
        quantity: parseInt(invMinifig.quantity)
      });
    });
  }

  // Load inventory parts (split files)
  async loadInventoryParts() {
    try {
      // First try to load parts_info.txt to get file count
      const partsInfoResponse = await fetch(`${CONFIG.DATA_PATH}${CONFIG.CSV_FILES.inventoryPartsSplit}parts_info.txt`);
      
      let fileCount = 0;
      if (partsInfoResponse.ok) {
        const partsInfoText = await partsInfoResponse.text();
        const match = partsInfoText.match(/Total files: (\d+)/);
        if (match) {
          fileCount = parseInt(match[1]);
        }
      }
      
      // If no parts_info.txt, try to detect files
      if (fileCount === 0) {
        fileCount = await this.detectInventoryPartsFiles();
      }
      
      if (fileCount === 0) {
        console.warn('No inventory parts files found');
        return;
      }
      
      // Load all parts files
      for (let i = 1; i <= fileCount; i++) {
        const fileNum = i.toString().padStart(3, '0');
        const filePath = `${CONFIG.DATA_PATH}${CONFIG.CSV_FILES.inventoryPartsSplit}inventory_parts_part_${fileNum}.csv`;
        
        try {
          const parts = await this.loadCSV(filePath);
          
          parts.forEach(part => {
            const setId = part.set_num;
            if (!this.data.inventoryParts.has(setId)) {
              this.data.inventoryParts.set(setId, []);
            }
            this.data.inventoryParts.get(setId).push({
              inventoryId: parseInt(part.inventory_id),
              setNum: part.set_num,
              partNum: part.part_num,
              colorId: parseInt(part.color_id),
              quantity: parseInt(part.quantity),
              isSpare: part.is_spare === 't'
            });
          });
        } catch (error) {
          console.warn(`Failed to load inventory parts file ${fileNum}:`, error);
        }
      }
    } catch (error) {
      Utils.handleError(error, 'loadInventoryParts');
    }
  }

  // Detect inventory parts files
  async detectInventoryPartsFiles() {
    let fileCount = 0;
    
    for (let i = 1; i <= 50; i++) {
      const fileNum = i.toString().padStart(3, '0');
      const filePath = `${CONFIG.DATA_PATH}${CONFIG.CSV_FILES.inventoryPartsSplit}inventory_parts_part_${fileNum}.csv`;
      
      try {
        const response = await fetch(filePath, { method: 'HEAD' });
        if (response.ok) {
          fileCount = i;
        } else {
          break;
        }
      } catch (error) {
        break;
      }
    }
    
    return fileCount;
  }

  // Build search indexes
  buildIndexes() {
    // Build part search index
    this.partSearchIndex = new Map();
    this.data.parts.forEach((part, partNum) => {
      const searchTerms = [
        part.partNum.toLowerCase(),
        part.name.toLowerCase(),
        part.material.toLowerCase()
      ].join(' ');
      
      this.partSearchIndex.set(partNum, searchTerms);
    });
    
    // Build set search index
    this.setSearchIndex = new Map();
    this.data.sets.forEach((set, setNum) => {
      const searchTerms = [
        set.setNum.toLowerCase(),
        set.name.toLowerCase()
      ].join(' ');
      
      this.setSearchIndex.set(setNum, searchTerms);
    });
    
    // Build minifig search index
    this.minifigSearchIndex = new Map();
    this.data.minifigs.forEach((minifig, figNum) => {
      const searchTerms = [
        minifig.figNum.toLowerCase(),
        minifig.name.toLowerCase()
      ].join(' ');
      
      this.minifigSearchIndex.set(figNum, searchTerms);
    });
  }

  // Search parts
  searchParts(query, limit = 50) {
    if (!query || !this.partSearchIndex) return [];
    
    const searchQuery = query.toLowerCase();
    const results = [];
    
    for (const [partNum, searchTerms] of this.partSearchIndex) {
      if (searchTerms.includes(searchQuery)) {
        const part = this.data.parts.get(partNum);
        if (part) {
          results.push(part);
        }
      }
    }
    
    return results.slice(0, limit);
  }

  // Search sets
  searchSets(query, limit = 50) {
    if (!query || !this.setSearchIndex) return [];
    
    const searchQuery = query.toLowerCase();
    const results = [];
    
    for (const [setNum, searchTerms] of this.setSearchIndex) {
      if (searchTerms.includes(searchQuery)) {
        const set = this.data.sets.get(setNum);
        if (set) {
          results.push(set);
        }
      }
    }
    
    return results.slice(0, limit);
  }

  // Search minifigs
  searchMinifigs(query, limit = 50) {
    if (!query || !this.minifigSearchIndex) return [];
    
    const searchQuery = query.toLowerCase();
    const results = [];
    
    for (const [figNum, searchTerms] of this.minifigSearchIndex) {
      if (searchTerms.includes(searchQuery)) {
        const minifig = this.data.minifigs.get(figNum);
        if (minifig) {
          results.push(minifig);
        }
      }
    }
    
    return results.slice(0, limit);
  }

  // Get data by type
  getData(type) {
    return this.data[type] || new Map();
  }

  // Get item by ID
  getItem(type, id) {
    return this.data[type]?.get(id);
  }

  // Get all items as array
  getAllItems(type) {
    return Array.from(this.data[type]?.values() || []);
  }

  // Get items by category
  getItemsByCategory(type, categoryId) {
    const items = this.getAllItems(type);
    return items.filter(item => item.categoryId === categoryId || item.themeId === categoryId);
  }

  // Get inventory for set
  getSetInventory(setNum) {
    return {
      parts: this.data.inventoryParts.get(setNum) || [],
      minifigs: this.data.inventoryMinifigs.get(setNum) || [],
      sets: this.data.inventorySets.get(setNum) || []
    };
  }

  // Get related sets for minifig
  getRelatedSets(figNum) {
    const relatedSets = new Set();
    
    for (const [setNum, minifigs] of this.data.inventoryMinifigs) {
      if (minifigs.some(m => m.figNum === figNum)) {
        relatedSets.add(setNum);
      }
    }
    
    return Array.from(relatedSets).map(setNum => this.data.sets.get(setNum)).filter(Boolean);
  }

  // Get data statistics
  getStatistics() {
    return {
      colors: this.data.colors.size,
      parts: this.data.parts.size,
      sets: this.data.sets.size,
      minifigs: this.data.minifigs.size,
      themes: this.data.themes.size,
      partCategories: this.data.partCategories.size,
      inventories: this.data.inventories.size,
      inventorySets: this.data.inventorySets.size,
      inventoryMinifigs: this.data.inventoryMinifigs.size,
      inventoryParts: this.data.inventoryParts.size
    };
  }
}

// Create global data loader instance
window.dataLoader = new DataLoader();

// Export for use in other modules
window.DataLoader = DataLoader;
