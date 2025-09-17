# Инструкция по переносу файлов

## Необходимо скопировать следующие файлы:

### 1. Иконки (в папку `assets/icons/`)
Из папки `каталог-lego OLD/` скопируйте:
- `favicon.ico`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png`
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`

### 2. Изображения (в папку `assets/images/`)
Из папки `каталог-lego OLD/` скопируйте:
- `ogimage.png`

### 3. Данные (в папку `data/`)
Из папки `каталог-lego OLD/Data/` скопируйте всю папку `Data` целиком:
- `colors.csv`
- `elements.csv`
- `inventories.csv`
- `inventory_minifigs.csv`
- `inventory_sets.csv`
- `minifigs.csv`
- `part_categories.csv`
- `part_relationships.csv`
- `parts.csv`
- `sets.csv`
- `themes.csv`
- `inventory_parts_split/` (всю папку)

## После копирования файлов:

1. **Запустите локальный сервер** (обязательно!):
   ```bash
   # Python 3
   python -m http.server 8080
   
   # Или Node.js
   npx serve -p 8080
   ```

2. **Откройте в браузере**: `http://localhost:8080`

3. **НЕ открывайте файл напрямую** (`file://`) - это вызовет ошибки CORS!

## Структура должна выглядеть так:

```
lego-catalog/
├── assets/
│   ├── icons/
│   │   ├── favicon.ico
│   │   ├── favicon-16x16.png
│   │   ├── favicon-32x32.png
│   │   ├── apple-touch-icon.png
│   │   ├── android-chrome-192x192.png
│   │   └── android-chrome-512x512.png
│   └── images/
│       └── ogimage.png
├── data/
│   ├── colors.csv
│   ├── parts.csv
│   ├── sets.csv
│   ├── themes.csv
│   ├── minifigs.csv
│   ├── part_categories.csv
│   ├── inventories.csv
│   ├── inventory_sets.csv
│   ├── inventory_minifigs.csv
│   └── inventory_parts_split/
│       ├── inventory_parts_part_001.csv
│       ├── inventory_parts_part_002.csv
│       └── ...
└── index.html
```

## Важно!

- **Обязательно запускайте через локальный сервер** - иначе будут ошибки CORS
- Файлы должны быть в правильных папках
- После копирования перезапустите сервер
