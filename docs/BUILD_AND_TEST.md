# Build e validação

## Verificações de código

```powershell
npx --yes pnpm@9.12.0 install --frozen-lockfile
npx --yes pnpm@9.12.0 check
npx --yes pnpm@9.12.0 test
npx --yes pnpm@9.12.0 lint
npx expo-doctor
```

## Prebuild Android

```powershell
npx expo prebuild --clean --platform android --no-install
```

O projeto usa Continuous Native Generation. As pastas `android` e `ios` são geradas e continuam ignoradas pelo Git.

## Windows sem Android Studio

`build-apk-windows.bat` chama `build-apk-sem-android-studio.ps1`. O roteiro:

1. verifica Node.js 20 ou superior;
2. baixa Microsoft OpenJDK 17 ZIP para o perfil do usuário, sem instalação administrativa;
3. baixa Android Command-line Tools e verifica o SHA-256 oficial;
4. verifica se há 7 GB livres na primeira instalação ou 2 GB nas seguintes;
5. aceita licenças e instala platform-tools, Android 36, build-tools 35/36 e NDK 27;
6. remove ZIPs e pastas temporárias depois da extração;
7. instala dependências pelo pnpm 9.12;
8. executa prebuild limpo, TypeScript e testes;
9. cria `android/local.properties` somente depois de a pasta Android existir;
10. executa `:app:assembleDebug --stacktrace`;
11. grava um log detalhado em `build-logs`.

Ferramentas locais:

```text
%LOCALAPPDATA%\DriverTouchPop\tools
%LOCALAPPDATA%\DriverTouchPop\AndroidSdk
```

APK esperada:

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

A configuração atual gera uma APK `arm64-v8a`, adequada a aparelhos Android 64-bit e menor que uma APK universal.

## GitHub Actions

O workflow `.github/workflows/android-debug.yml` executa as verificações, o prebuild e o Gradle em cada push para `main` ou por acionamento manual. A saída é publicada por 14 dias como o artefato `DriverTouch-Pop-debug`.

## Teste físico obrigatório

1. Instalar a APK debug.
2. Confirmar que DriverTouch Pop aparece em Acessibilidade.
3. Habilitar o serviço e voltar ao painel.
4. Confirmar que o aplicativo iniciou desarmado.
5. Executar calibração guiada.
6. Armar somente o modo de teste.
7. Abrir o POP driver com o veículo parado.
8. Conferir diagnósticos no Registro.
9. Validar que a mesma tela compatível gera apenas um evento.
10. Revogar o serviço nas configurações do Android e confirmar o estado no painel.

O modo assistido só deve ser testado depois dessas dez verificações.
