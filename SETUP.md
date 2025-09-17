# Инструкции по настройке

## Быстрый старт

### 1. Клонирование и настройка

```bash
# Клонируйте репозиторий
git clone https://github.com/yourusername/lego-catalog.git
cd lego-catalog

# Скопируйте необходимые файлы (см. COPY_FILES.md)
# Запустите локальный сервер
python -m http.server 8000
```

### 2. Открытие в браузере

Перейдите по адресу: `http://localhost:8000`

## Подробная настройка

### 1. Настройка API ключей

Отредактируйте файл `assets/js/config.js`:

```javascript
export const REBRICKABLE_API_KEYS = [
  'YOUR_REBRICKABLE_API_KEY_1',
  'YOUR_REBRICKABLE_API_KEY_2',
];
```

**Как получить API ключ:**
1. Зарегистрируйтесь на [Rebrickable](https://rebrickable.com/)
2. Перейдите в раздел API
3. Создайте новый API ключ
4. Скопируйте ключ в конфигурацию

### 2. Настройка данных

Убедитесь, что скопированы все CSV файлы в папку `assets/data/`:

- `colors.csv` - цвета LEGO
- `parts.csv` - детали
- `sets.csv` - наборы
- `minifigs.csv` - минифигурки
- `themes.csv` - темы
- `inventory_*.csv` - инвентари
- `inventory_parts_split/` - разделенные файлы инвентаря

### 3. Настройка изображений

Скопируйте изображения в соответствующие папки:

- `assets/icons/` - иконки приложения
- `assets/images/` - общие изображения
- `assets/images/minifigs/` - изображения минифигурок

### 4. Настройка PWA

Файл `manifest.json` уже настроен, но вы можете изменить:

- `name` - название приложения
- `short_name` - короткое название
- `description` - описание
- `theme_color` - цвет темы
- `background_color` - цвет фона

### 5. Настройка домена

Для настройки собственного домена:

1. Отредактируйте файл `CNAME`:
```
yourdomain.com
```

2. Настройте DNS записи:
   - CNAME: `www` -> `yourusername.github.io`
   - A: `@` -> `185.199.108.153`

## Настройка для разработки

### 1. Установка зависимостей

```bash
# Node.js (опционально)
npm install

# Python (рекомендуется)
python --version
```

### 2. Настройка IDE

Рекомендуемые расширения для VS Code:

- **Tailwind CSS IntelliSense** - автодополнение для Tailwind
- **HTML CSS Support** - поддержка CSS в HTML
- **JavaScript (ES6) code snippets** - сниппеты для JS
- **Live Server** - локальный сервер
- **Prettier** - форматирование кода

### 3. Настройка линтеров

```bash
# Установка линтеров
npm install -g htmlhint stylelint eslint

# Проверка кода
htmlhint index.html
stylelint assets/css/styles.css
eslint assets/js/*.js
```

## Настройка для продакшена

### 1. Оптимизация изображений

```bash
# Установка imagemin
npm install -g imagemin-cli

# Оптимизация PNG
imagemin assets/images/*.png --out-dir=assets/images/optimized

# Оптимизация JPG
imagemin assets/images/*.jpg --out-dir=assets/images/optimized
```

### 2. Минификация кода

```bash
# Установка минификаторов
npm install -g clean-css-cli uglify-js

# Минификация CSS
clean-css-cli -o assets/css/styles.min.css assets/css/styles.css

# Минификация JS
uglify-js assets/js/app.js -o assets/js/app.min.js
```

### 3. Настройка HTTPS

Для работы PWA необходим HTTPS:

1. **GitHub Pages**: автоматически предоставляет HTTPS
2. **Netlify**: автоматически предоставляет HTTPS
3. **Vercel**: автоматически предоставляет HTTPS
4. **Собственный сервер**: настройте SSL сертификат

## Настройка аналитики

### 1. Google Analytics

Добавьте в `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 2. Yandex Metrica

Добавьте в `index.html`:

```html
<!-- Yandex Metrica -->
<script type="text/javascript">
   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
   m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

   ym(METRICA_ID, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true
   });
</script>
```

## Настройка уведомлений

### 1. Push уведомления

Добавьте в `service-worker.js`:

```javascript
// Обработка push уведомлений
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/assets/icons/android-chrome-192x192.png',
    badge: '/assets/icons/favicon-32x32.png'
  };

  event.waitUntil(
    self.registration.showNotification('LEGO Catalog', options)
  );
});
```

### 2. Уведомления о обновлениях

Добавьте в `app.js`:

```javascript
// Проверка обновлений
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (confirm('Доступно обновление. Перезагрузить страницу?')) {
      window.location.reload();
    }
  });
}
```

## Настройка кэширования

### 1. Service Worker

Настройте кэширование в `service-worker.js`:

```javascript
const CACHE_NAME = 'lego-catalog-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/css/styles.css',
  '/assets/js/app.js',
  // ... другие файлы
];
```

### 2. HTTP заголовки

Для собственного сервера настройте заголовки:

```apache
# .htaccess
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

## Мониторинг и отладка

### 1. Логирование

Включите отладку в `config.js`:

```javascript
export const DEBUG_MODE = true;
```

### 2. Мониторинг ошибок

Добавьте в `app.js`:

```javascript
// Отслеживание ошибок
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Отправка на сервер мониторинга
});
```

### 3. Производительность

Используйте DevTools для анализа:

- **Performance** - профилирование производительности
- **Memory** - анализ использования памяти
- **Network** - анализ загрузки ресурсов

## Безопасность

### 1. CSP заголовки

Добавьте в `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:;">
```

### 2. Защита API ключей

- Не коммитьте API ключи в репозиторий
- Используйте переменные окружения
- Ограничьте доступ к API ключам

### 3. Валидация данных

```javascript
// Валидация пользовательского ввода
function validateInput(input) {
  if (typeof input !== 'string') return false;
  if (input.length > 1000) return false;
  return /^[a-zA-Z0-9\s\-_]+$/.test(input);
}
```

## Резервное копирование

### 1. Автоматическое резервное копирование

```javascript
// В service-worker.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'backup-sync') {
    event.waitUntil(backupData());
  }
});

async function backupData() {
  const data = await getStoredData();
  await sendToBackupServer(data);
}
```

### 2. Экспорт данных

```javascript
// Экспорт коллекции
function exportCollection() {
  const data = {
    parts: S.coll,
    sets: S.setColl,
    minifigs: S.minifigColl,
    timestamp: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lego-collection-backup.json';
  a.click();
}
```

## Обновление

### 1. Обновление данных

```javascript
// Проверка обновлений данных
async function checkDataUpdates() {
  const lastUpdate = localStorage.getItem('lastDataUpdate');
  const currentDate = new Date().toISOString().split('T')[0];
  
  if (lastUpdate !== currentDate) {
    await updateData();
    localStorage.setItem('lastDataUpdate', currentDate);
  }
}
```

### 2. Миграция данных

```javascript
// Миграция данных при обновлении
function migrateData() {
  const version = localStorage.getItem('dataVersion') || '1.0.0';
  
  if (version < '2.0.0') {
    // Миграция с версии 1.x на 2.x
    migrateFromV1ToV2();
  }
  
  localStorage.setItem('dataVersion', '2.0.0');
}
```
