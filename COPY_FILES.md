# Инструкции по копированию файлов

## Необходимые файлы для полной функциональности

### 1. Иконки (assets/icons/)
Скопируйте следующие файлы из папки `каталог-lego OLD/`:
- `apple-touch-icon.png`
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `favicon.ico`

### 2. Изображения (assets/images/)
Скопируйте следующие файлы из папки `каталог-lego OLD/`:
- `ogimage.png`

### 3. Данные (assets/data/)
Скопируйте всю папку `Data/` из `каталог-lego OLD/` в `assets/data/`:
- `colors.csv`
- `elements.csv`
- `inventories.csv`
- `inventory_minifigs.csv`
- `inventory_parts_split/` (вся папка)
- `inventory_sets.csv`
- `minifigs.csv`
- `part_categories.csv`
- `part_relationships.csv`
- `parts.csv`
- `sets.csv`
- `themes.csv`

### 4. Минифигурки (assets/images/minifigs/)
Скопируйте папку `Minifig_png/` из `каталог-lego OLD/` в `assets/images/minifigs/`

## Команды для копирования

### Windows (PowerShell)
```powershell
# Создание папок
New-Item -ItemType Directory -Path "assets\icons" -Force
New-Item -ItemType Directory -Path "assets\images" -Force
New-Item -ItemType Directory -Path "assets\data" -Force
New-Item -ItemType Directory -Path "assets\images\minifigs" -Force

# Копирование иконок
Copy-Item "каталог-lego OLD\*.png" "assets\icons\"
Copy-Item "каталог-lego OLD\favicon.ico" "assets\icons\"

# Копирование изображений
Copy-Item "каталог-lego OLD\ogimage.png" "assets\images\"

# Копирование данных
Copy-Item "каталог-lego OLD\Data\*" "assets\data\" -Recurse

# Копирование минифигурок
Copy-Item "каталог-lego OLD\Minifig_png\*" "assets\images\minifigs\" -Recurse
```

### Linux/macOS (Bash)
```bash
# Создание папок
mkdir -p assets/icons
mkdir -p assets/images
mkdir -p assets/data
mkdir -p assets/images/minifigs

# Копирование иконок
cp "каталог-lego OLD"/*.png assets/icons/
cp "каталог-lego OLD"/favicon.ico assets/icons/

# Копирование изображений
cp "каталог-lego OLD"/ogimage.png assets/images/

# Копирование данных
cp -r "каталог-lego OLD"/Data/* assets/data/

# Копирование минифигурок
cp -r "каталог-lego OLD"/Minifig_png/* assets/images/minifigs/
```

## Проверка

После копирования убедитесь, что структура папок выглядит так:

```
assets/
├── icons/
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   └── favicon.ico
├── images/
│   ├── ogimage.png
│   └── minifigs/
│       ├── fig-1.png
│       ├── fig-2.png
│       └── ...
└── data/
    ├── colors.csv
    ├── elements.csv
    ├── inventories.csv
    ├── inventory_minifigs.csv
    ├── inventory_parts_split/
    │   ├── inventory_parts_part_001.csv
    │   ├── inventory_parts_part_002.csv
    │   └── ...
    ├── inventory_sets.csv
    ├── minifigs.csv
    ├── part_categories.csv
    ├── part_relationships.csv
    ├── parts.csv
    ├── sets.csv
    └── themes.csv
```

## Примечания

- Убедитесь, что все файлы скопированы корректно
- Проверьте, что размеры файлов соответствуют ожидаемым
- После копирования запустите приложение и проверьте загрузку данных