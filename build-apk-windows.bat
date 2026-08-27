@echo off
setlocal
title PopMove Safe Accept - Gerar APK sem Android Studio
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-apk-sem-android-studio.ps1"
pause
