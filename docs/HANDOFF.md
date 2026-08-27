# Relatório de transferência — DriverTouch Pop

## Resumo executivo

O projeto começou como uma solicitação para reduzir a interação manual de motoristas com ofertas exibidas no POP driver. A primeira versão foi limitada à PopMove e implementada como um **aplicativo Android separado**, não como alteração do aplicativo de terceiros. A solução usa uma interface Expo/React Native para configuração e uma camada Kotlin para integração com o `AccessibilityService` do Android.

O código disponível nesta transferência é um **protótipo técnico**. Há funcionalidades concluídas na interface e na configuração local, mas a integração final depende de teste controlado em dispositivo físico. Não existe APK validada, não existe integração oficial com a PopMove e não existe confirmação de que o aplicativo-alvo exponha os textos necessários à detecção por acessibilidade.

## Escopo implementado

| Requisito original | Implementação atual | Situação |
| --- | --- | --- |
| Começar somente pela PopMove | Pacote alvo fixado em `br.com.popmove.driver` | Implementado, pendente de confirmação no aparelho |
| Configurar um toque prolongado | Coordenadas normalizadas X/Y e duração ajustável | Implementado |
| Modo de teste | Registra evento compatível sem disparar gesto | Implementado |
| Modo assistido | Dispara `GestureDescription` quando armado e compatível | Implementado, não validado em aparelho |
| Calibração por aparelho | Quadro tátil e campos de coordenadas normalizadas | Implementado |
| Registro local | Eventos técnicos limitados a 30 entradas | Implementado |
| Segurança | Desarmar manual, modo padrão de teste, intervalo mínimo | Implementado |
| Outros aplicativos | Nenhum | Fora de escopo da versão atual |

## Decisões técnicas importantes

O projeto armazena dados apenas no dispositivo. As configurações da interface ficam em AsyncStorage, e o módulo Kotlin mantém uma cópia operacional em `SharedPreferences` para que o serviço Android possa funcionar sem depender da tela React Native estar aberta. O projeto deliberadamente não armazena endereço, valor, origem, destino ou identificador de corrida.

O serviço recebe eventos de mudança de janela e conteúdo apenas do pacote configurado para o POP driver. Antes de tentar um gesto, ele verifica: serviço armado, modo diferente de desligado, coordenadas válidas, marcador com pelo menos dois caracteres e presença do marcador no conteúdo acessível. No modo de teste, o resultado é somente um registro local. No modo assistido, o serviço cria um toque prolongado na coordenada calibrada e aplica um intervalo mínimo entre tentativas.

## O que a próxima pessoa ou IA deve fazer primeiro

1. Confirmar o nome do pacote do POP driver instalado no aparelho real. O valor atual foi obtido da página pública do aplicativo e precisa ser tratado como uma hipótese operacional.
2. Pedir prints anonimizados do POP driver: tela sem oferta e tela com oferta. Usar esses materiais para decidir o marcador textual e o ponto de calibração.
3. Gerar uma APK debug em ambiente com Android SDK e instalar no aparelho. Confirmar que o serviço aparece em **Configurações → Acessibilidade**.
4. Validar se `rootInActiveWindow` realmente contém texto ou descrição da oferta. Caso não contenha, reavaliar a estratégia; não adicionar captura contínua de tela sem revisar as implicações de segurança, privacidade e política.
5. Testar sempre com veículo parado e manter o modo Teste até confirmar a calibração.

## Evidências de validação realizadas

| Verificação | Resultado |
| --- | --- |
| `pnpm check` | Aprovado |
| `pnpm test` | Aprovado: 3 testes de calibração; 1 teste de autenticação pré-existente ignorado |
| `npx expo prebuild --platform android --no-install` | Aprovado |
| Compilação Kotlin/Gradle neste ambiente | Não concluída: Android SDK ausente no sandbox |
| Compilação Android pelo fluxo remoto | Relato do usuário: barra carrega e retorna ao estado inicial sem liberar APK |
| Teste no POP driver | Não realizado |

## Perguntas em aberto

| Pergunta | Por que importa |
| --- | --- |
| A tela de oferta expõe texto na árvore de acessibilidade? | Sem isso, o marcador atual não será suficiente. |
| Qual texto é estável na tela de aceite? | Determina o valor de `acceptMarker`, que hoje começa em `aceitar`. |
| O ponto corresponde à tela real e à densidade do aparelho? | Necessário para um toque preciso. |
| A PopMove permite esse auxílio? | É preciso revisar termos e confirmar o risco operacional antes de qualquer distribuição. |
| O fluxo remoto de APK está falhando por que motivo? | Impede a distribuição de teste pela plataforma usada durante este trabalho. |

## Referências

[1]: https://developer.android.com/guide/topics/ui/accessibility/service "Android Developers — Accessibility services"
[2]: https://popmove.com.br/termsdriver.html "PopMove — Termos para motoristas"
