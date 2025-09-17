@echo off
echo Starting LEGO Catalog local server...
echo.
echo Choose server type:
echo 1. Python HTTP Server (port 8080)
echo 2. Node.js serve (port 8080)
echo 3. PHP built-in server (port 8080)
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo Starting Python HTTP Server...
    python -m http.server 8080
) else if "%choice%"=="2" (
    echo Starting Node.js serve...
    npx serve -p 8080
) else if "%choice%"=="3" (
    echo Starting PHP server...
    php -S localhost:8080
) else (
    echo Invalid choice. Starting Python server by default...
    python -m http.server 8080
)

echo.
echo Server started! Open http://localhost:8080 in your browser
pause
