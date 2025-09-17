# PowerShell скрипт для запуска HTTP-сервера
# LEGO Catalog Development Server

Write-Host "🔧 LEGO Catalog - Development Server" -ForegroundColor Cyan
Write-Host "PowerShell HTTP Server для разработки" -ForegroundColor Gray
Write-Host ""

# Проверяем, что мы в правильной директории
if (-not (Test-Path "index.html")) {
    Write-Host "❌ Ошибка: index.html не найден в текущей директории" -ForegroundColor Red
    Write-Host "Текущая директория: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Порт для сервера
$PORT = 8080

# Функция для получения локального IP
function Get-LocalIP {
    try {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1).IPAddress
        if ($ip) { return $ip } else { return "localhost" }
    } catch {
        return "localhost"
    }
}

# Функция для проверки доступности порта
function Test-Port {
    param([int]$Port)
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    } catch {
        return $false
    }
}

# Проверяем доступность порта
if (-not (Test-Port -Port $PORT)) {
    Write-Host "❌ Ошибка: Порт $PORT уже используется" -ForegroundColor Red
    Write-Host "Попробуйте другой порт или остановите другой сервер" -ForegroundColor Yellow
    exit 1
}

# Получаем локальный IP
$localIP = Get-LocalIP

Write-Host "🚀 LEGO Catalog Development Server" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "📁 Директория: $(Get-Location)" -ForegroundColor White
Write-Host "🌐 URL: http://localhost:$PORT" -ForegroundColor White
Write-Host "📱 Мобильный доступ: http://$localIP`:$PORT" -ForegroundColor White
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "📋 Доступные страницы:" -ForegroundColor White
Write-Host "   • Главная: http://localhost:$PORT/" -ForegroundColor Cyan
Write-Host "   • Тест: http://localhost:$PORT/test-simple.html" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "🛑 Для остановки нажмите Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Открываем браузер
try {
    Start-Process "http://localhost:$PORT"
    Write-Host "🌐 Браузер открыт автоматически" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Не удалось открыть браузер автоматически" -ForegroundColor Yellow
}

Write-Host ""

# Запускаем HTTP-сервер
try {
    # Используем встроенный HTTP-сервер PowerShell
    $listener = [System.Net.HttpListener]::new()
    $listener.Prefixes.Add("http://localhost:$PORT/")
    $listener.Start()
    
    Write-Host "✅ Сервер запущен успешно!" -ForegroundColor Green
    Write-Host "Ожидание запросов..." -ForegroundColor Gray
    Write-Host ""
    
    # Обработка запросов
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Получаем путь к файлу
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") { $localPath = "/index.html" }
        
        $filePath = Join-Path (Get-Location) $localPath.TrimStart('/')
        
        # Проверяем существование файла
        if (Test-Path $filePath -PathType Leaf) {
            # Определяем MIME-тип
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mimeType = switch ($extension) {
                ".html" { "text/html; charset=utf-8" }
                ".css" { "text/css; charset=utf-8" }
                ".js" { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".csv" { "text/csv; charset=utf-8" }
                ".png" { "image/png" }
                ".jpg" { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".gif" { "image/gif" }
                ".svg" { "image/svg+xml" }
                ".ico" { "image/x-icon" }
                default { "application/octet-stream" }
            }
            
            # Читаем файл
            $content = [System.IO.File]::ReadAllBytes($filePath)
            
            # Устанавливаем заголовки
            $response.ContentType = $mimeType
            $response.ContentLength64 = $content.Length
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            $response.AddHeader("Access-Control-Allow-Headers", "Content-Type")
            
            # Отправляем файл
            $response.OutputStream.Write($content, 0, $content.Length)
            $response.StatusCode = 200
            
            Write-Host "✅ $($request.HttpMethod) $localPath - $mimeType" -ForegroundColor Green
        } else {
            # Файл не найден
            $response.StatusCode = 404
            $response.ContentType = "text/html; charset=utf-8"
            $errorHtml = @"
<!DOCTYPE html>
<html>
<head>
    <title>404 - Файл не найден</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .error { color: #e74c3c; }
        .path { color: #7f8c8d; }
    </style>
</head>
<body>
    <h1 class="error">404 - Файл не найден</h1>
    <p>Запрашиваемый файл: <span class="path">$localPath</span></p>
    <p>Полный путь: <span class="path">$filePath</span></p>
</body>
</html>
"@
            $errorBytes = [System.Text.Encoding]::UTF8.GetBytes($errorHtml)
            $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
            
            Write-Host "❌ $($request.HttpMethod) $localPath - 404 Not Found" -ForegroundColor Red
        }
        
        $response.Close()
    }
} catch {
    Write-Host "❌ Ошибка сервера: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    if ($listener) {
        $listener.Stop()
        $listener.Close()
    }
    Write-Host "🛑 Сервер остановлен" -ForegroundColor Yellow
}
