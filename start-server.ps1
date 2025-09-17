Write-Host "Starting LEGO Catalog local server..." -ForegroundColor Green
Write-Host ""
Write-Host "Choose server type:" -ForegroundColor Yellow
Write-Host "1. Python HTTP Server (port 8080)"
Write-Host "2. Node.js serve (port 8080)"
Write-Host "3. PHP built-in server (port 8080)"
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "Starting Python HTTP Server..." -ForegroundColor Cyan
        python -m http.server 8080
    }
    "2" {
        Write-Host "Starting Node.js serve..." -ForegroundColor Cyan
        npx serve -p 8080
    }
    "3" {
        Write-Host "Starting PHP server..." -ForegroundColor Cyan
        php -S localhost:8080
    }
    default {
        Write-Host "Invalid choice. Starting Python server by default..." -ForegroundColor Yellow
        python -m http.server 8080
    }
}

Write-Host ""
Write-Host "Server started! Open http://localhost:8080 in your browser" -ForegroundColor Green
Read-Host "Press Enter to continue"
