@echo off
title GitHub Connection Test
color 0A
echo ============================================
echo   GitHub Connectivity Test
echo ============================================
echo.
echo   Testing github.com ...
curl -s -o nul -m 10 -w "   -> HTTP %%{http_code}   time %%{time_total}s" https://github.com
echo.
echo.
echo   Testing api.github.com ...
curl -s -o nul -m 10 -w "   -> HTTP %%{http_code}" https://api.github.com
echo.
echo.
echo   Testing github.io (Pages) ...
curl -s -o nul -m 10 -w "   -> HTTP %%{http_code}" https://pages.github.com
echo.
echo.
echo --------------------------------------------
echo   200 / 301 / 302  = OK
echo   000              = FAILED (network blocked)
echo --------------------------------------------
echo.
pause
