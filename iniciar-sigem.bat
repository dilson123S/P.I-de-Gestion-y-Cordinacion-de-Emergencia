@echo off
chcp 65001 >nul
title SIGEM - Inicializador Central de Emergencias
color 0B

echo ===============================================================================
echo        SISTEMA INTEGRADO DE GESTION Y COORDINACION DE EMERGENCIAS (SIGEM)
echo                    Consola CAD 123 + Backend + App Movil
echo ===============================================================================
echo.
echo [1/4] Verificando entorno de ejecucion...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    echo Por favor instala Node.js antes de continuar.
    pause
    exit /b 1
)

echo [OK] Node.js detectado correctamente.
echo.

echo [2/4] Liberando puertos en caso de ejecuciones previas (3005, 3002, 8081)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>nul
echo [OK] Puertos verificados y listos.
echo.

echo [3/4] Lanzando servicios del ecosistema SIGEM en ventanas dedicadas...

:: 1. Iniciar Backend (Puerto 3005)
start "SIGEM [1/3] - Backend API REST y WebSockets (Puerto 3005)" cmd /k "cd /d %~dp0backend && title [SIGEM] Backend API (3005) && echo Iniciando Backend API en http://localhost:3005... && npm run dev"

:: Esperar 3 segundos para que el backend inicie antes de la web
timeout /t 3 /nobreak >nul

:: 2. Iniciar Consola Web CAD (Puerto 3002)
start "SIGEM [2/3] - Consola Web CAD 123 (Puerto 3002)" cmd /k "cd /d %~dp0web-dashboard && title [SIGEM] Consola Web CAD (3002) && echo Iniciando Consola Web en http://localhost:3002... && npm run dev"

:: 3. Iniciar Aplicacion Movil (Expo Tunnel en Puerto 8081)
start "SIGEM [3/3] - App Movil Expo Tunnel (Puerto 8081)" cmd /k "cd /d %~dp0mobile-app && title [SIGEM] App Movil (8081) && echo Iniciando Expo con tunel ngrok... && npx expo start --tunnel ngrok -c"

echo.
echo [4/4] Abriendo Consola Web en el navegador predeterminado...
timeout /t 4 /nobreak >nul
start http://localhost:3002/login

cls
color 0A
echo ===============================================================================
echo        SISTEMA INTEGRADO DE GESTION Y COORDINACION DE EMERGENCIAS (SIGEM)
echo                    ¡DESPLIEGUE COMPLETADO EXITOSAMENTE!
echo ===============================================================================
echo.
echo  [+] Backend API REST:       http://localhost:3005/api/v1
echo  [+] Consola Web CAD 123:    http://localhost:3002
echo  [+] Servidor App Movil:     http://localhost:8081 (Escanear QR con Expo Go)
echo.
echo -------------------------------------------------------------------------------
echo  CREDENCIALES DE ACCESO RAPIDO:
echo  - Administrador General:    admin@emergencias.gob       / admin123  (Web)
echo  - Operador Integral:        operador1@emergencias.gob   / operador123 (Web)
echo  - Personal de Campo:        campo1@emergencias.gob      / campo123  (Movil)
echo  - Personal de Campo:        deltorojou@gmail.com        / (Clave)   (Movil PL-01)
echo  - Ciudadano SOS:            ciudadano@correo.com        / ciudadano123 (Movil)
echo -------------------------------------------------------------------------------
echo.
echo  Para detener todos los servicios de forma limpia, puedes ejecutar:
echo  ^> detener-sigem.bat
echo.
echo  Puedes minimizar esta ventana. Los servicios continuaran ejecutandose.
echo ===============================================================================
pause
