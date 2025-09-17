#!/usr/bin/env python3
"""
Скрипт для установки зависимостей для парсера заказов LEGO
"""

import subprocess
import sys

def install_package(package):
    """Установка пакета через pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ {package} успешно установлен")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Ошибка установки {package}")
        return False

def main():
    print("🚀 Установка зависимостей для парсера заказов LEGO...")
    print("=" * 60)
    
    # Список необходимых пакетов
    packages = [
        "beautifulsoup4==4.12.2",
        "lxml==4.9.3", 
        "pandas==2.0.3",
        "requests==2.31.0",
        "Pillow==10.0.1"
    ]
    
    success_count = 0
    
    for package in packages:
        print(f"\n📦 Устанавливаю {package}...")
        if install_package(package):
            success_count += 1
    
    print("\n" + "=" * 60)
    if success_count == len(packages):
        print("🎉 Все зависимости успешно установлены!")
        print("Теперь вы можете запустить order_parser_api.py")
    else:
        print(f"⚠️ Установлено {success_count}/{len(packages)} пакетов")
        print("Проверьте ошибки выше и попробуйте установить недостающие пакеты вручную")
    
    input("\nНажмите Enter для выхода...")

if __name__ == "__main__":
    main()
