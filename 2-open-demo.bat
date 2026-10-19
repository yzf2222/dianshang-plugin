@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ==========================================
echo   [2] Open the DEMO product page (for plugin test)
echo ==========================================
echo.
echo IMPORTANT:
echo   To let the extension work on a local file, you must
echo   enable "Allow access to file URLs" on chrome://extensions
echo   (extension details -^> toggle on).
echo.
echo   Easier option: open a real product page instead, e.g.
echo   https://item.jd.com/100012043978.html
echo.

if exist "%~dp0docs\demo.html" (
    start "" "%~dp0docs\demo.html"
) else (
    echo ERROR: docs\demo.html not found.
)

echo Press any key to close...
pause >nul
