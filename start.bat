@echo off
title Guitar Loop Trainer
echo ============================================
echo   Guitar Loop Trainer - Starting...
echo ============================================
echo.
echo Opening http://localhost:3000 in your browser...
echo Keep this window open while using the app.
echo Press Ctrl+C to stop the server.
echo.
start http://localhost:3000
npx serve -l 3000
