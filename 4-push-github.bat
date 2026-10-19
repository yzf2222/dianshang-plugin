@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ==========================================
echo   [4] Push to GitHub
echo ==========================================
echo.
echo Create an EMPTY public repo on github.com first, then paste its URL here.
echo Example: https://github.com/yourname/dianshang-plugin.git
echo.

set "REPO="
set /p REPO=Repo URL: 

if "%REPO%"=="" (
    echo ERROR: empty URL, aborted.
    pause
    exit /b 1
)

echo.
git remote remove origin >nul 2>&1
git remote add origin "%REPO%"
git branch -M main

echo Pushing ... (username = your GitHub name, password = Personal Access Token)
echo.
git push -u origin main

echo.
echo ==========================================
echo   If push succeeded, go to repo Settings -^> Pages
echo   Source: Deploy from a branch / main / /docs
echo ==========================================
echo Press any key to close...
pause >nul
