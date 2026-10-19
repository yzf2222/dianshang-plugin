@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Push project to GitHub

echo ==========================================
echo   Push project to GitHub
echo ==========================================
echo.

rem ---- locate git.exe (system first, then bundled portable git) ----
set "GIT=git"
where git >nul 2>&1
if errorlevel 1 set "GIT=C:\Users\win10\.workbuddy\vendor\PortableGit\cmd\git.exe"
if not exist "%GIT%" if "%GIT%" NEQ "git" goto nogit
"%GIT%" --version >nul 2>&1
if errorlevel 1 goto nogit
echo [git] %GIT%
echo.

set "GHUSER="
set "GHREPO="
set "GHTOKEN="

set /p GHUSER=GitHub username (e.g. yzf2222): 
set /p GHREPO=Repository name (e.g. dianshang-plugin): 
set /p GHTOKEN=Personal Access Token (ghp_...): 

if "%GHUSER%"=="" goto bad
if "%GHREPO%"=="" goto bad
if "%GHTOKEN%"=="" goto bad

echo.
echo ------------------------------------------
echo  User : %GHUSER%
echo  Repo : %GHREPO%
echo  Token: %GHTOKEN:~0,8%... (hidden)
echo ------------------------------------------
echo.
echo Pushing, please wait ...

"%GIT%" remote remove origin >nul 2>&1
"%GIT%" branch -M main

echo Committing pending changes ...
"%GIT%" add -A >nul 2>&1
"%GIT%" diff --cached --quiet
if errorlevel 1 "%GIT%" commit -q -m "chore: add helper scripts"
echo.

"%GIT%" -c credential.helper= push -u "https://%GHUSER%:%GHTOKEN%@github.com/%GHUSER%/%GHREPO%.git" main --force

if errorlevel 1 goto failed

"%GIT%" remote remove origin >nul 2>&1
"%GIT%" remote add origin https://github.com/%GHUSER%/%GHREPO%.git

echo.
echo ==========================================
echo   [OK] Push succeeded
echo   Repo: https://github.com/%GHUSER%/%GHREPO%
echo ==========================================
echo.
echo   NEXT STEP:
echo   Repo page - Settings - Pages
echo   Source: Deploy from a branch
echo   Branch: main   Folder: /docs
echo   Then Save and wait 1-2 minutes.
echo.
pause
exit /b 0

:nogit
echo.
echo [ERROR] git.exe not found.
echo Try: C:\Users\win10\.workbuddy\vendor\PortableGit\cmd\git.exe
echo.
pause
exit /b 1

:failed
echo.
echo ==========================================
echo   [FAILED] Push failed
echo ==========================================
echo   Check:
echo   1. Token has the "repo" scope checked
echo   2. Repository name is exactly correct
echo   3. Repo still exists (not deleted)
echo.
pause
exit /b 1

:bad
echo.
echo ERROR: username / repo / token cannot be empty.
echo.
pause
exit /b 1
