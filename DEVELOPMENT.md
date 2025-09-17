# 🚀 LEGO Catalog - Development Guide

## Быстрый старт

### 1. Запуск сервера разработки

Выберите один из способов:

#### Windows (Batch файл)
```bash
start-server.bat
```

#### Windows (PowerShell)
```powershell
.\start-server.ps1
```

#### Python (все платформы)
```bash
python start-server.py
```

#### Node.js (если установлен)
```bash
npx http-server -p 8080
```

### 2. Открытие в браузере

После запуска сервера откройте:
- **Главная страница**: http://localhost:8080/
- **Тест модулей**: http://localhost:8080/test-simple.html

## 🔧 Требования

### Минимальные требования
- **Браузер**: Chrome 61+, Firefox 60+, Safari 11+, Edge 79+
- **HTTP-сервер**: Любой (Python, Node.js, Live Server, etc.)

### Рекомендуемые инструменты
- **VS Code** с расширением Live Server
- **Python 3.6+** для встроенного сервера
- **Node.js** для альтернативных серверов

## 📁 Структура проекта

```
Brickful/
├── index.html              # Главная страница
├── test-simple.html        # Тест модулей
├── manifest.json           # PWA манифест
├── service-worker.js       # Service Worker
├── start-server.*          # Скрипты запуска сервера
├── assets/
│   ├── css/
│   │   └── styles.css      # Стили
│   ├── js/
│   │   ├── config.js       # Конфигурация
│   │   ├── utils.js        # Утилиты
│   │   ├── storage.js      # Хранилище
│   │   ├── api.js          # API
│   │   ├── data-loader.js  # Загрузка данных
│   │   ├── ui-components.js # UI компоненты
│   │   ├── search.js       # Поиск
│   │   ├── catalog.js      # Каталог
│   │   ├── collection.js   # Коллекция
│   │   ├── analytics.js    # Аналитика
│   │   └── app.js          # Главное приложение
│   ├── icons/              # Иконки
│   └── images/             # Изображения
└── data/                   # CSV данные
```

## 🐛 Решение проблем

### Проблема: CORS ошибки при открытии файлов
**Решение**: Используйте HTTP-сервер, не открывайте файлы напрямую

### Проблема: Модули не загружаются
**Решение**: 
1. Убедитесь, что используете HTTP-сервер
2. Проверьте консоль браузера на ошибки
3. Убедитесь, что все файлы существуют

### Проблема: Service Worker не работает
**Решение**:
1. Используйте HTTPS или localhost
2. Очистите кэш браузера
3. Проверьте консоль на ошибки

## 🔍 Отладка

### Консоль браузера
1. Откройте DevTools (F12)
2. Перейдите на вкладку Console
3. Проверьте ошибки и предупреждения

### Тестирование модулей
1. Откройте http://localhost:8080/test-simple.html
2. Нажмите "Тест модулей"
3. Проверьте результат

### Проверка Service Worker
1. Откройте DevTools (F12)
2. Перейдите на вкладку Application
3. Выберите Service Workers
4. Проверьте статус

## 📱 Мобильная разработка

### Доступ с мобильного устройства
1. Узнайте IP-адрес компьютера
2. Откройте http://[IP]:8080 на мобильном устройстве
3. Убедитесь, что устройства в одной сети

### Тестирование на мобильных устройствах
- **Chrome DevTools**: F12 → Toggle device toolbar
- **Реальные устройства**: Используйте IP-адрес
- **Эмуляторы**: Android Studio, Xcode

## 🚀 Развертывание

### GitHub Pages
1. Загрузите код в репозиторий
2. Включите GitHub Pages в настройках
3. Выберите ветку main

### Другие хостинги
- **Netlify**: Перетащите папку в Netlify
- **Vercel**: Подключите репозиторий
- **Firebase Hosting**: Используйте Firebase CLI

## 📚 Дополнительные ресурсы

- [MDN Web Docs](https://developer.mozilla.org/)
- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Guide](https://web.dev/progressive-web-apps/)