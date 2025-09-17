// Data loading and management for LEGO Catalog
import { CONFIG } from './config.js';
import { Utils } from './utils.js';

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

  // Fetch text with progress
  async fetchTextWithProgress(url, status, filename) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}: ${response.statusText}`);
      }
      
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;
      
      const reader = response.body.getReader();
      const chunks = [];
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        if (total > 0) {
          const progress = Math.round((loaded / total) * 100);
          this.updateProgress(loaded, total, `${status} (${progress}%)`);
        } else {
          this.updateProgress(loaded, loaded, status);
        }
      }
      
      const chunksAll = new Uint8Array(loaded);
      let position = 0;
      for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }
      
      return new TextDecoder('utf-8').decode(chunksAll);
    } catch (error) {
      Utils.handleError(error, `fetchTextWithProgress(${filename})`);
      throw error;
    }
  }

  // Parse CSV line
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
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
    try {
      const csvText = await this.fetchTextWithProgress(`${CONFIG.DATA_PATH}${CONFIG.CSV_FILES.parts}`, 'Загрузка деталей...', 'parts.csv');
      const lines = csvText.split('\n').slice(1); // Пропускаем заголовок
      
      lines.forEach(line => {
        if (line.trim()) {
          const fields = this.parseCSVLine(line);
          const [part_num, name, part_cat_id] = fields;
          if (part_num && name) {
            const part = {
              id: part_num,
              name: name,
              part_num: part_num,
              part_cat_id: part_cat_id ? parseInt(part_cat_id) : null,
              categoryId: part_cat_id ? parseInt(part_cat_id) : null,
              num_sets: 0,
              part_img_url: null,
              rebrickable_img_url: null
            };
            
            // Проверяем корректность данных
            if (part.categoryId && (part.categoryId < 1 || part.categoryId > 1000)) {
              console.warn('Invalid category ID for part', part_num, ':', part.categoryId);
              part.categoryId = null;
              part.part_cat_id = null;
            }
            
            this.data.parts.set(part_num, part);
          }
        }
      });
      
      console.log(`✅ Загружено ${this.data.parts.size} деталей`);
    } catch (error) {
      console.error('❌ Ошибка загрузки деталей:', error);
      throw error;
    }
  }

  // Load sets
  async loadSets() {
    try {
      const csvText = await this.fetchTextWithProgress(`${CONFIG.DATA_PATH}${CONFIG.CSV_FILES.sets}`, 'Загрузка наборов...', 'sets.csv');
      const lines = csvText.split('\n').slice(1); // Пропускаем заголовок
      
      lines.forEach(line => {
        if (line.trim()) {
          const fields = this.parseCSVLine(line);
          const [set_num, name, year, theme_id, num_parts, img_url] = fields;
          if (set_num && name) {
            // Используем URL изображения из CSV, если доступно, иначе генерируем
            let setImgUrl = img_url || `https://cdn.rebrickable.com/media/sets/${set_num}.jpg`;
            
            // Проверяем URL изображения
            if (setImgUrl && (!setImgUrl.startsWith('http') || setImgUrl.includes('localhost'))) {
              console.warn('Invalid image URL detected for set', set_num, ':', setImgUrl);
              setImgUrl = `https://cdn.rebrickable.com/media/sets/${set_num}.jpg`;
            }
            
            const set = {
              set_num: set_num,
              name: name,
              year: year ? parseInt(year) : null,
              theme_id: theme_id ? parseInt(theme_id) : null,
              num_parts: num_parts ? parseInt(num_parts) : null,
              set_img_url: setImgUrl
            };
            
            // Проверяем корректность данных
            if (set.year && (set.year < 1900 || set.year > 2030)) {
              console.warn('Invalid year for set', set_num, ':', set.year);
              set.year = null;
            }
            
            this.data.sets.set(set_num, set);
          }
        }
      });
      
      console.log(`✅ Загружено ${this.data.sets.size} наборов`);
    } catch (error) {
      console.error('❌ Ошибка загрузки наборов:', error);
      throw error;
    }
  }

  // Load minifigs
  async loadMinifigs() {
    try {
      const csvText = await this.fetchTextWithProgress(`${CONFIG.DATA_PATH}${CONFIG.CSV_FILES.minifigs}`, 'Загрузка минифигурок...', 'minifigs.csv');
      const lines = csvText.split('\n').slice(1); // Пропускаем заголовок
      
      lines.forEach(line => {
        if (line.trim()) {
          const fields = this.parseCSVLine(line);
          const [fig_num, name, num_parts, img_url] = fields;
          if (fig_num && name) {
            // Используем URL изображения из CSV, если доступно, иначе генерируем
            let minifigImgUrl = img_url || `https://cdn.rebrickable.com/media/minifigs/${fig_num}.jpg`;
            
            // Проверяем URL изображения
            if (minifigImgUrl && (!minifigImgUrl.startsWith('http') || minifigImgUrl.includes('localhost'))) {
              console.warn('Invalid image URL detected for minifig', fig_num, ':', minifigImgUrl);
              minifigImgUrl = `https://cdn.rebrickable.com/media/minifigs/${fig_num}.jpg`;
            }
            
            const minifig = {
              fig_num: fig_num,
              name: name,
              num_parts: num_parts ? parseInt(num_parts) : 0,
              img_url: minifigImgUrl
            };
            
            this.data.minifigs.set(fig_num, minifig);
          }
        }
      });
      
      console.log(`✅ Загружено ${this.data.minifigs.size} минифигурок`);
    } catch (error) {
      console.error('❌ Ошибка загрузки минифигурок:', error);
      throw error;
    }
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
      // Load only the files that we know exist (1-6)
      const fileCount = 6; // We know we have files 001-006
      
      console.log(`Loading inventory parts files (1-${fileCount})...`);
      
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
          
          console.log(`Loaded inventory parts file ${fileNum}: ${parts.length} parts`);
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
          // If we get 404, we've reached the end of available files
          if (response.status === 404) {
            break;
          }
        }
      } catch (error) {
        // If there's a network error, stop trying
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
        part.part_num?.toLowerCase() || '',
        part.name?.toLowerCase() || '',
        part.material?.toLowerCase() || ''
      ].join(' ');
      
      this.partSearchIndex.set(partNum, searchTerms);
    });
    
    // Build set search index
    this.setSearchIndex = new Map();
    this.data.sets.forEach((set, setNum) => {
      const searchTerms = [
        set.set_num?.toLowerCase() || '',
        set.name?.toLowerCase() || ''
      ].join(' ');
      
      this.setSearchIndex.set(setNum, searchTerms);
    });
    
    // Build minifig search index
    this.minifigSearchIndex = new Map();
    this.data.minifigs.forEach((minifig, figNum) => {
      const searchTerms = [
        minifig.fig_num?.toLowerCase() || '',
        minifig.name?.toLowerCase() || ''
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
    if (!this.data[type]) return new Map();
    return this.data[type];
  }

  // Get item by ID
  getItem(type, id) {
    if (!this.data[type]) return null;
    return this.data[type].get(id);
  }

  // Get all items as array
  getAllItems(type) {
    if (!this.data[type]) return [];
    return Array.from(this.data[type].values());
  }

  // Get items by category
  getItemsByCategory(type, categoryId) {
    const items = this.getAllItems(type);
    return items.filter(item => 
      (item.categoryId && item.categoryId === categoryId) || 
      (item.themeId && item.themeId === categoryId)
    );
  }

  // Get inventory for set
  getSetInventory(setNum) {
    return {
      parts: this.data.inventoryParts?.get(setNum) || [],
      minifigs: this.data.inventoryMinifigs?.get(setNum) || [],
      sets: this.data.inventorySets?.get(setNum) || []
    };
  }

  // Get related sets for minifig
  getRelatedSets(figNum) {
    const relatedSets = new Set();
    
    if (this.data.inventoryMinifigs) {
      for (const [setNum, minifigs] of this.data.inventoryMinifigs) {
        if (minifigs.some(m => m.figNum === figNum)) {
          relatedSets.add(setNum);
        }
      }
    }
    
    return Array.from(relatedSets).map(setNum => this.data.sets?.get(setNum)).filter(Boolean);
  }

  // Get data statistics
  getStatistics() {
    return {
      colors: this.data.colors?.size || 0,
      parts: this.data.parts?.size || 0,
      sets: this.data.sets?.size || 0,
      minifigs: this.data.minifigs?.size || 0,
      themes: this.data.themes?.size || 0,
      partCategories: this.data.partCategories?.size || 0,
      inventories: this.data.inventories?.size || 0,
      inventorySets: this.data.inventorySets?.size || 0,
      inventoryMinifigs: this.data.inventoryMinifigs?.size || 0,
      inventoryParts: this.data.inventoryParts?.size || 0
    };
  }
}

// Create global data loader instance
const dataLoader = new DataLoader();
window.dataLoader = dataLoader;

// Export for use in other modules
export { dataLoader as DataLoader };
