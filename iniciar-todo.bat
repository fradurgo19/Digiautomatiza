@echo off
echo.
echo ========================================
echo   Digiautomatiza - Iniciar Todo
echo ========================================
echo.
echo Iniciando todos los servidores...
echo.

cd "C:\Users\Frank Duran\OneDrive - Partequipos S.A.S\Escritorio\Digi\project"

echo [1/3] Iniciando Frontend (React)...
start "Digiautomatiza - Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul

echo [2/3] Iniciando Backend API (Neon Database)...
start "Digiautomatiza - API" cmd /k "npm run api:dev"
timeout /t 2 /nobreak > nul

echo [3/3] Iniciando Email Server (Resend)...
start "Digiautomatiza - Email" cmd /k "npm run email:dev"
timeout /t 2 /nobreak > nul

echo.
echo ========================================
echo   Todos los servidores iniciados!
echo ========================================
echo.
echo URLs:
echo   - Frontend:      http://localhost:5173
echo   - Backend API:   http://localhost:3000
echo   - Email Server:  http://localhost:3001
echo   - Prisma Studio: npm run db:studio
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul

