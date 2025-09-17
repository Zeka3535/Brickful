import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import csv
import re
from bs4 import BeautifulSoup
import os
from pathlib import Path
import pandas as pd
import requests
import time
from typing import Dict, List, Optional, Tuple

class RebrickableAPI:
    """Класс для работы с данными Rebrickable"""
    
    def __init__(self, data_dir: str = "Data"):
        self.data_dir = Path(data_dir)
        self.parts_df = None
        self.colors_df = None
        self.sets_df = None
        self.minifigs_df = None
        self.elements_df = None
        self.part_categories_df = None
        self.themes_df = None
        self.load_data()
    
    def load_data(self):
        """Загрузка CSV данных Rebrickable"""
        try:
            # Загружаем основные таблицы
            self.parts_df = pd.read_csv(self.data_dir / "parts.csv")
            self.colors_df = pd.read_csv(self.data_dir / "colors.csv")
            self.sets_df = pd.read_csv(self.data_dir / "sets.csv")
            self.minifigs_df = pd.read_csv(self.data_dir / "minifigs.csv")
            self.elements_df = pd.read_csv(self.data_dir / "elements.csv")
            self.part_categories_df = pd.read_csv(self.data_dir / "part_categories.csv")
            self.themes_df = pd.read_csv(self.data_dir / "themes.csv")
            
            print("Данные Rebrickable успешно загружены")
        except Exception as e:
            print(f"Ошибка загрузки данных Rebrickable: {e}")
            # Создаем пустые DataFrame если файлы не найдены
            self.parts_df = pd.DataFrame()
            self.colors_df = pd.DataFrame()
            self.sets_df = pd.DataFrame()
            self.minifigs_df = pd.DataFrame()
            self.elements_df = pd.DataFrame()
            self.part_categories_df = pd.DataFrame()
            self.themes_df = pd.DataFrame()
    
    def search_part(self, part_num: str) -> Optional[Dict]:
        """Поиск детали по номеру"""
        if self.parts_df.empty:
            return None
        
# print(f"DEBUG: Поиск детали по номеру: '{part_num}'")
        
        # Точное совпадение
        part = self.parts_df[self.parts_df['part_num'] == part_num]
        if not part.empty:
            part_data = part.iloc[0]
