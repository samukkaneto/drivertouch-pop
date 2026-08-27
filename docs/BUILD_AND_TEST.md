# Build e teste

## Pré-requisitos para compilação local

Uma máquina de build precisa de Node.js, Java 17 e Android SDK com `platform-tools`, `platforms;android-36` e `build-tools;36.0.0`. A ferramenta oficial `sdkmanager` pode instalar esses componentes sem a interface do Android Studio [1].

| Ambiente | Caminho recomendado | Estado |
| --- | --- | --- |
| Linux/macOS com SDK configurado | `pnpm install` → `npx expo prebuild` → Gradle | Não testado fora do sandbox |
| Windows sem Android Studio | `build-apk-windows.bat` | Criado; precisa de teste real |
| Publicação remota | Painel de build Android | Relato de retorno ao estado inicial sem APK |

## Validação de JavaScript já realizada

```bash
pnpm check
pnpm test
```

Resultado registrado antes desta transferência: TypeScript aprovado; três testes da lógica de calibração aprovados; um teste de autenticação previamente existente foi ignorado.

## Compilação Android manual

Com o Android SDK disponível, execute na raiz do projeto:

```bash
pnpm install
npx expo prebuild --clean --platform android --no-install
cd android
./gradlew assembleDebug
```

No Windows, o equivalente do último comando é:

```text
android\gradlew.bat assembleDebug
```

O arquivo esperado é:

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

Uma APK de variante debug é assinada com chave de depuração e pode ser instalada para testes; para distribuição de release seria necessário um processo de assinatura apropriado [2].

## Roteiro Windows sem Android Studio

O arquivo `build-apk-windows.bat` inicia `build-apk-sem-android-studio.ps1`. O script tenta instalar Node.js LTS e Java 17 por `winget`, baixa Android Command-line Tools, instala os pacotes SDK pelo `sdkmanager`, cria `android/local.properties`, instala as dependências e chama `gradlew.bat assembleDebug`.

Esse atalho foi montado para reduzir passos manuais. Ele ainda não foi executado em Windows real e pode exigir ajustes para permissões, versão do `winget`, política corporativa, antivírus ou alterações de URLs da Google. A próxima pessoa deve solicitar a mensagem completa se o script parar; não deve assumir que a APK foi gerada até encontrar `app-debug.apk` no caminho informado.

## Teste em aparelho físico

1. Instalar a APK debug no Android.
2. Abrir o DriverTouch Pop e calibrar um ponto de teste.
3. Abrir **Permissões Android** e confirmar que o serviço aparece na lista de Acessibilidade.
4. Ativar o serviço com o veículo parado.
5. Manter o modo **Teste** e abrir o POP driver.
6. Verificar no Registro se há evento compatível; se não houver, revisar marcador e árvore de acessibilidade.
7. Só avaliar modo assistido depois de confirmar coordenada, marcador e desligamento manual.

## Referências

[1]: https://developer.android.com/tools/sdkmanager "Android Developers — sdkmanager"
[2]: https://developer.android.com/build/build-for-release "Android Developers — Build your app for release to users"
