@echo off
chcp 65001 >nul
title SIGEM - Detener Todos los Servicios
color 0C

echo ===============================================================================
echo        SIGEM - DETENCION LIMPIA DE TODOS LOS SERVICIOS OPERATIVOS
echo ===============================================================================
echo.
echo Deteniendo procesos en puertos 3005 (Backend), 3002 (Web) y 8081 (Expo)...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005 ^| findstr LISTENING') do (
    echo [+] Deteniendo proceso Backend PID %%a...
    taskkill /F /PID %%a >nul 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002 ^| findstr LISTENING') do (
    echo [+] Deteniendo proceso Consola Web PID %%a...
    taskkill /F /PID %%a >nul 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081 ^| findstr LISTENING') do (
    echo [+] Deteniendo proceso Expo PID %%a...
    taskkill /F /PID %%a >nul 2>nul
)

echo.
color 0A
echo [OK] Todos los servicios de SIGEM han sido detenidos correctamente.
echo Los puertos se encuentran libres para un nuevo despliegue.
echo.
pause