# print(f"DEBUG: ✓ Точное совпадение найдено: {part_data['part_num']}")
            return {
                'part_num': part_data['part_num'],
                'name': part_data['name'],
                'part_cat_id': part_data['part_cat_id'],
                'part_cat_name': self.get_part_category_name(part_data['part_cat_id'])
            }
        
        # Поиск по частичному совпадению (если номер содержит цифры)
        if part_num.isdigit():
            # Ищем детали, которые содержат этот номер
            part = self.parts_df[self.parts_df['part_num'].str.contains(part_num, na=False)]
            if not part.empty:
                part_data = part.iloc[0]
                print(f"DEBUG: ✓ Частичное совпадение найдено: {part_data['part_num']} содержит {part_num}")
                return {
                    'part_num': part_data['part_num'],
                    'name': part_data['name'],
                    'part_cat_id': part_data['part_cat_id'],
                    'part_cat_name': self.get_part_category_name(part_data['part_cat_id'])
                }
        
        # Поиск по похожим номерам (убираем лишние символы)
        clean_part_num = re.sub(r'[^a-zA-Z0-9]', '', part_num)
        if clean_part_num != part_num:
            part = self.parts_df[self.parts_df['part_num'] == clean_part_num]
            if not part.empty:
                part_data = part.iloc[0]
                print(f"DEBUG: ✓ Очищенный номер найден: '{clean_part_num}' -> {part_data['part_num']}")
                return {
                    'part_num': part_data['part_num'],
                    'name': part_data['name'],
                    'part_cat_id': part_data['part_cat_id'],
                    'part_cat_name': self.get_part_category_name(part_data['part_cat_id'])
                }
        
        # Поиск по альтернативным форматам (например, SW0578 -> sw0578)
        if part_num.isupper():
            lower_part_num = part_num.lower()
            part = self.parts_df[self.parts_df['part_num'] == lower_part_num]
            if not part.empty:
                part_data = part.iloc[0]
                print(f"DEBUG: ✓ Нижний регистр найден: '{lower_part_num}' -> {part_data['part_num']}")
                return {
                    'part_num': part_data['part_num'],
                    'name': part_data['name'],
                    'part_cat_id': part_data['part_cat_id'],
                    'part_cat_name': self.get_part_category_name(part_data['part_cat_id'])
                }
        
        # Поиск по цифровой части (например, SW0578 -> 0578)
        if not part_num.isdigit():
            digits = re.findall(r'\d+', part_num)
            if digits:
                for digit in digits:
                    if len(digit) >= 3:  # Ищем цифры длиной от 3 символов
                        part = self.parts_df[self.parts_df['part_num'].str.contains(digit, na=False)]
                        if not part.empty:
                            part_data = part.iloc[0]
                            print(f"DEBUG: ✓ Цифровая часть найдена: '{digit}' в {part_data['part_num']}")
                            return {
                                'part_num': part_data['part_num'],
                                'name': part_data['name'],
                                'part_cat_id': part_data['part_cat_id'],
                                'part_cat_name': self.get_part_category_name(part_data['part_cat_id'])
                            }
        
        # НОВЫЙ: Поиск по похожим номерам (например, 18860 -> 18680, 18861, 18862)
        if part_num.isdigit() and len(part_num) >= 4:
            # Ищем номера с похожими цифрами (замена одной цифры)
            for i in range(len(part_num)):
                for digit in '0123456789':
                    if digit != part_num[i]:
                        similar_num = part_num[:i] + digit + part_num[i+1:]
                        part = self.parts_df[self.parts_df['part_num'] == similar_num]
                        if not part.empty:
                            part_data = part.iloc[0]
                            print(f"DEBUG: ✓ Похожий номер найден: '{part_num}' -> '{similar_num}' -> {part_data['part_num']}")
                            return {
                                'part_num': part_data['part_num'],
                                'name': part_data['name'],
                                'part_cat_id': part_data['part_cat_id'],
                                'part_cat_name': self.get_part_category_name(part_data['part_cat_id'])
                            }
        
        # НОВЫЙ: Поиск по номерам с перестановкой цифр
        if part_num.isdigit() and len(part_num) >= 4:
            # Ищем номера с перестановкой соседних цифр
            for i in range(len(part_num) - 1):
                swapped_num = part_num[:i] + part_num[i+1] + part_num[i] + part_num[i+2:]
                part = self.parts_df[self.parts_df['part_num'] == swapped_num]
                if not part.empty:
                    part_data = part.iloc[0]
                    print(f"DEBUG: ✓ Перестановка цифр найдена: '{part_num}' -> '{swapped_num}' -> {part_data['part_num']}")
                    return {
                        'part_num': part_data['part_num'],
                        'name': part_data['name'],
                        'part_cat_id': part_data['part_cat_id'],
                        'part_cat_name': self.get_part_category_name(part_data['part_cat_id'])
                    }
        
        print(f"DEBUG: ✗ Деталь не найдена: '{part_num}'")
        return None
    
    def search_set(self, set_num: str) -> Optional[Dict]:
        """Поиск набора по номеру"""
        if self.sets_df.empty:
            return None
        
        # Точное совпадение
        set_data = self.sets_df[self.sets_df['set_num'] == set_num]
        if not set_data.empty:
            set_info = set_data.iloc[0]
            return {
                'set_num': set_info['set_num'],
                'name': set_info['name'],
                'theme_id': set_info['theme_id'],
                'theme_name': self.get_theme_name(set_info['theme_id']),
                'year': set_info['year'],
                'num_parts': set_info['num_parts']
            }
        
        # Поиск по частичному совпадению (если номер содержит цифры)
        if set_num.isdigit():
            # Ищем наборы, которые содержат этот номер
            set_data = self.sets_df[self.sets_df['set_num'].str.contains(set_num, na=False)]
            if not set_data.empty:
                set_info = set_data.iloc[0]
                return {
                    'set_num': set_info['set_num'],
                    'name': set_info['name'],
                    'theme_id': set_info['theme_id'],
                    'theme_name': self.get_theme_name(set_info['theme_id']),
                    'year': set_info['year'],
                    'num_parts': set_info['num_parts']
                }
        
        # Поиск по похожим номерам (убираем лишние символы)
        clean_set_num = re.sub(r'[^a-zA-Z0-9]', '', set_num)
        if clean_set_num != set_num:
            set_data = self.sets_df[self.sets_df['set_num'] == clean_set_num]
            if not set_data.empty:
                set_info = set_data.iloc[0]
                return {
                    'set_num': set_info['set_num'],
                    'name': set_info['name'],
                    'theme_id': set_info['theme_id'],
                    'theme_name': self.get_theme_name(set_info['theme_id']),
                    'year': set_info['year'],
                    'num_parts': set_info['num_parts']
                }
        
        # Поиск по альтернативным форматам (например, SW0578 -> sw0578)
        if set_num.isupper():
            lower_set_num = set_num.lower()
            set_data = self.sets_df[self.sets_df['set_num'] == lower_set_num]
            if not set_data.empty:
                set_info = set_data.iloc[0]
                return {
                    'set_num': set_info['set_num'],
                    'name': set_info['name'],
                    'theme_id': set_info['theme_id'],
                    'theme_name': self.get_theme_name(set_info['theme_id']),
                    'year': set_info['year'],
                    'num_parts': set_info['num_parts']
                }
        
        # Поиск по цифровой части (например, SW0578 -> 0578)
        if not set_num.isdigit():
            digits = re.findall(r'\d+', set_num)
            if digits:
                for digit in digits:
                    if len(digit) >= 3:  # Ищем цифры длиной от 3 символов
                        set_data = self.sets_df[self.sets_df['set_num'].str.contains(digit, na=False)]
                        if not set_data.empty:
                            set_info = set_data.iloc[0]
                            return {
                                'set_num': set_info['set_num'],
                                'name': set_info['name'],
                                'theme_id': set_info['theme_id'],
                                'theme_name': self.get_theme_name(set_info['theme_id']),
                                'year': set_info['year'],
                                'num_parts': set_info['num_parts']
                            }
        
        return None
    
    def search_minifig(self, fig_num: str) -> Optional[Dict]:
        """Поиск минифигурки по номеру"""
        if self.minifigs_df.empty:
            return None
        
        # Точное совпадение
        minifig = self.minifigs_df[self.minifigs_df['fig_num'] == fig_num]
        if not minifig.empty:
            fig_data = minifig.iloc[0]
            return {
                'fig_num': fig_data['fig_num'],
                'name': fig_data['name'],
                'num_parts': fig_data['num_parts']
            }
        
        # Поиск по частичному совпадению (если номер содержит цифры)
        if fig_num.isdigit():
            # Ищем минифигурки, которые содержат этот номер
            minifig = self.minifigs_df[self.minifigs_df['fig_num'].str.contains(fig_num, na=False)]
            if not minifig.empty:
                fig_data = minifig.iloc[0]
                return {
                    'fig_num': fig_data['fig_num'],
                    'name': fig_data['name'],
                    'num_parts': fig_data['num_parts']
                }
        
        # Поиск по похожим номерам (убираем лишние символы)
        clean_fig_num = re.sub(r'[^a-zA-Z0-9]', '', fig_num)
        if clean_fig_num != fig_num:
            minifig = self.minifigs_df[self.minifigs_df['fig_num'] == clean_fig_num]
            if not minifig.empty:
                fig_data = minifig.iloc[0]
                return {
                    'fig_num': fig_data['fig_num'],
                    'name': fig_data['name'],
                    'num_parts': fig_data['num_parts']
                }
        
        # Поиск по альтернативным форматам (например, SW0578 -> sw0578)
        if fig_num.isupper():
            lower_fig_num = fig_num.lower()
            minifig = self.minifigs_df[self.minifigs_df['fig_num'] == lower_fig_num]
            if not minifig.empty:
                fig_data = minifig.iloc[0]
                return {
                    'fig_num': fig_data['fig_num'],
                    'name': fig_data['name'],
                    'num_parts': fig_data['num_parts']
                }
        
        # Поиск по цифровой части (например, SW0578 -> 0578)
        if not fig_num.isdigit():
            digits = re.findall(r'\d+', fig_num)
            if digits:
                for digit in digits:
                    if len(digit) >= 3:  # Ищем цифры длиной от 3 символов
                        minifig = self.minifigs_df[self.minifigs_df['fig_num'].str.contains(digit, na=False)]
                        if not minifig.empty:
                            fig_data = minifig.iloc[0]
                            return {
                                'fig_num': fig_data['fig_num'],
                                'name': fig_data['name'],
                                'num_parts': fig_data['num_parts']
                            }
        
        return None
    
    def search_color(self, color_name: str) -> Optional[Dict]:
        """Поиск цвета по названию"""
        if self.colors_df.empty:
            return None
        
        # Нормализуем название цвета для поиска
        color_name_lower = color_name.lower().strip()
        
        # Русско-английские соответствия для цветов
        color_mappings = {
            'красный': 'red',
            'синий': 'blue',
            'зеленый': 'green',
            'желтый': 'yellow',
            'черный': 'black',
            'белый': 'white',
            'серый': 'gray',
            'оранжевый': 'orange',
            'фиолетовый': 'purple',
            'розовый': 'pink',
            'коричневый': 'brown',
            'голубой': 'light blue',
            'светло-зеленый': 'light green',
            'темно-синий': 'dark blue',
            'темно-красный': 'dark red',
            'светло-серый': 'light gray',
            'темно-серый': 'dark gray',
            'золотой': 'gold',
            'серебряный': 'silver',
            'прозрачный': 'transparent',
            'прозрачно-красный': 'transparent red',
            'прозрачно-синий': 'transparent blue',
            'прозрачно-зеленый': 'transparent green',
            'прозрачно-желтый': 'transparent yellow',
            'прозрачно-оранжевый': 'transparent orange',
            'прозрачно-фиолетовый': 'transparent purple',
            'прозрачно-розовый': 'transparent pink',
            'прозрачно-коричневый': 'transparent brown',
            'прозрачно-голубой': 'transparent light blue',
            'прозрачно-светло-зеленый': 'transparent light green',
            'прозрачно-темно-синий': 'transparent dark blue',
            'прозрачно-темно-красный': 'transparent dark red',
            'прозрачно-светло-серый': 'transparent light gray',
            'прозрачно-темно-серый': 'transparent dark gray',
            'прозрачно-золотой': 'transparent gold',
            'прозрачно-серебряный': 'transparent silver',
            # Дополнительные вариации
            'красн': 'red',
            'син': 'blue',
            'зелен': 'green',
            'желт': 'yellow',
            'черн': 'black',
            'бел': 'white',
            'сер': 'gray',
            'оранж': 'orange',
            'фиолет': 'purple',
            'розов': 'pink',
            'коричнев': 'brown',
            'голуб': 'light blue',
            'золот': 'gold',
            'серебр': 'silver',
            'прозрачн': 'transparent',
            # Английские варианты
            'red': 'red',
            'blue': 'blue',
            'green': 'green',
            'yellow': 'yellow',
            'black': 'black',
            'white': 'white',
            'gray': 'gray',
            'orange': 'orange',
            'purple': 'purple',
            'pink': 'pink',
            'brown': 'brown',
            'gold': 'gold',
            'silver': 'silver',
            'trans': 'transparent',
            'transparent': 'transparent',
            # Дополнительные английские вариации
            'light': 'light',
            'dark': 'dark',
            'bright': 'bright',
            'pale': 'pale',
            'neon': 'neon',
            'metallic': 'metallic',
            'pearl': 'pearl',
            'chrome': 'chrome',
            'copper': 'copper',
            'brass': 'brass',
            'bronze': 'bronze',
            'steel': 'steel',
            'aluminum': 'aluminum',
            'titanium': 'titanium',
            'platinum': 'platinum',
            'ivory': 'ivory',
            'cream': 'cream',
            'beige': 'beige',
            'tan': 'tan',
            'olive': 'olive',
            'lime': 'lime',
            'teal': 'teal',
            'turquoise': 'turquoise',
            'navy': 'navy',
            'maroon': 'maroon',
            'burgundy': 'burgundy',
            'crimson': 'crimson',
            'scarlet': 'scarlet',
            'coral': 'coral',
            'salmon': 'salmon',
            'peach': 'peach',
            'apricot': 'apricot',
            'amber': 'amber',
            'indigo': 'indigo',
            'violet': 'violet',
            'lavender': 'lavender',
            'magenta': 'magenta',
            'fuchsia': 'fuchsia',
            'cyan': 'cyan',
            'aqua': 'aqua',
            'azure': 'azure',
            'cobalt': 'cobalt',
            'ultramarine': 'ultramarine',
            'emerald': 'emerald',
            'jade': 'jade',
            'forest': 'forest',
            'mint': 'mint',
            'sage': 'sage',
            'khaki': 'khaki',
            'sand': 'sand',
            'wheat': 'wheat',
            'champagne': 'champagne',
            'rose': 'rose',
            'blush': 'blush',
            'mauve': 'mauve',
            'taupe': 'taupe',
            'charcoal': 'charcoal',
            'slate': 'slate',
            'gunmetal': 'gunmetal'
        }
        
        # Сначала ищем точное совпадение
        color = self.colors_df[self.colors_df['name'].str.lower() == color_name_lower]
        if not color.empty:
            color_data = color.iloc[0]
            return {
                'id': color_data['id'],
                'name': color_data['name']
            }
        
        # Ищем по русско-английским соответствиям
        if color_name_lower in color_mappings:
            english_color = color_mappings[color_name_lower]
            color = self.colors_df[self.colors_df['name'].str.lower() == english_color.lower()]
            if not color.empty:
                color_data = color.iloc[0]
                return {
                    'id': color_data['id'],
                    'name': color_data['name']
                }
        
        # Ищем частичное совпадение
        color = self.colors_df[self.colors_df['name'].str.lower().str.contains(color_name_lower, na=False)]
        if not color.empty:
            color_data = color.iloc[0]
            return {
                'id': color_data['id'],
                'name': color_data['name']
            }
        
        # Ищем по английским названиям из соответствий
        for russian, english in color_mappings.items():
            if color_name_lower in russian or russian in color_name_lower:
                color = self.colors_df[self.colors_df['name'].str.lower() == english.lower()]
                if not color.empty:
                    color_data = color.iloc[0]
                    return {
                        'id': color_data['id'],
                        'name': color_data['name']
                    }
        
        # Поиск по частичному совпадению в названиях цветов
        for word in color_name_lower.split():
            if len(word) > 2:
                # Ищем цвета, содержащие это слово
                color = self.colors_df[self.colors_df['name'].str.lower().str.contains(word, na=False)]
                if not color.empty:
                    color_data = color.iloc[0]
                    return {
                        'id': color_data['id'],
                        'name': color_data['name']
                    }
        
        # НОВЫЙ: Поиск по комбинации слов (например, "light blue" -> "light blue")
        if ' ' in color_name_lower:
            words = color_name_lower.split()
            if len(words) >= 2:
                # Пробуем найти по комбинации слов
                for i in range(len(words) - 1):
                    for j in range(i + 1, len(words)):
                        if len(words[i]) > 2 and len(words[j]) > 2:
                            combined_search = f"{words[i]} {words[j]}"
                            color = self.colors_df[self.colors_df['name'].str.lower().str.contains(combined_search, na=False)]
                            if not color.empty:
                                color_data = color.iloc[0]
                                return {
                                    'id': color_data['id'],
                                    'name': color_data['name']
                                }
        
        # НОВЫЙ: Поиск по началу названия цвета
        for word in color_name_lower.split():
            if len(word) > 3:
                # Ищем цвета, название которых начинается с этого слова
                color = self.colors_df[self.colors_df['name'].str.lower().str.startswith(word, na=False)]
                if not color.empty:
                    color_data = color.iloc[0]
                    return {
                        'id': color_data['id'],
                        'name': color_data['name']
                    }
        
        # НОВЫЙ: Поиск по похожим названиям (fuzzy search)
        for word in color_name_lower.split():
            if len(word) > 3:
                # Ищем цвета с похожими названиями
                for _, color_row in self.colors_df.iterrows():
                    color_name = str(color_row['name']).lower()
                    # Проверяем, содержит ли название цвета наше слово или похожее
                    if word in color_name or any(similar in color_name for similar in [word[:-1], word + 's', word + 'y', word + 'ish']):
                        return {
                            'id': color_row['id'],
                            'name': color_row['name']
                        }
        
        return None
    
    def get_part_category_name(self, category_id: int) -> str:
        """Получение названия категории детали"""
        if self.part_categories_df.empty or pd.isna(category_id):
            return ""
        
        category = self.part_categories_df[self.part_categories_df['id'] == category_id]
        if not category.empty:
            return category.iloc[0]['name']
        return ""
    
    def get_theme_name(self, theme_id: int) -> str:
        """Получение названия темы набора"""
        if self.themes_df.empty or pd.isna(theme_id):
            return ""
        
        theme = self.themes_df[self.themes_df['id'] == theme_id]
        if not theme.empty:
            return theme.iloc[0]['name']
        return ""
    
    def search_part_by_name(self, item_name: str) -> Optional[Dict]:
        """Поиск детали по названию товара"""
        if self.parts_df.empty:
            return None
        
        print(f"DEBUG: Поиск детали по названию: '{item_name}'")
        
        # Нормализуем название для поиска
        name_lower = item_name.lower().strip()
        
        # Убираем лишние слова и символы
        clean_name = re.sub(r'[^\w\s]', ' ', item_name)
        words = [word for word in clean_name.split() if len(word) > 2]
        
        # Сортируем слова по длине (более длинные слова более значимы)
        words.sort(key=len, reverse=True)
        
        print(f"DEBUG: Ключевые слова для поиска: {words}")
        
        # Ищем детали, содержащие ключевые слова
        for word in words:
            if len(word) > 3:  # Ищем только значимые слова
                # Поиск по частичному совпадению в названии
                parts = self.parts_df[self.parts_df['name'].str.lower().str.contains(word, na=False)]
                if not parts.empty:
                    # Берем первую найденную деталь
                    part_data = parts.iloc[0]
                    print(f"DEBUG: ✓ Найдена деталь по ключевому слову '{word}': {part_data['part_num']} - {part_data['name']}")
                    return {
                        'part_num': part_data['part_num'],
                        'name': part_data['name'],
                        'part_cat_id': part_data['part_cat_id'],
                        'part_cat_name': self.get_part_category_name(part_data['part_cat_id'])
                    }
        
        # Если не найдено по отдельным словам, пробуем найти по комбинации слов
        if len(words) >= 2:
            # Ищем детали, содержащие несколько ключевых слов
            for i in range(len(words) - 1):
                for j in range(i + 1, len(words)):
                    if len(words[i]) > 3 and len(words[j]) > 3:
                        combined_search = f"{words[i]} {words[j]}"
                        parts = self.parts_df[self.parts_df['name'].str.lower().str.contains(combined_search, na=False)]
                        if not parts.empty:
                            part_data = parts.iloc[0]
                            print(f"DEBUG: ✓ Найдена деталь по комбинации '{combined_search}': {part_data['part_num']} - {part_data['name']}")
                            return {
                                'part_num': part_data['part_num'],
                                'name': part_data['name'],
                                'part_cat_id': part_data['part_cat_id'],
                                'part_cat_name': self.get_part_category_name(part_data['part_cat_id'])
                            }
        
        # НОВЫЙ: Поиск по частичному совпадению в начале названия
        for word in words:
            if len(word) > 4:  # Ищем только длинные слова
                # Ищем детали, название которых начинается с этого слова
                parts = self.parts_df[self.parts_df['name'].str.lower().str.startswith(word, na=False)]
                if not parts.empty:
                    part_data = parts.iloc[0]
                    print(f"DEBUG: ✓ Найдена деталь по началу названия '{word}': {part_data['part_num']} - {part_data['name']}")
                    return {
                        'part_num': part_data['part_num'],
                        'name': part_data['name'],
                        'part_cat_id': part_data['part_cat_id'],
                        'part_cat_name': self.get_part_category_name(part_data['part_cat_id'])
                    }
        
        print(f"DEBUG: ✗ Деталь не найдена по названию: '{item_name}'")
        return None
    
    def search_set_by_name(self, item_name: str) -> Optional[Dict]:
        """Поиск набора по названию товара"""
        if self.sets_df.empty:
            return None
        
        # Нормализуем название для поиска
        name_lower = item_name.lower().strip()
        
        # Убираем лишние слова и символы
        clean_name = re.sub(r'[^\w\s]', ' ', item_name)
        words = [word for word in clean_name.split() if len(word) > 2]
        
        # Ищем наборы, содержащие ключевые слова
        for word in words:
            if len(word) > 3:  # Ищем только значимые слова
                # Поиск по частичному совпадению в названии
                sets = self.sets_df[self.sets_df['name'].str.lower().str.contains(word, na=False)]
                if not sets.empty:
                    # Берем первый найденный набор
                    set_data = sets.iloc[0]
                    return {
                        'set_num': set_data['set_num'],
                        'name': set_data['name'],
                        'theme_id': set_data['theme_id'],
                        'theme_name': self.get_theme_name(set_data['theme_id']),
                        'year': set_data['year'],
                        'num_parts': set_data['num_parts']
                    }
        
        return None
    
    def search_minifig_by_name(self, item_name: str) -> Optional[Dict]:
        """Поиск минифигурки по названию товара"""
        if self.minifigs_df.empty:
            return None
        
        # Нормализуем название для поиска
        name_lower = item_name.lower().strip()
        
        # Убираем лишние слова и символы
        clean_name = re.sub(r'[^\w\s]', ' ', item_name)
        words = [word for word in clean_name.split() if len(word) > 2]
        
        # Ищем минифигурки, содержащие ключевые слова
        for word in words:
            if len(word) > 3:  # Ищем только значимые слова
                # Поиск по частичному совпадению в названии
                minifigs = self.minifigs_df[self.minifigs_df['name'].str.lower().str.contains(word, na=False)]
                if not minifigs.empty:
                    # Берем первую найденную минифигурку
                    fig_data = minifigs.iloc[0]
                    return {
                        'fig_num': fig_data['fig_num'],
                        'name': fig_data['name'],
                        'num_parts': fig_data['num_parts']
                    }
        
        return None

