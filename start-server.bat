@echo off
chcp 65001 >nul
title LEGO Catalog Development Server

echo.
echo 🔧 LEGO Catalog - Development Server
echo Batch HTTP Server для разработки
echo.

REM Проверяем, что мы в правильной директории
if not exist "index.html" (
    echo ❌ Ошибка: index.html не найден в текущей директории
    echo Текущая директория: %CD%
    pause
    exit /b 1
)

REM Порт для сервера
set PORT=8080

echo 🚀 LEGO Catalog Development Server
echo ==================================================
echo 📁 Директория: %CD%
echo 🌐 URL: http://localhost:%PORT%
echo ==================================================
echo 📋 Доступные страницы:
echo    • Главная: http://localhost:%PORT%/
echo    • Тест: http://localhost:%PORT%/test-simple.html
echo ==================================================
echo 🛑 Для остановки нажмите Ctrl+C
echo.

REM Открываем браузер
start http://localhost:%PORT%

echo 🌐 Браузер открыт автоматически
echo.

REM Запускаем HTTP-сервер с помощью Python
echo ✅ Запуск сервера...
echo.

REM Проверяем наличие Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python не найден. Установите Python 3.6+ или используйте start-server.ps1
    echo.
    echo Альтернативные способы запуска:
    echo 1. Установите Python: https://python.org
    echo 2. Используйте PowerShell: .\start-server.ps1
    echo 3. Используйте Node.js: npx http-server -p 8080
    echo 4. Используйте Live Server в VS Code
    pause
    exit /b 1
)

REM Запускаем Python сервер
python start-server.py

echo.
echo 🛑 Сервер остановлен
pause
