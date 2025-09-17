# Инструкции по развертыванию

## GitHub Pages

### 1. Подготовка репозитория

1. Создайте новый репозиторий на GitHub
2. Клонируйте репозиторий локально:
```bash
git clone https://github.com/yourusername/lego-catalog.git
cd lego-catalog
```

3. Скопируйте все файлы проекта в папку репозитория

### 2. Настройка GitHub Pages

1. Перейдите в настройки репозитория (Settings)
2. Найдите раздел "Pages" в боковом меню
3. В разделе "Source" выберите "Deploy from a branch"
4. Выберите ветку "main" и папку "/ (root)"
5. Нажмите "Save"

### 3. Настройка домена (опционально)

1. Создайте файл `CNAME` в корне репозитория
2. Добавьте ваш домен в файл:
```
yourdomain.com
```

3. Настройте DNS записи для вашего домена:
   - CNAME: `www` -> `yourusername.github.io`
   - A: `@` -> `185.199.108.153`
   - A: `@` -> `185.199.109.153`
   - A: `@` -> `185.199.110.153`
   - A: `@` -> `185.199.111.153`

### 4. Загрузка изменений

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

## Netlify

### 1. Подготовка

1. Создайте аккаунт на [Netlify](https://netlify.com)
2. Подключите ваш GitHub репозиторий

### 2. Настройка сборки

- **Build command**: (оставьте пустым)
- **Publish directory**: `/`
- **Base directory**: (оставьте пустым)

### 3. Переменные окружения

Добавьте переменные окружения в настройках сайта:
- `REBRICKABLE_API_KEY`: ваш API ключ
- `NODE_ENV`: production

## Vercel

### 1. Подготовка

1. Создайте аккаунт на [Vercel](https://vercel.com)
2. Подключите ваш GitHub репозиторий

### 2. Настройка

- **Framework Preset**: Other
- **Root Directory**: ./
- **Build Command**: (оставьте пустым)
- **Output Directory**: ./

## Firebase Hosting

### 1. Установка Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Инициализация проекта

```bash
firebase login
firebase init hosting
```

### 3. Настройка firebase.json

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

### 4. Развертывание

```bash
firebase deploy
```

## Локальный сервер

### 1. Python

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### 2. Node.js

```bash
# Установка serve
npm install -g serve

# Запуск сервера
serve . -p 8000
```

### 3. PHP

```bash
php -S localhost:8000
```

## Проверка развертывания

После развертывания проверьте:

1. ✅ Главная страница загружается
2. ✅ Сайдбар работает
3. ✅ Поиск функционирует
4. ✅ Переключение между разделами работает
5. ✅ PWA функции работают (установка как приложение)
6. ✅ Адаптивный дизайн работает на мобильных устройствах

## Устранение проблем

### Проблема: 404 ошибки для файлов

**Решение**: Убедитесь, что все файлы загружены в репозиторий и пути указаны корректно.

### Проблема: CORS ошибки

**Решение**: Используйте HTTPS для продакшена и настройте правильные CORS заголовки.

### Проблема: PWA не работает

**Решение**: Проверьте, что manifest.json и service-worker.js доступны по HTTPS.

### Проблема: Данные не загружаются

**Решение**: Убедитесь, что CSV файлы скопированы в папку assets/data/ и доступны по правильным путям.

## Мониторинг

Рекомендуется настроить мониторинг для отслеживания:

- Доступности сайта
- Производительности загрузки
- Ошибок JavaScript
- Использования API

Популярные сервисы:
- [UptimeRobot](https://uptimerobot.com)
- [Pingdom](https://pingdom.com)
- [Google Analytics](https://analytics.google.com)
