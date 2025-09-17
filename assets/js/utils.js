// Utility functions for LEGO Catalog

// Debounce function
function debounce(func, wait, immediate) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// Throttle function
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Format number with thousands separator
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Deep clone object
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

// Merge objects deeply
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}

// Check if value is empty
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// Sanitize HTML
function sanitizeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Escape regex special characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Highlight search terms in text
function highlightSearch(text, searchTerm) {
  if (!searchTerm || !text) return text;
  
  const escapedTerm = escapeRegex(searchTerm);
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// Get color from RGB hex
function getColorFromHex(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// Calculate color brightness
function getBrightness(hex) {
  const { r, g, b } = getColorFromHex(hex);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

// Get contrasting text color
function getContrastColor(hex) {
  return getBrightness(hex) > 128 ? '#000000' : '#ffffff';
}

// Format date
function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return new Intl.DateTimeFormat('ru-RU', { ...defaultOptions, ...options }).format(date);
}

// Format relative time
function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} дн. назад`;
  if (hours > 0) return `${hours} ч. назад`;
  if (minutes > 0) return `${minutes} мин. назад`;
  return 'только что';
}

// Validate email
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Get file extension
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// Parse CSV line
function parseCSVLine(line) {
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

// Convert CSV to JSON
function csvToJson(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = parseCSVLine(lines[0]);
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      result.push(obj);
    }
  }
  
  return result;
}

// Convert JSON to CSV
function jsonToCsv(jsonData, headers = null) {
  if (jsonData.length === 0) return '';
  
  const csvHeaders = headers || Object.keys(jsonData[0]);
  const csvLines = [csvHeaders.join(',')];
  
  jsonData.forEach(row => {
    const values = csvHeaders.map(header => {
      const value = row[header] || '';
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    });
    csvLines.push(values.join(','));
  });
  
  return csvLines.join('\n');
}

// Download file
function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Copy to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

// Show notification
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
    type === 'success' ? 'bg-green-600' :
    type === 'error' ? 'bg-red-600' :
    type === 'warning' ? 'bg-yellow-600' :
    'bg-blue-600'
  } text-white`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);
}

// Error handler
function handleError(error, context = '') {
  console.error(`Error in ${context}:`, error);
  
  if (CONFIG.ANALYTICS.enabled && window.analytics) {
    // Track error in analytics
    window.analytics.trackEvent('error', {
      context,
      message: error.message,
      stack: error.stack
    });
  }
  
  showNotification(`Ошибка: ${error.message}`, 'error');
}

// Performance measurement
function measurePerformance(name, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (CONFIG.ANALYTICS.trackPerformance) {
    console.log(`${name} took ${end - start} milliseconds`);
  }
  
  return result;
}

// Export functions
const Utils = {
  debounce,
  throttle,
  formatNumber,
  formatFileSize,
  generateId,
  deepClone,
  deepMerge,
  isEmpty,
  sanitizeHtml,
  escapeRegex,
  highlightSearch,
  getColorFromHex,
  getBrightness,
  getContrastColor,
  formatDate,
  formatRelativeTime,
  isValidEmail,
  isValidUrl,
  getFileExtension,
  parseCSVLine,
  csvToJson,
  jsonToCsv,
  downloadFile,
  copyToClipboard,
  showNotification,
  handleError,
  measurePerformance
};

// Make available globally for backward compatibility
window.Utils = Utils;

// Export for use in other modules
export { Utils };
