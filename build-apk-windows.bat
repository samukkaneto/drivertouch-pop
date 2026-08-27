@echo off
setlocal
title PopMove Safe Accept - Gerar APK de teste
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERRO: Node.js nao foi encontrado.
  echo Instale a versao LTS em https://nodejs.org e execute este arquivo novamente.
  pause
  exit /b 1
)

where corepack >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERRO: Corepack nao foi encontrado junto do Node.js.
  echo Reinstale o Node.js LTS marcando a instalacao padrao.
  pause
  exit /b 1
)

echo.
echo [1/3] Preparando dependencias do projeto...
call corepack enable
call corepack prepare pnpm@9.12.0 --activate
call pnpm install
if errorlevel 1 goto :build_error

echo.
echo [2/3] Atualizando os arquivos Android...
call npx expo prebuild --platform android --no-install
if errorlevel 1 goto :build_error

echo.
echo [3/3] Criando a APK de teste...
call android\gradlew.bat assembleDebug
if errorlevel 1 goto :build_error

echo.
echo APK criada com sucesso.
echo Arquivo: android\app\build\outputs\apk\debug\app-debug.apk
start "" explorer "android\app\build\outputs\apk\debug"
pause
exit /b 0

:build_error
echo.
echo A compilacao parou. Abra a pasta android no Android Studio,
echo instale os componentes sugeridos pelo programa e rode este arquivo novamente.
pause
exit /b 1
