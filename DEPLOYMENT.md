# Инструкции по развертыванию

## GitHub Pages

### Автоматическое развертывание

1. **Форкните репозиторий**
   - Перейдите на страницу репозитория
   - Нажмите кнопку "Fork" в правом верхнем углу

2. **Включите GitHub Pages**
   - Перейдите в Settings → Pages
   - В разделе "Source" выберите "Deploy from a branch"
   - Выберите ветку "main" и папку "/ (root)"
   - Нажмите "Save"

3. **Настройте домен (опционально)**
   - В файле `CNAME` замените `lego-catalog.example.com` на ваш домен
   - В настройках GitHub Pages добавьте ваш домен

### Ручное развертывание

1. **Клонируйте репозиторий**
```bash
git clone https://github.com/yourusername/lego-catalog.git
cd lego-catalog
```

2. **Добавьте данные**
   - Скопируйте CSV файлы в папку `data/`
   - Добавьте иконки в папку `assets/icons/`

3. **Настройте API ключи**
   - Отредактируйте `assets/js/config.js`
   - Добавьте ваши API ключи Rebrickable

4. **Зафиксируйте изменения**
```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

## Netlify

1. **Подключите репозиторий**
   - Войдите в Netlify
   - Нажмите "New site from Git"
   - Выберите ваш репозиторий

2. **Настройте сборку**
   - Build command: (оставьте пустым)
   - Publish directory: `/`

3. **Добавьте переменные окружения**
   - Site settings → Environment variables
   - Добавьте `REBRICKABLE_API_KEY` с вашим ключом

## Vercel

1. **Установите Vercel CLI**
```bash
npm i -g vercel
```

2. **Разверните проект**
```bash
vercel --prod
```

3. **Настройте переменные окружения**
   - В панели Vercel добавьте переменные
   - `REBRICKABLE_API_KEY` = ваш API ключ

## Firebase Hosting

1. **Установите Firebase CLI**
```bash
npm install -g firebase-tools
```

2. **Инициализируйте проект**
```bash
firebase init hosting
```

3. **Настройте firebase.json**
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

4. **Разверните**
```bash
firebase deploy
```

## Настройка данных

### Добавление CSV файлов

1. **Скачайте данные с Rebrickable**
   - Зарегистрируйтесь на [rebrickable.com](https://rebrickable.com)
   - Скачайте CSV файлы из раздела Downloads

2. **Разместите файлы**
   ```
   data/
   ├── colors.csv
   ├── parts.csv
   ├── sets.csv
   ├── themes.csv
   ├── minifigs.csv
   ├── part_categories.csv
   ├── inventories.csv
   ├── inventory_sets.csv
   ├── inventory_minifigs.csv
   └── inventory_parts_split/
       ├── inventory_parts_part_001.csv
       ├── inventory_parts_part_002.csv
       └── ...
   ```

### Настройка API

1. **Получите API ключ**
   - Зарегистрируйтесь на [rebrickable.com/api](https://rebrickable.com/api)
   - Создайте новый API ключ

2. **Обновите конфигурацию**
   ```javascript
   // assets/js/config.js
   const REBRICKABLE_API_KEYS = [
     'your-api-key-here'
   ];
   ```

## Оптимизация производительности

### Сжатие файлов

1. **Сжатие CSS и JS**
```bash
# Установите minifier
npm install -g clean-css-cli uglify-js

# Сожмите CSS
cleancss -o assets/css/styles.min.css assets/css/styles.css

# Сожмите JS файлы
uglifyjs assets/js/*.js -o assets/js/bundle.min.js
```

2. **Оптимизация изображений**
```bash
# Установите imagemin
npm install -g imagemin-cli

# Сожмите изображения
imagemin assets/icons/*.png --out-dir=assets/icons/optimized/
```

### Кэширование

1. **Настройте HTTP заголовки**
   - Для статических файлов: `Cache-Control: max-age=31536000`
   - Для HTML: `Cache-Control: max-age=3600`

2. **Service Worker**
   - Уже настроен в `service-worker.js`
   - Автоматически кэширует ресурсы

## Мониторинг

### Аналитика

1. **Google Analytics**
   - Добавьте код отслеживания в `index.html`
   - Настройте события в `assets/js/analytics.js`

2. **Встроенная аналитика**
   - Включена по умолчанию
   - Данные хранятся локально

### Ошибки

1. **Sentry (опционально)**
   - Зарегистрируйтесь на [sentry.io](https://sentry.io)
   - Добавьте SDK в `index.html`

2. **Встроенная обработка ошибок**
   - Автоматически логирует ошибки
   - Уведомления пользователю

## Безопасность

### HTTPS

1. **GitHub Pages** - автоматически
2. **Netlify** - автоматически
3. **Vercel** - автоматически
4. **Firebase** - автоматически

### CSP (Content Security Policy)

Добавьте в `index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://cdn.rebrickable.com;
  connect-src 'self' https://rebrickable.com https://api.rebrickable.com;
">
```

## Обновление

### Автоматическое обновление

1. **GitHub Actions** (рекомендуется)
   - Создайте `.github/workflows/deploy.yml`
   - Настройте автоматическое развертывание

2. **Webhook**
   - Настройте webhook для автоматического обновления

### Ручное обновление

1. **Обновите код**
```bash
git pull origin main
```

2. **Обновите данные**
   - Замените CSV файлы в папке `data/`
   - Обновите API ключи при необходимости

3. **Перезапустите приложение**
   - Очистите кэш браузера
   - Обновите Service Worker

## Устранение неполадок

### Частые проблемы

1. **Данные не загружаются**
   - Проверьте правильность путей к CSV файлам
   - Убедитесь, что файлы доступны по HTTPS

2. **API не работает**
   - Проверьте API ключи
   - Убедитесь, что CORS настроен правильно

3. **PWA не устанавливается**
   - Проверьте `manifest.json`
   - Убедитесь, что Service Worker зарегистрирован

4. **Медленная загрузка**
   - Оптимизируйте изображения
   - Включите сжатие на сервере
   - Используйте CDN

### Логи

1. **Консоль браузера**
   - Откройте DevTools → Console
   - Проверьте ошибки JavaScript

2. **Network tab**
   - Проверьте загрузку ресурсов
   - Убедитесь, что все файлы загружаются

3. **Application tab**
   - Проверьте Service Worker
   - Убедитесь, что данные кэшируются

## Поддержка

Если у вас возникли проблемы:

1. Проверьте [Issues](https://github.com/yourusername/lego-catalog/issues)
2. Создайте новый Issue с описанием проблемы
3. Приложите логи и скриншоты

---

**Удачного развертывания! 🚀**
