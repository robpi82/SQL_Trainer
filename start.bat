@echo off
title SQL Trainer
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js ist nicht installiert. Bitte von https://nodejs.org die LTS-Version installieren.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Pakete werden installiert, das dauert beim ersten Mal etwas ...
  call npm.cmd install
)
echo.
echo Die App startet gleich im Browser. Dieses Fenster offen lassen!
echo Zum Beenden: Fenster schliessen oder Strg+C druecken.
echo.
call npm.cmd run dev -- --open
pause
