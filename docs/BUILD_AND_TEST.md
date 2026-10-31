# Build e verificação

## Versão 0.12.0 de diagnóstico

A branch `codex/diagnostico-0.12.0` gera `Toalha-Vermelha-0.12.0-diagnostico.apk` na pré-release `v0.12.0`. O aplicativo inicia com automação pausada. Ver [`DIAGNOSTICO.md`](DIAGNOSTICO.md). A publicação mantém a transferência por cache isolado; o upload adicional como artefato é opcional e sua falha não impede a release.

## Verificações automatizadas

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm lint
npx expo prebuild --clean --platform android --no-install
cd android
./gradlew :safe-accept:testReleaseUnitTest :app:assembleRelease --no-daemon --stacktrace -PreactNativeArchitectures=arm64-v8a
```

O workflow `.github/workflows/android-debug.yml` executa esses passos e entrega o APK ARM64 na pré-release pública `v0.11.0`. Após verificar a assinatura, o job de build com acesso somente de leitura transfere o APK por cache com chave exclusiva do commit/execução/tentativa. Um job separado, sem checkout ou instalação de dependências, verifica o SHA-256 e publica a release com a permissão mínima de conteúdo exigida pelo GitHub. Releases já existentes são preservadas. A mudança evita depender da cota de artefatos Actions, que estava esgotada em 21/10/2026.

## Windows sem Android Studio

Execute `build-apk-windows.bat`. O roteiro instala ferramentas portáteis em `%LOCALAPPDATA%\Toalha VermelhaPop` e gera:

```text
android\app\build\outputs\apk\release\app-release.apk
```

## Verificação operacional no aparelho

1. Instalar a versão mais recente sobre a anterior para preservar a calibração.
2. Confirmar Acessibilidade e acesso às notificações habilitados.
3. Confirmar no painel `Execução automática ativa`.
4. Deixar o POP driver online.
5. Ao surgir uma oferta, o Registro deve mostrar: notificação reconhecida, POP driver aberto quando necessário, busca por rolagem quando a frase estiver abaixo, frase real visível e toque concluído. Sem a frase completa dentro da área segura, deve registrar encerramento sem pressão.

O sucesso do Gradle prova que o código compila e a APK é instalável. A confirmação de que o POP driver efetivamente mudou para o estado de corrida aceita só existe no aparelho autenticado, pois esse estado pertence ao serviço externo da PopMove.

## Verificar os modos e a referência visual (0.11.0)

- Mudar o tamanho do guia visual em Calibrar e confirmar que a seleção persiste ao reabrir; isso não deve alterar o gesto automático.
- Com uma frase de aceite visível, confirmar que o caminho gerado tem dois pontos iguais no centro dos limites detectados.
- Em Uma corrida, confirmar a pausa depois da tentativa, inclusive reabrindo o app e alterando o raio; nenhuma segunda oferta deve receber gesto antes de Liberar próxima corrida.
- Em Corridas seguidas, conferir o comportamento já existente de nova oferta durante viagem.
- Desligar durante uma espera de repetição deve impedir o próximo gesto.
- A área efetiva é reduzida aos limites visíveis da frase. Sem frase visível não existe toque automático.
- A pausa representa uma tentativa enviada ao Android, não confirmação de aceite pelo servidor do POP driver.
