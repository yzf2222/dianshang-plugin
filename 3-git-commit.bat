@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ==========================================
echo   [3] git init + add + commit
echo ==========================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo ERROR: git not found. Install Git first: https://git-scm.com/download/win
    pause
    exit /b 1
)

if not exist ".git" (
    echo [1/4] git init ...
    git init -b main
) else (
    echo [1/4] repo already exists, skip init
)

git config user.name >nul 2>&1
if errorlevel 1 (
    git config user.name "student"
    echo   local user.name = student
)
git config user.email >nul 2>&1
if errorlevel 1 (
    git config user.email "student@example.com"
    echo   local user.email = student@example.com
)

echo.
echo [2/4] git add -A ...
git add -A

echo.
echo [3/4] git commit ...
git commit -m "feat: e-commerce image downloader extension + landing page"

echo.
echo [4/4] git log ...
git log --oneline -5

echo.
echo ==========================================
echo   Done. Next: double click 4-push-github.bat
echo ==========================================
echo.
echo Press any key to close...
pause >nul
