@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ==========================================
echo   [1] Open the official site (docs\index.html)
echo ==========================================
echo.

if exist "%~dp0docs\index.html" (
    echo Opening docs\index.html ...
    start "" "%~dp0docs\index.html"
) else (
    echo ERROR: docs\index.html not found.
)

echo.
echo Done. Press any key to close...
pause >nul
