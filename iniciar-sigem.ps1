<#
.SYNOPSIS
    Script de Despliegue Unificado para SIGEM
.DESCRIPTION
    Lanza de forma concurrente el Backend (3005), la Consola Web (3002) y la App Móvil Expo (8081).
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "       SISTEMA INTEGRADO DE GESTIÓN Y COORDINACIÓN DE EMERGENCIAS (SIGEM)      " -ForegroundColor Cyan
Write-Host "                   Inicializador Automático de Servicios                       " -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = $PSScriptRoot

# 1. Comprobación de Node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js no está instalado o no se encuentra en el PATH." -ForegroundColor Red
    exit 1
}

# 2. Liberación de puertos
Write-Host "[1/3] Verificando puertos (3005, 3002, 8081)..." -ForegroundColor Yellow
$puertos = @(3005, 3002, 8081)
foreach ($p in $puertos) {
    $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($c in $conns) {
            Write-Host "  -> Liberando puerto $p (PID: $($c.OwningProcess))..." -ForegroundColor Gray
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}
Write-Host "[OK] Puertos listos." -ForegroundColor Green
Write-Host ""

# 3. Lanzamiento de procesos
Write-Host "[2/3] Iniciando servicios en terminales independientes..." -ForegroundColor Yellow

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\backend'; `$Host.UI.RawUI.WindowTitle = '[SIGEM] Backend API (3005)'; Write-Host 'Iniciando Backend...' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 3

# Web Dashboard
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\web-dashboard'; `$Host.UI.RawUI.WindowTitle = '[SIGEM] Consola Web CAD (3002)'; Write-Host 'Iniciando Consola Web...' -ForegroundColor Cyan; npm run dev"

# Mobile App
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\mobile-app'; `$Host.UI.RawUI.WindowTitle = '[SIGEM] App Móvil Expo (8081)'; Write-Host 'Iniciando Expo con túnel ngrok...' -ForegroundColor Cyan; npx expo start --tunnel ngrok -c"

Write-Host ""
Write-Host "[3/3] Abriendo navegador en la Consola Web..." -ForegroundColor Yellow
Start-Sleep -Seconds 4
Start-Process "http://localhost:3002/login"

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "                   ¡DESPLIEGUE INICIADO EXITOSAMENTE!                          " -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "  [+] Consola Web:        http://localhost:3002" -ForegroundColor White
Write-Host "  [+] Backend API:        http://localhost:3005/api/v1" -ForegroundColor White
Write-Host "  [+] App Móvil (Expo):   http://localhost:8081 (Escanear QR)" -ForegroundColor White
Write-Host ""
Write-Host "  Credenciales maestras:" -ForegroundColor Cyan
Write-Host "  - Admin:       admin@emergencias.gob / admin123" -ForegroundColor Gray
Write-Host "  - Operador:    operador1@emergencias.gob / operador123" -ForegroundColor Gray
Write-Host "  - Campo:       campo1@emergencias.gob / campo123" -ForegroundColor Gray
Write-Host "===============================================================================" -ForegroundColor Green