class OrderParser:
    def __init__(self, root):
        self.root = root
        self.root.title("Парсер заказов LEGO с API Rebrickable")
        self.root.geometry("1000x800")
        
        # Переменные
        self.input_file = tk.StringVar()
        self.output_file = tk.StringVar()
        self.parsed_data = []
        self.rebrickable_api = None
        
        # Проверка доступности PIL
        self.pil_available = self.check_pil_availability()
        
        self.setup_ui()
    
    def check_pil_availability(self):
        """Проверка доступности PIL/Pillow для обработки изображений"""
        try:
            import PIL
            return True
        except ImportError:
            print("PIL/Pillow не установлен. Изображения не будут загружены.")
            return False
        
    def setup_ui(self):
        # Главный фрейм
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Конфигурация сетки
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        
        # Увеличиваем размер окна
        self.root.geometry("1400x900")
        
                # Заголовок с красивым дизайном
        header_frame = ttk.Frame(main_frame, style="Header.TFrame")
        header_frame.grid(row=0, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 20))
        
        title_label = ttk.Label(header_frame, text="🧱 Парсер заказов LEGO", 
                               font=("Arial", 24, "bold"), foreground="white")
        title_label.pack(pady=15)
        
        subtitle_label = ttk.Label(header_frame, text="с API Rebrickable", 
                                   font=("Arial", 16), foreground="white")
        subtitle_label.pack(pady=(0, 15))
        
        # Описание
        desc_label = ttk.Label(header_frame, text="Программа извлекает данные из HTML заказов, обогащает их данными Rebrickable\nи формирует CSV файлы для импорта в каталог LEGO\n\nНазвания товаров автоматически заменяются на официальные из базы Rebrickable", 
                               font=("Arial", 11), foreground="white", justify="center")
        desc_label.pack(pady=(0, 20))
        
        # Панель управления файлами
        file_frame = ttk.LabelFrame(main_frame, text="📁 Управление файлами", padding="15")
        file_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 20))
        
        # Выбор входного файла
        input_frame = ttk.Frame(file_frame)
        input_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(input_frame, text="HTML файл заказа:", font=("Arial", 10, "bold")).pack(anchor=tk.W)
        input_entry_frame = ttk.Frame(input_frame)
        input_entry_frame.pack(fill=tk.X, pady=(5, 0))
        
        ttk.Entry(input_entry_frame, textvariable=self.input_file, font=("Arial", 10)).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        ttk.Button(input_entry_frame, text="🔍 Обзор", command=self.browse_input_file, 
                  style="Action.TButton").pack(side=tk.RIGHT)
        
        # Выбор выходного файла
        output_frame = ttk.Frame(file_frame)
        output_frame.pack(fill=tk.X)
        
        ttk.Label(output_frame, text="Выходной CSV файл:", font=("Arial", 10, "bold")).pack(anchor=tk.W)
        output_entry_frame = ttk.Frame(output_frame)
        output_entry_frame.pack(fill=tk.X, pady=(5, 0))
        
        ttk.Entry(output_entry_frame, textvariable=self.output_file, font=("Arial", 10)).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        ttk.Button(output_entry_frame, text="💾 Обзор", command=self.browse_output_file, 
                  style="Action.TButton").pack(side=tk.RIGHT)
        
        # Кнопки действий
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=2, column=0, columnspan=3, pady=20)
        
        ttk.Button(button_frame, text="🚀 Парсить заказ", command=self.parse_order, 
                  style="Primary.TButton").pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="🔧 Обогатить данными", command=self.enrich_with_rebrickable, 
                  state="disabled", style="Secondary.TButton").pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="📊 Экспорт в CSV", command=self.export_to_csv, 
                  state="disabled", style="Success.TButton").pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="🗑️ Очистить", command=self.clear_data, 
                  style="Danger.TButton").pack(side=tk.LEFT, padx=5)
        
        # Переключатель режимов отображения
        view_frame = ttk.Frame(main_frame)
        view_frame.grid(row=3, column=0, columnspan=3, pady=(0, 15))
        
        ttk.Label(view_frame, text="Режим отображения:", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=(0, 10))
        
        self.view_mode = tk.StringVar(value="cards")
        ttk.Radiobutton(view_frame, text="🃏 Карточки", variable=self.view_mode, 
                       value="cards", command=self.switch_view_mode).pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(view_frame, text="📋 Таблица", variable=self.view_mode, 
                       value="table", command=self.switch_view_mode).pack(side=tk.LEFT, padx=5)
        
        # Контейнер для результатов
        self.results_container = ttk.Frame(main_frame)
        self.results_container.grid(row=4, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 20))
        
        # Настройка веса строк для результатов
        main_frame.rowconfigure(4, weight=1)
        
        # Создание Treeview для отображения данных (скрыт по умолчанию)
        columns = ("Название", "Номер", "Количество", "Цвет", "Тип", "Статус API")
        self.tree = ttk.Treeview(self.results_container, columns=columns, show="headings", height=20)
        
        # Настройка заголовков колонок с большими размерами
        for col in columns:
            self.tree.heading(col, text=col)
            if col == "Название":
                self.tree.column(col, width=400, minwidth=300)
            else:
                self.tree.column(col, width=200, minwidth=150)
        
        # Скроллбары для таблицы
        v_scrollbar = ttk.Scrollbar(self.results_container, orient=tk.VERTICAL, command=self.tree.yview)
        h_scrollbar = ttk.Scrollbar(self.results_container, orient=tk.HORIZONTAL, command=self.tree.xview)
        self.tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        # Canvas для карточек с большим размером
        self.canvas = tk.Canvas(self.results_container, bg="white", width=1200, height=600)
        self.card_frame = ttk.Frame(self.canvas)
        
        # Скроллбары для карточек
        self.v_scrollbar_cards = ttk.Scrollbar(self.results_container, orient=tk.VERTICAL, command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=self.v_scrollbar_cards.set)
        
        # Статус
        self.status_var = tk.StringVar()
        self.status_var.set("Готов к работе")
        status_label = ttk.Label(main_frame, textvariable=self.status_var, 
                                font=("Arial", 10, "bold"), foreground="#2E86AB")
        status_label.grid(row=5, column=0, columnspan=3, pady=(10, 0))
        
        # Информация о PIL
        if not self.pil_available:
            pil_info_label = ttk.Label(main_frame, 
                                      text="⚠️ PIL/Pillow не установлен. Изображения не будут загружены. Установите: pip install Pillow", 
                                      font=("Arial", 9), foreground="#E74C3C")
            pil_info_label.grid(row=6, column=0, columnspan=3, pady=(5, 0))
        
        # Информация о формате CSV
        info_frame = ttk.LabelFrame(main_frame, text="📋 Формат CSV для импорта", padding="15")
        info_frame.grid(row=7, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(20, 0))
        
        info_text = """CSV файл содержит полную информацию: type, id, quantity, name, part_cat_id, part_cat_name, color_id, color_name, set_theme_id, set_theme_name, set_year, set_num_parts, minifig_num_parts

• Все поля заполняются автоматически из данных Rebrickable
• Названия товаров заменяются на официальные из базы Rebrickable
• Номера деталей/наборов извлекаются из названий
• Цвета сопоставляются с базой Rebrickable
• Категории и темы определяются автоматически"""
        
        info_label = ttk.Label(info_frame, text=info_text, font=("Arial", 9), foreground="#2E8B57", justify="left")
        info_label.pack()
        
        # Инициализация режима отображения
        self.current_view_mode = "cards"
        self.setup_styles()
        self.show_cards_view()
    
    def setup_styles(self):
        """Настройка стилей для красивого интерфейса"""
        style = ttk.Style()
        
        # Основные стили
        style.configure("Header.TFrame", background="#2E86AB", relief="flat")
        
        # Стили для кнопок с современными цветами
        style.configure("Primary.TButton", 
                       background="#007BFF", 
                       foreground="white",
                       borderwidth=0,
                       focuscolor="none",
                       font=("Arial", 10, "bold"))
        style.configure("Secondary.TButton", 
                       background="#6C757D", 
                       foreground="white",
                       borderwidth=0,
                       focuscolor="none",
                       font=("Arial", 10, "bold"))
        style.configure("Success.TButton", 
                       background="#28A745", 
                       foreground="white",
                       borderwidth=0,
                       focuscolor="none",
                       font=("Arial", 10, "bold"))
        style.configure("Danger.TButton", 
                       background="#DC3545", 
                       foreground="white",
                       borderwidth=0,
                       focuscolor="none",
                       font=("Arial", 10, "bold"))
        style.configure("Action.TButton", 
                       background="#17A2B8", 
                       foreground="white",
                       borderwidth=0,
                       focuscolor="none",
                       font=("Arial", 10, "bold"))
        
        # Стили для карточек с современным дизайном
        style.configure("Card.TFrame", 
                       background="white", 
                       relief="flat", 
                       borderwidth=1,
                       bordercolor="#E9ECEF")
        style.configure("CardHeader.TFrame", 
                       background="#F8F9FA", 
                       relief="flat",
                       bordercolor="#DEE2E6")
        style.configure("CardBody.TFrame", 
                       background="white", 
                       relief="flat")
        style.configure("CardFooter.TFrame", 
                       background="#F8F9FA", 
                       relief="flat",
                       bordercolor="#DEE2E6")
    
    def switch_view_mode(self):
        """Переключение между режимами отображения"""
        new_mode = self.view_mode.get()
        if new_mode != self.current_view_mode:
            self.current_view_mode = new_mode
            if new_mode == "cards":
                self.show_cards_view()
            else:
                self.show_table_view()
    
    def show_cards_view(self):
        """Показать представление карточками"""
        # Скрываем таблицу
        self.tree.grid_remove()
        
        # Показываем canvas с карточками
        self.canvas.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 10))
        self.v_scrollbar_cards.grid(row=0, column=1, sticky=(tk.N, tk.S))
        
        # Настраиваем веса для canvas
        self.results_container.columnconfigure(0, weight=1)
        self.results_container.rowconfigure(0, weight=1)
        
        # Обновляем карточки если есть данные
        if hasattr(self, 'parsed_data') and self.parsed_data:
            self.update_cards_display()
    
    def show_table_view(self):
        """Показать табличное представление"""
        # Скрываем canvas с карточками
        self.canvas.grid_remove()
        self.v_scrollbar_cards.grid_remove()
        
        # Показываем таблицу
        self.tree.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 10))
        
        # Настраиваем веса для таблицы
        self.results_container.columnconfigure(0, weight=1)
        self.results_container.rowconfigure(0, weight=1)
    
    def update_cards_display(self):
        """Обновить отображение карточек"""
        # Очищаем старые карточки
        for widget in self.card_frame.winfo_children():
            widget.destroy()
        
        if not self.parsed_data:
            return
        
        # Создаем карточки для каждого товара
        for i, item in enumerate(self.parsed_data):
            card = self.create_item_card(item, i)
            card.pack(fill=tk.X, padx=10, pady=5)
        
        # Настраиваем canvas
        self.canvas.create_window((0, 0), window=self.card_frame, anchor="nw")
        self.card_frame.update_idletasks()
        
        # Настраиваем прокрутку
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))
    
    def create_item_card(self, item, index):
        """Создать карточку товара"""
        card = ttk.Frame(self.card_frame, style="Card.TFrame")
        
        # Заголовок карточки
        header = ttk.Frame(card, style="CardHeader.TFrame")
        header.pack(fill=tk.X, padx=15, pady=(15, 0))
        
        # Левая часть заголовка с изображением
        left_header = ttk.Frame(header)
        left_header.pack(side=tk.LEFT, fill=tk.Y)
        
        # Загружаем изображение
        image_loaded = False
        part_num = item.get('part_number', '')
        item_type = item.get('type', 'part')
        
        if part_num and part_num != 'UNKNOWN':
            if item_type == 'part':
                photo = self.load_part_image(part_num)
            elif item_type == 'set':
                photo = self.load_set_image(part_num)
            else:
                photo = None
            
            if photo:
                # Создаем Label для изображения
                image_label = ttk.Label(left_header, image=photo)
                image_label.image = photo  # Сохраняем ссылку
                image_label.pack(side=tk.LEFT, padx=(0, 15))
                image_loaded = True
        
        # Если изображение не загружено, показываем иконку
        if not image_loaded:
            type_icon = self.get_type_icon(item_type)
            icon_label = ttk.Label(left_header, text=type_icon, font=("Arial", 24), 
                                 foreground="#007BFF")
            icon_label.pack(side=tk.LEFT, padx=(0, 15))
        
        # Центральная часть заголовка
        center_header = ttk.Frame(header)
        center_header.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        # Название товара
        name = item.get('name', 'Без названия')
        if len(name) > 80:
            name = name[:80] + "..."
        
        name_label = ttk.Label(center_header, text=name, font=("Arial", 14, "bold"), 
                              foreground="#2C3E50", wraplength=600)
        name_label.pack(anchor=tk.W, pady=(0, 5))
        
        # Номер детали/набора
        if part_num and part_num != 'UNKNOWN':
            part_label = ttk.Label(center_header, text=f"🔢 Номер: {part_num}", 
                                 font=("Arial", 11), foreground="#7F8C8D")
            part_label.pack(anchor=tk.W)
        
        # Правая часть заголовка
        right_header = ttk.Frame(header)
        right_header.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Статус обогащения
        status = "Не обогащено"
        status_color = "#E74C3C"
        if item.get('part_info') or item.get('set_info') or item.get('minifig_info'):
            status = "✓ Обогащено"
            status_color = "#27AE60"
        
        status_label = ttk.Label(right_header, text=status, font=("Arial", 11, "bold"), 
                                foreground=status_color)
        status_label.pack(anchor=tk.NE, pady=(0, 10))
        
        # Тело карточки
        body = ttk.Frame(card, style="CardBody.TFrame")
        body.pack(fill=tk.X, padx=15, pady=15)
        
        # Информация о товаре в две колонки
        info_frame = ttk.Frame(body)
        info_frame.pack(fill=tk.X)
        
        # Левая колонка
        left_col = ttk.Frame(info_frame)
        left_col.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        # Количество
        quantity = item.get('quantity', '1')
        ttk.Label(left_col, text=f"📦 Количество: {quantity}", 
                 font=("Arial", 11), foreground="#34495E").pack(anchor=tk.W, pady=3)
        
        # Тип товара
        type_text = {'part': 'Деталь', 'set': 'Набор', 'minifig': 'Минифигурка'}.get(item_type, 'Деталь')
        ttk.Label(left_col, text=f"🏷️ Тип: {type_text}", 
                 font=("Arial", 11), foreground="#34495E").pack(anchor=tk.W, pady=3)
        
        # Цвет
        color = item.get('color', '')
        if color:
            ttk.Label(left_col, text=f"🎨 Цвет: {color}", 
                     font=("Arial", 11), foreground="#34495E").pack(anchor=tk.W, pady=3)
        
        # Правая колонка
        right_col = ttk.Frame(info_frame)
        right_col.pack(side=tk.RIGHT, fill=tk.X, expand=True)
        
        # API информация
        if item.get('part_info'):
            part_info = item['part_info']
            ttk.Label(right_col, text=f"📚 Категория: {part_info.get('part_cat_name', '')}", 
                     font=("Arial", 11), foreground="#34495E").pack(anchor=tk.W, pady=3)
        elif item.get('set_info'):
            set_info = item['set_info']
            ttk.Label(right_col, text=f"🎭 Тема: {set_info.get('theme_name', '')}", 
                     font=("Arial", 11), foreground="#34495E").pack(anchor=tk.W, pady=3)
            ttk.Label(right_col, text=f"📅 Год: {set_info.get('year', '')}", 
                     font=("Arial", 11), foreground="#34495E").pack(anchor=tk.W, pady=3)
        elif item.get('minifig_info'):
            minifig_info = item['minifig_info']
            ttk.Label(right_col, text=f"🧩 Деталей: {minifig_info.get('num_parts', '')}", 
                     font=("Arial", 11), foreground="#34495E").pack(anchor=tk.W, pady=3)
        
        # Подвал карточки
        footer = ttk.Frame(card, style="CardFooter.TFrame")
        footer.pack(fill=tk.X, padx=15, pady=(0, 15))
        
        # Кнопки действий
        button_frame = ttk.Frame(footer)
        button_frame.pack(side=tk.RIGHT)
        
        # Кнопка редактирования
        edit_btn = ttk.Button(button_frame, text="✏️ Редактировать", 
                             style="Action.TButton", command=lambda: self.edit_item(index))
        edit_btn.pack(side=tk.LEFT, padx=5)
        
        # Кнопка удаления
        delete_btn = ttk.Button(button_frame, text="🗑️ Удалить", 
                               style="Danger.TButton", command=lambda: self.delete_item(index))
        delete_btn.pack(side=tk.LEFT, padx=5)
        
        return card
    
    def get_type_icon(self, item_type):
        """Получить иконку для типа товара"""
        icons = {
            'part': '🧱',
            'set': '📦',
            'minifig': '👤'
        }
        return icons.get(item_type, '🧱')
    
    def load_part_image(self, part_num):
        """Загрузка изображения детали из API"""
        # Проверяем доступность PIL
        if not self.pil_available:
            return None
            
        try:
            # URL для изображения детали из Rebrickable
            image_url = f"https://img.rebrickable.com/part_img/parts/{part_num}.jpg"
            
            # Загружаем изображение
            response = requests.get(image_url, timeout=10)
            if response.status_code == 200:
                # Конвертируем в PhotoImage для tkinter
                try:
                    from PIL import Image, ImageTk
                    import io
                    
                    image_data = io.BytesIO(response.content)
                    pil_image = Image.open(image_data)
                    
                    # Изменяем размер для карточки
                    pil_image = pil_image.resize((80, 80), Image.Resampling.LANCZOS)
                    
                    # Конвертируем в PhotoImage
                    photo = ImageTk.PhotoImage(pil_image)
                    return photo
                except ImportError:
                    print("PIL/Pillow не установлен. Изображения не будут загружены.")
                    return None
            else:
                return None
        except Exception as e:
            print(f"Ошибка загрузки изображения для {part_num}: {e}")
            return None
    
    def load_set_image(self, set_num):
        """Загрузка изображения набора из API"""
        # Проверяем доступность PIL
        if not self.pil_available:
            return None
            
        try:
            # URL для изображения набора из Rebrickable
            image_url = f"https://img.rebrickable.com/sets/{set_num}.jpg"
            
            response = requests.get(image_url, timeout=10)
            if response.status_code == 200:
                try:
                    from PIL import Image, ImageTk
                    import io
                    
                    image_data = io.BytesIO(response.content)
                    pil_image = Image.open(image_data)
                    pil_image = pil_image.resize((80, 80), Image.Resampling.LANCZOS)
                    
                    photo = ImageTk.PhotoImage(pil_image)
                    return photo
                except ImportError:
                    print("PIL/Pillow не установлен. Изображения не будут загружены.")
                    return None
            else:
                return None
        except Exception as e:
            print(f"Ошибка загрузки изображения набора {set_num}: {e}")
            return None
    
    def edit_item(self, index):
        """Редактировать товар (заглушка)"""
        messagebox.showinfo("Редактирование", f"Редактирование товара {index + 1} (функция в разработке)")
    
    def delete_item(self, index):
        """Удалить товар (заглушка)"""
        if messagebox.askyesno("Удаление", f"Удалить товар {index + 1}?"):
            del self.parsed_data[index]
            self.update_cards_display()
            self.update_table_display()
        
    def browse_input_file(self):
        filename = filedialog.askopenfilename(
            title="Выберите HTML файл заказа",
            filetypes=[("HTML файлы", "*.html"), ("Все файлы", "*.*")]
        )
        if filename:
            self.input_file.set(filename)
            # Автоматически предлагаем имя для выходного файла
            input_path = Path(filename)
            output_path = input_path.parent / f"{input_path.stem}_lego_import_api.csv"
            self.output_file.set(str(output_path))
    
    def browse_output_file(self):
        filename = filedialog.asksaveasfilename(
            title="Сохранить CSV файл для импорта",
            defaultextension=".csv",
            filetypes=[("CSV файлы", "*.csv"), ("Все файлы", "*.*")]
        )
        if filename:
            self.output_file.set(filename)
    
    def parse_order(self):
        if not self.input_file.get():
            messagebox.showerror("Ошибка", "Выберите HTML файл заказа")
            return
        
        try:
            self.status_var.set("Парсинг файла...")
            self.root.update()
            
            with open(self.input_file.get(), 'r', encoding='utf-8') as file:
                html_content = file.read()
            
            # Парсинг HTML
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Поиск раздела "Содержимое заказа"
            order_content = soup.find('h3', string=lambda text: text and 'Содержимое заказа' in text)
            
            if not order_content:
                messagebox.showerror("Ошибка", "Раздел 'Содержимое заказа' не найден в файле")
                return
            
            # Поиск всех товаров в заказе
            items = []
            order_section = order_content.find_parent('div', class_='sale-order-detail-payment-options-order-content')
            
            if order_section:
                # Поиск всех строк с товарами
                item_rows = order_section.find_all('div', class_='sale-order-detail-order-item-tr')
                
                for row in item_rows:
                    if 'sale-order-detail-order-basket-info' in row.get('class', []):
                        item_data = self.extract_item_data(row)
                        if item_data:
                            items.append(item_data)
            
            self.parsed_data = items
            
            # Очистка таблицы
            for item in self.tree.get_children():
                self.tree.delete(item)
            
            # Заполнение таблицы
            for item in items:
                self.tree.insert('', 'end', values=(
                    item.get('name', '')[:50] + "..." if len(item.get('name', '')) > 50 else item.get('name', ''),
                    item.get('part_number', 'UNKNOWN'),
                    item.get('quantity', ''),
                    item.get('color', ''),
                    item.get('type', ''),
                    "Не обогащено"
                ))
            
            # Обновляем карточки если включен режим карточек
            if self.current_view_mode == "cards":
                self.update_cards_display()
            
            self.status_var.set(f"Найдено товаров: {len(items)}")
            
            # Активация кнопки обогащения
            # Ищем кнопку по переменной view_mode
            for child in self.root.winfo_children():
                if isinstance(child, ttk.Frame):
                    for button in child.winfo_children():
                        if isinstance(button, ttk.Frame):
                            for btn in button.winfo_children():
                                if isinstance(btn, ttk.Button) and btn.cget('text') == "🔧 Обогатить данными":
                                    btn.configure(state="normal")
                                    break
            
            messagebox.showinfo("Успех", f"Парсинг завершен. Найдено товаров: {len(items)}")
            
        except Exception as e:
            messagebox.showerror("Ошибка", f"Ошибка при парсинге файла:\n{str(e)}")
            self.status_var.set("Ошибка при парсинге")
    
    def extract_item_data(self, row):
        """Извлечение данных о товаре из строки HTML"""
        try:
            item_data = {}
            
            # Название товара
            title_element = row.find('div', class_='sale-order-detail-order-item-title')
            if title_element:
                link = title_element.find('a')
                if link:
                    item_data['name'] = link.get_text(strip=True)
                else:
                    item_data['name'] = title_element.get_text(strip=True)
            
            # Ищем количество в колонке "Количество"
            quantity_found = False
            # Ищем все td элементы и ищем тот, который содержит заголовок "Количество"
            all_tds = row.find_all('div', class_='sale-order-detail-order-item-td')
            for td in all_tds:
                # Проверяем, содержит ли td заголовок "Количество"
                title_element = td.find('div', class_='sale-order-detail-order-item-td-title')
                if title_element and 'Количество' in title_element.get_text():
                    # Нашли колонку с количеством, ищем span с числом
                    text_element = td.find('div', class_='sale-order-detail-order-item-td-text')
                    if text_element:
                        span = text_element.find('span')
                        if span:
                            span_text = span.get_text(strip=True)
                            # Ищем количество в формате "1 шт", "6 шт" и т.д.
                            quantity_match = re.search(r'(\d+)\s*шт', span_text)
                            if quantity_match:
                                item_data['quantity'] = quantity_match.group(1)
                                quantity_found = True
                                print(f"DEBUG: Количество найдено: '{span_text}' -> {item_data['quantity']}")
                                break
                            
                            # Если не нашли "шт", ищем просто число
                            if not quantity_found and span_text.isdigit() and 1 <= int(span_text) <= 99:
                                item_data['quantity'] = span_text
                                quantity_found = True
                                print(f"DEBUG: Количество найдено как число: '{span_text}' -> {item_data['quantity']}")
                                break
                    break
            
            # Ищем цвет в специальном блоке
            color_found = False
            # Ищем все блоки с цветом
            color_divs = row.find_all('div', class_='sale-order-detail-order-item-color')
            for color_div in color_divs:
                # Проверяем, что это блок с цветом, а не с состоянием
                color_name_span = color_div.find('span', class_='sale-order-detail-order-item-color-name')
                if color_name_span:
                    color_name_text = color_name_span.get_text(strip=True)
                    # Проверяем различные варианты названий для цвета
                    if any(keyword in color_name_text.lower() for keyword in ['цвет:', 'color:', 'цвет', 'color']):
                        # Нашли блок с цветом, извлекаем значение
                        color_type_span = color_div.find('span', class_='sale-order-detail-order-item-color-type')
                        if color_type_span:
                            color_text = color_type_span.get_text(strip=True)
                            # Убираем код цвета в скобках, если есть
                            color_match = re.search(r'([^(]+)', color_text)
                            if color_match:
                                clean_color = color_match.group(1).strip()
                                # Дополнительная очистка цвета
                                clean_color = re.sub(r'\s+', ' ', clean_color)  # Убираем лишние пробелы
                                clean_color = re.sub(r'^\s+|\s+$', '', clean_color)  # Убираем пробелы в начале и конце
                                item_data['color'] = clean_color
                            else:
                                item_data['color'] = color_text.strip()
                            color_found = True
                            print(f"DEBUG: Цвет найден: '{color_text}' -> {item_data['color']}")
                            break
            
            # Если цвет не найден в блоках, попробуем найти в названии товара
            if not color_found:
                item_name = item_data.get('name', '')
                if item_name:
                    # Ищем цвет в конце названия (например, "Trans-Red U", "Black U")
                    color_match = re.search(r'([A-Za-z\-\s]+)\s*[UBN]\s*$', item_name)
                    if color_match:
                        potential_color = color_match.group(1).strip()
                        # Проверяем, что это похоже на цвет
                        if any(color_word in potential_color.lower() for color_word in ['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'orange', 'purple', 'pink', 'brown', 'gold', 'silver', 'trans', 'красн', 'син', 'зелен', 'желт', 'черн', 'бел', 'сер', 'оранж', 'фиолет', 'розов', 'коричнев', 'голуб', 'золот', 'серебр', 'прозрачн']):
                            item_data['color'] = potential_color
                            color_found = True
                            print(f"DEBUG: Цвет найден в названии: '{potential_color}'")
                    
                    # Если не нашли в конце, ищем в скобках
                    if not color_found:
                        bracket_match = re.search(r'\(([^)]+)\)', item_name)
                        if bracket_match:
                            bracket_content = bracket_match.group(1)
                            # Ищем цвет в скобках
                            if any(color_word in bracket_content.lower() for color_word in ['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'orange', 'purple', 'pink', 'brown', 'gold', 'silver', 'trans', 'красн', 'син', 'зелен', 'желт', 'черн', 'бел', 'сер', 'оранж', 'фиолет', 'розов', 'коричнев', 'голуб', 'золот', 'серебр', 'прозрачн']):
                                item_data['color'] = bracket_content.strip()
                                color_found = True
                                print(f"DEBUG: Цвет найден в скобках: '{bracket_content}'")
            
            # Если количество не найдено, устанавливаем по умолчанию
            if not quantity_found:
                item_data['quantity'] = '1'
                print(f"DEBUG: Количество не найдено, установлено по умолчанию: 1")
            
            # Если цвет не найден, устанавливаем пустую строку
            if not color_found:
                item_data['color'] = ''
                print(f"DEBUG: Цвет не найден, установлен пустым")
            
            # Определение типа товара
            item_data['type'] = self.determine_item_type(item_data['name'])
            
            # Извлечение номера детали/набора
            item_data['part_number'] = self.extract_part_number(item_data['name'])
            
            return item_data if item_data.get('name') else None
            
        except Exception as e:
            print(f"Ошибка при извлечении данных товара: {e}")
            return None
    
    def determine_item_type(self, name):
        """Определение типа товара по названию"""
        name_lower = name.lower()
        
        # Простые и четкие правила
        if any(word in name_lower for word in ['минифигурка', 'minifig', 'фигурка', 'figure']):
            return 'minifig'
        elif any(word in name_lower for word in ['набор', 'set', 'конструктор']):
            return 'set'
        else:
            return 'part'  # По умолчанию считаем деталью
    
    def extract_part_number(self, name):
        """Извлечение номера детали/набора из названия"""
        # Поиск номера в формате sw0578, 30374, 64567 и т.д.
        part_match = re.search(r'([a-z]{2}\d{4}|\d{5})', name, re.IGNORECASE)
        if part_match:
            return part_match.group(1).upper()
        
        # Поиск номера в скобках
        bracket_match = re.search(r'\(([^)]+)\)', name)
        if bracket_match:
            bracket_content = bracket_match.group(1)
            # Ищем номер в содержимом скобок
            number_match = re.search(r'([a-z]{2}\d{4}|\d{5})', bracket_content, re.IGNORECASE)
            if number_match:
                return number_match.group(1).upper()
        
        # Поиск других форматов номеров (например, 4-5 цифр подряд)
        number_match = re.search(r'(\d{4,6})', name)
        if number_match:
            return number_match.group(1)
        
        # Поиск номера в начале или конце названия
        # Убираем лишние символы и ищем числа
        clean_name = re.sub(r'[^\w\s\d-]', '', name)
        words = clean_name.split()
        for word in words:
            if re.match(r'^\d{3,6}$', word):
                return word
        
        # Поиск номеров в формате "№12345" или "N12345"
        number_match = re.search(r'[№N]\s*(\d{3,6})', name, re.IGNORECASE)
        if number_match:
            return number_match.group(1)
        
        # Поиск номеров после слова "номер" или "number"
        number_match = re.search(r'(?:номер|number)\s*[:\-]?\s*(\d{3,6})', name, re.IGNORECASE)
        if number_match:
            return number_match.group(1)
        
        # Поиск номеров в формате "12345-67" или "12345/67"
        number_match = re.search(r'(\d{3,6})[-/]\d{1,3}', name)
        if number_match:
            return number_match.group(1)
        
        # Поиск номеров в конце строки после пробела
        number_match = re.search(r'\s(\d{3,6})\s*$', name)
        if number_match:
            return number_match.group(1)
        
        # НОВЫЙ: Поиск любых цифр длиной от 3 символов
        all_numbers = re.findall(r'\d{3,}', name)
        if all_numbers:
            # Берем самый длинный номер
            longest_number = max(all_numbers, key=len)
            if len(longest_number) >= 3:
                return longest_number
        
        return None
    
    def enrich_with_rebrickable(self):
        """Обогащение данных информацией из Rebrickable"""
        if not self.parsed_data:
            messagebox.showwarning("Предупреждение", "Нет данных для обогащения")
            return
        
        try:
            self.status_var.set("Инициализация API Rebrickable...")
            self.root.update()
            
            # Инициализация API
            self.rebrickable_api = RebrickableAPI()
            
            if not self.rebrickable_api.parts_df.empty:
                self.status_var.set("Обогащение данных...")
                self.root.update()
                
                enriched_count = 0
                
                for i, item in enumerate(self.parsed_data):
                    part_number = item.get('part_number')
                    item_type = item.get('type')
                    
                    if part_number and part_number != 'UNKNOWN':
                        # Обновляем статус
                        self.status_var.set(f"Обработка {i+1}/{len(self.parsed_data)}: {part_number}")
                        self.root.update()
                        
                        # Обогащаем данные в зависимости от типа
                        enriched = False
                        
                        # Сначала пробуем найти по определенному типу
                        if item_type == 'part':
                            part_info = self.rebrickable_api.search_part(part_number)
                            if part_info:
                                item['part_info'] = part_info
                                enriched_count += 1
                                enriched = True
                                print(f"✓ Найдена деталь по номеру: {part_number} -> {part_info['name']}")
                            else:
                                # Пробуем найти по названию
                                part_info = self.rebrickable_api.search_part_by_name(item.get('name', ''))
                                if part_info:
                                    item['part_info'] = part_info
                                    enriched_count += 1
                                    enriched = True
                                    print(f"✓ Найдена деталь по названию: {item.get('name', '')} -> {part_info['name']}")
                        
                        elif item_type == 'set':
                            set_info = self.rebrickable_api.search_set(part_number)
                            if set_info:
                                item['set_info'] = set_info
                                enriched_count += 1
                                enriched = True
                                print(f"✓ Найден набор по номеру: {part_number} -> {set_info['name']}")
                            else:
                                # Пробуем найти по названию
                                set_info = self.rebrickable_api.search_set_by_name(item.get('name', ''))
                                if set_info:
                                    item['set_info'] = set_info
                                    enriched_count += 1
                                    enriched = True
                                    print(f"✓ Найден набор по названию: {item.get('name', '')} -> {set_info['name']}")
                        
                        elif item_type == 'minifig':
                            minifig_info = self.rebrickable_api.search_minifig(part_number)
                            if minifig_info:
                                item['minifig_info'] = minifig_info
                                enriched_count += 1
                                enriched = True
                                print(f"✓ Найдена минифигурка по номеру: {part_number} -> {minifig_info['name']}")
                            else:
                                # Пробуем найти по названию
                                minifig_info = self.rebrickable_api.search_minifig_by_name(item.get('name', ''))
                                if minifig_info:
                                    item['minifig_info'] = minifig_info
                                    enriched_count += 1
                                    enriched = True
                                    print(f"✓ Найдена минифигурка по названию: {item.get('name', '')} -> {minifig_info['name']}")
                        
                        # Если не удалось найти по определенному типу, пробуем все типы
                        if not enriched:
                            print(f"⚠ Попытка поиска по всем типам для: {part_number}")
                            
                            # Пробуем найти как деталь
                            part_info = self.rebrickable_api.search_part(part_number)
                            if part_info:
                                item['part_info'] = part_info
                                item['type'] = 'part'  # Обновляем тип
                                enriched_count += 1
                                enriched = True
                                print(f"✓ Найдена как деталь: {part_number} -> {part_info['name']}")
                            
                            # Если не найдена как деталь, пробуем как набор
                            elif not enriched:
                                set_info = self.rebrickable_api.search_set(part_number)
                                if set_info:
                                    item['set_info'] = set_info
                                    item['type'] = 'set'  # Обновляем тип
                                    enriched_count += 1
                                    enriched = True
                                    print(f"✓ Найдена как набор: {part_number} -> {set_info['name']}")
                            
                            # Если не найден как набор, пробуем как минифигурку
                            elif not enriched:
                                minifig_info = self.rebrickable_api.search_minifig(part_number)
                                if minifig_info:
                                    item['minifig_info'] = minifig_info
                                    item['type'] = 'minifig'  # Обновляем тип
                                    enriched_count += 1
                                    enriched = True
                                    print(f"✓ Найдена как минифигурка: {part_number} -> {minifig_info['name']}")
                            
                            # Если все еще не найдено, пробуем поиск по названию для всех типов
                            if not enriched:
                                print(f"⚠ Поиск по названию для всех типов: {item.get('name', '')}")
                                
                                # Пробуем как деталь
                                part_info = self.rebrickable_api.search_part_by_name(item.get('name', ''))
                                if part_info:
                                    item['part_info'] = part_info
                                    item['type'] = 'part'
                                    enriched_count += 1
                                    enriched = True
                                    print(f"✓ Найдена как деталь по названию: {item.get('name', '')} -> {part_info['name']}")
                                
                                # Пробуем как набор
                                elif not enriched:
                                    set_info = self.rebrickable_api.search_set_by_name(item.get('name', ''))
                                    if set_info:
                                        item['set_info'] = set_info
                                        item['type'] = 'set'
                                        enriched_count += 1
                                        enriched = True
                                        print(f"✓ Найден как набор по названию: {item.get('name', '')} -> {set_info['name']}")
                                
                                # Пробуем как минифигурку
                                elif not enriched:
                                    minifig_info = self.rebrickable_api.search_minifig_by_name(item.get('name', ''))
                                    if minifig_info:
                                        item['minifig_info'] = minifig_info
                                        item['type'] = 'minifig'
                                        enriched_count += 1
                                        enriched = True
                                        print(f"✓ Найдена как минифигурка по названию: {item.get('name', '')} -> {minifig_info['name']}")
                            
                            if not enriched:
                                print(f"✗ Товар не найден ни в одном типе: {part_number}")
                        
                        # Поиск цвета
                        color_name = item.get('color', '')
                        if color_name:
                            color_info = self.rebrickable_api.search_color(color_name)
                            if color_info:
                                item['color_info'] = color_info
                                print(f"✓ Найден цвет: {color_name} -> {color_info['name']}")
                            else:
                                print(f"✗ Цвет не найден: {color_name}")
                    else:
                        print(f"⚠ Номер не извлечен для: {item.get('name', 'Unknown')}")
                        # Пробуем найти по названию, если номер не извлечен
                        item_name = item.get('name', '')
                        if item_name:
                            if item_type == 'part':
                                part_info = self.rebrickable_api.search_part_by_name(item_name)
                                if part_info:
                                    item['part_info'] = part_info
                                    enriched_count += 1
                                    print(f"✓ Найдена деталь по названию (без номера): {item_name} -> {part_info['name']}")
                            elif item_type == 'set':
                                set_info = self.rebrickable_api.search_set_by_name(item_name)
                                if set_info:
                                    item['set_info'] = set_info
                                    enriched_count += 1
                                    print(f"✓ Найден набор по названию (без номера): {item_name} -> {set_info['name']}")
                            elif item_type == 'minifig':
                                minifig_info = self.rebrickable_api.search_minifig_by_name(item_name)
                                if minifig_info:
                                    item['minifig_info'] = minifig_info
                                    enriched_count += 1
                                    print(f"✓ Найдена минифигурка по названию (без номера): {item_name} -> {minifig_info['name']}")
                    
                    # Обновляем таблицу
                    self.update_table_row(i, item)
                    
                    # Обновляем карточки если включен режим карточек
                    if self.current_view_mode == "cards":
                        self.update_cards_display()
                    
                    # Небольшая задержка для обновления UI
                    time.sleep(0.01)
                
                # Обновляем всю таблицу после завершения обогащения
                self.update_table_display()
                
                self.status_var.set(f"Обогащение завершено. Обработано: {enriched_count}/{len(self.parsed_data)}")
                
                # Активация кнопки экспорта
                # Ищем кнопку по точному тексту
                for child in self.root.winfo_children():
                    if isinstance(child, ttk.Frame):
                        for button in child.winfo_children():
                            if isinstance(button, ttk.Frame):
                                for btn in button.winfo_children():
                                    if isinstance(btn, ttk.Button) and btn.cget('text') == "📊 Экспорт в CSV":
                                        btn.configure(state="normal")
                                        break
                
                messagebox.showinfo("Успех", f"Обогащение завершено!\nОбработано товаров: {enriched_count}/{len(self.parsed_data)}")
            else:
                messagebox.showwarning("Предупреждение", "Данные Rebrickable не найдены в папке Data/\nCSV файл будет создан с базовой информацией")
                
                # Активация кнопки экспорта даже без обогащения
                # Ищем кнопку по точному тексту
                for child in self.root.winfo_children():
                    if isinstance(child, ttk.Frame):
                        for button in child.winfo_children():
                            if isinstance(button, ttk.Frame):
                                for btn in button.winfo_children():
                                    if isinstance(btn, ttk.Button) and btn.cget('text') == "📊 Экспорт в CSV":
                                        btn.configure(state="normal")
                                        break
                
        except Exception as e:
            messagebox.showerror("Ошибка", f"Ошибка при обогащении данных:\n{str(e)}")
            self.status_var.set("Ошибка при обогащении")
    
    def update_table_row(self, index, item):
        """Обновление строки в таблице"""
        # Находим элемент в таблице
        children = self.tree.get_children()
        if index < len(children):
            item_id = children[index]
            
            # Определяем статус API и название для отображения
            status = "Не обогащено"
            display_name = item.get('name', '')
            
            if item.get('part_info') or item.get('set_info') or item.get('minifig_info'):
                status = "✓ Обогащено"
                # Показываем официальное название из API если доступно
                if item.get('part_info'):
                    api_name = item['part_info'].get('name', '')
                    if api_name:
                        display_name = f"✓ {api_name}"
                elif item.get('set_info'):
                    api_name = item['set_info'].get('name', '')
                    if api_name:
                        display_name = f"✓ {api_name}"
                elif item.get('minifig_info'):
                    api_name = item['minifig_info'].get('name', '')
                    if api_name:
                        display_name = f"✓ {api_name}"
            
            # Обновляем строку
            self.tree.item(item_id, values=(
                display_name[:50] + "..." if len(display_name) > 50 else display_name,
                item.get('part_number', 'UNKNOWN'),
                item.get('quantity', ''),
                item.get('color', ''),
                item.get('type', ''),
                status
            ))
    
    def update_table_display(self):
        """Обновить отображение таблицы"""
        # Очищаем таблицу
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        # Заполняем таблицу данными
        for item in self.parsed_data:
            status = "Не обогащено"
            display_name = item.get('name', '')
            
            if item.get('part_info') or item.get('set_info') or item.get('minifig_info'):
                status = "✓ Обогащено"
                if item.get('part_info'):
                    api_name = item['part_info'].get('name', '')
                    if api_name:
                        display_name = f"✓ {api_name}"
                elif item.get('set_info'):
                    api_name = item['set_info'].get('name', '')
                    if api_name:
                        display_name = f"✓ {api_name}"
                elif item.get('minifig_info'):
                    api_name = item['minifig_info'].get('name', '')
                    if api_name:
                        display_name = f"✓ {api_name}"
            
            self.tree.insert('', 'end', values=(
                display_name[:50] + "..." if len(display_name) > 50 else display_name,
                item.get('part_number', 'UNKNOWN'),
                item.get('quantity', ''),
                item.get('color', ''),
                item.get('type', ''),
                status
            ))
    
    def export_to_csv(self):
        if not self.parsed_data:
            messagebox.showwarning("Предупреждение", "Нет данных для экспорта")
            return
        
        if not self.output_file.get():
            messagebox.showerror("Ошибка", "Укажите путь для сохранения CSV файла")
            return
        
        try:
            self.status_var.set("Экспорт в CSV...")
            self.root.update()
            
            with open(self.output_file.get(), 'w', newline='', encoding='utf-8-sig') as csvfile:
                # Заголовки для импорта в LEGO каталог
                fieldnames = [
                    'type', 'id', 'quantity', 'name',
                    'part_cat_id', 'part_cat_name',
                    'color_id', 'color_name',
                    'set_theme_id', 'set_theme_name', 'set_year', 'set_num_parts',
                    'minifig_num_parts'
                ]
                
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames, delimiter=',')
                writer.writeheader()
                
                for item in self.parsed_data:
                    item_type = item.get('type', 'part')
                    part_number = item.get('part_number', 'UNKNOWN')
                    
                    # Приоритет названий: сначала API, потом оригинальное название
                    api_name = ""
                    if item_type == 'part' and item.get('part_info'):
                        api_name = item['part_info'].get('name', '')
                    elif item_type == 'set' and item.get('set_info'):
                        api_name = item['set_info'].get('name', '')
                    elif item_type == 'minifig' and item.get('minifig_info'):
                        api_name = item['minifig_info'].get('name', '')
                    
                    # Используем название из API если доступно, иначе оригинальное
                    final_name = api_name if api_name else item.get('name', '')
                    
                    if item_type == 'part':
                        # Для деталей
                        part_info = item.get('part_info', {})
                        color_info = item.get('color_info', {})
                        
                        writer.writerow({
                            'type': 'part',
                            'id': part_number,
                            'quantity': item.get('quantity', '1'),
                            'name': final_name,
                            'part_cat_id': part_info.get('part_cat_id', ''),
                            'part_cat_name': part_info.get('part_cat_name', ''),
                            'color_id': color_info.get('id', ''),
                            'color_name': color_info.get('name', item.get('color', '')),
                            'set_theme_id': '',
                            'set_theme_name': '',
                            'set_year': '',
                            'set_num_parts': '',
                            'minifig_num_parts': ''
                        })
                    elif item_type == 'set':
                        # Для наборов
                        set_info = item.get('set_info', {})
                        
                        writer.writerow({
                            'type': 'set',
                            'id': part_number,
                            'quantity': item.get('quantity', '1'),
                            'name': final_name,
                            'part_cat_id': '',
                            'part_cat_name': '',
                            'color_id': '',
                            'color_name': '',
                            'set_theme_id': set_info.get('theme_id', ''),
                            'set_theme_name': set_info.get('theme_name', ''),
                            'set_year': set_info.get('year', ''),
                            'set_num_parts': set_info.get('num_parts', ''),
                            'minifig_num_parts': ''
                        })
                    elif item_type == 'minifig':
                        # Для минифигурок
                        minifig_info = item.get('minifig_info', {})
                        
                        writer.writerow({
                            'type': 'minifig',
                            'id': part_number,
                            'quantity': item.get('quantity', '1'),
                            'name': final_name,
                            'part_cat_id': '',
                            'part_cat_name': '',
                            'color_id': '',
                            'color_name': '',
                            'set_theme_id': '',
                            'set_theme_name': '',
                            'set_year': '',
                            'set_num_parts': '',
                            'minifig_num_parts': minifig_info.get('num_parts', '')
                        })
            
            self.status_var.set(f"Экспорт завершен: {self.output_file.get()}")
            messagebox.showinfo("Успех", f"Данные успешно экспортированы в файл для импорта:\n{self.output_file.get()}\n\nФайл готов для импорта в каталог LEGO!")
            
        except Exception as e:
            messagebox.showerror("Ошибка", f"Ошибка при экспорте в CSV:\n{str(e)}")
            self.status_var.set("Ошибка при экспорте")
    
    def clear_data(self):
        """Очистка всех данных"""
        self.parsed_data = []
        self.input_file.set("")
        self.output_file.set("")
        self.rebrickable_api = None
        
        # Очистка таблицы
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        # Очистка карточек
        if hasattr(self, 'card_frame'):
            for widget in self.card_frame.winfo_children():
                widget.destroy()
        
        # Деактивация кнопок
        # Ищем кнопки по точному тексту
        for child in self.root.winfo_children():
            if isinstance(child, ttk.Frame):
                for button in child.winfo_children():
                    if isinstance(button, ttk.Frame):
                        for btn in button.winfo_children():
                            if isinstance(btn, ttk.Button):
                                if btn.cget('text') == "🔧 Обогатить данными":
                                    btn.configure(state="disabled")
                                elif btn.cget('text') == "📊 Экспорт в CSV":
                                    btn.configure(state="disabled")
        
        self.status_var.set("Готов к работе")

def main():
    root = tk.Tk()
    app = OrderParser(root)
    root.mainloop()

if __name__ == "__main__":
    main()
