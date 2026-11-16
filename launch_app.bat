@echo off
title Student Focus SIM - Cross Platform Host
color 0b
cls
echo Starting Focus SIM App Server...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
