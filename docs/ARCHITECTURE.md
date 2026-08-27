# Arquitetura técnica

## Visão geral

O DriverTouch Pop combina uma aplicação Expo com um módulo nativo local para Android. A interface não conversa com servidor. O fluxo é unidirecional: o motorista configura o app, a configuração é persistida localmente e sincronizada com a ponte nativa; o serviço de acessibilidade lê a configuração nativa para avaliar eventos do POP driver.

```text
Interface Expo/React Native
        ↓ configurações e comandos
SafeAcceptProvider + AsyncStorage
        ↓ sincronização
SafeAcceptBridge (Expo Module / Kotlin)
        ↓ SharedPreferences
PopMoveAccessibilityService
        ↓ eventos e árvore acessível
POP driver (br.com.popmove.driver)
```

## Componentes principais

| Caminho | Responsabilidade |
| --- | --- |
| `app/(tabs)/index.tsx` | Painel com estado, checklist e ação de desligar. |
| `app/(tabs)/calibrar.tsx` | Captura de ponto normalizado X/Y e visualização de referência. |
| `app/(tabs)/ajustes.tsx` | Modo, duração, atraso e marcador textual. |
| `app/(tabs)/permissoes.tsx` | Orientação e abertura das configurações nativas de acessibilidade. |
| `app/(tabs)/registro.tsx` | Histórico técnico sem dados de corrida. |
| `lib/safe-accept-context.tsx` | Estado global, AsyncStorage, registro e sincronização nativa. |
| `lib/calibration.ts` | Validação de coordenadas e cálculo do estado exibido. |
| `lib/safe-accept-bridge.ts` | Contrato JavaScript para o módulo Expo. |
| `modules/my-module/android/.../SafeAcceptBridgeModule.kt` | Funções Kotlin expostas à interface. |
| `modules/my-module/android/.../PopMoveAccessibilityService.kt` | Observação de eventos e despacho condicional do gesto. |
| `modules/my-module/android/.../SafeAcceptStore.kt` | Preferências operacionais do serviço nativo. |

## Modelo de dados

O tipo `SafeAcceptSettings` está em `lib/safe-accept-types.ts`.

| Campo | Tipo | Valor padrão | Finalidade |
| --- | --- | --- | --- |
| `appTarget` | `"popmove"` | `"popmove"` | Limita o primeiro protótipo ao aplicativo alvo. |
| `mode` | `off`, `test`, `assist` | `test` | Separa desligado, teste e gesto assistido. |
| `isArmed` | boolean | `false` | Exige ativação explícita. |
| `longPressDurationMs` | número | `2000` | Duração do toque prolongado. |
| `detectionDelayMs` | número | `400` | Atraso inicial antes do gesto. |
| `acceptMarker` | texto | `aceitar` | Marcador buscado na árvore de acessibilidade. |
| `calibration` | X/Y normalizados | `null` | Ponto relativo à largura e altura da tela. |
| `events` | lista limitada | `[]` | Registro técnico local. |

## Fluxo de serviço Android

Quando o Android conecta `PopMoveAccessibilityService`, o serviço registra que foi ativado. Para cada evento de janela ou conteúdo, ele descarta tudo que não seja do pacote `br.com.popmove.driver`. Em seguida, carrega a configuração de `SharedPreferences`.

No modo `test`, uma árvore que contenha o marcador cria um registro e encerra o fluxo. No modo `assist`, o serviço calcula as coordenadas reais multiplicando X/Y normalizados por largura/altura do display e chama `dispatchGesture` com um `GestureDescription.StrokeDescription`. O intervalo mínimo entre tentativas é a soma da duração, do atraso e de 2,5 segundos.

> A detecção textual é uma hipótese inicial. Outra IA não deve presumir que o POP driver expõe o texto esperado; isso exige inspeção em aparelho real.

## Arquivos Android relevantes

O manifesto do módulo em `modules/my-module/android/src/main/AndroidManifest.xml` declara o serviço com a permissão `android.permission.BIND_ACCESSIBILITY_SERVICE`. O arquivo XML em `res/xml/popmove_safe_accept_service.xml` solicita eventos de janela/conteúdo, recuperação de conteúdo da janela e execução de gestos. O Android documenta que a configuração do serviço controla as capacidades disponíveis para o `AccessibilityService` [1].

## Riscos e limites da arquitetura

| Risco | Mitigação existente | Trabalho futuro |
| --- | --- | --- |
| Detecção falha por ausência de texto acessível | Modo de teste é o padrão | Confirmar a árvore real e definir alternativa apropriada, se permitida. |
| Toque em posição errada | Calibração por coordenada relativa | Validar por densidade, rotação e elementos de sistema. |
| Repetição de gesto | Intervalo mínimo e controle armado | Adicionar máquina de estados por janela/oferta se houver identificação confiável. |
| Serviço continua ativo indevidamente | Ação “Desligar agora” e modo padrão não armado | Implementar notificação persistente e kill switch adicional. |
| Política/termos | Escopo local e sem distribuição pública | Revisar permissão da PopMove e política de acessibilidade antes de distribuir. |

## Referência

[1]: https://developer.android.com/guide/topics/ui/accessibility/service "Android Developers — Accessibility services"
