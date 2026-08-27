# Arquitetura

## Visão geral

```text
Interface Expo / React Native
        ↓ configuração explícita
SafeAcceptProvider + AsyncStorage
        ↓ Expo Module
SafeAcceptBridgeModule.kt
        ↓ SharedPreferences
PopMoveAccessibilityService.kt
        ↓ eventos acessíveis e GestureDescription
POP driver
```

O aplicativo funciona sem servidor. O estado visual fica no AsyncStorage e a cópia operacional fica em SharedPreferences, porque o serviço de acessibilidade precisa continuar funcionando quando a tela React Native não está aberta.

## Regras de segurança

- O estado armado não é restaurado ao iniciar o aplicativo.
- Toda conexão do serviço Android força `armed=false`.
- Trocar modo, recalibrar ou alterar parâmetros desarma a automação.
- O modo assistido exige confirmação adicional no painel.
- O painel só permite armar depois de detectar o serviço Android habilitado.
- Uma oferta é tratada apenas na transição “marcador ausente → marcador presente”.
- O estado só é liberado para outra tentativa depois que o marcador deixa de aparecer.
- Cancelamento ou recusa do gesto não provoca repetição automática na mesma aparição.

Essa estratégia prefere perder uma tentativa a executar dois gestos na mesma oferta.

## Calibração guiada

O serviço de acessibilidade cria primeiro uma pequena janela `TYPE_ACCESSIBILITY_OVERLAY`. Fora dessa janela, o POP driver continua utilizável. Quando o motorista toca em **Marcar agora**, o serviço cria temporariamente uma camada transparente de tela inteira e captura um único toque.

As coordenadas são normalizadas usando as mesmas dimensões de display usadas posteriormente por `GestureDescription`. O ponto é salvo como pendente no armazenamento nativo, o DriverTouch volta ao primeiro plano e a tela React Native consome e persiste a calibração.

A grade manual continua disponível como alternativa e usa o tamanho realmente medido do componente, sem largura fixa.

## Detecção

O XML do serviço limita eventos ao pacote `br.com.popmove.driver`. O Kotlin examina somente `text` e `contentDescription` da árvore acessível e procura o marcador configurado, inicialmente `aceitar`.

No modo de teste:

- marcador encontrado: registra uma oferta compatível;
- evento recebido sem marcador: registra diagnóstico limitado a uma entrada a cada dez segundos;
- árvore indisponível: registra a indisponibilidade sem salvar conteúdo da tela.

Nenhum endereço, valor, origem, destino ou texto completo da oferta é armazenado.

## Registro

Eventos de configuração ficam no AsyncStorage. Eventos do serviço ficam em um `JSONArray` limitado a 50 entradas no SharedPreferences. A tela Registro combina as duas fontes por data e identifica a origem de cada evento.

## Módulo Android

| Arquivo                                             | Função                                               |
| --------------------------------------------------- | ---------------------------------------------------- |
| `modules/safe-accept/src/SafeAcceptBridgeModule.ts` | Tipos do contrato nativo                             |
| `SafeAcceptBridgeModule.kt`                         | Configuração, estado, eventos e início da calibração |
| `SafeAcceptStore.kt`                                | Configuração operacional e registro limitado         |
| `PopMoveAccessibilityService.kt`                    | Detecção, sobreposição e gesto                       |
| `popmove_safe_accept_service.xml`                   | Capacidades e filtro do serviço                      |

O módulo é descoberto pelo Expo Modules Autolinking como `safe-accept`.
