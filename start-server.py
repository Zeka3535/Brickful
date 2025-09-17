#!/usr/bin/env python3
"""
Простой HTTP-сервер для разработки LEGO Catalog
Запускает сервер на http://localhost:8080
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# Порт для сервера
PORT = 8080

# Директория проекта
PROJECT_DIR = Path(__file__).parent.absolute()

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Кастомный обработчик HTTP-запросов с поддержкой MIME-типов"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_DIR, **kwargs)
    
    def end_headers(self):
        # Добавляем заголовки для CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def guess_type(self, path):
        """Определяем MIME-тип для различных файлов"""
        mimetype, encoding = super().guess_type(path)
        
        # Специальные случаи для нашего проекта
        if path.endswith('.js'):
            return 'application/javascript'
        elif path.endswith('.css'):
            return 'text/css'
        elif path.endswith('.json'):
            return 'application/json'
        elif path.endswith('.csv'):
            return 'text/csv'
        elif path.endswith('.html'):
            return 'text/html'
        
        return mimetype

def start_server():
    """Запускает HTTP-сервер"""
    try:
        # Проверяем, что мы в правильной директории
        if not (PROJECT_DIR / 'index.html').exists():
            print("❌ Ошибка: index.html не найден в текущей директории")
            print(f"Текущая директория: {PROJECT_DIR}")
            return False
        
        # Создаем сервер
        with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
            print("🚀 LEGO Catalog Development Server")
            print("=" * 50)
            print(f"📁 Директория: {PROJECT_DIR}")
            print(f"🌐 URL: http://localhost:{PORT}")
            print(f"📱 Мобильный доступ: http://{get_local_ip()}:{PORT}")
            print("=" * 50)
            print("📋 Доступные страницы:")
            print(f"   • Главная: http://localhost:{PORT}/")
            print(f"   • Тест: http://localhost:{PORT}/test-simple.html")
            print("=" * 50)
            print("🛑 Для остановки нажмите Ctrl+C")
            print()
            
            # Открываем браузер
            try:
                webbrowser.open(f'http://localhost:{PORT}')
                print("🌐 Браузер открыт автоматически")
            except:
                print("⚠️ Не удалось открыть браузер автоматически")
            
            print()
            
            # Запускаем сервер
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Ошибка: Порт {PORT} уже используется")
            print("Попробуйте другой порт или остановите другой сервер")
        else:
            print(f"❌ Ошибка запуска сервера: {e}")
        return False
    except KeyboardInterrupt:
        print("\n🛑 Сервер остановлен")
        return True
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")
        return False

def get_local_ip():
    """Получает локальный IP-адрес"""
    import socket
    try:
        # Подключаемся к внешнему адресу для определения локального IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except:
        return "localhost"

if __name__ == "__main__":
    print("🔧 LEGO Catalog - Development Server")
    print("Python HTTP Server для разработки")
    print()
    
    # Проверяем версию Python
    if sys.version_info < (3, 6):
        print("❌ Требуется Python 3.6 или новее")
        sys.exit(1)
    
    # Запускаем сервер
    success = start_server()
    sys.exit(0 if success else 1)
