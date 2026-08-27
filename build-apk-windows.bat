@echo off
setlocal
chcp 65001 >nul
title DriverTouch Pop - Gerar APK sem Android Studio
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-apk-sem-android-studio.ps1"
set EXIT_CODE=%ERRORLEVEL%
pause
exit /b %EXIT_CODE%
