@echo off
echo.
echo ========================================
echo   Digiautomatiza - Detener Todo
echo ========================================
echo.
echo Deteniendo todos los procesos de Node.js...
echo.

taskkill /F /IM node.exe 2>nul

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Todos los procesos detenidos
    echo ========================================
) else (
    echo.
    echo No habia procesos de Node.js corriendo
)

echo.
echo Presiona cualquier tecla para cerrar...
pause > nul

