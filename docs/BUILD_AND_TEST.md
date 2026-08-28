# Build e verificação

## Verificações automatizadas

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm lint
npx expo prebuild --clean --platform android --no-install
cd android
./gradlew :app:assembleRelease --no-daemon --stacktrace
```

O workflow `.github/workflows/android-debug.yml` executa esses passos a cada push na `main` e publica `DriverTouch-Pop-standalone` por 14 dias.

## Windows sem Android Studio

Execute `build-apk-windows.bat`. O roteiro instala ferramentas portáteis em `%LOCALAPPDATA%\DriverTouchPop` e gera:

```text
android\app\build\outputs\apk\release\app-release.apk
```

## Verificação operacional no aparelho

1. Instalar a versão mais recente sobre a anterior para preservar a calibração.
2. Confirmar Acessibilidade e acesso às notificações habilitados.
3. Confirmar no painel `Execução automática ativa`.
4. Deixar o POP driver online.
5. Ao surgir uma oferta, o Registro deve mostrar: notificação reconhecida, PopDriver aberto quando necessário, frase real localizada e toque concluído. Sem a frase completa, deve registrar encerramento sem pressão.

O sucesso do Gradle prova que o código compila e a APK é instalável. A confirmação de que o POP driver efetivamente mudou para o estado de corrida aceita só existe no aparelho autenticado, pois esse estado pertence ao serviço externo da PopMove.
