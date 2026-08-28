# Gerar APK no Windows sem Android Studio

## Passo único

Dê dois cliques em:

```text
build-apk-windows.bat
```

Na primeira execução, o roteiro baixa:

- Microsoft OpenJDK 17 portátil;
- Android Command-line Tools oficiais;
- Android SDK 36 e Build Tools 36.0.0;
- Android NDK 27;
- dependências JavaScript do projeto.

Java e Android SDK ficam dentro de `%LOCALAPPDATA%\DriverTouchPop`. Não é necessário instalar Android Studio, criar conta, informar token nem publicar o aplicativo.

Reserve pelo menos **7 GB livres** no disco C: para a primeira execução. Depois que o NDK estiver instalado, o roteiro exige no mínimo 2 GB livres. Os ZIPs temporários são removidos automaticamente.

O roteiro também executa TypeScript e testes antes do Gradle. Se qualquer etapa falhar, a mensagem mostra a linha e o caminho do log completo.

## Resultado

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

A pasta da APK abre automaticamente quando o build termina.

A APK atual é destinada a aparelhos Android 64-bit (`arm64-v8a`). Como alternativa, o workflow **Android debug APK** do GitHub Actions gera o mesmo artefato fora do computador local.

## Logs

```text
build-logs\build-AAAAMMDD-HHMMSS.log
```

Os arquivos `.log` são ignorados pelo Git e podem ser enviados para diagnóstico sem precisar fotografar a janela.

## Primeiro teste

Instale a APK no aparelho do motorista, habilite Acessibilidade e acesso às notificações e preserve a calibração dentro do cartão da viagem. O painel deve indicar **Execução automática ativa**.
