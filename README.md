# DriverTouch Pop

> Protótipo Android local para configurar e testar um toque prolongado assistido no POP driver, com calibração manual, modo de teste e registro técnico local.

## Estado da transferência

Este repositório foi preparado para continuidade por outro desenvolvedor ou outra IA. A interface React Native está implementada, assim como uma ponte Kotlin e um serviço Android de acessibilidade. A lógica de tela passou em checagem de tipos e em testes unitários. A APK **ainda precisa de validação em um aparelho Android físico**, pois não foi possível concluir a compilação nativa neste ambiente de desenvolvimento por falta do Android SDK local.

| Área | Estado | Onde consultar |
| --- | --- | --- |
| Interface mobile | Implementada | `app/(tabs)/` |
| Configurações locais | Implementadas com AsyncStorage | `lib/safe-accept-context.tsx` |
| Serviço Android | Implementado, não validado em aparelho | `modules/my-module/android/` |
| Testes unitários | 3 testes aprovados | `tests/calibration.test.ts` |
| Build Android | Prebuild criado; APK pendente | `docs/BUILD_AND_TEST.md` |
| Relato de falha de publicação | Registrado, ainda sem diagnóstico | `docs/KNOWN_ISSUES.md` |

## O que o aplicativo faz

O aplicativo funciona localmente e não possui login, backend obrigatório ou armazenamento em nuvem. O motorista escolhe o modo, calibra um ponto relativo na tela, define a duração do toque e ativa o serviço de acessibilidade nas configurações do Android. Em **Modo de teste**, o serviço apenas registra uma detecção compatível; ele não envia gesto. Em **Modo assistido**, o serviço procura um marcador textual configurável no POP driver e, se a tela corresponder, envia um toque prolongado ao ponto calibrado.

O Android permite que um `AccessibilityService` receba eventos de janela, recupere conteúdo da janela e envie gestos quando essas capacidades forem declaradas pelo serviço [1]. O uso de APIs de acessibilidade em aplicações distribuídas exige aderência às regras aplicáveis do Android e do Google Play [2].

## Comece por aqui

Leia os documentos nesta ordem:

1. [`docs/HANDOFF.md`](docs/HANDOFF.md) — resumo executivo, escopo e próximos passos.
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — estrutura, fluxo de dados e integração nativa.
3. [`docs/BUILD_AND_TEST.md`](docs/BUILD_AND_TEST.md) — como validar e gerar a APK.
4. [`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md) — falhas, riscos e itens não confirmados.

## Comandos de desenvolvimento

| Objetivo | Comando |
| --- | --- |
| Instalar dependências | `pnpm install` |
| Checar TypeScript | `pnpm check` |
| Rodar testes | `pnpm test` |
| Rodar a interface | `pnpm dev` |
| Gerar arquivos Android | `npx expo prebuild --clean --platform android --no-install` |
| Compilar debug local | `cd android && ./gradlew assembleDebug` |

No Windows, há também `build-apk-windows.bat`, que chama `build-apk-sem-android-studio.ps1`. Ele foi criado como alternativa sem Android Studio, mas **ainda precisa ser executado e corrigido em um computador Windows real**.

## Segurança operacional

O primeiro teste deve ocorrer com o veículo parado. A calibração depende do tamanho e da interface do aparelho; portanto, o projeto não deve ser considerado pronto para uso real sem validação no POP driver. Não foram recebidos prints suficientes da tela de oferta para confirmar o marcador textual, as coordenadas ideais ou a compatibilidade da árvore de acessibilidade da PopMove.

## Referências

[1]: https://developer.android.com/guide/topics/ui/accessibility/service "Android Developers — Accessibility services"
[2]: https://support.google.com/googleplay/android-developer/answer/10964491?hl=pt-BR "Google Play — Política da API Accessibility"
