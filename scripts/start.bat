@echo off
cd /d "%~dp0"
title Guitar Loop Trainer
echo ============================================
echo   Guitar Loop Trainer - Starting...
echo ============================================
echo.
echo Starting local server on http://localhost:3000 ...
echo Keep this window open while using the app.
echo Press Ctrl+C to stop the server.
echo.
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"
npx serve -l 3000
